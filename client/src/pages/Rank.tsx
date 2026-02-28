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
    story: "铸于上古，承载着最初的诗意与梦想。每一位诗词学者都从这里起步，磨砺心志，以诗为剑，开启征途。",
    minScore: 0,
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
    story: "枪法如诗，刺破云霄。掌握此枪者，已能背诵千首唐诗，出口成章，令人叹服。",
    minScore: 500,
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
    story: "刀光如日，照耀诗坛。持此刀者，宋词元曲信手拈来，一刀斩断万古愁，诗意横溢。",
    minScore: 1500,
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
    story: "戟分天地，诗贯古今。执此戟者，已是一方诗词宗师，楚辞汉赋皆在胸中，门下弟子无数。",
    minScore: 3500,
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
    story: "弓弦如丝，射穿时空。此弓射出的每一箭，都是一首流传千古的诗篇，字字珠玑，直击人心。",
    minScore: 7000,
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
    story: "扇动星河，诗意无边。持此扇者，已与古代诗人心灵相通，共赏明月，同醉春风，超凡入圣。",
    minScore: 12000,
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
    story: "一笔定乾坤，万古留芳名。执此笔者，乃当世诗词之王，上下五千年，纵横诗词海，名垂青史。",
    minScore: 20000,
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

  const ringColor = unlocked ? rank.gradientFrom : "#C8C8C8";
  const ringColorEnd = unlocked ? rank.gradientTo : "#A0A0A0";
  const textColor = unlocked ? rank.color : "#A0A0A0";
  const bgOpacity = unlocked ? 0.12 : 0.05;
  const gradId = `grad-${rank.tier}-${size}`;
  const bgGradId = `bg-${rank.tier}-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        filter: unlocked && isCurrent
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
          <stop offset="0%" stopColor={unlocked ? rank.color : "#888"} stopOpacity={bgOpacity * 2} />
          <stop offset="100%" stopColor={unlocked ? rank.color : "#888"} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* 背景晕染 */}
      <circle cx={cx} cy={cy} r={r + ringWidth / 2} fill={`url(#${bgGradId})`} />

      {/* 轨道底环 */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={unlocked ? rank.color + "22" : "#E0E0E0"}
        strokeWidth={ringWidth}
      />

      {/* 进度环 */}
      {unlocked && (
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
      {unlocked && progress > 3 && progress < 100 && (
        <circle
          cx={cx + r * Math.cos((strokeDash / circumference) * 2 * Math.PI - Math.PI / 2)}
          cy={cy + r * Math.sin((strokeDash / circumference) * 2 * Math.PI - Math.PI / 2)}
          r={ringWidth * 0.55}
          fill={rank.colorLight}
        />
      )}

      {/* 中心兵器汉字 */}
      <text
        x={cx}
        y={cy + size * 0.09}
        textAnchor="middle"
        fontSize={size * 0.30}
        fontFamily="Huiwen-MinchoGBK, Noto Serif SC, STSong, serif"
        fontWeight="600"
        fill={textColor}
        style={{ opacity: unlocked ? 1 : 0.3 }}
      >
        {rank.weapon}
      </text>
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
                  borderColor: isCurrent ? rank.color + "50" : unlocked ? rank.color + "25" : "var(--border)",
                  opacity: isAuthenticated && !unlocked ? 0.55 : 1,
                }}
              >
                <div className="p-5">
                  {/* 上部：圆环 + 三行信息 */}
                  <div className="flex items-start gap-5">
                    {/* 大圆环徽章 */}
                    <div className="flex-shrink-0">
                      <RingBadge
                        rank={rank}
                        unlocked={unlocked}
                        isCurrent={isCurrent}
                        progress={prog}
                        size={100}
                      />
                    </div>

                    {/* 三行信息 */}
                    <div className="flex-1 min-w-0 pt-1">
                      {/* 第一行：兵器名称 + 当前标签 */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className="font-bold font-display"
                          style={{
                            fontSize: "20px",
                            color: unlocked ? rank.color : "var(--foreground)",
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
                      <div className="flex items-center gap-1.5 mb-2">
                        <div
                          className="text-xs px-2 py-0.5 rounded-md font-semibold"
                          style={{
                            background: unlocked ? rank.color + "15" : "var(--muted)",
                            color: unlocked ? rank.color : "var(--muted-foreground)",
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

                      {/* 第三行：兵器传说 */}
                      <p
                        className="text-muted-foreground leading-relaxed"
                        style={{ fontSize: "13px" }}
                      >
                        {rank.story}
                      </p>
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

      <BottomNav />
    </div>
  );
}
