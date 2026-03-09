import { publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  logUserEvent,
  logPerformanceMetric,
  getDailyAnalytics,
  calculateDAU,
  calculateMAU,
  getRetentionRate,
  getConversionFunnel,
  getUserDistribution,
  createABTest,
  assignABTestVariant,
  getABTestResults,
} from "../analytics-db";

export const analyticsRouter = {
  /**
   * 记录用户事件（前端调用）
   */
  logEvent: publicProcedure
    .input(
      z.object({
        sessionKey: z.string(),
        eventType: z.string(),
        eventData: z.record(z.string(), z.unknown()).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      await logUserEvent(
        input.sessionKey,
        input.eventType,
        input.eventData,
        input.metadata
      );
      return { success: true };
    }),

  /**
   * 记录性能指标（前端调用）
   */
  logMetric: publicProcedure
    .input(
      z.object({
        sessionKey: z.string(),
        metricType: z.string(),
        value: z.number(),
        page: z.string().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      await logPerformanceMetric(
        input.sessionKey,
        input.metricType,
        input.value,
        input.page
      );
      return { success: true };
    }),

  /**
   * 获取日分析数据
   */
  getDailyAnalytics: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }: any) => {
      return await getDailyAnalytics(input.date);
    }),

  /**
   * 计算DAU
   */
  calculateDAU: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }: any) => {
      const dau = await calculateDAU(input.date);
      return { date: input.date, dau };
    }),

  /**
   * 计算MAU
   */
  calculateMAU: publicProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ input }: any) => {
      const mau = await calculateMAU(input.year, input.month);
      return { year: input.year, month: input.month, mau };
    }),

  /**
   * 获取留存率
   */
  getRetentionRate: publicProcedure
    .input(
      z.object({
        cohortDate: z.string(),
        daysSinceStart: z.number(),
      })
    )
    .query(async ({ input }: any) => {
      return await getRetentionRate(input.cohortDate, input.daysSinceStart);
    }),

  /**
   * 获取转化漏斗
   */
  getConversionFunnel: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }: any) => {
      return await getConversionFunnel(input.date);
    }),

  /**
   * 获取用户分布
   */
  getUserDistribution: publicProcedure
    .input(
      z.object({
        date: z.string(),
        dimension: z.string(),
      })
    )
    .query(async ({ input }: any) => {
      return await getUserDistribution(input.date, input.dimension);
    }),

  /**
   * 创建A/B测试
   */
  createABTest: publicProcedure
    .input(
      z.object({
        testName: z.string(),
        description: z.string().optional(),
        controlVariant: z.string(),
        treatmentVariant: z.string(),
        targetMetric: z.string(),
        sampleSize: z.number().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      return await createABTest(
        input.testName,
        input.description || "",
        input.controlVariant,
        input.treatmentVariant,
        input.targetMetric,
        input.sampleSize || 1000
      );
    }),

  /**
   * 分配A/B测试变体
   */
  assignABTestVariant: publicProcedure
    .input(
      z.object({
        testId: z.number(),
        sessionKey: z.string(),
      })
    )
    .query(async ({ input }: any) => {
      const variant = await assignABTestVariant(input.testId, input.sessionKey);
      return { testId: input.testId, variant };
    }),

  /**
   * 获取A/B测试结果
   */
  getABTestResults: publicProcedure
    .input(z.object({ testId: z.number() }))
    .query(async ({ input }: any) => {
      return await getABTestResults(input.testId);
    }),
};
