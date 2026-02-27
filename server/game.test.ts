import { describe, expect, it } from "vitest";

// ─── Test: Poet Matching Algorithm ───────────────────────────────────────────
function matchPoet(
  stats: {
    poetCorrectMap: Record<string, number>;
    typePreferMap: Record<string, number>;
    avgResponseTime: number;
    totalCorrect: number;
    totalAnswered: number;
  },
  allPoets: Array<{ id: number; name: string; mbtiType: string }>
) {
  const scores: Record<number, number> = {};
  for (const p of allPoets) scores[p.id] = 0;

  for (const [poetId, correct] of Object.entries(stats.poetCorrectMap)) {
    const id = Number(poetId);
    if (scores[id] !== undefined) scores[id] += correct * 0.5;
  }

  const prefType = Object.entries(stats.typePreferMap).sort((a, b) => b[1] - a[1])[0]?.[0];
  const poetByMbti = (mbti: string) => allPoets.find((p) => p.mbtiType === mbti)?.id;

  if (prefType === "reorder") { const id = poetByMbti("ENFP"); if (id) scores[id] = (scores[id] ?? 0) + 20; }
  if (prefType === "error")   { const id = poetByMbti("INFJ"); if (id) scores[id] = (scores[id] ?? 0) + 20; }
  if (prefType === "fill")    { const id = poetByMbti("ISTJ"); if (id) scores[id] = (scores[id] ?? 0) + 15; }

  const accuracy = stats.totalAnswered > 0 ? stats.totalCorrect / stats.totalAnswered : 0;
  if (accuracy > 0.8) { const id = poetByMbti("ISTJ"); if (id) scores[id] = (scores[id] ?? 0) + 15; }

  const bestId = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestScore = scores[Number(bestId)] ?? 0;
  const totalPossible = Math.max(1, stats.totalAnswered * 0.5 + 50);
  const matchPct = Math.min(99, Math.max(60, Math.round((bestScore / totalPossible) * 100 + 60)));

  return { poetId: Number(bestId), matchScore: matchPct };
}

// ─── Test: Score Calculation ──────────────────────────────────────────────────
function calculateScore(isCorrect: boolean, difficulty: number, consecutive: number, responseTime: number) {
  if (!isCorrect) return -Math.floor(10 * difficulty * 0.5);
  const base = 10 * difficulty;
  const speedBonus = responseTime < 3 ? 5 : responseTime < 6 ? 2 : 0;
  const comboBonus = consecutive >= 5 ? 10 : consecutive >= 3 ? 5 : 0;
  return base + speedBonus + comboBonus;
}

// ─── Test: Rank Determination ─────────────────────────────────────────────────
function getRankTier(score: number): string {
  if (score >= 20000) return "king";
  if (score >= 12000) return "star";
  if (score >= 7000) return "diamond";
  if (score >= 3500) return "platinum";
  if (score >= 1500) return "gold";
  if (score >= 500) return "silver";
  return "bronze";
}

describe("Poet Matching Algorithm", () => {
  const mockPoets = [
    { id: 1, name: "李白", mbtiType: "ENFP" },
    { id: 2, name: "杜甫", mbtiType: "INFJ" },
    { id: 3, name: "李清照", mbtiType: "ISTJ" },
    { id: 4, name: "苏轼", mbtiType: "ENFJ" },
  ];

  it("should match poet based on correct answers", () => {
    const stats = {
      poetCorrectMap: { "1": 10, "2": 2 },
      typePreferMap: {},
      avgResponseTime: 5,
      totalCorrect: 12,
      totalAnswered: 15,
    };
    const result = matchPoet(stats, mockPoets);
    expect(result.poetId).toBe(1); // 李白 has most correct answers
    expect(result.matchScore).toBeGreaterThanOrEqual(60);
    expect(result.matchScore).toBeLessThanOrEqual(99);
  });

  it("should boost ISTJ poet for high accuracy users", () => {
    const stats = {
      poetCorrectMap: {},
      typePreferMap: { fill: 5 },
      avgResponseTime: 5,
      totalCorrect: 9,
      totalAnswered: 10,
    };
    const result = matchPoet(stats, mockPoets);
    expect(result.poetId).toBe(3); // 李清照 ISTJ gets fill + accuracy boost
  });

  it("should return match score between 60 and 99", () => {
    const stats = {
      poetCorrectMap: { "2": 5 },
      typePreferMap: { error: 3 },
      avgResponseTime: 8,
      totalCorrect: 5,
      totalAnswered: 10,
    };
    const result = matchPoet(stats, mockPoets);
    expect(result.matchScore).toBeGreaterThanOrEqual(60);
    expect(result.matchScore).toBeLessThanOrEqual(99);
  });
});

describe("Score Calculation", () => {
  it("should return negative score for wrong answer", () => {
    const score = calculateScore(false, 1, 0, 5);
    expect(score).toBeLessThan(0);
  });

  it("should return positive score for correct answer", () => {
    const score = calculateScore(true, 1, 0, 5);
    expect(score).toBeGreaterThan(0);
  });

  it("should give speed bonus for fast answers", () => {
    const fastScore = calculateScore(true, 1, 0, 2);
    const slowScore = calculateScore(true, 1, 0, 10);
    expect(fastScore).toBeGreaterThan(slowScore);
  });

  it("should give combo bonus for consecutive wins", () => {
    const comboScore = calculateScore(true, 1, 5, 5);
    const normalScore = calculateScore(true, 1, 0, 5);
    expect(comboScore).toBeGreaterThan(normalScore);
  });

  it("should scale with difficulty", () => {
    const easyScore = calculateScore(true, 1, 0, 5);
    const hardScore = calculateScore(true, 5, 0, 5);
    expect(hardScore).toBeGreaterThan(easyScore);
  });
});

describe("Rank Tier System", () => {
  it("should start at bronze", () => {
    expect(getRankTier(0)).toBe("bronze");
    expect(getRankTier(499)).toBe("bronze");
  });

  it("should advance to silver at 500", () => {
    expect(getRankTier(500)).toBe("silver");
    expect(getRankTier(1499)).toBe("silver");
  });

  it("should advance to gold at 1500", () => {
    expect(getRankTier(1500)).toBe("gold");
  });

  it("should reach king at 20000", () => {
    expect(getRankTier(20000)).toBe("king");
    expect(getRankTier(99999)).toBe("king");
  });

  it("should follow the weapon rank progression", () => {
    const tiers = [0, 500, 1500, 3500, 7000, 12000, 20000].map(getRankTier);
    expect(tiers).toEqual(["bronze", "silver", "gold", "platinum", "diamond", "star", "king"]);
  });
});

describe("Auth Logout", () => {
  it("should clear session cookie", async () => {
    const { appRouter } = await import("./routers");
    const { COOKIE_NAME } = await import("../shared/const");
    const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];

    const ctx = {
      user: {
        id: 1, openId: "test-user", email: "test@test.com", name: "Test",
        loginMethod: "manus", role: "user" as const,
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as any,
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as any,
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});
