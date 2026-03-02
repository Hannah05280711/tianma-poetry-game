import { and, desc, eq, gte, lte, sql, ne, inArray } from "drizzle-orm";
import {
  dailyTaskConfigs,
  destinyPoets,
  gameSessions,
  poets,
  questions,
  userDailyTasks,
  userQuestionRecords,
  users,
  weaponRanks,
  weeklyLeaderboard,
} from "../drizzle/schema";
import { getDb } from "./db";

// ─── Weapon Rank Helpers ──────────────────────────────────────────────────────
export async function getRankByScore(score: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(weaponRanks)
    .where(and(lte(weaponRanks.minScore, score), gte(weaponRanks.maxScore, score)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAllRanks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weaponRanks).orderBy(weaponRanks.minScore);
}

// ─── Question Helpers ─────────────────────────────────────────────────────────
export async function getRandomQuestions(difficulty: number, count: number, excludeIds: number[] = []) {
  const db = await getDb();
  if (!db) return [];
  let query = db
    .select()
    .from(questions)
    .where(eq(questions.difficulty, difficulty))
    .orderBy(sql`RAND()`)
    .limit(count);
  return query;
}

export async function getQuestionsByDifficulty(minDiff: number, maxDiff: number, count: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(questions)
    .where(and(gte(questions.difficulty, minDiff), lte(questions.difficulty, maxDiff)))
    .orderBy(sql`RAND()`)
    .limit(count);
}

/**
 * 按主题标签优先推送题目：先拉取匹配 themeTag 的题目，不足时用普通题目补充
 * themeTag 可以是节日名（如"中秋"）、节气名（如"清明"）或诗人名（如"李白"）
 */
export async function getQuestionsByTheme(
  themeTag: string,
  minDiff: number,
  maxDiff: number,
  count: number
) {
  const db = await getDb();
  if (!db) return [];

  const diffFilter = and(gte(questions.difficulty, minDiff), lte(questions.difficulty, maxDiff));

  // 1. 先拉取匹配主题的题目（按诗人名或themeTag字段匹配）
  const themeQs = await db
    .select()
    .from(questions)
    .where(and(
      diffFilter,
      sql`(${questions.themeTag} LIKE ${`%${themeTag}%`} OR ${questions.sourcePoemAuthor} LIKE ${`%${themeTag}%`})`
    ))
    .orderBy(sql`RAND()`)
    .limit(count * 3);

  if (themeQs.length >= count) {
    return themeQs.slice(0, count);
  }

  // 2. 不足时用普通题目补充
  const needed = count - themeQs.length;
  const existingIds = themeQs.map(q => q.id);
  const extraQs = await db
    .select()
    .from(questions)
    .where(and(
      diffFilter,
      existingIds.length > 0 ? sql`${questions.id} NOT IN (${sql.join(existingIds.map(id => sql`${id}`), sql`, `)})` : sql`1=1`
    ))
    .orderBy(sql`RAND()`)
    .limit(needed * 3);

  return [...themeQs, ...extraQs].slice(0, count);
}

export async function getQuestionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  return rows[0] ?? null;
}

// ─── Poet Helpers ─────────────────────────────────────────────────────────────
export async function getAllPoets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(poets);
}

export async function getPoetById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(poets).where(eq(poets.id, id)).limit(1);
  return rows[0] ?? null;
}

// ─── User Game State ──────────────────────────────────────────────────────────
export async function getUserGameState(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ?? null;
}

export async function updateUserScore(userId: number, scoreDelta: number, isCorrect: boolean) {
  const db = await getDb();
  if (!db) return;
  const user = await getUserGameState(userId);
  if (!user) return;

  const newScore = Math.max(0, (user.totalScore ?? 0) + scoreDelta);
  const newAnswered = (user.totalAnswered ?? 0) + 1;
  const newCorrect = (user.totalCorrect ?? 0) + (isCorrect ? 1 : 0);
  const newConsecutive = isCorrect ? (user.consecutiveWins ?? 0) + 1 : 0;

  // Get new rank
  const rank = await getRankByScore(newScore);
  const newRankId = rank?.id ?? user.currentRankId;

  await db
    .update(users)
    .set({
      totalScore: newScore,
      totalAnswered: newAnswered,
      totalCorrect: newCorrect,
      consecutiveWins: newConsecutive,
      currentRankId: newRankId,
    })
    .where(eq(users.id, userId));

  return { newScore, newRankId, newConsecutive, oldRankId: user.currentRankId };
}

