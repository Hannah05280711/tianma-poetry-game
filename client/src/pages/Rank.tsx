import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/_core/hooks/useAuth";
import { loadLocalState } from "@/lib/localGameState";

const RANK_TIERS = [
  {
    tier: "bronze",
    name: "青铜剑",
    weapon: "剑",
    emoji: "🗡️",
    color: "#B87333",
    colorLight: "#D4A574",
    gradientFrom: "#B87333",
    gradientTo: "#8B5E3C",
    desc: "初入江湖，磨砺剑锋",
    story: "铸于上古，承载着最初的诗意与梦想。每一位诗词学者都从这里起步，磨砺心志，以诗为剑，开启征途。",
    poem: "十年磨一剑，霜刃未曾试",
    poemAuthor: "贾岛《剑客》",
    minScore: 0,
  },
  {
    tier: "silver",
    name: "白银枪",
    weapon: "枪",
    emoji: "🔱",
    color: "#7A8A9A",
    colorLight: "#A8B8C8",
    gradientFrom: "#8A9BAB",
    gradientTo: "#5A6B7B",
    desc: "渐入佳境，枪法精进",
    story: "枪法如诗，刺破云霄。掌握此枪者，已能背诵千首唐诗，出口成章，令人叹服。",
    poem: "熊掌山中路，青天不知处",
    poemAuthor: "李白《山中问答》",
    minScore: 500,
  },
  {
    tier: "gold",
    name: "黄金刀",
    weapon: "刀",
    emoji: "⚔️",
    color: "#C8960C",
    colorLight: "#E8B84B",
    gradientFrom: "#D4A017",
    gradientTo: "#A07010",
    desc: "刀光剑影，名震一方",
    story: "刀光如日，照耀诗坛。持此刀者，宋词元曲信手拈来，一刀斩断万古愁，诗意横溢。",
    poem: "会当凌绝顶，一览众山小",
    poemAuthor: "杜甫《望岳》",
    minScore: 1500,
  },
  {
    tier: "platinum",
    name: "铂金戟",
    weapon: "戟",
    emoji: "🏆",
    color: "#5B8FA8",
    colorLight: "#8BBDD4",
    gradientFrom: "#6BA0BB",
    gradientTo: "#3B6F88",
    desc: "戟指苍穹，威震四海",
    story: "戟分天地，诗贯古今。执此戟者，已是一方诗词宗师，楚辞汉赋皆在胸中，门下弟子无数。",
    poem: "路漫漫其修远兮，吾将上下而求索",
    poemAuthor: "屈原《离骚》",
    minScore: 3500,
  },
  {
    tier: "diamond",
    name: "钻石弓",
    weapon: "弓",
    emoji: "💎",
    color: "#2563EB",
    colorLight: "#60A5FA",
    gradientFrom: "#3B82F6",
    gradientTo: "#1D4ED8",
    desc: "弓弦一响，百步穿杨",
    story: "弓弦如丝，射穿时空。此弓射出的每一箭，都是一首流传千古的诗篇，字字珠玑，直击人心。",
    poem: "不知细叶谁裁出，二月春风似剪刀",
    poemAuthor: "贺知章《咏柳》",
    minScore: 7000,
  },
  {
    tier: "star",
    name: "星耀扇",
    weapon: "扇",
    emoji: "✨",
    color: "#D97706",
    colorLight: "#FCD34D",
    gradientFrom: "#F59E0B",
    gradientTo: "#B45309",
    desc: "扇动星河，诗意无边",
    story: "扇动星河，诗意无边。持此扇者，已与古代诗人心灵相通，共赏明月，同醉春风，超凡入圣。",
    poem: "人生如梦，为欢几何",
    poemAuthor: "李白《春夜宴诸从弟桃李园序》",
    minScore: 12000,
  },
  {
    tier: "king",
    name: "王者笔",
    weapon: "笔",
    emoji: "👑",
    color: "#9B2335",
    colorLight: "#E05C6E",
    gradientFrom: "#C0392B",
    gradientTo: "#7B1A28",
    desc: "一笔定乾坤，诗词之王",
    story: "一笔定乾坤，万古留芳名。执此笔者，乃当世诗词之王，上下五千年，纵横诗词海，名垂青史。",
    poem: "笔落惊风雨，诗成泣鬼神",
    poemAuthor: "杜甫《寄李十二白二十韵》",
    minScore: 20000,
  },
];

