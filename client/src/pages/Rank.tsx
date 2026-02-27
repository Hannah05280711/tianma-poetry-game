import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";

const RANK_TIERS = [
  { tier: "bronze",   name: "青铜剑", emoji: "🗡️", color: "#B87333", desc: "初入江湖，磨砺剑锋",       minScore: 0 },
  { tier: "silver",   name: "白银枪", emoji: "🔱", color: "#8A8A8A", desc: "渐入佳境，枪法精进",       minScore: 500 },
  { tier: "gold",     name: "黄金刀", emoji: "⚔️", color: "#C8960C", desc: "刀光剑影，名震一方",       minScore: 1500 },
  { tier: "platinum", name: "铂金戟", emoji: "🏆", color: "#6B7280", desc: "戟指苍穹，威震四海",       minScore: 3500 },
  { tier: "diamond",  name: "钻石弓", emoji: "🏹", color: "#2563EB", desc: "弓弦一响，百步穿杨",       minScore: 7000 },
  { tier: "star",     name: "星耀扇", emoji: "🌟", color: "#D97706", desc: "扇动星河，诗意无边",       minScore: 12000 },
  { tier: "king",     name: "王者笔", emoji: "👑", color: "#DC2626", desc: "一笔定乾坤，诗词之王",     minScore: 20000 },
];

const WEAPON_STORIES = [
  { emoji: "🗡️", name: "青铜剑", story: "铸于上古，承载着最初的诗意与梦想。每一位诗词学者都从这里起步，磨砺心志。" },
  { emoji: "🔱", name: "白银枪", story: "枪法如诗，刺破云霄。掌握此枪者，已能背诵千首唐诗，出口成章。" },
  { emoji: "⚔️", name: "黄金刀", story: "刀光如日，照耀诗坛。持此刀者，宋词元曲信手拈来，令人叹服。" },
  { emoji: "🏆", name: "铂金戟", story: "戟分天地，诗贯古今。执此戟者，已是一方诗词宗师，门下弟子无数。" },
  { emoji: "🏹", name: "钻石弓", story: "弓弦如丝，射穿时空。此弓射出的每一箭，都是一首流传千古的诗篇。" },
  { emoji: "🌟", name: "星耀扇", story: "扇动星河，诗意无边。持此扇者，已与古代诗人心灵相通，共赏明月。" },
  { emoji: "👑", name: "王者笔", story: "一笔定乾坤，万古留芳名。执此笔者，乃当世诗词之王，名垂青史。" },
];

export default function Rank() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: gameState } = trpc.game.getState.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const currentTier = gameState?.rank?.rankTier ?? "bronze";
  const currentScore = gameState?.totalScore ?? 0;

  return (
    <div className="min-h-screen page-content px-4 pt-safe bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 mb-2 border-b border-border">
        <button onClick={() => navigate("/")} className="text-muted-foreground text-xl leading-none">‹</button>
        <h1 className="font-semibold text-base font-display text-foreground">⚔️ 王者兵器谱</h1>
      </div>

      {/* Current rank card */}
      {isAuthenticated && gameState?.rank && (
        <div className="rounded-2xl p-5 mb-5 text-center animate-scale-in border"
          style={{
            background: `linear-gradient(135deg, ${gameState.rank.color ?? "#B87333"}12 0%, #FFFDF9 100%)`,
            borderColor: (gameState.rank.color ?? "#B87333") + "40",
          }}>
          <div className="text-5xl mb-2 float-anim">{gameState.rank.iconEmoji}</div>
          <div className="text-xl font-bold font-display mb-1" style={{ color: gameState.rank.color ?? "#B87333" }}>
            {gameState.rank.rankName}
          </div>
          <div className="text-sm text-muted-foreground mb-3">{gameState.rank.tierName}</div>
          <div className="text-2xl font-bold" style={{ color: "var(--gold)" }}>
            {currentScore} 分
          </div>

          {(() => {
            const currentTierIdx = RANK_TIERS.findIndex(r => r.tier === currentTier);
            const nextTier = RANK_TIERS[currentTierIdx + 1];
            if (!nextTier) return (
              <div className="mt-3 text-xs text-muted-foreground">👑 已达最高段位</div>
            );
            const progress = Math.min(100, ((currentScore - (RANK_TIERS[currentTierIdx]?.minScore ?? 0)) /
              (nextTier.minScore - (RANK_TIERS[currentTierIdx]?.minScore ?? 0))) * 100);
            return (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>距离 {nextTier.name}</span>
                  <span>{nextTier.minScore - currentScore} 分</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-muted">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${gameState.rank.color}, ${nextTier.color})` }} />
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Guest prompt */}
      {!isAuthenticated && (
        <div className="rounded-xl p-3 mb-4 flex items-center gap-2 bg-card border border-border">
          <span className="text-lg">💡</span>
          <p className="text-xs text-muted-foreground">登录后可查看你的当前段位和积分进度</p>
        </div>
      )}

      {/* Rank list */}
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">段位体系</h2>
      <div className="space-y-2 mb-6">
        {RANK_TIERS.map((rank, idx) => {
          const isCurrentTier = rank.tier === currentTier && isAuthenticated;
          const isUnlocked = isAuthenticated && currentScore >= rank.minScore;
          const subRanks = ["Ⅲ", "Ⅱ", "Ⅰ"];

          return (
            <div key={rank.tier}
              className="rounded-2xl overflow-hidden transition-all border"
              style={{
                background: isCurrentTier ? rank.color + "0D" : "white",
                borderColor: isCurrentTier ? rank.color + "50" : "oklch(0.90 0.01 80)",
                opacity: isAuthenticated && !isUnlocked ? 0.55 : 1,
              }}>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{rank.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground"
                        style={{ color: isCurrentTier ? rank.color : undefined }}>
                        {rank.name}
                      </span>
                      {isCurrentTier && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: rank.color + "20", color: rank.color }}>
                          当前
                        </span>
                      )}
                      {isAuthenticated && !isUnlocked && <span className="text-xs text-muted-foreground">🔒</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{rank.desc}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">起始分</div>
                    <div className="text-sm font-semibold" style={{ color: rank.color }}>{rank.minScore}</div>
                  </div>
                </div>

                {isCurrentTier && (
                  <div className="flex gap-2 mt-3">
                    {subRanks.map((sub) => {
                      const subScore = rank.minScore + (["Ⅲ", "Ⅱ", "Ⅰ"].indexOf(sub)) *
                        Math.floor((((RANK_TIERS[idx + 1]?.minScore ?? rank.minScore + 1500) - rank.minScore) / 3));
                      const isCurrentSub = gameState?.rank?.subRank === (["Ⅲ", "Ⅱ", "Ⅰ"].indexOf(sub) + 1);
                      return (
                        <div key={sub}
                          className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: isCurrentSub ? rank.color + "25" : "oklch(0.94 0.01 80)",
                            color: isCurrentSub ? rank.color : "var(--ink-pale)",
                            border: `1px solid ${isCurrentSub ? rank.color + "40" : "transparent"}`,
                          }}>
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

      {/* Weapon stories */}
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">兵器传说</h2>
      <div className="space-y-3 mb-6">
        {WEAPON_STORIES.map((w) => (
          <div key={w.name} className="rounded-xl p-3 flex gap-3 bg-card border border-border">
            <div className="text-2xl flex-shrink-0">{w.emoji}</div>
            <div>
              <div className="font-semibold text-sm font-display mb-0.5 text-foreground">{w.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{w.story}</div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