export async function updateUserPoetPreference(
  userId: number,
  poetId: number,
  questionType: string,
  isCorrect: boolean,
  responseTime: number
) {
  const db = await getDb();
  if (!db) return;
  const user = await getUserGameState(userId);
  if (!user) return;

  const poetMap: Record<string, number> = user.poetCorrectMap ? (typeof user.poetCorrectMap === 'string' ? JSON.parse(user.poetCorrectMap) : user.poetCorrectMap as Record<string, number>) : {};
  const typeMap: Record<string, number> = user.typePreferMap ? (typeof user.typePreferMap === 'string' ? JSON.parse(user.typePreferMap) : user.typePreferMap as Record<string, number>) : {};

  if (isCorrect) {
    poetMap[String(poetId)] = (poetMap[String(poetId)] ?? 0) + 1;
  }
  typeMap[questionType] = (typeMap[questionType] ?? 0) + 1;

  // Rolling average response time
  const totalAnswered = (user.totalAnswered ?? 0) + 1;
  const oldAvg = user.avgResponseTime ?? 5.0;
  const newAvg = (oldAvg * (totalAnswered - 1) + responseTime) / totalAnswered;

  await db
    .update(users)
    .set({
    poetCorrectMap: JSON.stringify(poetMap) as unknown as null,
    typePreferMap: JSON.stringify(typeMap) as unknown as null,
      avgResponseTime: newAvg,
    })
    .where(eq(users.id, userId));
}

export async function consumeHint(userId: number) {
  const db = await getDb();
  if (!db) return false;
  const user = await getUserGameState(userId);
  if (!user || (user.hintsCount ?? 0) <= 0) return false;
  await db.update(users).set({ hintsCount: (user.hintsCount ?? 1) - 1 }).where(eq(users.id, userId));
  return true;
}

export async function consumeShield(userId: number) {
  const db = await getDb();
  if (!db) return false;
  const user = await getUserGameState(userId);
  if (!user || (user.shieldsCount ?? 0) <= 0) return false;
  await db.update(users).set({ shieldsCount: (user.shieldsCount ?? 1) - 1 }).where(eq(users.id, userId));
  return true;
}

export async function consumeInk(userId: number) {
  const db = await getDb();
  if (!db) return false;
  const user = await getUserGameState(userId);
  if (!user || (user.inkDrops ?? 0) <= 0) return false;
  await db.update(users).set({ inkDrops: (user.inkDrops ?? 1) - 1 }).where(eq(users.id, userId));
  return true;
}

// ─── Question Record ──────────────────────────────────────────────────────────
export async function saveQuestionRecord(
  userId: number,
  questionId: number,
  isCorrect: boolean,
  responseTime: number,
  sessionId: string
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userQuestionRecords).values({
    userId,
    questionId,
    isCorrect,
    responseTime,
    sessionId,
  });
}

// ─── Destiny Poet ─────────────────────────────────────────────────────────────
export async function getDestinyPoet(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(destinyPoets).where(eq(destinyPoets.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function saveDestinyPoet(
  userId: number,
  poetId: number,
  matchScore: number,
  analysisReport: string,
  acrosticPoem: string
) {
  const db = await getDb();
  if (!db) return;
  const existing = await getDestinyPoet(userId);
  if (existing) {
    await db
      .update(destinyPoets)
      .set({ poetId, matchScore, analysisReport, acrosticPoem })
      .where(eq(destinyPoets.userId, userId));
  } else {
    await db.insert(destinyPoets).values({ userId, poetId, matchScore, analysisReport, acrosticPoem });
  }
}

export async function incrementShareCount(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(destinyPoets)
    .set({ shareCount: sql`shareCount + 1` })
    .where(eq(destinyPoets.userId, userId));
}

// ─── Daily Tasks ──────────────────────────────────────────────────────────────
export async function getDailyTaskConfigs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailyTaskConfigs);
}

export async function getUserDailyTasks(userId: number, date: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userDailyTasks)
    .where(and(eq(userDailyTasks.userId, userId), eq(userDailyTasks.date, date)));
}

export async function upsertDailyTaskProgress(
  userId: number,
  taskKey: string,
  date: string,
  increment: number = 1
) {
  const db = await getDb();
  if (!db) return;

  const config = await db
    .select()
    .from(dailyTaskConfigs)
    .where(eq(dailyTaskConfigs.taskKey, taskKey))
    .limit(1);
  if (!config[0]) return;

  const existing = await db
    .select()
    .from(userDailyTasks)
    .where(and(eq(userDailyTasks.userId, userId), eq(userDailyTasks.taskKey, taskKey), eq(userDailyTasks.date, date)))
    .limit(1);

  if (existing[0]) {
    if (existing[0].completed) return existing[0];
    const newProgress = (existing[0].progress ?? 0) + increment;
    const completed = newProgress >= (config[0].targetCount ?? 1);
    await db
      .update(userDailyTasks)
      .set({ progress: newProgress, completed, completedAt: completed ? new Date() : undefined })
      .where(eq(userDailyTasks.id, existing[0].id));
    return { ...existing[0], progress: newProgress, completed };
  } else {
    const newProgress = increment;
    const completed = newProgress >= (config[0].targetCount ?? 1);
    await db.insert(userDailyTasks).values({
      userId,
      taskKey,
      date,
      progress: newProgress,
      completed,
      completedAt: completed ? new Date() : undefined,
    });
    return { userId, taskKey, date, progress: newProgress, completed, claimed: false };
  }
}

