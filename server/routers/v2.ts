/**
 * V2 路由：解救樊登·诗词闯关
 * 关卡解锁制 + 诗债机制 + 诗人卡牌系统
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getAllStages,
  getStageById,
  getUserProgressForSession,
  getUserProgressForStage,
  upsertUserProgress,
  unlockNextStage,
  getUnpaidDebts,
  createDebts,
  repayDebts,
  createGameSession,
  getGameSession,
  updateSessionAnswer,
  finalizeSession,
  getQuestionsByIds,
  getFillQuestionsByDifficulty,
  getAllPoetCards,
  getUserOwnedCardIds,
  getUserCards,
  dropCards,
  getDifficultyRange,
  shuffle,
} from "../v2-db";

// ── 路由 ──────────────────────────────────────────────────────

export const v2Router = router({

  /** 获取所有关卡列表（含用户进度） */
  getStages: publicProcedure
    .input(z.object({ sessionKey: z.string() }))
    .query(async ({ input }) => {
      const stages = await getAllStages();
      const progresses = await getUserProgressForSession(input.sessionKey);
      const progressMap = new Map(progresses.map((p) => [p.stageId, p]));

      return stages.map((stage, idx) => {
        const progress = progressMap.get(stage.id);
        let status: "locked" | "available" | "completed" = "locked";
        if (idx === 0) {
          status = (progress?.status as "locked" | "available" | "completed") ?? "available";
        } else {
          status = (progress?.status as "locked" | "available" | "completed") ?? "locked";
        }
        return {
          ...stage,
          status,
          bestCorrect: progress?.bestCorrect ?? 0,
          attemptCount: progress?.attemptCount ?? 0,
          completedAt: progress?.completedAt ?? null,
        };
      });
    }),

  /** 开始一关（返回题目列表） */
  startStage: publicProcedure
    .input(z.object({ sessionKey: z.string(), stageId: z.number() }))
    .mutation(async ({ input }) => {
      const stage = await getStageById(input.stageId);
      if (!stage) throw new Error("关卡不存在");

      // 检查关卡是否已解锁（第一关默认可用）
      if (stage.stageNumber > 1) {
        const progress = await getUserProgressForStage(input.sessionKey, input.stageId);
        if (!progress || progress.status === "locked") {
          throw new Error("该关卡尚未解锁");
        }
      }

      // 检查是否有未还清的诗债
      const unpaidDebts = await getUnpaidDebts(input.sessionKey, input.stageId);
      if (unpaidDebts.length > 0) {
        const debtQuestionIds = unpaidDebts.map((d) => d.questionId);
        const debtQuestions = await getQuestionsByIds(debtQuestionIds);
        const sessionId = await createGameSession(
          input.sessionKey, input.stageId, "debt", debtQuestionIds
        );
        return {
          phase: "debt" as const,
          sessionId,
          debtCount: unpaidDebts.length,
          questions: debtQuestions.map((q) => ({
            id: q.id,
            content: q.content,
            options: q.options ? JSON.parse(q.options) : [],
            correctAnswer: q.correctAnswer,
            sourcePoemTitle: q.sourcePoemTitle,
            sourcePoemAuthor: q.sourcePoemAuthor,
          })),
        };
      }

      // 无诗债，正常答题
      const [minDiff, maxDiff] = getDifficultyRange(stage.tierKey);
      const allQs = await getFillQuestionsByDifficulty(minDiff, maxDiff);
      if (allQs.length < 10) throw new Error("题库题目不足，请联系管理员");

      const selected = shuffle(allQs).slice(0, 10);
      const questionIds = selected.map((q) => q.id);
      const sessionId = await createGameSession(
        input.sessionKey, input.stageId, "main", questionIds
      );

      return {
        phase: "main" as const,
        sessionId,
        debtCount: 0,
        questions: selected.map((q) => ({
          id: q.id,
          content: q.content,
          options: q.options ? JSON.parse(q.options) : [],
          correctAnswer: q.correctAnswer,
          sourcePoemTitle: q.sourcePoemTitle,
          sourcePoemAuthor: q.sourcePoemAuthor,
        })),
      };
    }),

  /** 提交单题答案 */
  submitAnswer: publicProcedure
    .input(z.object({
      sessionKey: z.string(),
      sessionId: z.number(),
      questionId: z.number(),
      answer: z.string(),
    }))
    .mutation(async ({ input }) => {
      const session = await getGameSession(input.sessionId);
      if (!session) throw new Error("会话不存在");

      const questions = await getQuestionsByIds([input.questionId]);
      const question = questions[0];
      if (!question) throw new Error("题目不存在");

      const isCorrect = input.answer.trim() === question.correctAnswer.trim();
      const wrongIds: number[] = session.wrongQuestionIds
        ? JSON.parse(session.wrongQuestionIds) : [];
      if (!isCorrect) wrongIds.push(input.questionId);

      const newCorrect = (session.correctCount ?? 0) + (isCorrect ? 1 : 0);
      await updateSessionAnswer(input.sessionId, newCorrect, wrongIds);

      return {
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      };
    }),

  /** 完成一关（处理诗债、解锁下一关、掉落卡牌） */
  completeStage: publicProcedure
    .input(z.object({ sessionKey: z.string(), sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const session = await getGameSession(input.sessionId);
      if (!session) throw new Error("会话不存在");

      const stage = await getStageById(session.stageId);
      if (!stage) throw new Error("关卡不存在");

      const correctCount = session.correctCount ?? 0;
      const wrongIds: number[] = session.wrongQuestionIds
        ? JSON.parse(session.wrongQuestionIds) : [];

      // 通关判断
      const passed = session.phase === "debt"
        ? wrongIds.length === 0
        : correctCount === 10;

      // 正常答题阶段：记录诗债
      if (session.phase === "main" && wrongIds.length > 0) {
        await createDebts(input.sessionKey, session.stageId, wrongIds);
      }

      // 还债阶段：标记已还清
      if (session.phase === "debt" && passed) {
        const debtQuestionIds: number[] = session.questionIds
          ? JSON.parse(session.questionIds) : [];
        if (debtQuestionIds.length > 0) {
          await repayDebts(input.sessionKey, session.stageId, debtQuestionIds);
        }
      }

      // 更新会话状态
      await finalizeSession(input.sessionId, passed);

      // 更新用户进度
      const existingProgress = await getUserProgressForStage(input.sessionKey, session.stageId);
      const newStatus = passed
        ? "completed"
        : (existingProgress?.status === "completed" ? "completed" : "available");
      await upsertUserProgress(
        input.sessionKey, session.stageId, newStatus,
        correctCount, 1,
        passed ? new Date() : (existingProgress?.completedAt ?? null)
      );

      // 解锁下一关
      let nextStageUnlocked = false;
      if (passed) {
        nextStageUnlocked = await unlockNextStage(input.sessionKey, stage.stageNumber);
      }

      // 卡牌掉落（通关后，仅正常答题阶段）
      let droppedCards: Array<{ id: number; poetName: string; imageUrl: string; rarity: string; signaturePoem: string | null }> = [];
      if (passed && session.phase === "main") {
        let dropCount = 0;
        if (correctCount === 10) dropCount = 2;
        else if (correctCount >= 8) dropCount = 1;
        if (dropCount > 0) {
          droppedCards = await dropCards(input.sessionKey, session.stageId, dropCount);
        }
      }

      return {
        passed,
        correctCount,
        totalQuestions: 10,
        wrongCount: wrongIds.length,
        hasDebt: !passed && wrongIds.length > 0,
        nextStageUnlocked,
        droppedCards,
        storyAfter: passed ? stage.storyAfter : null,
      };
    }),

  /** 获取用户卡牌收藏（去重） */
  getMyCards: publicProcedure
    .input(z.object({ sessionKey: z.string() }))
    .query(async ({ input }) => {
      const userCards = await getUserCards(input.sessionKey);
      const seen = new Set<number>();
      const unique = userCards.filter((c) => {
        if (seen.has(c.cardId)) return false;
        seen.add(c.cardId);
        return true;
      });
      return { cards: unique, total: unique.length, totalAvailable: 24 };
    }),

  /** 获取所有卡牌（含是否已获得） */
  getAllCards: publicProcedure
    .input(z.object({ sessionKey: z.string() }))
    .query(async ({ input }) => {
      const all = await getAllPoetCards();
      const ownedSet = await getUserOwnedCardIds(input.sessionKey);
      return all.map((c) => ({ ...c, owned: ownedSet.has(c.id) }));
    }),

  /** 获取关卡剧情 */
  getStageStory: publicProcedure
    .input(z.object({ stageId: z.number() }))
    .query(async ({ input }) => {
      return getStageById(input.stageId);
    }),

  /** 检查诗债 */
  checkDebts: publicProcedure
    .input(z.object({ sessionKey: z.string(), stageId: z.number() }))
    .query(async ({ input }) => {
      const debts = await getUnpaidDebts(input.sessionKey, input.stageId);
      return { count: debts.length, hasDebt: debts.length > 0 };
    }),
});
