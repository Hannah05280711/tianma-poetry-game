import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  claimDailyTaskReward,
  consumeHint,
  consumeInk,
  consumeShield,
  getAllPoets,
  getAllRanks,
  getDailyTaskConfigs,
  getDestinyPoet,
  getPoetById,
  getQuestionsByDifficulty,
  getQuestionsByTheme,
  getRankByScore,
  getUserAnswerStats,
  getUserDailyTasks,
  getUserGameState,
  getWeeklyLeaderboard,
  handleDailyLogin,
  incrementShareCount,
  saveDestinyPoet,
  saveQuestionRecord,
  updateUserPoetPreference,
  updateUserScore,
  updateWeeklyScore,
  upsertDailyTaskProgress,
} from "../game-db";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";

// ─── Poet Matching Algorithm ──────────────────────────────────────────────────
// 题型偏好 -> MBTI 类型列表（支持多个匹配）
const TYPE_MBTI_MAP: Record<string, string[]> = {
  reorder: ["ENFP", "ENTP", "ENFJ"],   // 排序题 -> 创意型
  error:   ["INFJ", "INTJ", "ISTJ"],   // 纠错题 -> 分析型
  fill:    ["ISTJ", "ISFJ", "INFJ"],   // 填空题 -> 谨慎型
  chain:   ["ENFJ", "ESFJ", "ENTJ"],   // 接龙题 -> 社交型
  judge:   ["INTP", "INTJ", "INFP"],   // 判断题 -> 思考型
};
const ACCURACY_MBTI_MAP: Record<string, string[]> = {
  high:  ["ISTJ", "INTJ", "INFJ"],   // 高精准 -> 完美主义
  mid:   ["ENFJ", "ESFJ", "ISFJ"],   // 中精准 -> 平衡型
  low:   ["ENFP", "ENTP", "ISFP"],   // 低精准 -> 自由型
};
const SPEED_MBTI_MAP: Record<string, string[]> = {
  fast:  ["ENFJ", "ENTJ", "ESTJ", "ENFP"],   // 决断快
  slow:  ["INFP", "INTP", "ISFP", "INFJ"],   // 思考慢
};

function matchPoet(
  stats: {
    poetCorrectMap: Record<string, number>;
    typePreferMap: Record<string, number>;
    avgResponseTime: number;
    totalCorrect: number;
    totalAnswered: number;
  },
  allPoets: Array<{ id: number; name: string; mbtiType: string; dynastyWeight?: number | null }>
) {
  const scores: Record<number, number> = {};
  for (const p of allPoets) scores[p.id] = 0;

  // 1. 直接答题记录：诗人相关题目的正确数 (weight 0.5)
  for (const [poetId, correct] of Object.entries(stats.poetCorrectMap)) {
    const id = Number(poetId);
    if (scores[id] !== undefined) scores[id] += correct * 0.5;
  }

  // 2. 题型偏好 -> MBTI 匹配 (weight 0.2)
  const prefType = Object.entries(stats.typePreferMap).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (prefType && TYPE_MBTI_MAP[prefType]) {
    for (const p of allPoets) {
      if (TYPE_MBTI_MAP[prefType].includes(p.mbtiType)) {
        scores[p.id] = (scores[p.id] ?? 0) + 20 * (p.dynastyWeight ?? 1.0);
      }
    }
  }

  // 3. 精准度 -> MBTI 匹配 (weight 0.15)
  const accuracy = stats.totalAnswered > 0 ? stats.totalCorrect / stats.totalAnswered : 0;
  const accKey = accuracy > 0.8 ? "high" : accuracy < 0.4 ? "low" : "mid";
  for (const p of allPoets) {
    if (ACCURACY_MBTI_MAP[accKey].includes(p.mbtiType)) {
      scores[p.id] = (scores[p.id] ?? 0) + 15 * (p.dynastyWeight ?? 1.0);
    }
  }

  // 4. 答题速度 -> MBTI 匹配 (weight 0.15)
  const speedKey = stats.avgResponseTime < 3 ? "fast" : stats.avgResponseTime > 7 ? "slow" : null;
  if (speedKey) {
    for (const p of allPoets) {
      if (SPEED_MBTI_MAP[speedKey].includes(p.mbtiType)) {
        scores[p.id] = (scores[p.id] ?? 0) + 15 * (p.dynastyWeight ?? 1.0);
      }
    }
  }

  // 5. 随机化因子：增加多样性，防止每次都匹配同一人
  // 随机扰动范围为当前最高分的±20%，确保每次结果有明显差异
  const maxScore = Math.max(1, ...Object.values(scores));
  const perturbRange = Math.max(15, maxScore * 0.20);
  for (const p of allPoets) {
    const perturb = (Math.random() * 2 - 1) * perturbRange;
    scores[p.id] = Math.max(0, (scores[p.id] ?? 0) + perturb);
  }

  const bestId = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestScore = scores[Number(bestId)] ?? 0;
  const totalPossible = Math.max(1, stats.totalAnswered * 0.5 + 50);
  const matchPct = Math.min(99, Math.max(60, Math.round((bestScore / totalPossible) * 100 + 60)));

  return { poetId: Number(bestId), matchScore: matchPct };
}

