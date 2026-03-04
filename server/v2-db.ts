/**
 * V2 数据库辅助函数
 * 封装所有 v2 相关的数据库操作
 */
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  poetCards,
  questions,
  userPoetCards,
  userStageProgress,
  v2GameSessions,
  v2PoetDebts,
  v2Stages,
} from "../drizzle/schema";
import { getDb } from "./db";

// ── 工具函数 ──────────────────────────────────────────────────

export function getDifficultyRange(tierKey: string): [number, number] {
  const map: Record<string, [number, number]> = {
    bronze: [1, 2],
    silver: [2, 3],
    gold: [3, 3],
    platinum: [3, 4],
    diamond: [4, 4],
    star: [4, 5],
    king: [5, 5],
  };
  return map[tierKey] ?? [1, 2];
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── 关卡查询 ──────────────────────────────────────────────────

export async function getAllStages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(v2Stages).orderBy(v2Stages.stageNumber);
}

export async function getStageById(stageId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(v2Stages).where(eq(v2Stages.id, stageId));
  return rows[0] ?? null;
}

export async function getStageByNumber(stageNumber: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(v2Stages).where(eq(v2Stages.stageNumber, stageNumber));
  return rows[0] ?? null;
}

// ── 用户进度 ──────────────────────────────────────────────────

export async function getUserProgressForSession(sessionKey: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userStageProgress).where(eq(userStageProgress.sessionKey, sessionKey));
}

export async function getUserProgressForStage(sessionKey: string, stageId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(userStageProgress).where(
    and(eq(userStageProgress.sessionKey, sessionKey), eq(userStageProgress.stageId, stageId))
  );
  return rows[0] ?? null;
}

export async function upsertUserProgress(
  sessionKey: string,
  stageId: number,
  status: "locked" | "available" | "completed",
  bestCorrect: number,
  attemptDelta: number,
  completedAt?: Date | null
) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserProgressForStage(sessionKey, stageId);
  if (existing) {
    await db.update(userStageProgress).set({
      status,
      bestCorrect: Math.max(existing.bestCorrect ?? 0, bestCorrect),
      attemptCount: (existing.attemptCount ?? 0) + attemptDelta,
      completedAt: completedAt !== undefined ? completedAt : existing.completedAt,
    }).where(eq(userStageProgress.id, existing.id));
  } else {
    await db.insert(userStageProgress).values({
      sessionKey,
      stageId,
      status,
      bestCorrect,
      attemptCount: attemptDelta,
      completedAt: completedAt ?? undefined,
    });
  }
}

export async function unlockNextStage(sessionKey: string, currentStageNumber: number) {
  const nextStage = await getStageByNumber(currentStageNumber + 1);
  if (!nextStage) return false;
  const db = await getDb();
  if (!db) return false;
  const existing = await getUserProgressForStage(sessionKey, nextStage.id);
  if (!existing) {
    await db.insert(userStageProgress).values({
      sessionKey,
      stageId: nextStage.id,
      status: "available",
      bestCorrect: 0,
      attemptCount: 0,
    });
    return true;
  } else if (existing.status === "locked") {
    await db.update(userStageProgress)
      .set({ status: "available" })
      .where(eq(userStageProgress.id, existing.id));
    return true;
  }
  return false;
}

// ── 诗债 ──────────────────────────────────────────────────────

export async function getUnpaidDebts(sessionKey: string, stageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(v2PoetDebts).where(
    and(
      eq(v2PoetDebts.sessionKey, sessionKey),
      eq(v2PoetDebts.stageId, stageId),
      sql`${v2PoetDebts.repaidAt} IS NULL`
    )
  );
}

export async function createDebts(sessionKey: string, stageId: number, questionIds: number[]) {
  const db = await getDb();
  if (!db) return;
  // 先清除旧诗债
  await db.delete(v2PoetDebts).where(
    and(
      eq(v2PoetDebts.sessionKey, sessionKey),
      eq(v2PoetDebts.stageId, stageId),
      sql`${v2PoetDebts.repaidAt} IS NULL`
    )
  );
  // 新增诗债
  for (const qId of questionIds) {
    await db.insert(v2PoetDebts).values({ sessionKey, stageId, questionId: qId });
  }
}

