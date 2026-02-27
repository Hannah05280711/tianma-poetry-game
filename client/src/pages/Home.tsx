import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

const RANK_COLORS: Record<string, string> = {
  bronze: "#B87333", silver: "#8A8A8A", gold: "#C8960C",
  platinum: "#6B7280", diamond: "#2563EB", star: "#D97706", king: "#DC2626",
};

const POET_EMOJIS: Record<string, string> = {
  "李白": "🌙", "杜甫": "📜", "王维": "🏔️", "苏轼": "🌊",
  "李清照": "🌸", "辛弃疾": "⚔️", "白居易": "🎵", "陶渊明": "🌿",
};

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: gameState } = trpc.game.getState.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const { data: destinyPoet } = trpc.game.getDestinyPoet.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const rankColor = gameState?.rank
    ? RANK_COLORS[gameState.rank.rankTier] ?? "#B87333"
    : "#B87333";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4 float-anim">🎋</div>
          <p className="text-sm text-muted-foreground">墨香飘来...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-content bg-background">
      <div className="px-4 pt-safe">
        {/* Header */}
        <div className="flex items-center justify-between py-4 border-b border-border mb-4">
          <div>
            <h1 className="text-xl font-bold font-display text-foreground">
              天马行空
            </h1>
            <p className="text-xs text-muted-foreground">你的本命诗人是谁？</p>
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border border-border bg-card transition-all"
            >
              <span>👤</span>
              <span className="text-xs max-w-[80px] truncate text-foreground">{user?.name ?? "诗词人"}</span>
            </button>
          ) : (
            <a
              href={getLoginUrl()}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all text-white"
              style={{ background: "var(--vermilion)" }}
            >
              登录
            </a>
          )}
        </div>

        {/* Hero Banner */}
        <div
          className="relative rounded-2xl overflow-hidden mb-4 p-5 border"
          style={{
            background: "linear-gradient(135deg, #FFF5F5 0%, #FFF9F0 100%)",
            borderColor: "oklch(0.55 0.20 25 / 0.20)",
          }}
        >
          <div className="absolute top-2 right-3 text-7xl opacity-10 select-none pointer-events-none">
            📜
          </div>
          <div className="relative z-10">
            <div className="text-4xl mb-2 float-anim">🎋</div>
            <h2 className="text-xl font-bold font-display mb-1 text-foreground">
              诗词闯关
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              答题积分 · 晋升段位 · 解锁本命诗人
            </p>
            <button
              onClick={() => navigate("/game")}
              className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 text-white"
              style={{ background: "var(--vermilion)", boxShadow: "0 4px 14px oklch(0.55 0.20 25 / 0.30)" }}
            >
              ⚔️ 开始答题
            </button>
          </div>
        </div>

        {/* Stats Row (if logged in) */}
        {isAuthenticated && gameState && (
          <div className="grid grid-cols-3 gap-3 mb-4 animate-slide-up">
            <div className="rounded-xl p-3 text-center bg-card border border-border">
              <div className="text-lg font-bold" style={{ color: "var(--gold)" }}>
                {gameState.totalScore}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">总积分</div>
            </div>
            <div className="rounded-xl p-3 text-center bg-card border"
              style={{ borderColor: rankColor + "40" }}>
              <div className="text-lg font-bold" style={{ color: rankColor }}>
                {gameState.rank?.iconEmoji ?? "🗡️"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {gameState.rank?.tierName ?? "青铜剑"}
              </div>
            </div>
            <div className="rounded-xl p-3 text-center bg-card border border-border">
              <div className="text-lg font-bold" style={{ color: "var(--celadon)" }}>
                {gameState.consecutiveWins}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">连胜</div>
            </div>
          </div>
        )}

        {/* Destiny Poet Card */}
        {isAuthenticated && destinyPoet?.poet && (
          <div
            className="rounded-2xl p-4 mb-4 cursor-pointer transition-all active:scale-[0.98] animate-slide-up border bg-card"
            style={{ borderColor: "oklch(0.55 0.20 25 / 0.25)" }}
            onClick={() => navigate("/destiny")}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "var(--vermilion-pale)", border: "1.5px solid oklch(0.55 0.20 25 / 0.30)" }}>
                {POET_EMOJIS[(destinyPoet.poet as { name: string }).name] ?? "✨"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "var(--vermilion-pale)", color: "var(--vermilion)" }}>
                    本命诗人
                  </span>
                  <span className="text-xs text-muted-foreground">{destinyPoet.matchScore}% 契合</span>
                </div>
                <div className="font-bold text-base font-display text-foreground">
                  {(destinyPoet.poet as { name: string }).name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(destinyPoet.poet as { dynasty: string; mbtiType: string }).dynasty}代 · {(destinyPoet.poet as { mbtiType: string }).mbtiType}
                </div>
              </div>
              <span className="text-muted-foreground">›</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { path: "/rank", icon: "⚔️", title: "兵器谱", desc: "查看段位系统" },
            { path: "/daily", icon: "📅", title: "每日任务", desc: "完成任务得奖励" },
            { path: "/leaderboard", icon: "🏆", title: "周赛排名", desc: "本周答题王" },
            { path: "/destiny", icon: "✨", title: "本命觉醒", desc: "发现你的诗人", requireAuth: true },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => {
                if (item.requireAuth && !isAuthenticated) {
                  toast.info("请先登录");
                  window.location.href = getLoginUrl();
                  return;
                }
                navigate(item.path);
              }}
              className="rounded-2xl p-4 text-left transition-all active:scale-95 bg-card border border-border hover:border-[oklch(0.55_0.20_25_/_0.30)]"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-semibold text-sm text-foreground">{item.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>

        {/* Ink drops */}
        {isAuthenticated && gameState && (
          <div className="rounded-xl p-3 mb-4 flex items-center gap-3 bg-card border border-border">
            <span className="text-sm text-muted-foreground shrink-0">墨滴</span>
            <div className="flex gap-1 flex-1 flex-wrap">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    background: i < (gameState.inkDrops ?? 0)
                      ? "var(--celadon)"
                      : "oklch(0.90 0.01 80)",
                  }}
                />
              ))}
            </div>
            <span className="text-sm font-bold shrink-0" style={{ color: "var(--celadon)" }}>
              {gameState.inkDrops}/20
            </span>
          </div>
        )}

        {/* Login tip */}
        {!isAuthenticated && (
          <div className="rounded-xl p-3 mb-4 flex items-center gap-3 bg-card border border-border">
            <span className="text-lg">💡</span>
            <p className="text-xs text-muted-foreground flex-1">登录后可保存积分、解锁本命诗人</p>
            <a href={getLoginUrl()}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold flex-shrink-0 text-white"
              style={{ background: "var(--vermilion)" }}>
              登录
            </a>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
