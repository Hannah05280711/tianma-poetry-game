import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";

const RANK_COLORS: Record<string, string> = {
  bronze: "#CD7F32", silver: "#C0C0C0", gold: "#FFD700",
  platinum: "#E5E4E2", diamond: "#B9F2FF", star: "#FFB347", king: "#FF6B35",
};

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: gameState } = trpc.game.getState.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: destinyPoet } = trpc.game.getDestinyPoet.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4"
        style={{ background: "oklch(0.10 0.025 270)" }}>
        <div className="text-5xl float-anim">👤</div>
        <p className="text-muted-foreground text-sm">请先登录查看个人档案</p>
        <a href={getLoginUrl()}
          className="px-6 py-2.5 rounded-xl font-bold text-sm"
          style={{ background: "oklch(0.72 0.18 35)", color: "oklch(0.10 0.02 270)" }}>
          立即登录
        </a>
      </div>
    );
  }

  const rankColor = gameState?.rank ? (RANK_COLORS[gameState.rank.rankTier] ?? "#CD7F32") : "#CD7F32";
  const accuracy = gameState && gameState.totalAnswered > 0
    ? Math.round((gameState.totalCorrect / gameState.totalAnswered) * 100)
    : 0;

  return (
    <div className="min-h-screen page-content px-4 pt-safe" style={{ background: "oklch(0.10 0.025 270)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 py-4 mb-2">
        <button onClick={() => navigate("/")} className="text-muted-foreground text-xl">‹</button>
        <h1 className="font-bold text-lg font-display">👤 个人档案</h1>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl p-5 mb-4 text-center"
        style={{
          background: `linear-gradient(135deg, ${rankColor}15, oklch(0.16 0.03 270))`,
          border: `1px solid ${rankColor}40`,
        }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-3"
          style={{ background: `${rankColor}20`, border: `3px solid ${rankColor}50` }}>
          {user?.name?.charAt(0) ?? "诗"}
        </div>
        <h2 className="text-xl font-bold font-display mb-1">{user?.name ?? "诗词人"}</h2>
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-lg">{gameState?.rank?.iconEmoji ?? "🗡️"}</span>
          <span className="text-sm font-bold" style={{ color: rankColor }}>
            {gameState?.rank?.rankName ?? "青铜剑·Ⅲ"}
          </span>
        </div>
        {destinyPoet?.poet && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
            style={{ background: "oklch(0.72 0.18 35 / 0.15)", color: "oklch(0.72 0.18 35)" }}>
            ✨ 本命诗人：{destinyPoet.poet.name}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "总积分", value: gameState?.totalScore ?? 0, color: "oklch(0.78 0.18 85)", emoji: "⭐" },
          { label: "答题总数", value: gameState?.totalAnswered ?? 0, color: "oklch(0.62 0.18 190)", emoji: "📝" },
          { label: "答对率", value: `${accuracy}%`, color: "oklch(0.72 0.18 35)", emoji: "✅" },
          { label: "最高连胜", value: gameState?.consecutiveWins ?? 0, color: "oklch(0.62 0.22 25)", emoji: "🔥" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-4"
            style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span>{stat.emoji}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Items */}
      <div className="rounded-2xl p-4 mb-4"
        style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
        <h3 className="font-bold text-sm mb-3">🎒 道具背包</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center py-3 rounded-xl" style={{ background: "oklch(0.20 0.04 270)" }}>
            <div className="text-2xl">💡</div>
            <div className="text-lg font-bold mt-1" style={{ color: "oklch(0.72 0.18 35)" }}>
              {gameState?.hintsCount ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">提示卡</div>
          </div>
          <div className="text-center py-3 rounded-xl" style={{ background: "oklch(0.20 0.04 270)" }}>
            <div className="text-2xl">🛡️</div>
            <div className="text-lg font-bold mt-1" style={{ color: "oklch(0.62 0.18 190)" }}>
              {gameState?.shieldsCount ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">护盾</div>
          </div>
          <div className="text-center py-3 rounded-xl" style={{ background: "oklch(0.20 0.04 270)" }}>
            <div className="text-2xl">💧</div>
            <div className="text-lg font-bold mt-1" style={{ color: "oklch(0.55 0.15 290)" }}>
              {gameState?.inkDrops ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">墨滴</div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="space-y-2 mb-4">
        <button onClick={() => navigate("/rank")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-98"
          style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
          <span className="text-xl">⚔️</span>
          <span className="text-sm font-medium">查看兵器谱段位</span>
          <span className="ml-auto text-muted-foreground">›</span>
        </button>
        <button onClick={() => navigate("/destiny")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-98"
          style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
          <span className="text-xl">✨</span>
          <span className="text-sm font-medium">本命诗人觉醒报告</span>
          <span className="ml-auto text-muted-foreground">›</span>
        </button>
        <button onClick={() => navigate("/leaderboard")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-98"
          style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
          <span className="text-xl">🏆</span>
          <span className="text-sm font-medium">周赛排行榜</span>
          <span className="ml-auto text-muted-foreground">›</span>
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="w-full py-3 rounded-xl text-sm text-muted-foreground transition-all"
        style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}
      >
        退出登录
      </button>

      <BottomNav />
    </div>
  );
}
