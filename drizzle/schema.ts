import {
  boolean,
  float,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Game fields
  totalScore: int("totalScore").default(0).notNull(),
  currentRankId: int("currentRankId").default(1).notNull(),
  consecutiveWins: int("consecutiveWins").default(0).notNull(),
  totalAnswered: int("totalAnswered").default(0).notNull(),
  totalCorrect: int("totalCorrect").default(0).notNull(),
  hintsCount: int("hintsCount").default(3).notNull(),
  shieldsCount: int("shieldsCount").default(1).notNull(),
  inkDrops: int("inkDrops").default(20).notNull(),
  consecutiveLoginDays: int("consecutiveLoginDays").default(0).notNull(),
  lastLoginDate: timestamp("lastLoginDate"),
  poetCorrectMap: text("poetCorrectMap"),
  typePreferMap: text("typePreferMap"),
  avgResponseTime: float("avgResponseTime").default(5.0),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const poets = mysqlTable("poets", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  dynasty: varchar("dynasty", { length: 32 }).notNull(),
  mbtiType: varchar("mbtiType", { length: 8 }).notNull(),
  mbtiDescription: text("mbtiDescription").notNull(),
  personalityTags: text("personalityTags"),
  signaturePoems: text("signaturePoems"),
  imageUrl: text("imageUrl"),
  relatedWeapons: text("relatedWeapons"),
  styleKeywords: text("styleKeywords"),
  dynastyWeight: float("dynastyWeight").default(1.0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Poet = typeof poets.$inferSelect;

export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  poetId: int("poetId").notNull(),
  content: text("content").notNull(),
  options: text("options"),
  correctAnswer: varchar("correctAnswer", { length: 512 }).notNull(),
  questionType: mysqlEnum("questionType", ["fill", "reorder", "error", "chain", "judge"]).notNull(),
  difficulty: int("difficulty").notNull().default(1),
  weaponTag: varchar("weaponTag", { length: 64 }),
  sourcePoemTitle: varchar("sourcePoemTitle", { length: 128 }),
  sourcePoemAuthor: varchar("sourcePoemAuthor", { length: 64 }),
  dynasty: varchar("dynasty", { length: 32 }),
  themeTag: varchar("themeTag", { length: 64 }),
  explanation: text("explanation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Question = typeof questions.$inferSelect;

export const weaponRanks = mysqlTable("weaponRanks", {
  id: int("id").autoincrement().primaryKey(),
  rankTier: mysqlEnum("rankTier", ["bronze", "silver", "gold", "platinum", "diamond", "star", "king"]).notNull(),
  rankName: varchar("rankName", { length: 64 }).notNull(),
  tierName: varchar("tierName", { length: 32 }).notNull(),
  subRank: int("subRank").notNull(),
  weaponName: varchar("weaponName", { length: 64 }).notNull(),
  weaponStory: text("weaponStory"),
  minScore: int("minScore").notNull(),
  maxScore: int("maxScore").notNull(),
  iconEmoji: varchar("iconEmoji", { length: 16 }).default("⚔️"),
  color: varchar("color", { length: 32 }).default("#CD7F32"),
  glowColor: varchar("glowColor", { length: 32 }).default("#CD7F32"),
});

export type WeaponRank = typeof weaponRanks.$inferSelect;

export const userQuestionRecords = mysqlTable("userQuestionRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questionId: int("questionId").notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  answeredAt: timestamp("answeredAt").defaultNow().notNull(),
  responseTime: float("responseTime").default(0),
  sessionId: varchar("sessionId", { length: 64 }),
});

export const destinyPoets = mysqlTable("destinyPoets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  poetId: int("poetId").notNull(),
  matchScore: float("matchScore").notNull(),
  analysisReport: text("analysisReport"),
  acrosticPoem: text("acrosticPoem"),
  shareCount: int("shareCount").default(0),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DestinyPoet = typeof destinyPoets.$inferSelect;

export const dailyTaskConfigs = mysqlTable("dailyTaskConfigs", {
  id: int("id").autoincrement().primaryKey(),
  taskKey: varchar("taskKey", { length: 64 }).notNull().unique(),
  taskName: varchar("taskName", { length: 128 }).notNull(),
  description: text("description"),
  rewardScore: int("rewardScore").default(0),
  rewardHints: int("rewardHints").default(0),
  rewardInk: int("rewardInk").default(0),
  targetCount: int("targetCount").default(1),
  iconEmoji: varchar("iconEmoji", { length: 16 }).default("📜"),
});

export const userDailyTasks = mysqlTable("userDailyTasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskKey: varchar("taskKey", { length: 64 }).notNull(),
  date: varchar("date", { length: 16 }).notNull(),
  progress: int("progress").default(0),
  completed: boolean("completed").default(false),
  claimed: boolean("claimed").default(false),
  completedAt: timestamp("completedAt"),
});

export const weeklyLeaderboard = mysqlTable("weeklyLeaderboard", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  weekKey: varchar("weekKey", { length: 16 }).notNull(),
  weekScore: int("weekScore").default(0),
  weekAnswered: int("weekAnswered").default(0),
  weekCorrect: int("weekCorrect").default(0),
  rankTier: varchar("rankTier", { length: 32 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const gameSessions = mysqlTable("gameSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  difficulty: int("difficulty").default(1),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  totalQuestions: int("totalQuestions").default(0),
  correctCount: int("correctCount").default(0),
  scoreEarned: int("scoreEarned").default(0),
  inkUsed: int("inkUsed").default(0),
  maxConsecutive: int("maxConsecutive").default(0),
  completed: boolean("completed").default(false),
});

// ============================================================
// V2 Tables: 解救樊登·诗词闯关
// ============================================================

/** 诗人卡牌定义表（24张） */
export const poetCards = mysqlTable("poetCards", {
  id: int("id").autoincrement().primaryKey(),
  poetName: varchar("poetName", { length: 64 }).notNull(),
  dynasty: varchar("dynasty", { length: 32 }),
  imageUrl: text("imageUrl").notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic"]).default("common").notNull(),
  description: text("description"),
  signaturePoem: text("signaturePoem"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PoetCard = typeof poetCards.$inferSelect;

/** 用户已获得的卡牌 */
export const userPoetCards = mysqlTable("userPoetCards", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("sessionKey", { length: 128 }).notNull(), // localStorage key for guest
  cardId: int("cardId").notNull(),
  obtainedAt: timestamp("obtainedAt").defaultNow().notNull(),
  stageId: int("stageId"), // which stage dropped this card
});

export type UserPoetCard = typeof userPoetCards.$inferSelect;

/** V2关卡配置表（7个兵器段位，每段位3小关，共21关） */
export const v2Stages = mysqlTable("v2Stages", {
  id: int("id").autoincrement().primaryKey(),
  stageNumber: int("stageNumber").notNull().unique(), // 1-21
  tierKey: mysqlEnum("tierKey", ["bronze", "silver", "gold", "platinum", "diamond", "star", "king"]).notNull(),
  subLevel: int("subLevel").notNull(), // 1,2,3
  stageName: varchar("stageName", { length: 64 }).notNull(),
  storyBefore: text("storyBefore"), // 关卡开始前的剧情
  storyAfter: text("storyAfter"),  // 通关后的剧情
  difficulty: int("difficulty").default(1).notNull(), // 题目难度筛选
  questionsPerRound: int("questionsPerRound").default(10).notNull(),
  weaponEmoji: varchar("weaponEmoji", { length: 16 }).default("⚔️"),
});

export type V2Stage = typeof v2Stages.$inferSelect;

/** 用户关卡进度 */
export const userStageProgress = mysqlTable("userStageProgress", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("sessionKey", { length: 128 }).notNull(),
  stageId: int("stageId").notNull(),
  status: mysqlEnum("status", ["locked", "available", "completed"]).default("locked").notNull(),
  bestCorrect: int("bestCorrect").default(0), // best correct count in this stage
  attemptCount: int("attemptCount").default(0),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserStageProgress = typeof userStageProgress.$inferSelect;

/** 诗债表：记录用户在某关卡答错的题目，通关前必须重答 */
export const v2PoetDebts = mysqlTable("v2PoetDebts", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("sessionKey", { length: 128 }).notNull(),
  stageId: int("stageId").notNull(),
  questionId: int("questionId").notNull(),
  wrongAnswer: varchar("wrongAnswer", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  repaidAt: timestamp("repaidAt"), // null = still owed, set when correctly answered
});

export type V2PoetDebt = typeof v2PoetDebts.$inferSelect;

/** V2答题会话 */
export const v2GameSessions = mysqlTable("v2GameSessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("sessionKey", { length: 128 }).notNull(),
  stageId: int("stageId").notNull(),
  phase: mysqlEnum("phase", ["main", "debt"]).default("main").notNull(), // main=正常答题, debt=还诗债
  questionIds: text("questionIds"), // JSON array of question IDs for this session
  currentIndex: int("currentIndex").default(0),
  correctCount: int("correctCount").default(0),
  wrongQuestionIds: text("wrongQuestionIds"), // JSON array of wrong question IDs
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  passed: boolean("passed").default(false),
});
