import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

const RANK_COLORS: Record<string, string> = {
  bronze: "#CD7F32", silver: "#C0C0C0", gold: "#FFD700",
  platinum: "#E5E4E2", diamond: "#B9F2FF", star: "#FFB347", king: "#FF6B35",
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
    ? RANK_COLORS[gameState.rank.rankTier] ?? "#CD7F32"
    : "#CD7F32";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.10 0.025 270)" }}>
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4 float-anim">🎋</div>
          <p className="text-muted-foreground text-sm">墨香飘来...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-content" style={{ background: "oklch(0.10 0.025 270)" }}>
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ maxWidth: "480px", left: "50%", transform: "translateX(-50%)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.18 35) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-20 left-0 w-48 h-48 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, oklch(0.62 0.18 190) 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />
      </div>

      <div className="relative z-10 px-4 pt-safe">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-xl font-bold font-display" style={{ color: "oklch(0.72 0.18 35)" }}>
              天马行空
            </h1>
            <p className="text-xs text-muted-foreground">你的本命诗人是谁？</p>
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all"
              style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}
            >
              <span>👤</span>
              <span className="text-xs max-w-[80px] truncate">{user?.name ?? "诗词人"}</span>
            </button>
          ) : (
            <a
              href={getLoginUrl()}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{ background: "oklch(0.72 0.18 35)", color: "oklch(0.10 0.02 270)" }}
            >
              登录
            </a>
          )}
        </div>

        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden mb-4 p-5"
          style={{ background: "linear-gradient(135deg, oklch(0.18 0.06 290), oklch(0.14 0.04 270))", border: "1px solid oklch(0.30 0.08 290 / 0.5)" }}>
          <div className="absolute top-0 right-0 text-8xl opacity-10 select-none" style={{ transform: "translate(10%, -10%)" }}>
            📜
          </div>
          <div className="relative z-10">
            <div className="text-4xl mb-2 float-anim">🎋</div>
            <h2 className="text-2xl font-bold font-display mb-1" style={{ color: "oklch(0.95 0.01 80)" }}>
              诗词闯关
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              答题积分 · 晋升段位 · 解锁本命诗人
            </p>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  toast.info("请先登录开始游戏");
                  window.location.href = getLoginUrl();
                  return;
                }
                navigate("/game");
              }}
              className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{ background: "oklch(0.72 0.18 35)", color: "oklch(0.10 0.02 270)", boxShadow: "0 4px 16px oklch(0.72 0.18 35 / 0.4)" }}
            >
              ⚔️ 开始答题
            </button>
          </div>
        </div>

        {/* Stats Row (if logged in) */}
        {isAuthenticated && gameState && (
          <div className="grid grid-cols-3 gap-3 mb-4 animate-slide-up">
            <div className="rounded-xl p-3 text-center"
              style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
              <div className="text-xl font-bold" style={{ color: "oklch(0.78 0.18 85)" }}>
                {gameState.totalScore}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">总积分</div>
            </div>
            <div className="rounded-xl p-3 text-center"
              style={{ background: "oklch(0.16 0.03 270)", border: `1px solid ${rankColor}40` }}>
              <div className="text-xl font-bold" style={{ color: rankColor }}>
                {gameState.rank?.iconEmoji ?? "🗡️"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {gameState.rank?.tierName ?? "青铜剑"}
              </div>
            </div>
            <div className="rounded-xl p-3 text-center"
              style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
              <div className="text-xl font-bold" style={{ color: "oklch(0.62 0.18 190)" }}>
                {gameState.consecutiveWins}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">连胜</div>
            </div>
          </div>
        )}

        {/* Destiny Poet Card */}
        {isAuthenticated && destinyPoet?.poet && (
          <div
            className="rounded-2xl p-4 mb-4 cursor-pointer transition-all active:scale-98 animate-slide-up"
            style={{ background: "linear-gradient(135deg, oklch(0.18 0.06 35 / 0.3), oklch(0.16 0.03 270))", border: "1px solid oklch(0.72 0.18 35 / 0.4)" }}
            onClick={() => navigate("/destiny")}
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: "oklch(0.72 0.18 35 / 0.2)", border: "2px solid oklch(0.72 0.18 35 / 0.5)" }}>
                {POET_EMOJIS[destinyPoet.poet.name] ?? "✨"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "oklch(0.72 0.18 35 / 0.2)", color: "oklch(0.72 0.18 35)" }}>
                    本命诗人
                  </span>
                  <span className="text-xs text-muted-foreground">{destinyPoet.matchScore}% 契合</span>
                </div>
                <div className="font-bold text-lg font-display mt-0.5">{destinyPoet.poet.name}</div>
                <div className="text-xs text-muted-foreground truncate">{destinyPoet.poet.dynasty}代 · {destinyPoet.poet.mbtiType}</div>
              </div>
              <span className="text-muted-foreground text-lg">›</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => navigate("/rank")}
            className="rounded-2xl p-4 text-left transition-all active:scale-95"
            style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}
          >
            <div className="text-2xl mb-2">⚔️</div>
            <div className="font-semibold text-sm">兵器谱</div>
            <div className="text-xs text-muted-foreground mt-0.5">查看段位系统</div>
          </button>
          <button
            onClick={() => navigate("/daily")}
            className="rounded-2xl p-4 text-left transition-all active:scale-95"
            style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}
          >
            <div className="text-2xl mb-2">📅</div>
            <div className="font-semibold text-sm">每日任务</div>
            <div className="text-xs text-muted-foreground mt-0.5">完成任务得奖励</div>
          </button>
          <button
            onClick={() => navigate("/leaderboard")}
            className="rounded-2xl p-4 text-left transition-all active:scale-95"
            style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}
          >
            <div className="text-2xl mb-2">🏆</div>
            <div className="font-semibold text-sm">周赛排名</div>
            <div className="text-xs text-muted-foreground mt-0.5">本周答题王</div>
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                toast.info("请先登录");
                window.location.href = getLoginUrl();
                return;
              }
              navigate("/destiny");
            }}
            className="rounded-2xl p-4 text-left transition-all active:scale-95"
            style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}
          >
            <div className="text-2xl mb-2">✨</div>
            <div className="font-semibold text-sm">本命觉醒</div>
            <div className="text-xs text-muted-foreground mt-0.5">发现你的诗人</div>
          </button>
        </div>

        {/* Ink drops display */}
        {isAuthenticated && gameState && (
          <div className="rounded-xl p-3 mb-4 flex items-center gap-3"
            style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
            <span className="text-sm text-muted-foreground">墨滴（生命值）</span>
            <div className="flex gap-1 flex-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    background: i < (gameState.inkDrops ?? 0)
                      ? "oklch(0.62 0.18 190)"
                      : "oklch(0.22 0.04 270)",
                  }}
                />
              ))}
            </div>
            <span className="text-sm font-bold" style={{ color: "oklch(0.62 0.18 190)" }}>
              {gameState.inkDrops}/20
            </span>
          </div>
        )}

        {/* Login prompt */}
        {!isAuthenticated && (
          <div className="rounded-2xl p-5 text-center mb-4"
            style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
            <div className="text-3xl mb-2">🌙</div>
            <p className="text-sm text-muted-foreground mb-3">登录后开始诗词闯关之旅</p>
            <a
              href={getLoginUrl()}
              className="inline-block px-6 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: "oklch(0.72 0.18 35)", color: "oklch(0.10 0.02 270)" }}
            >
              立即登录
            </a>
          </div>
        )}

        {/* Poet showcase */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">✨ 等待你发现的诗人</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {[
              { name: "李白", dynasty: "唐", emoji: "🌙", mbti: "ENFP", desc: "浪漫主义巅峰" },
              { name: "杜甫", dynasty: "唐", emoji: "📜", mbti: "INFJ", desc: "忧国忧民诗圣" },
              { name: "苏轼", dynasty: "宋", emoji: "🌊", mbti: "ENFJ", desc: "旷达乐观词宗" },
              { name: "李清照", dynasty: "宋", emoji: "🌸", mbti: "ISTJ", desc: "婉约千古才女" },
              { name: "辛弃疾", dynasty: "宋", emoji: "⚔️", mbti: "ESTJ", desc: "铁血战士词人" },
              { name: "王维", dynasty: "唐", emoji: "🏔️", mbti: "INFP", desc: "禅意山水诗佛" },
            ].map((p) => (
              <div key={p.name}
                className="flex-shrink-0 w-24 rounded-xl p-3 text-center"
                style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
                <div className="text-2xl mb-1">{p.emoji}</div>
                <div className="font-bold text-sm font-display">{p.name}</div>
                <div className="text-[10px] text-muted-foreground">{p.dynasty}代</div>
                <div className="text-[10px] mt-1 px-1 py-0.5 rounded-full"
                  style={{ background: "oklch(0.72 0.18 35 / 0.15)", color: "oklch(0.72 0.18 35)" }}>
                  {p.mbti}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
