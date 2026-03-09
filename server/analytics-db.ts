import { getDb } from "./db";
import {
  userEvents,
  performanceMetrics,
  dailyAnalytics,
  retentionAnalytics,
  conversionFunnel,
  userDistribution,
  abTests,
  abTestAssignments,
  abTestResults,
} from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

const getDbClient = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db;
};

// ============================================================
// 事件埋点 API
// ============================================================

export interface EventData {
  [key: string]: any;
}

export interface EventMetadata {
  userAgent?: string;
  referer?: string;
  timestamp?: number;
  [key: string]: any;
}

/**
 * 记录用户事件
 */
export async function logUserEvent(
  sessionKey: string,
  eventType: string,
  eventData?: EventData,
  metadata?: EventMetadata
) {
  try {
    const db = await getDbClient();
    await db.insert(userEvents).values({
      sessionKey,
      eventType: eventType as any,
      eventData: eventData ? JSON.stringify(eventData) : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (error) {
    console.error("[Analytics] Failed to log event:", error);
  }
}

/**
 * 记录性能指标
 */
export async function logPerformanceMetric(
  sessionKey: string,
  metricType: string,
  value: number,
  page?: string
) {
  try {
    const db = await getDbClient();
    await db.insert(performanceMetrics).values({
      sessionKey,
      metricType: metricType as any,
      value,
      page,
    });
  } catch (error) {
    console.error("[Analytics] Failed to log performance metric:", error);
  }
}

// ============================================================
// 分析查询 API
// ============================================================

/**
 * 获取日分析数据
 */
export async function getDailyAnalytics(date: string) {
  try {
    const db = await getDbClient();
    const result = await db
      .select()
      .from(dailyAnalytics)
      .where(eq(dailyAnalytics.date, date))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Analytics] Failed to get daily analytics:", error);
    return null;
  }
}

/**
 * 计算DAU（日活跃用户数）
 */
export async function calculateDAU(date: string) {
  try {
    const db = await getDbClient();
    const startOfDay = new Date(`${date}T00:00:00Z`);
    const endOfDay = new Date(`${date}T23:59:59Z`);

    const result = await db
      .selectDistinct({ sessionKey: userEvents.sessionKey })
      .from(userEvents)
      .where(
        and(
          gte(userEvents.createdAt, startOfDay),
          lte(userEvents.createdAt, endOfDay)
        )
      );

    return result.length;
  } catch (error) {
    console.error("[Analytics] Failed to calculate DAU:", error);
    return 0;
  }
}

/**
 * 计算MAU（月活跃用户数）
 */
export async function calculateMAU(year: number, month: number) {
  try {
    const db = await getDbClient();
    const startOfMonth = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00Z`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const result = await db
      .selectDistinct({ sessionKey: userEvents.sessionKey })
      .from(userEvents)
      .where(
        and(
          gte(userEvents.createdAt, startOfMonth),
          lte(userEvents.createdAt, endOfMonth)
        )
      );

    return result.length;
  } catch (error) {
    console.error("[Analytics] Failed to calculate MAU:", error);
    return 0;
  }
}

/**
 * 获取留存率数据
 */
export async function getRetentionRate(cohortDate: string, daysSinceStart: number) {
  try {
    const db = await getDbClient();
    const result = await db
      .select()
      .from(retentionAnalytics)
      .where(
        and(
          eq(retentionAnalytics.cohortDate, cohortDate),
          eq(retentionAnalytics.daysSinceStart, daysSinceStart)
        )
      )
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Analytics] Failed to get retention rate:", error);
    return null;
  }
}

/**
 * 获取转化漏斗数据
 */
export async function getConversionFunnel(date: string) {
  try {
    const db = await getDbClient();
    const result = await db
      .select()
      .from(conversionFunnel)
      .where(eq(conversionFunnel.date, date))
      .orderBy(conversionFunnel.step);
    return result;
  } catch (error) {
    console.error("[Analytics] Failed to get conversion funnel:", error);
    return [];
  }
}

/**
 * 获取用户分布数据
 */
export async function getUserDistribution(date: string, dimension: string) {
  try {
    const db = await getDbClient();
    const result = await db
      .select()
      .from(userDistribution)
      .where(
        and(
          eq(userDistribution.date, date),
          eq(userDistribution.dimension, dimension as any)
        )
      );
    return result;
  } catch (error) {
    console.error("[Analytics] Failed to get user distribution:", error);
    return [];
  }
}

// ============================================================
// A/B测试 API
// ============================================================

/**
 * 创建A/B测试
 */
export async function createABTest(
  testName: string,
  description: string,
  controlVariant: string,
  treatmentVariant: string,
  targetMetric: string,
  sampleSize: number = 1000
) {
  try {
    const db = await getDbClient();
    const result = await db.insert(abTests).values({
      testName,
      description,
      controlVariant,
      treatmentVariant,
      targetMetric,
      sampleSize,
      status: "draft",
    });
    return result;
  } catch (error) {
    console.error("[Analytics] Failed to create A/B test:", error);
    return null;
  }
}

/**
 * 为用户分配A/B测试变体
 */
export async function assignABTestVariant(
  testId: number,
  sessionKey: string
): Promise<string | null> {
  try {
    const db = await getDbClient();
    // 检查是否已分配
    const existing = await db
      .select()
      .from(abTestAssignments)
      .where(
        and(
          eq(abTestAssignments.testId, testId),
          eq(abTestAssignments.sessionKey, sessionKey)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0].variant;
    }

    // 随机分配（50/50）
    const variant = Math.random() < 0.5 ? "control" : "treatment";
    await db.insert(abTestAssignments).values({
      testId,
      sessionKey,
      variant,
    });

    return variant;
  } catch (error) {
    console.error("[Analytics] Failed to assign A/B test variant:", error);
    return null;
  }
}

/**
 * 获取A/B测试结果
 */
export async function getABTestResults(testId: number) {
  try {
    const db = await getDbClient();
    const result = await db
      .select()
      .from(abTestResults)
      .where(eq(abTestResults.testId, testId));
    return result;
  } catch (error) {
    console.error("[Analytics] Failed to get A/B test results:", error);
    return [];
  }
}

/**
 * 更新A/B测试结果（统计数据）
 */
export async function updateABTestResults(
  testId: number,
  variant: string,
  sampleCount: number,
  conversionCount: number,
  avgMetricValue: number,
  stdDeviation: number
) {
  try {
    const db = await getDbClient();
    const conversionRate = sampleCount > 0 ? conversionCount / sampleCount : 0;

    // 检查是否存在
    const existing = await db
      .select()
      .from(abTestResults)
      .where(
        and(
          eq(abTestResults.testId, testId),
          eq(abTestResults.variant, variant)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(abTestResults)
        .set({
          sampleCount,
          conversionCount,
          conversionRate,
          avgMetricValue,
          stdDeviation,
        })
        .where(
          and(
            eq(abTestResults.testId, testId),
            eq(abTestResults.variant, variant)
          )
        );
    } else {
      await db.insert(abTestResults).values({
        testId,
        variant,
        sampleCount,
        conversionCount,
        conversionRate,
        avgMetricValue,
        stdDeviation,
      });
    }
  } catch (error) {
    console.error("[Analytics] Failed to update A/B test results:", error);
  }
}
