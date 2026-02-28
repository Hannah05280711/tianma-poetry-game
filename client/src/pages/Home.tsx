import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { isInMiniProgram } from "@/lib/wechatBridge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

const RANK_COLORS: Record<string, string> = {
  bronze: "#B87333", silver: "#8A8A8A", gold: "#C8960C",
  platinum: "#6B7280", diamond: "#2563EB", star: "#D97706", king: "#DC2626",
};

const POET_EMOJIS: Record<string, string> = {
  "李白": "🌙", "杜甫": "📜", "王维": "🏔️", "苏轼": "🌊",
  "李清照": "🌸", "辛弃疾": "⚔️", "白居易": "🎵", "陶渊明": "🌿",
};

// 随机诗句装饰
const BANNER_POEMS = [
  { text: "床前明月光，疑是地上霜", author: "李白" },
  { text: "春眠不觉晓，处处闻啼鸟", author: "孟浩然" },
  { text: "举头望明月，低头思故乡", author: "李白" },
  { text: "独在异乡为异客，每逢佳节倍思亲", author: "王维" },
  { text: "会当凌绝顶，一览众山小", author: "杜甫" },
  { text: "明月几时有，把酒问青天", author: "苏轼" },
];

const bannerPoem = BANNER_POEMS[Math.floor(Math.random() * BANNER_POEMS.length)]!;

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

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
          <div className="text-5xl mb-4 float-anim" style={{ fontFamily: "serif" }}>墨</div>
          <p className="text-sm text-muted-foreground font-serif-poem">墨香飘来...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-content bg-background">
      <div className="px-4 pt-safe">
        {/* Header */}
        <div className="flex items-center justify-between py-4 mb-4"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h1 className="font-display text-foreground" style={{ fontSize: "22px", letterSpacing: "0.1em" }}>
              天马行空
            </h1>
            <p className="text-xs font-serif-poem" style={{ color: "var(--ink-pale)", letterSpacing: "0.06em" }}>
              你的本命诗人是谁
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 主题切换按钮 */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-full border transition-all"
              style={{
                borderColor: "var(--border)",
                background: "var(--card)",
                color: "var(--foreground)",
              }}
              title={theme === "light" ? "切换夜读模式" : "切换日间模式"}
            >
              {theme === "light" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all"
                style={{ borderColor: "var(--border)", background: "var(--card)" }}
              >
                <span style={{ fontSize: "14px" }}>👤</span>
                <span className="text-xs max-w-[80px] truncate text-foreground">{user?.name ?? "诗词人"}</span>
              </button>
            ) : !isInMiniProgram() ? (
              <a
                href={getLoginUrl()}
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all text-white"
                style={{ background: "var(--vermilion)", letterSpacing: "0.04em" }}
              >
                登录
              </a>
            ) : null}
          </div>
        </div>

        {/* Hero Banner - 诗句装饰风格 */}
        <div
          className="relative rounded-2xl overflow-hidden mb-4 border"
          style={{
            background: "linear-gradient(135deg, oklch(0.97 0.015 28) 0%, oklch(0.98 0.010 75) 50%, oklch(0.97 0.012 190) 100%)",
            borderColor: "oklch(0.50 0.19 22 / 0.18)",
            boxShadow: "0 4px 20px oklch(0.50 0.19 22 / 0.10)",
          }}
        >
          {/* 装饰性大字 */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none"
            style={{
              fontSize: "80px",
              fontFamily: "'Noto Serif SC', serif",
              color: "oklch(0.50 0.19 22 / 0.07)",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}>
            诗
          </div>

          <div className="relative z-10 p-5">
            {/* 诗句引用 */}
            <div className="mb-4">
              <p className="font-serif-poem text-foreground mb-1"
                style={{ fontSize: "15px", color: "var(--ink-light)", letterSpacing: "0.08em" }}>
                「{bannerPoem.text}」
              </p>
              <p className="text-xs font-serif-poem" style={{ color: "var(--ink-pale)" }}>
                — {bannerPoem.author}
              </p>
            </div>

            <div className="mb-4">
              <h2 className="font-display text-foreground mb-1" style={{ fontSize: "18px", letterSpacing: "0.06em" }}>
                诗词闯关
              </h2>
              <p className="text-xs text-muted-foreground" style={{ letterSpacing: "0.04em" }}>
                答题积分 · 晋升段位 · 解锁本命诗人
              </p>
            </div>

            <button
              onClick={() => navigate("/game")}
              className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 text-white"
              style={{
                background: "var(--vermilion)",
                boxShadow: "0 4px 14px oklch(0.50 0.19 22 / 0.30)",
                letterSpacing: "0.06em",
              }}
            >
              开始答题
            </button>
          </div>
        </div>

        {/* Stats Row (if logged in) */}
        {isAuthenticated && gameState && (
          <div className="grid grid-cols-3 gap-3 mb-4 animate-slide-up">
            <div className="rounded-xl p-3 text-center border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="font-bold font-display" style={{ fontSize: "20px", color: "var(--gold)" }}>
                {gameState.totalScore}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-serif-poem">总积分</div>
            </div>
            <div className="rounded-xl p-3 text-center border"
              style={{ background: "var(--card)", borderColor: rankColor + "40" }}>
              <div className="font-bold" style={{ fontSize: "20px", color: rankColor }}>
                {gameState.rank?.iconEmoji ?? "🗡️"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 truncate font-serif-poem">
                {gameState.rank?.tierName ?? "青铜剑"}
              </div>
            </div>
            <div className="rounded-xl p-3 text-center border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="font-bold font-display" style={{ fontSize: "20px", color: "var(--celadon)" }}>
                {gameState.consecutiveWins}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-serif-poem">连胜</div>
            </div>
          </div>
        )}

        {/* Destiny Poet Card */}
        {isAuthenticated && destinyPoet?.poet && (
          <div
            className="rounded-2xl p-4 mb-4 cursor-pointer transition-all active:scale-[0.98] animate-slide-up border"
            style={{
              background: "linear-gradient(135deg, oklch(0.97 0.015 28 / 0.6), var(--card))",
              borderColor: "oklch(0.50 0.19 22 / 0.22)",
              boxShadow: "0 2px 10px oklch(0.50 0.19 22 / 0.08)",
            }}
            onClick={() => navigate("/destiny")}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  background: "var(--vermilion-pale)",
                  border: "1.5px solid oklch(0.50 0.19 22 / 0.25)",
                }}>
                {POET_EMOJIS[(destinyPoet.poet as { name: string }).name] ?? "✨"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="tag-seal"
                    style={{ background: "var(--vermilion-pale)", color: "var(--vermilion)" }}>
                    本命诗人
                  </span>
                  <span className="text-xs text-muted-foreground">{destinyPoet.matchScore}% 契合</span>
                </div>
                <div className="font-bold font-display text-foreground" style={{ fontSize: "17px" }}>
                  {(destinyPoet.poet as { name: string }).name}
                </div>
                <div className="text-xs font-serif-poem text-muted-foreground">
                  {(destinyPoet.poet as { dynasty: string; mbtiType: string }).dynasty}代 · {(destinyPoet.poet as { mbtiType: string }).mbtiType}
                </div>
              </div>
              <span className="text-muted-foreground text-lg">›</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { path: "/rank", icon: "⚔️", title: "兵器谱", desc: "查看段位系统" },
            { path: "/daily", icon: "📅", title: "每日任务", desc: "完成任务得奖励" },
            { path: "/leaderboard", icon: "🏆", title: "周赛排名", desc: "本周答题王" },
            { path: "/destiny", icon: "✨", title: "本命觉醒", desc: "发现你的诗人" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="rounded-2xl p-4 text-left transition-all active:scale-95 border"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
                boxShadow: "0 1px 4px oklch(0.14 0.025 55 / 0.04)",
              }}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-semibold text-sm text-foreground" style={{ letterSpacing: "0.04em" }}>{item.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>

        {/* Ink drops */}
        {isAuthenticated && gameState && (
          <div className="rounded-xl p-3 mb-4 flex items-center gap-3 border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <span className="text-xs font-serif-poem text-muted-foreground shrink-0">墨滴</span>
            <div className="flex gap-1 flex-1 flex-wrap">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    background: i < (gameState.inkDrops ?? 0)
                      ? "var(--celadon)"
                      : "var(--border)",
                  }}
                />
              ))}
            </div>
            <span className="text-sm font-bold shrink-0 font-display" style={{ color: "var(--celadon)" }}>
              {gameState.inkDrops}/20
            </span>
          </div>
        )}

        {/* Login tip */}
        {!isAuthenticated && !isInMiniProgram() && (
          <div className="rounded-xl p-3 mb-4 flex items-center gap-3 border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <span className="text-lg">💡</span>
            <p className="text-xs text-muted-foreground flex-1">登录后可保存积分、解锁本命诗人</p>
            <a href={getLoginUrl()}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold flex-shrink-0 text-white"
              style={{ background: "var(--vermilion)", letterSpacing: "0.04em" }}>
              登录
            </a>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
