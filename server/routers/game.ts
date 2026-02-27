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
function matchPoet(
  stats: {
    poetCorrectMap: Record<string, number>;
    typePreferMap: Record<string, number>;
    avgResponseTime: number;
    totalCorrect: number;
    totalAnswered: number;
  },
  allPoets: Array<{ id: number; name: string; mbtiType: string }>
) {
  const scores: Record<number, number> = {};
  for (const p of allPoets) scores[p.id] = 0;

  // 1. Correct answers per poet (weight 0.5)
  for (const [poetId, correct] of Object.entries(stats.poetCorrectMap)) {
    const id = Number(poetId);
    if (scores[id] !== undefined) scores[id] += correct * 0.5;
  }

  // 2. Question type preference (weight 0.2)
  const prefType = Object.entries(stats.typePreferMap).sort((a, b) => b[1] - a[1])[0]?.[0];
  const poetByMbti = (mbti: string) => allPoets.find((p) => p.mbtiType === mbti)?.id;
  if (prefType === "reorder") { const id = poetByMbti("ENFP"); if (id) scores[id] = (scores[id] ?? 0) + 20; }
  if (prefType === "error")   { const id = poetByMbti("INFJ"); if (id) scores[id] = (scores[id] ?? 0) + 20; }
  if (prefType === "fill")    { const id = poetByMbti("ISTJ"); if (id) scores[id] = (scores[id] ?? 0) + 15; }
  if (prefType === "chain")   { const id = poetByMbti("ENFJ"); if (id) scores[id] = (scores[id] ?? 0) + 15; }
  if (prefType === "judge")   { const id = poetByMbti("INTP"); if (id) scores[id] = (scores[id] ?? 0) + 15; }

  // 3. Response speed (weight 0.15)
  if (stats.avgResponseTime < 3) { const id = poetByMbti("ENFJ"); if (id) scores[id] = (scores[id] ?? 0) + 15; }
  if (stats.avgResponseTime > 7) { const id = poetByMbti("INFP"); if (id) scores[id] = (scores[id] ?? 0) + 15; }

  // 4. Accuracy (weight 0.15)
  const accuracy = stats.totalAnswered > 0 ? stats.totalCorrect / stats.totalAnswered : 0;
  if (accuracy > 0.8) { const id = poetByMbti("ISTJ"); if (id) scores[id] = (scores[id] ?? 0) + 15; }
  if (accuracy < 0.4) { const id = poetByMbti("ENFP"); if (id) scores[id] = (scores[id] ?? 0) + 10; }

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

  // Get questions for a session
  getQuestions: protectedProcedure
    .input(z.object({ difficulty: z.number().min(1).max(5).default(1), count: z.number().min(1).max(10).default(5) }))
    .query(async ({ input }) => {
      const qs = await getQuestionsByDifficulty(
        Math.max(1, input.difficulty - 1),
        Math.min(5, input.difficulty + 1),
        input.count
      );
      // Shuffle options for each question
      return qs.map((q) => ({
        ...q,
        options: q.options ? [...(Array.isArray(q.options) ? q.options as string[] : JSON.parse(q.options as string) as string[])].sort(() => Math.random() - 0.5) : [],
      }));
    }),

  // Submit an answer
  submitAnswer: protectedProcedure
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
      const user = await getUserGameState(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      let scoreDelta = 0;
      let shieldUsed = false;

      if (isCorrect) {
        scoreDelta = 10;
        const newConsec = (user.consecutiveWins ?? 0) + 1;
        if (newConsec === 3) scoreDelta += 5; // 3-win bonus
        if (newConsec === 5) scoreDelta += 5; // 5-win bonus
      } else {
        // Check shield
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
      await updateUserPoetPreference(
        ctx.user.id,
        question.poetId,
        question.questionType,
        isCorrect,
        input.responseTime
      );
      await saveQuestionRecord(ctx.user.id, input.questionId, isCorrect, input.responseTime, input.sessionId);

      // Update weekly leaderboard
      const rank = await getRankByScore(result?.newScore ?? 0);
      await updateWeeklyScore(ctx.user.id, Math.max(0, scoreDelta), isCorrect, rank?.tierName ?? "青铜剑");

      // Update daily tasks
      const today = new Date().toISOString().slice(0, 10);
      await upsertDailyTaskProgress(ctx.user.id, "answer_3", today, 1);
      if (isCorrect) {
        await upsertDailyTaskProgress(ctx.user.id, "win_streak_2", today, 1);
      }

      // Consecutive win rewards
      let reward: { type: string; message: string } | null = null;
      const newConsec = result?.newConsecutive ?? 0;
      if (isCorrect && newConsec === 5) {
        // Give hint
        const db = await import("../game-db").then((m) => m.getUserGameState(ctx.user.id));
        if (db) {
          const { getDb } = await import("../db");
          const { users } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const dbConn = await getDb();
          if (dbConn) {
            await dbConn.update(users).set({ hintsCount: (db.hintsCount ?? 0) + 1 }).where(eq(users.id, ctx.user.id));
          }
        }
        reward = { type: "hint", message: "🎉 5连胜！获得提示卡×1" };
      } else if (isCorrect && newConsec === 10) {
        // Give shield
        const db = await import("../game-db").then((m) => m.getUserGameState(ctx.user.id));
        if (db) {
          const { getDb } = await import("../db");
          const { users } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const dbConn = await getDb();
          if (dbConn) {
            await dbConn.update(users).set({ shieldsCount: (db.shieldsCount ?? 0) + 1 }).where(eq(users.id, ctx.user.id));
          }
        }
        reward = { type: "shield", message: "🛡️ 10连胜！获得护身符×1" };
      }

      // Check rank up
      const rankChanged = result && result.newRankId !== result.oldRankId;
      if (rankChanged) {
        const newRank = await getRankByScore(result.newScore);
        await notifyOwner({
          title: "🏆 段位晋升通知",
          content: `用户 ${ctx.user.name ?? ctx.user.openId} 晋升至 ${newRank?.rankName ?? "新段位"}！当前积分：${result.newScore}`,
        });
      }

      // Check destiny poet unlock (100 answers)
      const updatedUser = await getUserGameState(ctx.user.id);
      const shouldUnlock =
        (updatedUser?.totalAnswered ?? 0) >= 100 && !(await getDestinyPoet(ctx.user.id));

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
        explanation: question.explanation,
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

  // Get destiny poet
  getDestinyPoet: protectedProcedure.query(async ({ ctx }) => {
    const destiny = await getDestinyPoet(ctx.user.id);
    if (!destiny) return null;
    const poet = await getPoetById(destiny.poetId);
    return { ...destiny, poet };
  }),

  // Generate destiny poet (trigger matching)
  generateDestinyPoet: protectedProcedure.mutation(async ({ ctx }) => {
    const stats = await getUserAnswerStats(ctx.user.id);
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

请用第二人称"你"来写，语气亲切活泼，结合诗人特点分析用户性格。`;

    const acrosticPrompt = `请以"${poet.name}"这两个字（或三个字）为藏头，创作一首藏头诗，要求：
1. 每句开头的字依次是"${poet.name.split("").join("、")}"
2. 内容要体现该诗人的风格特点
3. 每句5-7字，共${poet.name.length}句
4. 只输出诗句，不要解释`;

    const [analysisReport, acrosticPoem] = await Promise.all([
      callLLM(analysisPrompt),
      callLLM(acrosticPrompt),
    ]);

    await saveDestinyPoet(
      ctx.user.id,
      poetId,
      matchScore,
      analysisReport || `你与${poet.name}的灵魂契合度高达${matchScore}%！你们都有着对诗词的热爱和独特的人生感悟。`,
      acrosticPoem || `${poet.name.split("").map((c) => `${c}字开头的诗句`).join("\n")}`
    );

    await notifyOwner({
      title: "✨ 本命诗人解锁通知",
      content: `用户 ${ctx.user.name ?? ctx.user.openId} 解锁了本命诗人：${poet.name}（${poet.mbtiType}），契合度 ${matchScore}%`,
    });

    const result = await getDestinyPoet(ctx.user.id);
    return { ...result, poet };
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
});
