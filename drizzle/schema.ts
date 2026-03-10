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
  difficulty: int("difficulty").default(1).notNull(), // 题目难度筛选（1-5）
  targetAccuracy: float("targetAccuracy").default(70).notNull(), // 目标答对率（%）
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


// ============================================================
// Analytics Tables: 数据与分析系统
// ============================================================

/** 用户行为事件表 - 记录所有关键事件 */
export const userEvents = mysqlTable("userEvents", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("sessionKey", { length: 128 }).notNull(), // guest or user openId
  eventType: mysqlEnum("eventType", [
    "game_start",        // 开始答题
    "game_complete",     // 完成答题
    "question_answer",   // 回答问题
    "rank_up",          // 段位晋升
    "card_drop",        // 卡牌掉落
    "share",            // 分享
    "destiny_unlock",   // 本命诗人解锁
    "daily_task",       // 每日任务完成
    "page_view",        // 页面浏览
    "button_click",     // 按钮点击
    "error",            // 错误事件
  ]).notNull(),
  eventData: text("eventData"), // JSON: { gameId, difficulty, score, cardCount, etc. }
  metadata: text("metadata"), // JSON: { userAgent, referer, timestamp, etc. }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  // Indexes for fast querying
});

export type UserEvent = typeof userEvents.$inferSelect;

/** 性能指标表 - Web Vitals & API Performance */
export const performanceMetrics = mysqlTable("performanceMetrics", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("sessionKey", { length: 128 }).notNull(),
  metricType: mysqlEnum("metricType", [
    "LCP",              // Largest Contentful Paint
    "FID",              // First Input Delay
    "CLS",              // Cumulative Layout Shift
    "TTFB",             // Time to First Byte
    "FCP",              // First Contentful Paint
    "api_response_time", // API响应时间
    "page_load_time",   // 页面加载时间
    "error_rate",       // 错误率
  ]).notNull(),
  value: float("value").notNull(), // 指标值（毫秒或百分比）
  page: varchar("page", { length: 128 }), // 页面路径
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;

/** A/B测试表 - 实验配置与分组 */
export const abTests = mysqlTable("abTests", {
  id: int("id").autoincrement().primaryKey(),
  testName: varchar("testName", { length: 128 }).notNull().unique(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "running", "paused", "completed"]).default("draft").notNull(),
  controlVariant: varchar("controlVariant", { length: 64 }).notNull(), // 对照组
  treatmentVariant: varchar("treatmentVariant", { length: 64 }).notNull(), // 实验组
  targetMetric: varchar("targetMetric", { length: 64 }).notNull(), // 目标指标（如转化率、留存率）
  sampleSize: int("sampleSize").default(1000), // 样本大小
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ABTest = typeof abTests.$inferSelect;

/** A/B测试用户分组表 */
export const abTestAssignments = mysqlTable("abTestAssignments", {
  id: int("id").autoincrement().primaryKey(),
  testId: int("testId").notNull(),
  sessionKey: varchar("sessionKey", { length: 128 }).notNull(),
  variant: varchar("variant", { length: 64 }).notNull(), // "control" 或 "treatment"
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

export type ABTestAssignment = typeof abTestAssignments.$inferSelect;

/** A/B测试结果表 - 预计算的统计数据 */
export const abTestResults = mysqlTable("abTestResults", {
  id: int("id").autoincrement().primaryKey(),
  testId: int("testId").notNull(),
  variant: varchar("variant", { length: 64 }).notNull(),
  sampleCount: int("sampleCount").default(0),
  conversionCount: int("conversionCount").default(0),
  conversionRate: float("conversionRate").default(0),
  avgMetricValue: float("avgMetricValue").default(0),
  stdDeviation: float("stdDeviation").default(0),
  confidence: float("confidence").default(0), // 置信度 (0-1)
  pValue: float("pValue").default(1), // p值
  winner: boolean("winner").default(false), // 是否为赢家
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ABTestResult = typeof abTestResults.$inferSelect;

/** 日分析报告表 - 预计算的每日统计 */
export const dailyAnalytics = mysqlTable("dailyAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(), // YYYY-MM-DD
  dau: int("dau").default(0), // Daily Active Users
  newUsers: int("newUsers").default(0), // 新用户数
  totalSessions: int("totalSessions").default(0), // 总会话数
  totalGamePlays: int("totalGamePlays").default(0), // 总游戏次数
  avgGameDuration: float("avgGameDuration").default(0), // 平均游戏时长（秒）
  totalScore: int("totalScore").default(0), // 总积分
  avgScore: float("avgScore").default(0), // 平均积分
  conversionRate: float("conversionRate").default(0), // 转化率（新用户→完成游戏）
  rankUpCount: int("rankUpCount").default(0), // 段位晋升数
  cardDropCount: int("cardDropCount").default(0), // 卡牌掉落数
  shareCount: int("shareCount").default(0), // 分享数
  errorCount: int("errorCount").default(0), // 错误数
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyAnalytics = typeof dailyAnalytics.$inferSelect;

/** 留存率表 - 按日期计算的用户留存 */
export const retentionAnalytics = mysqlTable("retentionAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  cohortDate: varchar("cohortDate", { length: 10 }).notNull(), // 用户首次活跃日期 YYYY-MM-DD
  daysSinceStart: int("daysSinceStart").notNull(), // 距离首次活跃的天数 (0, 1, 3, 7, 14, 30)
  retainedUsers: int("retainedUsers").default(0), // 保留的用户数
  retentionRate: float("retentionRate").default(0), // 留存率 (0-1)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RetentionAnalytics = typeof retentionAnalytics.$inferSelect;

/** 转化漏斗表 - 追踪用户从进入到完成的各个步骤 */
export const conversionFunnel = mysqlTable("conversionFunnel", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  step: mysqlEnum("step", [
    "page_view",        // 页面浏览
    "game_start",       // 开始游戏
    "first_question",   // 回答第一题
    "game_complete",    // 完成游戏
    "rank_up",          // 段位晋升
    "share",            // 分享
  ]).notNull(),
  userCount: int("userCount").default(0), // 该步骤的用户数
  conversionRate: float("conversionRate").default(0), // 该步骤的转化率
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversionFunnel = typeof conversionFunnel.$inferSelect;

/** 用户分布表 - 按维度统计用户分布 */
export const userDistribution = mysqlTable("userDistribution", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  dimension: mysqlEnum("dimension", [
    "rank",             // 按段位分布
    "difficulty",       // 按难度分布
    "game_mode",        // 按游戏模式分布
    "device",           // 按设备分布
    "region",           // 按地区分布
  ]).notNull(),
  dimensionValue: varchar("dimensionValue", { length: 64 }).notNull(), // 维度值（如"bronze_1"、"mobile"）
  userCount: int("userCount").default(0), // 用户数
  percentage: float("percentage").default(0), // 百分比
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserDistribution = typeof userDistribution.$inferSelect;
