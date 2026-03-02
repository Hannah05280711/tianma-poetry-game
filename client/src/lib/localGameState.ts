/**
 * 本地游戏状态管理
 * 所有游戏进度存储在 localStorage，无需登录即可使用
 */

const STORAGE_KEY = "tianma_game_state_v2";

export interface LocalGameState {
  totalScore: number;
  currentRankId: number;
  consecutiveWins: number;
  totalAnswered: number;
  totalCorrect: number;
  hintsCount: number;
  shieldsCount: number;
  inkDrops: number;
  // 诗人偏好数据（用于解锁本命诗人）
  poetCorrectMap: Record<string, number>;   // poetId -> 答对题数
  poetTotalMap: Record<string, number>;     // poetId -> 总答题数
  typePreferMap: Record<string, number>;    // questionType -> 答题次数
  avgResponseTime: number;
  // 每日任务进度
  dailyDate: string;                        // 今日日期 YYYY-MM-DD
  dailyAnswered: number;                    // 今日答题数
  dailyCorrect: number;                     // 今日答对数
  dailyStreak: number;                      // 今日最长连胜
  // 本命诗人（解锁后存储）
  destinyPoetId: number | null;
  destinyMatchScore: number;
  destinyUnlockedAt: number | null;
  // 周积分（用于排行榜展示本地数据）
  weeklyScore: number;
  weeklyDate: string;                       // 本周起始日期
  // 昵称（可选）
  nickname: string;
  // 灯谜馆进度
  riddleCorrectTotal: number;    // 灯谜馆累计答对题数
  riddlePlayCount: number;       // 灯谜馆游玩局数
  riddleAchievements: string[];  // 已解锁的灯谜成就ID
}

const DEFAULT_STATE: LocalGameState = {
  totalScore: 0,
  currentRankId: 1,
  consecutiveWins: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  hintsCount: 3,
  shieldsCount: 1,
  inkDrops: 20,
  poetCorrectMap: {},
  poetTotalMap: {},
  typePreferMap: {},
  avgResponseTime: 5.0,
  dailyDate: "",
  dailyAnswered: 0,
  dailyCorrect: 0,
  dailyStreak: 0,
  destinyPoetId: null,
  destinyMatchScore: 0,
  destinyUnlockedAt: null,
  weeklyScore: 0,
  weeklyDate: "",
  nickname: "诗词侠客",
  riddleCorrectTotal: 0,
  riddlePlayCount: 0,
  riddleAchievements: [],
};

export function loadLocalState(): LocalGameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LocalGameState>;
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_STATE };
}

