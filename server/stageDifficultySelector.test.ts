import { describe, it, expect } from "vitest";
import {
  DIFFICULTY_CONFIG,
  getStageDifficultyConfig,
  calculateCardDropRate,
  getTimeLimit,
  validateDifficultyConfig,
  recommendNextDifficulty,
} from "./stageDifficultySelector";

describe("Stage Difficulty Selector", () => {
  describe("DIFFICULTY_CONFIG", () => {
    it("should have 5 difficulty levels", () => {
      expect(Object.keys(DIFFICULTY_CONFIG)).toHaveLength(5);
    });

    it("should have complete config for each level", () => {
      for (let i = 1; i <= 5; i++) {
        const config = DIFFICULTY_CONFIG[i as keyof typeof DIFFICULTY_CONFIG];
        expect(config).toBeDefined();
        expect(config.name).toBeDefined();
        expect(config.targetAccuracy).toBeGreaterThan(0);
        expect(config.cardDropRate).toBeGreaterThan(0);
        expect(config.cardDropRate).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("getStageDifficultyConfig", () => {
    it("should return correct config for valid difficulty", () => {
      const config = getStageDifficultyConfig(3);
      expect(config.name).toBe("中等");
      expect(config.targetAccuracy).toBe(65);
    });

    it("should clamp difficulty to valid range", () => {
      const config1 = getStageDifficultyConfig(0);
      expect(config1.name).toBe("极简");

      const config2 = getStageDifficultyConfig(10);
      expect(config2.name).toBe("极难");
    });
  });

  describe("calculateCardDropRate", () => {
    it("should return base rate when accuracy equals target", () => {
      const rate = calculateCardDropRate(3, 65);
      expect(rate).toBe(0.7); // 中等难度的基础掉卡率
    });

    it("should increase rate when accuracy exceeds target", () => {
      const rate = calculateCardDropRate(3, 85);
      expect(rate).toBeGreaterThan(0.7);
    });

    it("should not exceed 1.0", () => {
      const rate = calculateCardDropRate(1, 100);
      expect(rate).toBeLessThanOrEqual(1);
    });

    it("should not be negative", () => {
      const rate = calculateCardDropRate(5, 0);
      expect(rate).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getTimeLimit", () => {
    it("should return correct time limits", () => {
      expect(getTimeLimit(1)).toBe(60);
      expect(getTimeLimit(2)).toBe(50);
      expect(getTimeLimit(3)).toBe(40);
      expect(getTimeLimit(4)).toBe(30);
      expect(getTimeLimit(5)).toBe(20);
    });

    it("should clamp to valid range", () => {
      expect(getTimeLimit(0)).toBe(60);
      expect(getTimeLimit(10)).toBe(20);
    });
  });

  describe("validateDifficultyConfig", () => {
    it("should validate complete config", () => {
      expect(validateDifficultyConfig()).toBe(true);
    });
  });

  describe("recommendNextDifficulty", () => {
    it("should increase difficulty when accuracy is much higher than target", () => {
      const nextDiff = recommendNextDifficulty(2, 95, 75);
      expect(nextDiff).toBe(3);
    });

    it("should decrease difficulty when accuracy is much lower than target", () => {
      const nextDiff = recommendNextDifficulty(4, 30, 50);
      expect(nextDiff).toBe(3);
    });

    it("should keep same difficulty when accuracy is near target", () => {
      const nextDiff = recommendNextDifficulty(3, 65, 65);
      expect(nextDiff).toBe(3);
    });

    it("should not go below difficulty 1", () => {
      const nextDiff = recommendNextDifficulty(1, 20, 50);
      expect(nextDiff).toBe(1);
    });

    it("should not go above difficulty 5", () => {
      const nextDiff = recommendNextDifficulty(5, 95, 50);
      expect(nextDiff).toBe(5);
    });
  });

  describe("Difficulty progression", () => {
    it("should show increasing difficulty from level 1 to 5", () => {
      const accuracies = [];
      for (let i = 1; i <= 5; i++) {
        const config = getStageDifficultyConfig(i);
        accuracies.push(config.targetAccuracy);
      }
      // 目标答对率应该递减（难度递增）
      for (let i = 0; i < accuracies.length - 1; i++) {
        expect(accuracies[i]).toBeGreaterThan(accuracies[i + 1]);
      }
    });

    it("should show decreasing card drop rate from level 1 to 5", () => {
      const rates = [];
      for (let i = 1; i <= 5; i++) {
        const config = getStageDifficultyConfig(i);
        rates.push(config.cardDropRate);
      }
      // 掉卡率应该递减（难度递增）
      for (let i = 0; i < rates.length - 1; i++) {
        expect(rates[i]).toBeGreaterThan(rates[i + 1]);
      }
    });
  });
});
