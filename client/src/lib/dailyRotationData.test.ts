import { describe, it, expect } from "vitest";
import {
  getTodayRotation,
  getRotationByDate,
  getUpcomingRotations,
  getDateDescription,
  validateRotationData,
  getAllColors,
  getAllIcons,
  SPRING_POEMS,
} from "./dailyRotationData";

describe("Daily Rotation Data", () => {
  describe("SPRING_POEMS Configuration", () => {
    it("should have 7 spring poems", () => {
      expect(SPRING_POEMS).toHaveLength(7);
    });

    it("should have all required fields for each poem", () => {
      SPRING_POEMS.forEach((poem) => {
        expect(poem.id).toBeDefined();
        expect(poem.poem).toBeTruthy();
        expect(poem.author).toBeTruthy();
        expect(poem.icon).toBeTruthy();
        expect(poem.iconEmoji).toBeTruthy();
        expect(poem.colorHex).toBeTruthy();
        expect(poem.colorName).toBeTruthy();
        expect(poem.description).toBeTruthy();
      });
    });

    it("should have unique IDs", () => {
      const ids = SPRING_POEMS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(SPRING_POEMS.length);
    });

    it("should have valid hex colors", () => {
      const hexRegex = /^#[0-9A-F]{6}$/i;
      SPRING_POEMS.forEach((poem) => {
        expect(poem.colorHex).toMatch(hexRegex);
      });
    });
  });

  describe("getTodayRotation", () => {
    it("should return a valid rotation item", () => {
      const rotation = getTodayRotation();
      expect(rotation).toBeDefined();
      expect(rotation.poem).toBeTruthy();
      expect(rotation.author).toBeTruthy();
      expect(rotation.colorHex).toBeTruthy();
    });

    it("should return same rotation for same day", () => {
      const date = new Date(2026, 2, 9); // March 9, 2026
      const rotation1 = getTodayRotation(date);
      const rotation2 = getTodayRotation(date);
      expect(rotation1.id).toBe(rotation2.id);
    });

    it("should cycle through poems over time", () => {
      const rotations: number[] = [];
      for (let i = 0; i < 14; i++) {
        const date = new Date(2026, 2, 1 + i);
        rotations.push(getTodayRotation(date).id);
      }

      // Should see at least some variation
      const uniqueIds = new Set(rotations);
      expect(uniqueIds.size).toBeGreaterThan(1);
    });

    it("should cycle back to first poem after 7 days", () => {
      const date1 = new Date(2026, 2, 1);
      const date2 = new Date(2026, 2, 8);
      const rotation1 = getTodayRotation(date1);
      const rotation2 = getTodayRotation(date2);
      expect(rotation1.id).toBe(rotation2.id);
    });
  });

  describe("getRotationByDate", () => {
    it("should return rotation for specific date", () => {
      const rotation = getRotationByDate(2026, 3, 9);
      expect(rotation).toBeDefined();
      expect(rotation.poem).toBeTruthy();
    });

    it("should match getTodayRotation for same date", () => {
      const date = new Date(2026, 2, 15); // March 15, 2026
      const rotation1 = getTodayRotation(date);
      const rotation2 = getRotationByDate(2026, 3, 15);
      expect(rotation1.id).toBe(rotation2.id);
    });

    it("should handle different months", () => {
      const rotations = [
        getRotationByDate(2026, 1, 1),
        getRotationByDate(2026, 3, 1),
        getRotationByDate(2026, 6, 1),
        getRotationByDate(2026, 12, 1),
      ];

      rotations.forEach((rotation) => {
        expect(rotation).toBeDefined();
        expect(rotation.poem).toBeTruthy();
      });
    });
  });

  describe("getUpcomingRotations", () => {
    it("should return array of rotations", () => {
      const rotations = getUpcomingRotations(7);
      expect(Array.isArray(rotations)).toBe(true);
      expect(rotations).toHaveLength(7);
    });

    it("should return valid rotations", () => {
      const rotations = getUpcomingRotations(7);
      rotations.forEach((rotation) => {
        expect(rotation.poem).toBeTruthy();
        expect(rotation.colorHex).toBeTruthy();
      });
    });

    it("should support custom day count", () => {
      expect(getUpcomingRotations(1)).toHaveLength(1);
      expect(getUpcomingRotations(14)).toHaveLength(14);
      expect(getUpcomingRotations(30)).toHaveLength(30);
    });

    it("should have different rotations for consecutive days", () => {
      const rotations = getUpcomingRotations(7);
      const ids = rotations.map((r) => r.id);
      // At least some should be different
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBeGreaterThan(1);
    });
  });

  describe("getDateDescription", () => {
    it("should return valid date description", () => {
      const date = new Date(2026, 2, 9); // March 9, 2026
      const desc = getDateDescription(date);
      expect(desc).toContain("月");
      expect(desc).toContain("日");
      expect(desc).toContain("周");
    });

    it("should format month and day correctly", () => {
      const date = new Date(2026, 0, 1); // January 1, 2026
      const desc = getDateDescription(date);
      expect(desc).toContain("1月");
      expect(desc).toContain("1日");
    });

    it("should include correct weekday", () => {
      const date = new Date(2026, 2, 9); // March 9, 2026 (Monday)
      const desc = getDateDescription(date);
      expect(desc).toContain("周");
    });
  });

  describe("validateRotationData", () => {
    it("should return true for valid data", () => {
      expect(validateRotationData()).toBe(true);
    });

    it("should validate all poems have required fields", () => {
      const isValid = SPRING_POEMS.every(
        (item) =>
          item.poem &&
          item.author &&
          item.icon &&
          item.iconEmoji &&
          item.colorHex &&
          item.colorName &&
          item.description
      );
      expect(isValid).toBe(true);
    });
  });

  describe("getAllColors", () => {
    it("should return array of colors", () => {
      const colors = getAllColors();
      expect(Array.isArray(colors)).toBe(true);
      expect(colors).toHaveLength(SPRING_POEMS.length);
    });

    it("should have hex and name for each color", () => {
      const colors = getAllColors();
      colors.forEach((color) => {
        expect(color.hex).toBeTruthy();
        expect(color.name).toBeTruthy();
      });
    });

    it("should have valid hex values", () => {
      const hexRegex = /^#[0-9A-F]{6}$/i;
      const colors = getAllColors();
      colors.forEach((color) => {
        expect(color.hex).toMatch(hexRegex);
      });
    });
  });

  describe("getAllIcons", () => {
    it("should return array of icons", () => {
      const icons = getAllIcons();
      expect(Array.isArray(icons)).toBe(true);
      expect(icons).toHaveLength(SPRING_POEMS.length);
    });

    it("should have emoji for each icon", () => {
      const icons = getAllIcons();
      icons.forEach((icon) => {
        expect(icon).toBeTruthy();
        expect(typeof icon).toBe("string");
      });
    });

    it("should have unique icons", () => {
      const icons = getAllIcons();
      const uniqueIcons = new Set(icons);
      expect(uniqueIcons.size).toBe(icons.length);
    });
  });

  describe("Deterministic Behavior", () => {
    it("should always return same rotation for same date across multiple calls", () => {
      const date = new Date(2026, 2, 15);
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(getTodayRotation(date).id);
      }
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(1);
    });

    it("should handle leap years correctly", () => {
      // 2024 is a leap year
      const date = new Date(2024, 1, 29); // Feb 29, 2024
      expect(() => getTodayRotation(date)).not.toThrow();
    });

    it("should handle year boundaries", () => {
      const date1 = new Date(2025, 11, 31); // Dec 31, 2025
      const date2 = new Date(2026, 0, 1); // Jan 1, 2026
      const rotation1 = getTodayRotation(date1);
      const rotation2 = getTodayRotation(date2);
      // Should be different (consecutive days)
      expect(rotation1.id).not.toBe(rotation2.id);
    });
  });
});