export function saveLocalState(state: LocalGameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function updateLocalState(updater: (prev: LocalGameState) => LocalGameState): LocalGameState {
  const prev = loadLocalState();
  const next = updater(prev);
  saveLocalState(next);
  return next;
}

// 段位配置（与后端保持一致）
export interface RankInfo {
  id: number;
  rankName: string;
  tierName: string;
  rankTier: string;
  iconEmoji: string;
  minScore: number;
  maxScore: number;
}

// 段位配置：以兵器谱（Rank.tsx的 RANK_TIERS）为权威数据源
// 7个tier，每个tier分三小级（Ⅲ/Ⅱ/Ⅰ），分数节点与兵器谱完全对齐
export const RANKS: RankInfo[] = [
  // 青铜剑 0~499（分三小级）
  { id: 1,  rankName: "青铜剑·Ⅲ", tierName: "青铜剑", rankTier: "bronze",   iconEmoji: "🗡️",  minScore: 0,    maxScore: 166 },
  { id: 2,  rankName: "青铜剑·Ⅱ", tierName: "青铜剑", rankTier: "bronze",   iconEmoji: "🗡️",  minScore: 167,  maxScore: 333 },
  { id: 3,  rankName: "青铜剑·Ⅰ", tierName: "青铜剑", rankTier: "bronze",   iconEmoji: "🗡️",  minScore: 334,  maxScore: 499 },
  // 白银枪 500~1499（分三小级）
  { id: 4,  rankName: "白银枪·Ⅲ", tierName: "白银枪", rankTier: "silver",   iconEmoji: "🔱",  minScore: 500,  maxScore: 832 },
  { id: 5,  rankName: "白银枪·Ⅱ", tierName: "白银枪", rankTier: "silver",   iconEmoji: "🔱",  minScore: 833,  maxScore: 1166 },
  { id: 6,  rankName: "白银枪·Ⅰ", tierName: "白银枪", rankTier: "silver",   iconEmoji: "🔱",  minScore: 1167, maxScore: 1499 },
  // 黄金刀 1500~3499（分三小级）
  { id: 7,  rankName: "黄金刀·Ⅲ", tierName: "黄金刀", rankTier: "gold",     iconEmoji: "⚔️",  minScore: 1500, maxScore: 2166 },
  { id: 8,  rankName: "黄金刀·Ⅱ", tierName: "黄金刀", rankTier: "gold",     iconEmoji: "⚔️",  minScore: 2167, maxScore: 2833 },
  { id: 9,  rankName: "黄金刀·Ⅰ", tierName: "黄金刀", rankTier: "gold",     iconEmoji: "⚔️",  minScore: 2834, maxScore: 3499 },
  // 铂金戟 3500~6999（分三小级）
  { id: 10, rankName: "铂金戟·Ⅲ", tierName: "铂金戟", rankTier: "platinum", iconEmoji: "🏆",  minScore: 3500, maxScore: 4666 },
  { id: 11, rankName: "铂金戟·Ⅱ", tierName: "铂金戟", rankTier: "platinum", iconEmoji: "🏆",  minScore: 4667, maxScore: 5833 },
  { id: 12, rankName: "铂金戟·Ⅰ", tierName: "铂金戟", rankTier: "platinum", iconEmoji: "🏆",  minScore: 5834, maxScore: 6999 },
  // 钻石弓 7000~11999（分三小级）
  { id: 13, rankName: "钻石弓·Ⅲ", tierName: "钻石弓", rankTier: "diamond",  iconEmoji: "💎",  minScore: 7000,  maxScore: 8666 },
  { id: 14, rankName: "钻石弓·Ⅱ", tierName: "钻石弓", rankTier: "diamond",  iconEmoji: "💎",  minScore: 8667,  maxScore: 10333 },
  { id: 15, rankName: "钻石弓·Ⅰ", tierName: "钻石弓", rankTier: "diamond",  iconEmoji: "💎",  minScore: 10334, maxScore: 11999 },
  // 星耀扇 12000~19999（分三小级）
  { id: 16, rankName: "星耀扇·Ⅲ", tierName: "星耀扇", rankTier: "star",     iconEmoji: "✨",  minScore: 12000, maxScore: 14666 },
  { id: 17, rankName: "星耀扇·Ⅱ", tierName: "星耀扇", rankTier: "star",     iconEmoji: "✨",  minScore: 14667, maxScore: 17333 },
  { id: 18, rankName: "星耀扇·Ⅰ", tierName: "星耀扇", rankTier: "star",     iconEmoji: "✨",  minScore: 17334, maxScore: 19999 },
  // 王者笔 20000+（分两小级）
  { id: 19, rankName: "王者笔·Ⅱ", tierName: "王者笔", rankTier: "king",     iconEmoji: "👑",  minScore: 20000, maxScore: 29999 },
  { id: 20, rankName: "王者笔·Ⅰ", tierName: "王者笔", rankTier: "king",     iconEmoji: "👑",  minScore: 30000, maxScore: 999999 },
];

export function getRankByScore(score: number): RankInfo {
  // 从高到低找第一个 minScore <= score 的段位
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i]!.minScore) return RANKS[i]!;
  }
  return RANKS[0]!;
}

// 答题后更新本地状态，返回更新后的状态和是否段位变化
export interface AnswerUpdateResult {
  newState: LocalGameState;
  scoreDelta: number;
  rankChanged: boolean;
  oldRank: RankInfo;
  newRank: RankInfo;
  shouldUnlockDestiny: boolean;
  reward: { type: string; message: string } | null;
}

