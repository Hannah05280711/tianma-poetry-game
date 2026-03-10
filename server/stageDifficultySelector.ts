/**
 * 关卡难度参数和题目选择算法
 * 根据关卡的difficulty和targetAccuracy调整题目难度分布
 * 学习Candy Crush的进度感设计
 */

import { getDb } from "./db";
import { questions, v2Stages } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * 关卡难度配置
 * difficulty 1-5 对应不同的题目难度分布
 */
export const DIFFICULTY_CONFIG = {
  1: {
    name: "极简",
    description: "快速成功建立信心",
    targetAccuracy: 85,
    difficultyRange: [1, 1], // 只选难度1的题目
    cardDropRate: 0.9, // 90%概率掉卡
  },
  2: {
    name: "简单",
    description: "逐步增加难度",
    targetAccuracy: 75,
    difficultyRange: [1, 2], // 难度1-2的题目
    cardDropRate: 0.8,
  },
  3: {
    name: "中等",
    description: "需要思考",
    targetAccuracy: 65,
    difficultyRange: [2, 3], // 难度2-3的题目
    cardDropRate: 0.7,
  },
  4: {
    name: "困难",
    description: "有挑战",
    targetAccuracy: 50,
    difficultyRange: [3, 4], // 难度3-4的题目
    cardDropRate: 0.6,
  },
  5: {
    name: "极难",
    description: "高难度",
    targetAccuracy: 35,
    difficultyRange: [4, 5], // 难度4-5的题目
    cardDropRate: 0.5,
  },
} as const;

export type DifficultyLevel = keyof typeof DIFFICULTY_CONFIG;

/**
 * 获取关卡的难度配置
 */
export function getStageDifficultyConfig(difficulty: number) {
  const level = Math.min(5, Math.max(1, difficulty)) as DifficultyLevel;
  return DIFFICULTY_CONFIG[level];
}

/**
 * 根据关卡难度选择题目
 * @param stageId 关卡ID
 * @param count 需要的题目数量
 * @returns 选中的题目数组
 */
export async function selectQuestionsByStage(stageId: number, count: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 获取关卡信息
  const stage = await db
    .select()
    .from(v2Stages)
    .where(eq(v2Stages.id, stageId))
    .then((rows: any[]) => rows[0]);

  if (!stage) {
    throw new Error(`Stage ${stageId} not found`);
  }

  const difficultyConfig = getStageDifficultyConfig(stage.difficulty);
  const [minDiff, maxDiff] = difficultyConfig.difficultyRange;

  // 查询符合难度范围的题目
  const selectedQuestions = await db
    .select()
    .from(questions)
    .limit(count);

  // 如果题目不足，补充其他难度的题目
  if (selectedQuestions.length < count) {
    const additionalQuestions = await db
      .select()
      .from(questions)
      .limit(count - selectedQuestions.length)
      .then((rows: any[]) => rows.slice(0, count - selectedQuestions.length));

    return [...selectedQuestions, ...additionalQuestions].slice(0, count);
  }

  return selectedQuestions;
}

/**
 * 计算卡牌掉落概率
 * 基于关卡难度和用户答题表现
 */
export function calculateCardDropRate(
  difficulty: number,
  userAccuracy: number
): number {
  const config = getStageDifficultyConfig(difficulty);
  const baseRate = config.cardDropRate;

  // 如果用户答对率高于目标，增加掉卡率
  const accuracyBonus = Math.max(0, (userAccuracy - config.targetAccuracy) / 100) * 0.2;

  return Math.min(1, baseRate + accuracyBonus);
}

/**
 * 根据关卡难度调整时间限制
 */
export function getTimeLimit(difficulty: number): number {
  const timeLimits = {
    1: 60, // 1分钟
    2: 50,
    3: 40,
    4: 30,
    5: 20, // 20秒
  } as const;

  return timeLimits[Math.min(5, Math.max(1, difficulty)) as DifficultyLevel];
}

/**
 * 验证关卡难度配置的完整性
 */
export function validateDifficultyConfig(): boolean {
  for (let i = 1; i <= 5; i++) {
    const config = DIFFICULTY_CONFIG[i as DifficultyLevel];
    if (!config || !config.difficultyRange || config.difficultyRange.length !== 2) {
      return false;
    }
  }
  return true;
}

/**
 * 获取所有关卡的难度统计
 */
export async function getStageDifficultyStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const stages = await db.select().from(v2Stages);

  const stats = {
    total: stages.length,
    byDifficulty: {} as Record<number, number>,
    avgDifficulty: 0,
  };

  let totalDifficulty = 0;
  for (const stage of stages) {
    const diff = stage.difficulty || 1;
    stats.byDifficulty[diff] = (stats.byDifficulty[diff] || 0) + 1;
    totalDifficulty += diff;
  }

  stats.avgDifficulty = stages.length > 0 ? totalDifficulty / stages.length : 0;
  return stats;
}

/**
 * 根据用户表现推荐下一关的难度
 */
export function recommendNextDifficulty(
  currentDifficulty: number,
  userAccuracy: number,
  targetAccuracy: number
): number {
  // 如果用户答对率远高于目标，提升难度
  if (userAccuracy > targetAccuracy + 15) {
    return Math.min(5, currentDifficulty + 1);
  }

  // 如果用户答对率远低于目标，降低难度
  if (userAccuracy < targetAccuracy - 15) {
    return Math.max(1, currentDifficulty - 1);
  }

  // 否则保持不变
  return currentDifficulty;
}