export async function repayDebts(sessionKey: string, stageId: number, questionIds: number[]) {
  const db = await getDb();
  if (!db) return;
  if (questionIds.length === 0) return;
  await db.update(v2PoetDebts)
    .set({ repaidAt: new Date() })
    .where(
      and(
        eq(v2PoetDebts.sessionKey, sessionKey),
        eq(v2PoetDebts.stageId, stageId),
        inArray(v2PoetDebts.questionId, questionIds)
      )
    );
}

// ── 游戏会话 ──────────────────────────────────────────────────

export async function createGameSession(
  sessionKey: string,
  stageId: number,
  phase: "main" | "debt",
  questionIds: number[]
) {
  const db = await getDb();
  if (!db) throw new Error("数据库连接失败");
  const result = await db.insert(v2GameSessions).values({
    sessionKey,
    stageId,
    phase,
    questionIds: JSON.stringify(questionIds),
    currentIndex: 0,
    correctCount: 0,
    wrongQuestionIds: JSON.stringify([]),
  });
  return Number((result as unknown as { insertId: number }[])[0]?.insertId ?? 0);
}

export async function getGameSession(sessionId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(v2GameSessions).where(eq(v2GameSessions.id, sessionId));
  return rows[0] ?? null;
}

export async function updateSessionAnswer(
  sessionId: number,
  newCorrectCount: number,
  wrongIds: number[]
) {
  const db = await getDb();
  if (!db) return;
  await db.update(v2GameSessions).set({
    correctCount: newCorrectCount,
    wrongQuestionIds: JSON.stringify(wrongIds),
  }).where(eq(v2GameSessions.id, sessionId));
}

export async function finalizeSession(sessionId: number, passed: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(v2GameSessions).set({
    passed,
    completedAt: new Date(),
  }).where(eq(v2GameSessions.id, sessionId));
}

// ── 题目 ──────────────────────────────────────────────────────

export async function getQuestionsByIds(ids: number[]) {
  const db = await getDb();
  if (!db || ids.length === 0) return [];
  return db.select().from(questions).where(inArray(questions.id, ids));
}

export async function getFillQuestionsByDifficulty(minDiff: number, maxDiff: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(questions).where(
    and(
      eq(questions.questionType, "fill"),
      sql`${questions.difficulty} >= ${minDiff}`,
      sql`${questions.difficulty} <= ${maxDiff}`
    )
  );
}

// ── 卡牌 ──────────────────────────────────────────────────────

export async function getAllPoetCards() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(poetCards).orderBy(poetCards.id);
}

export async function getUserOwnedCardIds(sessionKey: string) {
  const db = await getDb();
  if (!db) return new Set<number>();
  const rows = await db.select({ cardId: userPoetCards.cardId })
    .from(userPoetCards)
    .where(eq(userPoetCards.sessionKey, sessionKey));
  return new Set(rows.map((r) => r.cardId));
}

export async function getUserCards(sessionKey: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: userPoetCards.id,
    cardId: userPoetCards.cardId,
    obtainedAt: userPoetCards.obtainedAt,
    stageId: userPoetCards.stageId,
    poetName: poetCards.poetName,
    dynasty: poetCards.dynasty,
    imageUrl: poetCards.imageUrl,
    rarity: poetCards.rarity,
    description: poetCards.description,
    signaturePoem: poetCards.signaturePoem,
  })
    .from(userPoetCards)
    .innerJoin(poetCards, eq(userPoetCards.cardId, poetCards.id))
    .where(eq(userPoetCards.sessionKey, sessionKey))
    .orderBy(userPoetCards.obtainedAt);
}

export async function dropCards(sessionKey: string, stageId: number, count: number) {
  const db = await getDb();
  if (!db || count <= 0) return [];
  const all = await getAllPoetCards();
  const shuffled = shuffle(all);
  const toDrop = shuffled.slice(0, count);
  for (const card of toDrop) {
    await db.insert(userPoetCards).values({ sessionKey, cardId: card.id, stageId });
  }
  return toDrop.map((c) => ({
    id: c.id,
    poetName: c.poetName,
    imageUrl: c.imageUrl,
    rarity: c.rarity,
    signaturePoem: c.signaturePoem,
  }));
}
