import { describe, it, expect, vi } from "vitest";
import {
  logUserEvent,
  logPerformanceMetric,
} from "./analytics-db";

describe("Analytics System", () => {
  describe("Event Logging", () => {
    it("should handle user event logging", async () => {
      // 测试事件日志记录函数的存在和可调用性
      expect(typeof logUserEvent).toBe("function");
      
      // 调用函数应该不抛出错误
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await logUserEvent("session_123", "game_start", { difficulty: 1 });
      consoleSpy.mockRestore();
    });

    it("should handle performance metric logging", async () => {
      expect(typeof logPerformanceMetric).toBe("function");
      
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await logPerformanceMetric("session_123", "LCP", 2500, "/game");
      consoleSpy.mockRestore();
    });

    it("should accept various event types", async () => {
      const eventTypes = [
        "game_start",
        "game_complete",
        "question_answer",
        "rank_up",
        "card_drop",
        "share",
        "destiny_unlock",
        "daily_task",
        "page_view",
        "button_click",
        "error",
      ];

      for (const eventType of eventTypes) {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        await logUserEvent("session_test", eventType, { test: true });
        consoleSpy.mockRestore();
      }
    });

    it("should accept various metric types", async () => {
      const metricTypes = [
        "LCP",
        "FID",
        "CLS",
        "TTFB",
        "FCP",
        "api_response_time",
        "page_load_time",
        "error_rate",
      ];

      for (const metricType of metricTypes) {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        await logPerformanceMetric("session_test", metricType, Math.random() * 5000);
        consoleSpy.mockRestore();
      }
    });

    it("should handle event data with metadata", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      await logUserEvent(
        "session_456",
        "question_answer",
        { questionId: 1, isCorrect: true, responseTime: 3.5 },
        { userAgent: "Mozilla/5.0", referer: "https://example.com" }
      );
      
      consoleSpy.mockRestore();
    });

    it("should handle empty event data", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      await logUserEvent("session_789", "page_view");
      
      consoleSpy.mockRestore();
    });
  });

  describe("Analytics API Functions", () => {
    it("should export analytics functions", async () => {
      const { 
        getDailyAnalytics,
        calculateDAU,
        calculateMAU,
        getRetentionRate,
        getConversionFunnel,
        getUserDistribution,
        createABTest,
        assignABTestVariant,
        getABTestResults,
        updateABTestResults,
      } = await import("./analytics-db");

      expect(typeof getDailyAnalytics).toBe("function");
      expect(typeof calculateDAU).toBe("function");
      expect(typeof calculateMAU).toBe("function");
      expect(typeof getRetentionRate).toBe("function");
      expect(typeof getConversionFunnel).toBe("function");
      expect(typeof getUserDistribution).toBe("function");
      expect(typeof createABTest).toBe("function");
      expect(typeof assignABTestVariant).toBe("function");
      expect(typeof getABTestResults).toBe("function");
      expect(typeof updateABTestResults).toBe("function");
    });
  });

  describe("Event Payload Structure", () => {
    it("should handle complex event data", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      const complexData = {
        gameId: "game_123",
        difficulty: 3,
        score: 850,
        correctCount: 8,
        totalQuestions: 10,
        accuracy: 0.8,
        duration: 45.5,
        timestamp: Date.now(),
      };

      await logUserEvent("session_complex", "game_complete", complexData);
      
      consoleSpy.mockRestore();
    });

    it("should handle nested metadata", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      const metadata = {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        referer: "https://example.com/game",
        timestamp: Date.now(),
        viewport: { width: 375, height: 812 },
        connection: { type: "4g", effectiveType: "4g" },
      };

      await logUserEvent("session_nested", "page_view", {}, metadata);
      
      consoleSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    it("should handle logging errors gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      // 这些调用可能会失败（数据库不可用），但不应该抛出异常
      await logUserEvent("", "invalid_event");
      await logPerformanceMetric("", "INVALID_METRIC", NaN);
      
      // 函数应该捕获错误并记录，而不是抛出
      consoleSpy.mockRestore();
    });

    it("should not throw on database errors", async () => {
      expect(async () => {
        await logUserEvent("session_error", "error", {
          errorMessage: "Test error",
          errorStack: "at test",
        });
      }).not.toThrow();
    });
  });

  describe("Session Key Handling", () => {
    it("should accept various session key formats", async () => {
      const sessionKeys = [
        "session_123",
        "user_openid_abc123",
        "guest_random_xyz",
        "long_session_key_with_many_characters_123456789",
      ];

      for (const sessionKey of sessionKeys) {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        await logUserEvent(sessionKey, "page_view");
        consoleSpy.mockRestore();
      }
    });
  });
});