// 兵器 SVG 图标路径映射
const WEAPON_ICONS: Record<string, React.ReactNode> = {
  "剑": (
    <>
      <line x1="12" y1="3" x2="12" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 6L12 3L15 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 18L12 21L14 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  "枪": (
    <>
      <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 5L12 3L15 5L12 8Z" fill="currentColor" opacity="0.8"/>
      <line x1="10" y1="15" x2="14" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  "刀": (
    <>
      <path d="M7 19L17 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M17 5L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M7 19L5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="6.5" cy="18.5" r="1.5" fill="currentColor" opacity="0.6"/>
    </>
  ),
  "戟": (
    <>
      <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 7L17 5L15 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 7L7 5L9 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "弓": (
    <>
      <path d="M6 4C6 4 4 8 4 12C4 16 6 20 6 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="6" y1="4" x2="6" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" opacity="0.5"/>
      <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" opacity="0.6"/>
      <path d="M16 10L18 12L16 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "扇": (
    <>
      <path d="M12 20C12 20 5 15 5 9C5 6.24 7.24 4 10 4C11.06 4 12 4.37 12 4.37" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 20C12 20 19 15 19 9C19 6.24 16.76 4 14 4C12.94 4 12 4.37 12 4.37" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="4.37" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </>
  ),
  "笔": (
    <>
      <path d="M6 18L10 14L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 6H18V10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 18L4 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M4 20L6 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    </>
  ),
};

// SVG 圆环徽章组件（Apple Fitness 风格）
function RingBadge({
  rank,
  unlocked,
  isCurrent,
  progress = 0,
  size = 88,
}: {
  rank: typeof RANK_TIERS[0];
  unlocked: boolean;
  isCurrent: boolean;
  progress?: number;
  size?: number;
}) {
  // 青铜剑是初始兵器，始终彩色显示
  const effectiveUnlocked = unlocked || rank.minScore === 0;
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDash = circumference * Math.min(1, Math.max(0, progress / 100));
  const ringWidth = size * 0.11;

  const ringColor = effectiveUnlocked ? rank.gradientFrom : "#C8C8C8";
  const ringColorEnd = effectiveUnlocked ? rank.gradientTo : "#A0A0A0";
  const iconColor = effectiveUnlocked ? rank.color : "#A0A0A0";
  const bgOpacity = effectiveUnlocked ? 0.12 : 0.05;
  const gradId = `grad-${rank.tier}-${size}`;
  const bgGradId = `bg-${rank.tier}-${size}`;
  // 圆圈内图案大小：与本命诗人卡片（96px容器/48px图案=50%比例）保持一致
  // 兵器谱圆圈内径 = size - 2*ringWidth，图案占内径50%
  const innerDiameter = size - 2 * ringWidth;
  const iconSize = innerDiameter * 0.52;
  const iconOffset = (size - iconSize) / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        filter: effectiveUnlocked && isCurrent
          ? `drop-shadow(0 0 ${size * 0.09}px ${rank.color}70)`
          : "none",
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={ringColor} />
          <stop offset="100%" stopColor={ringColorEnd} />
        </linearGradient>
        <radialGradient id={bgGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={effectiveUnlocked ? rank.color : "#888"} stopOpacity={bgOpacity * 2} />
          <stop offset="100%" stopColor={effectiveUnlocked ? rank.color : "#888"} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* 背景晕染 */}
      <circle cx={cx} cy={cy} r={r + ringWidth / 2} fill={`url(#${bgGradId})`} />

      {/* 轨道底环 */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={effectiveUnlocked ? rank.color + "22" : "#E0E0E0"}
        strokeWidth={ringWidth}
      />

      {/* 进度环 */}
      {effectiveUnlocked && (
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={ringWidth}
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}

      {/* 进度端点光点 */}
      {effectiveUnlocked && progress > 3 && progress < 100 && (
        <circle
          cx={cx + r * Math.cos((strokeDash / circumference) * 2 * Math.PI - Math.PI / 2)}
          cy={cy + r * Math.sin((strokeDash / circumference) * 2 * Math.PI - Math.PI / 2)}
          r={ringWidth * 0.55}
          fill={rank.colorLight}
        />
      )}

      {/* 中心兵器 Emoji 图标 */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={iconSize}
        style={{ opacity: effectiveUnlocked ? 1 : 0.25, userSelect: "none" }}
      >
        {rank.emoji}
      </text>
    </svg>
  );
}

const RIDDLE_ACHIEVEMENTS = [
  { id: "riddle_10", name: "灯谜入门", emoji: "🏮", desc: "猜对 10 道灯谜", required: 10, color: "#C8860C" },
  { id: "riddle_30", name: "灯谜高手", emoji: "🎆", desc: "猜对 30 道灯谜", required: 30, color: "#B5446E" },
  { id: "riddle_50", name: "灯谜达人", emoji: "🎉", desc: "猜对 50 道灯谜", required: 50, color: "#2E6DA4" },
];

export default function Rank() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  // 记录上次访问时的最高段位，用于检测新解锁
  const [prevTierIdx, setPrevTierIdx] = useState<number | null>(null);
  const [newlyUnlockedTier, setNewlyUnlockedTier] = useState<string | null>(null);
  const [riddleCorrect, setRiddleCorrect] = useState(0);
  const [localScore, setLocalScore] = useState(0);

  useEffect(() => {
    const state = loadLocalState();
    setRiddleCorrect(state.riddleCorrectTotal ?? 0);
    setLocalScore(state.totalScore ?? 0);
  }, []);

  const { data: gameState } = trpc.game.getState.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const currentTier = gameState?.rank?.rankTier ?? "bronze";
  const currentScore = gameState?.totalScore ?? 0;
  const currentTierIdx = RANK_TIERS.findIndex(r => r.tier === currentTier);
  const currentRankData = RANK_TIERS[currentTierIdx];
  const nextTier = RANK_TIERS[currentTierIdx + 1];

  // 检测段位变化，触发新解锁动效
  useEffect(() => {
    if (!isAuthenticated || currentTierIdx < 0) return;
    const storageKey = 'rank_prev_tier_idx';
    const stored = sessionStorage.getItem(storageKey);
    const storedIdx = stored !== null ? parseInt(stored, 10) : null;
    if (storedIdx !== null && currentTierIdx > storedIdx) {
      // 段位提升，标记新解锁的兵器
      setNewlyUnlockedTier(currentTier);
      setPrevTierIdx(storedIdx);
      // 3秒后清除动效
      const timer = setTimeout(() => setNewlyUnlockedTier(null), 3000);
      return () => clearTimeout(timer);
    }
    sessionStorage.setItem(storageKey, String(currentTierIdx));
  }, [currentTierIdx, currentTier, isAuthenticated]);

  const tierProgress = (() => {
    if (!currentRankData || !nextTier) return currentRankData ? 100 : 0;
    const tierMin = currentRankData.minScore;
    const tierMax = nextTier.minScore;
    return Math.min(100, Math.max(0, ((currentScore - tierMin) / (tierMax - tierMin)) * 100));
  })();

  return (
    <div className="min-h-screen page-content bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xl leading-none"
        >
          ‹
        </button>
        <h1 className="font-semibold font-display text-foreground" style={{ fontSize: "19px" }}>
          王者兵器谱
        </h1>
      </div>

      <div className="px-4 pt-5">

        {/* 当前段位卡片（仅登录用户显示）*/}
        {isAuthenticated && gameState?.rank && currentRankData && (
          <div
            className="rounded-2xl p-5 mb-6 border overflow-hidden relative"
            style={{
              background: `linear-gradient(135deg, ${currentRankData.color}15 0%, var(--card) 70%)`,
              borderColor: currentRankData.color + "40",
            }}
          >
            {/* 装饰大字 */}
            <div
              className="absolute right-5 top-3 font-display select-none pointer-events-none"
              style={{ fontSize: "80px", color: currentRankData.color, opacity: 0.05, lineHeight: 1 }}
            >
              {currentRankData.weapon}
            </div>

            <div className="flex items-center gap-4">
              <RingBadge
                rank={currentRankData}
                unlocked={true}
                isCurrent={true}
                progress={tierProgress}
                size={88}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className="font-bold font-display"
                    style={{ fontSize: "21px", color: currentRankData.color }}
                  >
                    {gameState.rank.rankName}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: currentRankData.color + "20", color: currentRankData.color }}
                  >
                    当前段位
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">{currentRankData.desc}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold" style={{ color: "var(--gold)" }}>{currentScore}</span>
                  <span className="text-sm text-muted-foreground">积分</span>
                </div>
              </div>
            </div>

            {/* 进度条 */}
            {nextTier ? (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>距离 <span style={{ color: nextTier.color }}>{nextTier.name}</span></span>
                  <span>还需 {nextTier.minScore - currentScore} 分</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${tierProgress}%`,
                      background: `linear-gradient(90deg, ${currentRankData.color}, ${nextTier.color})`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-3 text-center text-sm font-semibold" style={{ color: currentRankData.color }}>
                ✦ 已达最高段位 · 诗词之王 ✦
              </div>
            )}
          </div>
        )}

        {/* 游客提示 */}
        {!isAuthenticated && (
          <div className="rounded-xl p-4 mb-5 flex items-start gap-3 bg-card border border-border">
            <div className="text-xl mt-0.5">💡</div>
            <div>
              <div className="font-semibold text-foreground mb-0.5" style={{ fontSize: "15px" }}>登录解锁段位追踪</div>
              <p className="text-xs text-muted-foreground">登录后可查看你的当前段位、积分进度和兵器解锁状态</p>
            </div>
          </div>
        )}

        {/* 分隔线 */}
        <div className="flex items-center gap-2 mb-5">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground px-2 font-semibold tracking-widest">七大兵器</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* 兵器卡片列表 */}
        <div className="space-y-4 mb-6">
          {RANK_TIERS.map((rank) => {
            const unlocked = isAuthenticated && currentScore >= rank.minScore;
            const isCurrent = rank.tier === currentTier && isAuthenticated;
            const nextR = RANK_TIERS[RANK_TIERS.indexOf(rank) + 1];
            const prog = unlocked ? (isCurrent ? tierProgress : 100) : 0;

            const isNewlyUnlocked = newlyUnlockedTier === rank.tier;
            return (
              <div
                key={rank.tier}
                className="rounded-2xl border overflow-hidden transition-all"
                style={{
                  background: isCurrent
                    ? rank.color + "0C"
                    : unlocked
                    ? rank.color + "06"
                    : "var(--card)",
                  borderColor: isNewlyUnlocked ? rank.color : isCurrent ? rank.color + "50" : unlocked ? rank.color + "25" : "var(--border)",
                  opacity: isAuthenticated && !unlocked ? 0.55 : 1,
                  boxShadow: isNewlyUnlocked ? `0 0 0 2px ${rank.color}60, 0 0 24px ${rank.color}40` : undefined,
                  animation: isNewlyUnlocked ? 'rankUnlock 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both' : undefined,
                }}
              >
                <div className="p-5">
                  {/* 圆环居中 + 三行信息居中 */}
                  <div className="flex flex-col items-center text-center gap-3">
                    {/* 大圆环徽章（居中） */}
                    <div className="flex justify-center">
                      <RingBadge
                        rank={rank}
                        unlocked={unlocked}
                        isCurrent={isCurrent}
                        progress={prog}
                        size={110}
                      />
                    </div>

                    {/* 三行信息 */}
                    <div className="w-full">
                      {/* 第一行：兵器名称 + 当前标签 */}
                      <div className="flex items-center justify-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className="font-bold font-display"
                          style={{
                            fontSize: "20px",
                            color: (unlocked || rank.minScore === 0) ? rank.color : "var(--foreground)",
                          }}
                        >
                          {rank.name}
                        </span>
                        {isCurrent && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: rank.color + "20", color: rank.color }}
                          >
                            当前
                          </span>
                        )}
                        {isAuthenticated && unlocked && !isCurrent && (
                          <span className="text-xs text-muted-foreground">✓ 已解锁</span>
                        )}
                        {isAuthenticated && !unlocked && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="opacity-40 flex-shrink-0">
                            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>

                      {/* 第二行：解锁分数 */}
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <div
                          className="text-xs px-2 py-0.5 rounded-md font-semibold"
                          style={{
                            background: (unlocked || rank.minScore === 0) ? rank.color + "15" : "var(--muted)",
                            color: (unlocked || rank.minScore === 0) ? rank.color : "var(--muted-foreground)",
                          }}
                        >
                          {rank.minScore === 0 ? "初始兵器" : `${rank.minScore} 分解锁`}
                        </div>
                        {isCurrent && nextR && (
                          <div className="text-xs text-muted-foreground">
                            距下一级 {nextR.minScore - currentScore} 分
                          </div>
                        )}
                      </div>

                      {/* 第三行：兵器传说（在第一个句号和第三个逗号处断行，三行居中） */}
                      <div
                        className="text-muted-foreground text-center"
                        style={{ fontSize: "13px", lineHeight: "1.85" }}
                      >
                        {(() => {
                          const s = rank.story;
                          const p1 = s.indexOf('\u3002');
                          let commaCount = 0, p3 = -1;
                          for (let j = 0; j < s.length; j++) {
                            if (s[j] === '\uff0c') { commaCount++; if (commaCount === 3) { p3 = j; break; } }
                          }
                          const line1 = s.slice(0, p1 + 1);
                          const line2 = p3 > p1 ? s.slice(p1 + 1, p3 + 1) : s.slice(p1 + 1);
                          const line3 = p3 > p1 ? s.slice(p3 + 1) : '';
                          return (
                            <>
                              <div>{line1}</div>
                              <div>{line2}</div>
                              {line3 && <div>{line3}</div>}
                            </>
                          );
                        })()}
                      </div>

                      {/* 诗句彩蛋 */}
                      {'poem' in rank && rank.poem && (
                        <div
                          className="mt-3 pt-3 text-center"
                          style={{ borderTop: `1px solid ${(unlocked || rank.minScore === 0) ? rank.color + '25' : 'var(--border)'}` }}
                        >
                          <div
                            className="font-serif-poem italic"
                            style={{
                              fontSize: "13px",
                              color: (unlocked || rank.minScore === 0) ? rank.color : "var(--muted-foreground)",
                              letterSpacing: "0.05em",
                            }}
                          >
                            「{rank.poem}」
                          </div>
                          <div
                            className="text-muted-foreground mt-0.5"
                            style={{ fontSize: "11px" }}
                          >
                            —— {(rank as { poemAuthor?: string }).poemAuthor}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 当前段位：子段位进度条 */}
                  {isCurrent && nextR && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: rank.color + "20" }}>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>段位进度</span>
                        <span>{Math.round(prog)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${prog}%`,
                            background: `linear-gradient(90deg, ${rank.color}, ${rank.colorLight})`,
                          }}
                        />
                      </div>
                      {/* 子段位标记 */}
                      <div className="flex gap-2 mt-3">
                        {["Ⅲ", "Ⅱ", "Ⅰ"].map((sub, subIdx) => {
                          const isCurrentSub = gameState?.rank?.subRank === (subIdx + 1);
                          return (
                            <div
                              key={sub}
                              className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold"
                              style={{
                                background: isCurrentSub ? rank.color + "25" : "var(--muted)",
                                color: isCurrentSub ? rank.color : "var(--muted-foreground)",
                                border: `1px solid ${isCurrentSub ? rank.color + "40" : "transparent"}`,
                              }}
                            >
                              {rank.name.slice(0, 2)}{sub}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 诗词灯谜馆成就 */}
      <div className="px-4 pb-6">
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <span style={{ fontSize: "20px" }}>🏮</span>
            <h2 className="font-semibold text-foreground" style={{ fontSize: "17px" }}>诗词灯谜馆成就</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {RIDDLE_ACHIEVEMENTS.map((ach) => {
              const unlocked = riddleCorrect >= ach.required;
              return (
                <div
                  key={ach.id}
                  className="rounded-2xl p-3 text-center border transition-all"
                  style={{
                    background: unlocked ? `${ach.color}12` : "var(--muted)",
                    borderColor: unlocked ? `${ach.color}40` : "var(--border)",
                    opacity: unlocked ? 1 : 0.6,
                  }}
                >
                  <div style={{ fontSize: "32px", filter: unlocked ? "none" : "grayscale(1)" }}>
                    {ach.emoji}
                  </div>
                  <div
                    className="font-semibold mt-1"
                    style={{ fontSize: "13px", color: unlocked ? ach.color : "var(--muted-foreground)" }}
                  >
                    {ach.name}
                  </div>
                  <div className="text-muted-foreground mt-0.5" style={{ fontSize: "11px" }}>
                    {ach.desc}
                  </div>
                  {unlocked ? (
                    <div
                      className="mt-1.5 text-xs font-medium rounded-full px-2 py-0.5 inline-block"
                      style={{ background: `${ach.color}20`, color: ach.color }}
                    >
                      已解锁
                    </div>
                  ) : (
                    <div className="mt-1.5 text-xs text-muted-foreground">
                      {riddleCorrect}/{ach.required}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-center text-muted-foreground mt-3" style={{ fontSize: "12px" }}>
            已累计猜对 <span className="font-semibold" style={{ color: "#C8860C" }}>{riddleCorrect}</span> 道灯谜
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
