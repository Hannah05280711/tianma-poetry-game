import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { isVibrationSupported } from "@/lib/haptics";

const RANK_COLORS: Record<string, string> = {
  bronze: "#B87333", silver: "#8A8A8A", gold: "#C8960C",
  platinum: "#6B7280", diamond: "#2563EB", star: "#D97706", king: "#DC2626",
};

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const { soundEnabled, hapticEnabled, toggleSound, toggleHaptic } = useSoundSettings();

  const { data: gameState } = trpc.game.getState.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: destinyPoet } = trpc.game.getDestinyPoet.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4 bg-background">
        <div className="text-5xl float-anim">👤</div>
        <p className="text-muted-foreground text-sm">个人档案需登录后查看</p>
        <p className="text-xs text-muted-foreground">小程序登录后可自动同步</p>
      </div>
    );
  }

  const rankColor = gameState?.rank ? (RANK_COLORS[gameState.rank.rankTier] ?? "#B87333") : "#B87333";
  const accuracy = gameState && gameState.totalAnswered > 0
    ? Math.round((gameState.totalCorrect / gameState.totalAnswered) * 100)
    : 0;

  return (
    <div className="min-h-screen page-content px-4 pt-safe bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 mb-2 border-b border-border">
        <button onClick={() => navigate("/")} className="text-muted-foreground text-xl leading-none">‹</button>
        <h1 className="font-semibold text-base font-display text-foreground">👤 个人档案</h1>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl p-5 mb-4 text-center border"
        style={{
          background: `linear-gradient(135deg, ${rankColor}0D 0%, #FFFDF9 100%)`,
          borderColor: rankColor + "35",
        }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 font-bold"
          style={{ background: rankColor + "18", border: `3px solid ${rankColor}40`, color: rankColor }}>
          {user?.name?.charAt(0) ?? "诗"}
        </div>
        <h2 className="text-xl font-bold font-display mb-1 text-foreground">{user?.name ?? "诗词人"}</h2>
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-lg">{gameState?.rank?.iconEmoji ?? "🗡️"}</span>
          <span className="text-sm font-semibold" style={{ color: rankColor }}>
            {gameState?.rank?.rankName ?? "青铜剑·Ⅲ"}
          </span>
        </div>
        {destinyPoet?.poet && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
            style={{ background: "var(--vermilion-pale)", color: "var(--vermilion)" }}>
            ✨ 本命诗人：{(destinyPoet.poet as { name: string }).name}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "总积分", value: gameState?.totalScore ?? 0, color: "var(--gold)", emoji: "⭐" },
          { label: "答题总数", value: gameState?.totalAnswered ?? 0, color: "var(--celadon)", emoji: "📝" },
          { label: "答对率", value: `${accuracy}%`, color: "var(--vermilion)", emoji: "✅" },
          { label: "最高连胜", value: gameState?.consecutiveWins ?? 0, color: "#DC2626", emoji: "🔥" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-4 bg-card border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span>{stat.emoji}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Items */}
      <div className="rounded-2xl p-4 mb-4 bg-card border border-border">
        <h3 className="font-semibold text-sm mb-3 text-foreground">🎒 道具背包</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: "💡", count: gameState?.hintsCount ?? 0, label: "提示卡", color: "var(--vermilion)" },
            { emoji: "🛡️", count: gameState?.shieldsCount ?? 0, label: "护盾", color: "var(--celadon)" },
            { emoji: "💧", count: gameState?.inkDrops ?? 0, label: "墨滴", color: "#2563EB" },
          ].map((item) => (
            <div key={item.label} className="text-center py-3 rounded-xl bg-muted">
              <div className="text-2xl">{item.emoji}</div>
              <div className="text-lg font-bold mt-1" style={{ color: item.color }}>
                {item.count}
              </div>
              <div className="text-[10px] text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="space-y-2 mb-4">
        {[
          { path: "/rank", icon: "⚔️", label: "查看兵器谱段位" },
          { path: "/destiny", icon: "✨", label: "本命诗人觉醒报告" },
          { path: "/leaderboard", icon: "🏆", label: "周赛排行榜" },
        ].map((item) => (
          <button key={item.path} onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-[0.98] bg-card border border-border">
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium text-foreground">{item.label}</span>
            <span className="ml-auto text-muted-foreground">›</span>
          </button>
        ))}
      </div>

      {/* Sound & Haptic Settings */}
      <div className="rounded-2xl p-4 mb-4 bg-card border border-border">
        <h3 className="font-semibold text-sm mb-3 text-foreground">🔔 声音与震动</h3>
        <div className="space-y-3">
          {/* 音效开关 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{soundEnabled ? "🔊" : "🔇"}</span>
              <div>
                <div className="text-sm font-medium text-foreground">音效</div>
                <div className="text-xs text-muted-foreground">古筝木鱼等中式音效</div>
              </div>
            </div>
            <button
              onClick={toggleSound}
              className="relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0"
              style={{
                background: soundEnabled ? "var(--vermilion)" : "var(--muted)",
              }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: soundEnabled ? "26px" : "2px" }}
              />
            </button>
          </div>
          {/* 震动开关 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{hapticEnabled ? "📳" : "📴"}</span>
              <div>
                <div className="text-sm font-medium text-foreground">震动反馈</div>
                <div className="text-xs text-muted-foreground">
                  {isVibrationSupported() ? "答对答错触觉反馈" : "iOS 暂不支持"}
                </div>
              </div>
            </div>
            <button
              onClick={toggleHaptic}
              disabled={!isVibrationSupported()}
              className="relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 disabled:opacity-40"
              style={{
                background: hapticEnabled && isVibrationSupported() ? "var(--vermilion)" : "var(--muted)",
              }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: hapticEnabled && isVibrationSupported() ? "26px" : "2px" }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="w-full py-3 rounded-xl text-sm text-muted-foreground transition-all bg-card border border-border mb-4"
      >
        退出登录
      </button>

      <BottomNav />
    </div>
  );
}
