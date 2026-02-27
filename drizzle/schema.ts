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
