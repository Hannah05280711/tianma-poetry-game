import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";

const RANK_TIERS = [
  {
    tier: "bronze",
    name: "青铜剑",
    weapon: "剑",
    color: "#B87333",
    colorLight: "#D4A574",
    gradientFrom: "#B87333",
    gradientTo: "#8B5E3C",
    desc: "初入江湖，磨砺剑锋",
    story: "铸于上古，承载着最初的诗意与梦想。每一位诗词学者都从这里起步，磨砺心志。",
    minScore: 0,
    // SVG path for sword
    icon: `<path d="M12 2L14 8H20L15 12L17 18L12 15L7 18L9 12L4 8H10L12 2Z" fill="currentColor"/>`,
  },
  {
    tier: "silver",
    name: "白银枪",
    weapon: "枪",
    color: "#7A8A9A",
    colorLight: "#A8B8C8",
    gradientFrom: "#8A9BAB",
    gradientTo: "#5A6B7B",
    desc: "渐入佳境，枪法精进",
    story: "枪法如诗，刺破云霄。掌握此枪者，已能背诵千首唐诗，出口成章。",
    minScore: 500,
    icon: `<line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><path d="M9 5L12 2L15 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>`,
  },
  {
    tier: "gold",
    name: "黄金刀",
    weapon: "刀",
    color: "#C8960C",
    colorLight: "#E8B84B",
    gradientFrom: "#D4A017",
    gradientTo: "#A07010",
    desc: "刀光剑影，名震一方",
    story: "刀光如日，照耀诗坛。持此刀者，宋词元曲信手拈来，令人叹服。",
    minScore: 1500,
    icon: `<path d="M5 19L12 4L16 12L19 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="5" cy="19" r="2" fill="currentColor"/>`,
  },
  {
    tier: "platinum",
    name: "铂金戟",
    weapon: "戟",
    color: "#5B8FA8",
    colorLight: "#8BBDD4",
    gradientFrom: "#6BA0BB",
    gradientTo: "#3B6F88",
    desc: "戟指苍穹，威震四海",
    story: "戟分天地，诗贯古今。执此戟者，已是一方诗词宗师，门下弟子无数。",
    minScore: 3500,
    icon: `<path d="M12 2V22M8 6L12 2L16 6M8 10H16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>`,
  },
  {
    tier: "diamond",
    name: "钻石弓",
    weapon: "弓",
    color: "#2563EB",
    colorLight: "#60A5FA",
    gradientFrom: "#3B82F6",
    gradientTo: "#1D4ED8",
    desc: "弓弦一响，百步穿杨",
    story: "弓弦如丝，射穿时空。此弓射出的每一箭，都是一首流传千古的诗篇。",
    minScore: 7000,
    icon: `<path d="M5 12C5 8.13 8.13 5 12 5C15.87 5 19 8.13 19 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>`,
  },
  {
    tier: "star",
    name: "星耀扇",
    weapon: "扇",
    color: "#D97706",
    colorLight: "#FCD34D",
    gradientFrom: "#F59E0B",
    gradientTo: "#B45309",
    desc: "扇动星河，诗意无边",
    story: "扇动星河，诗意无边。持此扇者，已与古代诗人心灵相通，共赏明月。",
    minScore: 12000,
    icon: `<path d="M12 3C12 3 6 7 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 7 12 3 12 3Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12 3L12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>`,
  },
  {
    tier: "king",
    name: "王者笔",
    weapon: "笔",
    color: "#9B2335",
    colorLight: "#E05C6E",
    gradientFrom: "#C0392B",
    gradientTo: "#7B1A28",
    desc: "一笔定乾坤，诗词之王",
    story: "一笔定乾坤，万古留芳名。执此笔者，乃当世诗词之王，名垂青史。",
    minScore: 20000,
    icon: `<path d="M6 18L10 14L14 10L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 6H18V10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 18L4 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>`,
  },
];

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
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDash = circumference * Math.min(1, Math.max(0, progress / 100));
  const ringWidth = size * 0.11;

  // 未解锁：灰度
  const ringColor = unlocked ? rank.gradientFrom : "#C8C8C8";
  const ringColorEnd = unlocked ? rank.gradientTo : "#A0A0A0";
  const iconColor = unlocked ? rank.color : "#A0A0A0";
  const bgOpacity = unlocked ? 0.12 : 0.05;
  const glowId = `glow-${rank.tier}`;
  const gradId = `grad-${rank.tier}`;
  const bgGradId = `bg-${rank.tier}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: unlocked && isCurrent ? `drop-shadow(0 0 ${size * 0.08}px ${rank.color}80)` : "none" }}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={ringColor} />
          <stop offset="100%" stopColor={ringColorEnd} />
        </linearGradient>
        <radialGradient id={bgGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={unlocked ? rank.color : "#888888"} stopOpacity={bgOpacity * 2} />
          <stop offset="100%" stopColor={unlocked ? rank.color : "#888888"} stopOpacity={0} />
        </radialGradient>
        {unlocked && isCurrent && (
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={size * 0.04} result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>

      {/* 背景圆 */}
      <circle cx={cx} cy={cy} r={r + ringWidth / 2} fill={`url(#${bgGradId})`} />

      {/* 轨道（灰色底环）*/}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={unlocked ? rank.color + "20" : "#E0E0E0"}
        strokeWidth={ringWidth}
      />

      {/* 进度环（已解锁显示进度，未解锁显示空环）*/}
      {unlocked && (
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={ringWidth}
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      )}

      {/* 圆环端点光点（已解锁且有进度时）*/}
      {unlocked && progress > 3 && (
        <circle
          cx={cx + r * Math.cos((strokeDash / circumference) * 2 * Math.PI - Math.PI / 2)}
          cy={cy + r * Math.sin((strokeDash / circumference) * 2 * Math.PI - Math.PI / 2)}
          r={ringWidth * 0.55}
          fill={rank.colorLight}
        />
      )}

      {/* 中心图标 */}
      <g
        transform={`translate(${cx - size * 0.18}, ${cy - size * 0.18}) scale(${size * 0.015})`}
        color={iconColor}
        style={{ opacity: unlocked ? 1 : 0.35 }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g dangerouslySetInnerHTML={{ __html: rank.icon }} />
        </svg>
      </g>

      {/* 中心兵器汉字 */}
      <text
        x={cx} y={cy + size * 0.07}
        textAnchor="middle"
        fontSize={size * 0.22}
        fontFamily="Huiwen-MinchoGBK, Noto Serif SC, STSong, serif"
        fontWeight="600"
        fill={iconColor}
        style={{ opacity: unlocked ? 1 : 0.35 }}
      >
        {rank.weapon}
      </text>

      {/* 已解锁完成标记（100%时显示✓）*/}
      {unlocked && progress >= 100 && (
        <text
          x={cx + r * 0.7} y={cy - r * 0.7}
          textAnchor="middle"
          fontSize={size * 0.14}
          fill={rank.colorLight}
        >✓</text>
      )}
    </svg>
  );
}