export function processLocalAnswer(
  isCorrect: boolean,
  poetId: number,
  questionType: string,
  responseTime: number,
): AnswerUpdateResult {
  const prev = loadLocalState();
  const oldRank = getRankByScore(prev.totalScore);

  let scoreDelta = 0;
  let reward: { type: string; message: string } | null = null;

  if (isCorrect) {
    scoreDelta = 10;
    const newConsec = prev.consecutiveWins + 1;
    if (newConsec === 3) scoreDelta += 5;
    if (newConsec === 5) {
      scoreDelta += 5;
      reward = { type: "hint", message: "🎉 5连胜！获得提示卡×1" };
    }
    if (newConsec === 10) {
      reward = { type: "shield", message: "🛡️ 10连胜！获得护身符×1" };
    }
  } else {
    scoreDelta = -10;
  }

  const newScore = Math.max(0, prev.totalScore + scoreDelta);
  const newConsec = isCorrect ? prev.consecutiveWins + 1 : 0;
  const newRank = getRankByScore(newScore);
  const rankChanged = newRank.id !== oldRank.id;

  // 更新诗人偏好数据
  const poetKey = String(poetId);
  const poetCorrectMap = { ...prev.poetCorrectMap };
  const poetTotalMap = { ...prev.poetTotalMap };
  if (poetId > 0) {
    poetTotalMap[poetKey] = (poetTotalMap[poetKey] ?? 0) + 1;
    if (isCorrect) poetCorrectMap[poetKey] = (poetCorrectMap[poetKey] ?? 0) + 1;
  }
  const typePreferMap = { ...prev.typePreferMap };
  typePreferMap[questionType] = (typePreferMap[questionType] ?? 0) + 1;

  // 加权平均响应时间
  const newTotal = prev.totalAnswered + 1;
  const newAvgTime = (prev.avgResponseTime * prev.totalAnswered + responseTime) / newTotal;

  // 每日任务
  const today = new Date().toISOString().slice(0, 10);
  const dailyDate = prev.dailyDate === today ? today : today;
  const dailyAnswered = prev.dailyDate === today ? prev.dailyAnswered + 1 : 1;
  const dailyCorrect = prev.dailyDate === today ? prev.dailyCorrect + (isCorrect ? 1 : 0) : (isCorrect ? 1 : 0);
  const dailyStreak = prev.dailyDate === today
    ? (isCorrect ? Math.max(prev.dailyStreak, newConsec) : prev.dailyStreak)
    : (isCorrect ? 1 : 0);

  // 周积分
  const weekStart = getWeekStart();
  const weeklyScore = prev.weeklyDate === weekStart
    ? prev.weeklyScore + Math.max(0, scoreDelta)
    : Math.max(0, scoreDelta);

  // 道具奖励
  let hintsCount = prev.hintsCount;
  let shieldsCount = prev.shieldsCount;
  if (reward?.type === "hint") hintsCount += 1;
  if (reward?.type === "shield") shieldsCount += 1;

  // 墨滴（答错消耗，每日恢复）
  let inkDrops = prev.inkDrops;
  if (!isCorrect) inkDrops = Math.max(0, inkDrops - 1);
  // 每日恢复墨滴
  if (prev.dailyDate !== today) inkDrops = 20;

  const shouldUnlockDestiny = newTotal >= 100 && prev.destinyPoetId === null;

  const newState: LocalGameState = {
    ...prev,
    totalScore: newScore,
    currentRankId: newRank.id,
    consecutiveWins: newConsec,
    totalAnswered: newTotal,
    totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
    hintsCount,
    shieldsCount,
    inkDrops,
    poetCorrectMap,
    poetTotalMap,
    typePreferMap,
    avgResponseTime: newAvgTime,
    dailyDate,
    dailyAnswered,
    dailyCorrect,
    dailyStreak,
    weeklyScore,
    weeklyDate: weekStart,
  };

  saveLocalState(newState);

  return {
    newState,
    scoreDelta,
    rankChanged,
    oldRank,
    newRank,
    shouldUnlockDestiny,
    reward,
  };
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sunday
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

// 消耗提示卡
export function consumeLocalHint(): boolean {
  const state = loadLocalState();
  if (state.hintsCount <= 0) return false;
  saveLocalState({ ...state, hintsCount: state.hintsCount - 1 });
  return true;
}

// 保存本命诗人
export function saveLocalDestinyPoet(poetId: number, matchScore: number): void {
  updateLocalState((prev) => ({
    ...prev,
    destinyPoetId: poetId,
    destinyMatchScore: matchScore,
    destinyUnlockedAt: Date.now(),
  }));
}

// 重置本命诗人（重新测试）
export function resetLocalDestinyPoet(): void {
  updateLocalState((prev) => ({
    ...prev,
    destinyPoetId: null,
    destinyMatchScore: 0,
    destinyUnlockedAt: null,
  }));
}

// 更新昵称
export function updateLocalNickname(nickname: string): void {
  updateLocalState((prev) => ({ ...prev, nickname }));
}