export async function claimDailyTaskReward(userId: number, taskKey: string, date: string) {
  const db = await getDb();
  if (!db) return null;

  const task = await db
    .select()
    .from(userDailyTasks)
    .where(and(eq(userDailyTasks.userId, userId), eq(userDailyTasks.taskKey, taskKey), eq(userDailyTasks.date, date)))
    .limit(1);

  if (!task[0] || !task[0].completed || task[0].claimed) return null;

  const config = await db
    .select()
    .from(dailyTaskConfigs)
    .where(eq(dailyTaskConfigs.taskKey, taskKey))
    .limit(1);
  if (!config[0]) return null;

  const user = await getUserGameState(userId);
  if (!user) return null;

  await db
    .update(users)
    .set({
      totalScore: (user.totalScore ?? 0) + (config[0].rewardScore ?? 0),
      hintsCount: (user.hintsCount ?? 0) + (config[0].rewardHints ?? 0),
      inkDrops: Math.min(20, (user.inkDrops ?? 0) + (config[0].rewardInk ?? 0)),
    })
    .where(eq(users.id, userId));

  await db
    .update(userDailyTasks)
    .set({ claimed: true })
    .where(eq(userDailyTasks.id, task[0].id));

  return config[0];
}

// ─── Weekly Leaderboard ───────────────────────────────────────────────────────
export function getCurrentWeekKey() {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export async function updateWeeklyScore(userId: number, scoreDelta: number, isCorrect: boolean, rankTier: string) {
  const db = await getDb();
  if (!db) return;
  const weekKey = getCurrentWeekKey();

  const existing = await db
    .select()
    .from(weeklyLeaderboard)
    .where(and(eq(weeklyLeaderboard.userId, userId), eq(weeklyLeaderboard.weekKey, weekKey)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(weeklyLeaderboard)
      .set({
        weekScore: (existing[0].weekScore ?? 0) + Math.max(0, scoreDelta),
        weekAnswered: (existing[0].weekAnswered ?? 0) + 1,
        weekCorrect: (existing[0].weekCorrect ?? 0) + (isCorrect ? 1 : 0),
        rankTier,
      })
      .where(eq(weeklyLeaderboard.id, existing[0].id));
  } else {
    await db.insert(weeklyLeaderboard).values({
      userId,
      weekKey,
      weekScore: Math.max(0, scoreDelta),
      weekAnswered: 1,
      weekCorrect: isCorrect ? 1 : 0,
      rankTier,
    });
  }
}

export async function getWeeklyLeaderboard(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  const weekKey = getCurrentWeekKey();
  return db
    .select({
      userId: weeklyLeaderboard.userId,
      weekScore: weeklyLeaderboard.weekScore,
      weekAnswered: weeklyLeaderboard.weekAnswered,
      weekCorrect: weeklyLeaderboard.weekCorrect,
      rankTier: weeklyLeaderboard.rankTier,
      userName: users.name,
    })
    .from(weeklyLeaderboard)
    .leftJoin(users, eq(weeklyLeaderboard.userId, users.id))
    .where(eq(weeklyLeaderboard.weekKey, weekKey))
    .orderBy(desc(weeklyLeaderboard.weekScore))
    .limit(limit);
}

// ─── Daily Login ──────────────────────────────────────────────────────────────
export async function handleDailyLogin(userId: number) {
  const db = await getDb();
  if (!db) return { isNew: false, consecutiveDays: 0 };

  const user = await getUserGameState(userId);
  if (!user) return { isNew: false, consecutiveDays: 0 };

  const today = new Date().toISOString().slice(0, 10);
  const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate).toISOString().slice(0, 10) : null;

  if (lastLogin === today) {
    return { isNew: false, consecutiveDays: user.consecutiveLoginDays ?? 1 };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const isConsecutive = lastLogin === yesterday;
  const newConsecutiveDays = isConsecutive ? (user.consecutiveLoginDays ?? 0) + 1 : 1;

  await db
    .update(users)
    .set({
      lastLoginDate: new Date(),
      consecutiveLoginDays: newConsecutiveDays,
    })
    .where(eq(users.id, userId));

  // Mark daily login task
  await upsertDailyTaskProgress(userId, "daily_login", today, 1);

  return { isNew: true, consecutiveDays: newConsecutiveDays };
}

// ─── User Stats for Poet Matching ─────────────────────────────────────────────
export async function getUserAnswerStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const user = await getUserGameState(userId);
  if (!user) return null;

  return {
    totalAnswered: user.totalAnswered ?? 0,
    totalCorrect: user.totalCorrect ?? 0,
    poetCorrectMap: user.poetCorrectMap ? (typeof user.poetCorrectMap === 'string' ? JSON.parse(user.poetCorrectMap) : user.poetCorrectMap as Record<string, number>) : {},
    typePreferMap: user.typePreferMap ? (typeof user.typePreferMap === 'string' ? JSON.parse(user.typePreferMap) : user.typePreferMap as Record<string, number>) : {},
    avgResponseTime: user.avgResponseTime ?? 5.0,
    consecutiveWins: user.consecutiveWins ?? 0,
    totalScore: user.totalScore ?? 0,
  };
}