// ─── LLM Helpers ─────────────────────────────────────────────────────────────
async function callLLM(prompt: string): Promise<string> {
  try {
    const res = await fetch(`${ENV.forgeApiUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
      }),
    });
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

// ─── Game Router ──────────────────────────────────────────────────────────────
export const gameRouter = router({
  // Get game state
  getState: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserGameState(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    const rank = await getRankByScore(user.totalScore ?? 0);
    const loginResult = await handleDailyLogin(ctx.user.id);
    return {
      totalScore: user.totalScore ?? 0,
      currentRankId: user.currentRankId ?? 1,
      rank,
      consecutiveWins: user.consecutiveWins ?? 0,
      totalAnswered: user.totalAnswered ?? 0,
      totalCorrect: user.totalCorrect ?? 0,
      hintsCount: user.hintsCount ?? 3,
      shieldsCount: user.shieldsCount ?? 1,
      inkDrops: user.inkDrops ?? 20,
      consecutiveLoginDays: user.consecutiveLoginDays ?? 1,
      isNewLogin: loginResult.isNew,
    };
  }),

  // Get questions for a session - public so guests can play without login
  getQuestions: publicProcedure
    .input(z.object({
      difficulty: z.number().min(1).max(5).default(1),
      count: z.number().min(1).max(10).default(5),
      // seed 用于破坏 tRPC 缓存，每次开始新游戏时传入不同的 seed。后端不使用它，仅用于让请求看起来不同
      seed: z.string().optional(),
      // 节日/节气/诗人主题标签，传入时优先推送相关题目
      themeTag: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // 拉取足够多的题目以便同诗去重后仍有足够数量
      const fetchCount = input.count * 5;
      // 王者关（difficulty=5）使用独立题库，只取 difficulty=5 的题目
      // 其他关卡取相邻难度范围，但严格排除 difficulty=5，确保王者关题目不混入其他关卡
      const minDiff = input.difficulty === 5 ? 5 : Math.max(1, input.difficulty - 1);
      const maxDiff = input.difficulty === 5 ? 5 : Math.min(4, input.difficulty + 1);
      // 如果传入了主题标签，使用主题优先查询
      const qs = input.themeTag
        ? await getQuestionsByTheme(input.themeTag, minDiff, maxDiff, fetchCount)
        : await getQuestionsByDifficulty(minDiff, maxDiff, fetchCount);

      // 同诗去重：每首诗只保留一题，避免同一首诗反复出现
      const seenPoems = new Set<string>();
      const deduplicated: typeof qs = [];
      for (const q of qs) {
        const poemKey = (q.sourcePoemTitle ?? "").trim();
        const dedupeKey = poemKey || `__q_${q.id}`; // 无诗名的题目用 id 区分
        if (!seenPoems.has(dedupeKey)) {
          seenPoems.add(dedupeKey);
          deduplicated.push(q);
        }
        if (deduplicated.length >= input.count) break;
      }

      // 如果去重后数量不够，用剩余题目补充（允许重复诗名）
      if (deduplicated.length < input.count) {
        const extra = qs.filter(q => !deduplicated.find(d => d.id === q.id));
        deduplicated.push(...extra.slice(0, input.count - deduplicated.length));
      }

      const finalQs = deduplicated.slice(0, input.count);

      // 随机洗牌选项
      return finalQs.map((q) => ({
        ...q,
        options: q.options
          ? [...(Array.isArray(q.options) ? q.options as string[] : JSON.parse(q.options as string) as string[])].sort(() => Math.random() - 0.5)
          : [],
      }));
    }),

  // Submit an answer - public so guests can play without login
  // Guests get immediate feedback but scores are not persisted
  submitAnswer: publicProcedure
    .input(
      z.object({
        questionId: z.number(),
        answer: z.string(),
        responseTime: z.number(),
        sessionId: z.string(),
        useShield: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const question = await import("../game-db").then((m) => m.getQuestionById(input.questionId));
      if (!question) throw new TRPCError({ code: "NOT_FOUND" });

      const isCorrect = question.correctAnswer === input.answer;

      // Guest mode: return result immediately without persisting
      if (!ctx.user) {
        const scoreDelta = isCorrect ? 10 : -10;
        return {
          isCorrect,
          scoreDelta,
          newScore: 0,
          newConsecutive: 0,
          shieldUsed: false,
          reward: null,
          rankChanged: false,
          newRank: null,
          shouldUnlockDestiny: false,
          explanation: null, // no explanation in guest mode
          correctAnswer: question.correctAnswer,
        };
      }

      // Logged-in user: full persistence
      const user = await getUserGameState(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      let scoreDelta = 0;
      let shieldUsed = false;

      if (isCorrect) {
        scoreDelta = 10;
        const newConsec = (user.consecutiveWins ?? 0) + 1;
        if (newConsec === 3) scoreDelta += 5;
        if (newConsec === 5) scoreDelta += 5;
      } else {
        if (input.useShield && (user.shieldsCount ?? 0) > 0) {
          await consumeShield(ctx.user.id);
          shieldUsed = true;
          scoreDelta = 0;
        } else {
          scoreDelta = -10;
          await consumeInk(ctx.user.id);
        }
      }

      const result = await updateUserScore(ctx.user.id, scoreDelta, isCorrect);
      await updateUserPoetPreference(ctx.user.id, question.poetId, question.questionType, isCorrect, input.responseTime);
      await saveQuestionRecord(ctx.user.id, input.questionId, isCorrect, input.responseTime, input.sessionId);

      const rank = await getRankByScore(result?.newScore ?? 0);
      await updateWeeklyScore(ctx.user.id, Math.max(0, scoreDelta), isCorrect, rank?.tierName ?? "青铜剑");

      const today = new Date().toISOString().slice(0, 10);
      await upsertDailyTaskProgress(ctx.user.id, "answer_3", today, 1);
      if (isCorrect) await upsertDailyTaskProgress(ctx.user.id, "win_streak_2", today, 1);

      let reward: { type: string; message: string } | null = null;
      const newConsec = result?.newConsecutive ?? 0;
      if (isCorrect && newConsec === 5) {
        const db = await import("../game-db").then((m) => m.getUserGameState(ctx.user!.id));
        if (db) {
          const { getDb } = await import("../db");
          const { users } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const dbConn = await getDb();
          if (dbConn) await dbConn.update(users).set({ hintsCount: (db.hintsCount ?? 0) + 1 }).where(eq(users.id, ctx.user!.id));
        }
        reward = { type: "hint", message: "🎉 5连胜！获得提示卡×1" };
      } else if (isCorrect && newConsec === 10) {
        const db = await import("../game-db").then((m) => m.getUserGameState(ctx.user!.id));
        if (db) {
          const { getDb } = await import("../db");
          const { users } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const dbConn = await getDb();
          if (dbConn) await dbConn.update(users).set({ shieldsCount: (db.shieldsCount ?? 0) + 1 }).where(eq(users.id, ctx.user!.id));
        }
        reward = { type: "shield", message: "🛡️ 10连胜！获得护身符×1" };
      }

      const rankChanged = result && result.newRankId !== result.oldRankId;
      if (rankChanged) {
        const newRank = await getRankByScore(result.newScore);
        await notifyOwner({
          title: "🏆 段位晋升通知",
          content: `用户 ${ctx.user.name ?? ctx.user.openId} 晋升至 ${newRank?.rankName ?? "新段位"}！当前积分：${result.newScore}`,
        });
      }

      const updatedUser = await getUserGameState(ctx.user.id);
      const shouldUnlock = (updatedUser?.totalAnswered ?? 0) >= 100 && !(await getDestinyPoet(ctx.user.id));

      return {
        isCorrect,
        scoreDelta,
        newScore: result?.newScore ?? 0,
        newConsecutive: result?.newConsecutive ?? 0,
        shieldUsed,
        reward,
        rankChanged,
        newRank: rankChanged ? await getRankByScore(result?.newScore ?? 0) : null,
        shouldUnlockDestiny: shouldUnlock,
        explanation: null, // explanation removed per UX requirement
        correctAnswer: question.correctAnswer,
      };
    }),

  // Use hint (remove one wrong option)
  useHint: protectedProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const used = await consumeHint(ctx.user.id);
      if (!used) throw new TRPCError({ code: "BAD_REQUEST", message: "没有提示卡了" });
      const question = await import("../game-db").then((m) => m.getQuestionById(input.questionId));
      if (!question) throw new TRPCError({ code: "NOT_FOUND" });
      const options: string[] = question.options ? (Array.isArray(question.options) ? question.options as string[] : JSON.parse(question.options as string)) : [];
      const wrong = options.filter((o) => o !== question.correctAnswer);
      const toRemove = wrong[Math.floor(Math.random() * wrong.length)];
      return { removedOption: toRemove };
    }),

  // Get all ranks
  getRanks: publicProcedure.query(() => getAllRanks()),

  // Get all poets
  getPoets: publicProcedure.query(() => getAllPoets()),

  // Get destiny poet (supports guest mode - returns null for guests)
  getDestinyPoet: publicProcedure.query(async ({ ctx }) => {
    const user = (ctx as { user?: { id: number } }).user;
    if (!user) return null;
    const destiny = await getDestinyPoet(user.id);
    if (!destiny) return null;
    const poet = await getPoetById(destiny.poetId);
    return { ...destiny, poet };
  }),

  // Generate destiny poet - supports guest mode with inline stats
  generateDestinyPoet: publicProcedure
    .input(z.object({
      // Guest mode: pass stats directly; logged-in users can omit (loaded from DB)
      guestStats: z.object({
        totalAnswered: z.number(),
        totalCorrect: z.number(),
        poetCorrectMap: z.record(z.string(), z.number()),
        typePreferMap: z.record(z.string(), z.number()),
        avgResponseTime: z.number(),
      }).optional(),
    }).optional())
    .mutation(async ({ ctx, input }) => {
    const user = (ctx as { user?: { id: number; name?: string; openId?: string } }).user;
    let stats: {
      totalAnswered: number;
      totalCorrect: number;
      poetCorrectMap: Record<string, number>;
      typePreferMap: Record<string, number>;
      avgResponseTime: number;
    } | null = null;

    if (user) {
      // Logged-in user: load stats from DB
      stats = await getUserAnswerStats(user.id);
      if (!stats) throw new TRPCError({ code: "NOT_FOUND" });
    } else if (input?.guestStats) {
      // Guest mode: use provided stats
      stats = input.guestStats;
    } else {
      throw new TRPCError({ code: "BAD_REQUEST", message: "请提供答题数据" });
    }

    if (!stats) throw new TRPCError({ code: "NOT_FOUND" });

    if (stats.totalAnswered < 10) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "至少需要答10题才能解锁本命诗人" });
    }

    const allPoets = await getAllPoets();
    const { poetId, matchScore } = matchPoet(stats, allPoets);
    const poet = await getPoetById(poetId);
    if (!poet) throw new TRPCError({ code: "NOT_FOUND" });

    // Generate LLM analysis
    const analysisPrompt = `你是一位古典诗词专家。请根据以下用户答题数据，生成一段关于"为什么你的本命诗人是${poet.name}"的个性化分析报告（200字以内，语言生动有趣，适合年轻人）：
- 答题总数：${stats.totalAnswered}题
- 答对率：${Math.round((stats.totalCorrect / Math.max(1, stats.totalAnswered)) * 100)}%
- 偏好题型：${Object.entries(stats.typePreferMap as Record<string,number>).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "综合"}
- 平均答题速度：${stats.avgResponseTime.toFixed(1)}秒
- 诗人MBTI：${poet.mbtiType}（${poet.mbtiDescription.slice(0, 30)}...）

请用第二人称"你"来写，语气亲切活泼，结合诗人特点分析用户性格。

【重要格式要求】请将内容分为三段，段与段之间用空行（\n\n）分隔：
第一段：一句亲切的问候语（称呼用户为"小诗友"或类似称呼）
第二段：根据答题数据分析用户性格特点的正文
第三段：结合诗人的MBTI类型（${poet.mbtiType}）分析两人灵魂契合之处`;

    const acrosticPrompt = `请以"${poet.name}"这两个字（或三个字）为藏头，创作一首藏头诗，要求：
1. 每句开头的字依次是"${poet.name.split("").join("、")}"
2. 内容要体现该诗人的风格特点
3. 每句5-7字，共${poet.name.length}句
4. 只输出诗句，不要解释`;

    const [analysisReport, acrosticPoem] = await Promise.all([
      callLLM(analysisPrompt),
      callLLM(acrosticPrompt),
    ]);

    const finalAnalysis = analysisReport || `你与${poet.name}的灵魂契合度高达${matchScore}%！你们都有着对诗词的热爱和独特的人生感悟。`;
    const finalAcrostic = acrosticPoem || `${poet.name.split("").map((c) => `${c}字开头的诗句`).join("\n")}`;

    if (user) {
      // Logged-in: save to DB
      await saveDestinyPoet(user.id, poetId, matchScore, finalAnalysis, finalAcrostic);
      await notifyOwner({
        title: "✨ 本命诗人解锁通知",
        content: `用户 ${user.name ?? user.openId} 解锁了本命诗人：${poet.name}（${poet.mbtiType}），契合度 ${matchScore}%`,
      });
      const result = await getDestinyPoet(user.id);
      return { ...result, poet };
    } else {
      // Guest: return result without saving
      return {
        id: 0, userId: 0, poetId, matchScore,
        analysisReport: finalAnalysis,
        acrosticPoem: finalAcrostic,
        shareCount: 0,
        generatedAt: new Date(),
        updatedAt: new Date(),
        poet,
      };
    }
  }),

  // Share destiny poet
  shareDestinyPoet: protectedProcedure.mutation(async ({ ctx }) => {
    await incrementShareCount(ctx.user.id);
    const today = new Date().toISOString().slice(0, 10);
    await upsertDailyTaskProgress(ctx.user.id, "share_result", today, 1);
    return { success: true };
  }),

  // Daily tasks
  getDailyTasks: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().slice(0, 10);
    const [configs, progress] = await Promise.all([
      getDailyTaskConfigs(),
      getUserDailyTasks(ctx.user.id, today),
    ]);
    const progressMap = Object.fromEntries(progress.map((p) => [p.taskKey, p]));
    return configs.map((c) => ({
      ...c,
      progress: progressMap[c.taskKey]?.progress ?? 0,
      completed: progressMap[c.taskKey]?.completed ?? false,
      claimed: progressMap[c.taskKey]?.claimed ?? false,
    }));
  }),

  claimTaskReward: protectedProcedure
    .input(z.object({ taskKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const today = new Date().toISOString().slice(0, 10);
      const reward = await claimDailyTaskReward(ctx.user.id, input.taskKey, today);
      if (!reward) throw new TRPCError({ code: "BAD_REQUEST", message: "任务未完成或已领取" });
      return reward;
    }),

  // Weekly leaderboard
  getWeeklyLeaderboard: publicProcedure.query(() => getWeeklyLeaderboard(50)),

  // Get poet details
  getPoet: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const poet = await getPoetById(input.id);
      if (!poet) throw new TRPCError({ code: "NOT_FOUND" });
      return poet;
    }),

  // LLM: Generate poem analysis
  analyzePoem: protectedProcedure
    .input(z.object({ poem: z.string(), author: z.string() }))
    .mutation(async ({ input }) => {
      const prompt = `请用100字以内，用活泼有趣的语言解析这首诗/词的意境和情感：
作者：${input.author}
内容：${input.poem}
要求：语言简洁生动，适合年轻人阅读，可以加入一些现代感的比喻。`;
      const analysis = await callLLM(prompt);
      return { analysis: analysis || "这首诗意境深远，值得细细品味。" };
    }),

  // LLM: Generate acrostic poem for user's nickname/title
  generateNicknameAcrostic: publicProcedure
    .input(z.object({ nickname: z.string().min(1).max(10) }))
    .mutation(async ({ input }) => {
      // 提取名号中的汉字（去掉数字和下划线）
      const chars = input.nickname.replace(/[^\u4e00-\u9fff]/g, "");
      if (!chars || chars.length < 1) {
        return { acrostic: "诗意人生，墨香千古。\n词韵悠长，风雅永存。" };
      }
      const useChars = chars.slice(0, Math.min(chars.length, 4)); // 最多取4字
      const prompt = `请以"${useChars}"这${useChars.length}个字为藏头，创作一首藏头诗，要求：
1. 每句开头的字依次是"${useChars.split("").join("、")}"
2. 内容要有诗词意境，优美典雅
3. 每句5-7字，共${useChars.length}句
4. 只输出诗句，每句一行，不要解释、不要标点以外的内容`;
      const acrostic = await callLLM(prompt);
      return { acrostic: acrostic || `${useChars.split("").map(c => `${c}字为首，诗意绵长`).join("\n")}` };
    }),
});