export default function Rank() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: gameState } = trpc.game.getState.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const currentTier = gameState?.rank?.rankTier ?? "bronze";
  const currentScore = gameState?.totalScore ?? 0;
  const currentTierIdx = RANK_TIERS.findIndex(r => r.tier === currentTier);
  const currentRankData = RANK_TIERS[currentTierIdx];
  const nextTier = RANK_TIERS[currentTierIdx + 1];

  // 计算当前段位内进度百分比
  const tierProgress = (() => {
    if (!currentRankData) return 0;
    if (!nextTier) return 100;
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
        <h1 className="font-semibold font-display text-foreground" style={{ fontSize: "19px" }}>王者兵器谱</h1>
      </div>

      <div className="px-4 pt-4">

        {/* 当前段位大卡片 */}
        {isAuthenticated && gameState?.rank && currentRankData && (
          <div
            className="rounded-2xl p-5 mb-6 animate-scale-in border overflow-hidden relative"
            style={{
              background: `linear-gradient(135deg, ${currentRankData.color}18 0%, var(--card) 60%)`,
              borderColor: currentRankData.color + "40",
            }}
          >
            {/* 装饰大字 */}
            <div
              className="absolute right-4 top-2 font-display select-none pointer-events-none"
              style={{ fontSize: "72px", color: currentRankData.color, opacity: 0.06, lineHeight: 1 }}
            >
              {currentRankData.weapon}
            </div>

            <div className="flex items-center gap-5">
              <RingBadge
                rank={currentRankData}
                unlocked={true}
                isCurrent={true}
                progress={tierProgress}
                size={96}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="font-bold font-display"
                    style={{ fontSize: "22px", color: currentRankData.color }}
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
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold" style={{ color: "var(--gold)" }}>{currentScore}</span>
                  <span className="text-sm text-muted-foreground">积分</span>
                </div>
              </div>
            </div>

            {/* 进度条 */}
            {nextTier && (
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
            )}
            {!nextTier && (
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
              <div className="text-sm font-semibold text-foreground mb-0.5">登录解锁段位追踪</div>
              <p className="text-xs text-muted-foreground">登录后可查看你的当前段位、积分进度和兵器解锁状态</p>
            </div>
          </div>
        )}

        {/* 徽章墙标题 */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground px-2 font-semibold tracking-widest">七大兵器</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* 圆环徽章网格 */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {RANK_TIERS.map((rank) => {
            const unlocked = !isAuthenticated ? false : currentScore >= rank.minScore;
            const isCurrent = rank.tier === currentTier && isAuthenticated;

            // 计算该段位进度
            const nextR = RANK_TIERS[RANK_TIERS.indexOf(rank) + 1];
            const prog = unlocked
              ? isCurrent
                ? tierProgress
                : 100
              : 0;

            return (
              <div key={rank.tier} className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  <RingBadge
                    rank={rank}
                    unlocked={unlocked}
                    isCurrent={isCurrent}
                    progress={prog}
                    size={72}
                  />
                  {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-40">
                        <rect x="5" y="11" width="14" height="10" rx="2" stroke="#888" strokeWidth="2"/>
                        <path d="M8 11V7a4 4 0 018 0v4" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div
                  className="text-center font-display"
                  style={{
                    fontSize: "12px",
                    color: unlocked ? rank.color : "var(--muted-foreground)",
                    fontWeight: isCurrent ? 700 : 500,
                    opacity: unlocked ? 1 : 0.5,
                  }}
                >
                  {rank.name}
                </div>
                <div className="text-center text-muted-foreground" style={{ fontSize: "10px", opacity: 0.7 }}>
                  {rank.minScore === 0 ? "起始" : `${rank.minScore}分`}
                </div>
              </div>
            );
          })}
          {/* 占位（4列，7个元素，最后一行补1个空位）*/}
          <div />
        </div>

        {/* 段位详情列表 */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground px-2 font-semibold tracking-widest">段位详情</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2 mb-6">
          {RANK_TIERS.map((rank, idx) => {
            const isCurrentTier = rank.tier === currentTier && isAuthenticated;
            const isUnlocked = isAuthenticated && currentScore >= rank.minScore;
            const subRanks = ["Ⅲ", "Ⅱ", "Ⅰ"];

            return (
              <div
                key={rank.tier}
                className="rounded-2xl overflow-hidden transition-all border"
                style={{
                  background: isCurrentTier ? rank.color + "0D" : "var(--card)",
                  borderColor: isCurrentTier ? rank.color + "50" : "var(--border)",
                  opacity: isAuthenticated && !isUnlocked ? 0.5 : 1,
                }}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    {/* 小圆环 */}
                    <RingBadge
                      rank={rank}
                      unlocked={isUnlocked}
                      isCurrent={isCurrentTier}
                      progress={isCurrentTier ? tierProgress : isUnlocked ? 100 : 0}
                      size={44}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-semibold font-display"
                          style={{ fontSize: "15px", color: isCurrentTier ? rank.color : "var(--foreground)" }}
                        >
                          {rank.name}
                        </span>
                        {isCurrentTier && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: rank.color + "20", color: rank.color }}
                          >
                            当前
                          </span>
                        )}
                        {isAuthenticated && !isUnlocked && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="opacity-40">
                            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{rank.desc}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-muted-foreground">起始分</div>
                      <div className="font-semibold" style={{ fontSize: "14px", color: rank.color }}>
                        {rank.minScore}
                      </div>
                    </div>
                  </div>

                  {/* 当前段位的子段位 */}
                  {isCurrentTier && (
                    <div className="flex gap-2 mt-3">
                      {subRanks.map((sub) => {
                        const subIdx = ["Ⅲ", "Ⅱ", "Ⅰ"].indexOf(sub);
                        const subScore = rank.minScore + subIdx *
                          Math.floor(((RANK_TIERS[idx + 1]?.minScore ?? rank.minScore + 1500) - rank.minScore) / 3);
                        const isCurrentSub = gameState?.rank?.subRank === (subIdx + 1);
                        return (
                          <div
                            key={sub}
                            className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-all"
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
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 兵器传说 */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground px-2 font-semibold tracking-widest">兵器传说</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-3 mb-6">
          {RANK_TIERS.map((rank) => {
            const unlocked = isAuthenticated && currentScore >= rank.minScore;
            return (
              <div
                key={rank.name}
                className="rounded-xl p-4 flex gap-3 border transition-all"
                style={{
                  background: unlocked ? rank.color + "08" : "var(--card)",
                  borderColor: unlocked ? rank.color + "30" : "var(--border)",
                  opacity: unlocked ? 1 : 0.55,
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <RingBadge rank={rank} unlocked={unlocked} isCurrent={false} progress={unlocked ? 100 : 0} size={36} />
                </div>
                <div>
                  <div
                    className="font-semibold font-display mb-1"
                    style={{ fontSize: "15px", color: unlocked ? rank.color : "var(--foreground)" }}
                  >
                    {rank.name}
                    {!unlocked && <span className="text-xs text-muted-foreground font-normal ml-2">（{rank.minScore}分解锁）</span>}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rank.story}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
