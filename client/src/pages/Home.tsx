import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";
import { useTheme } from "@/contexts/ThemeContext";
import { loadLocalState, getRankByScore, type LocalGameState } from "@/lib/localGameState";
import WelcomeModal from "@/components/WelcomeModal";
import { getTodayDisplay, getUpcomingEvents, type CalendarEvent } from "@/lib/calendarData";
import { isLanternFestivalSeason, shouldShowLanternEgg } from "@/lib/lanternRiddleData";

const RANK_COLORS: Record<string, string> = {
  bronze: "#B87333", silver: "#8A8A8A", gold: "#C8960C",
  platinum: "#6B7280", diamond: "#2563EB", star: "#D97706", king: "#DC2626",
};

const POET_EMOJIS: Record<string, string> = {
  "李白": "🌙", "杜甫": "📜", "王维": "🏔️", "苏轼": "🌊",
  "李清照": "🌸", "辛弃疾": "⚔️", "白居易": "🎵", "陶渊明": "🌿",
};

export default function Home() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [localState, setLocalState] = useState<LocalGameState | null>(null);

  // 今日日历信息（节气/节日/诗人纪念日）
  const todayDisplay = useMemo(() => getTodayDisplay(), []);
  const upcomingEvents = useMemo(() => getUpcomingEvents(5), []);

  // 加载本地状态
  useEffect(() => {
    setLocalState(loadLocalState());
  }, []);

  // 每次页面获得焦点时刷新本地状态（从游戏页返回后更新数据）
  useEffect(() => {
    const handleFocus = () => setLocalState(loadLocalState());
    window.addEventListener("focus", handleFocus);
    const handleVisible = () => {
      if (document.visibilityState === "visible") setLocalState(loadLocalState());
    };
    document.addEventListener("visibilitychange", handleVisible);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, []);

  // 获取本命诗人信息
  const { data: destinyPoetData } = trpc.game.getPoet.useQuery(
    { id: localState?.destinyPoetId ?? 0 },
    { enabled: (localState?.destinyPoetId ?? 0) > 0, retry: false }
  );
  const destinyPoet = destinyPoetData ? { poet: destinyPoetData } : null;

  const rank = localState ? getRankByScore(localState.totalScore) : null;
  const rankColor = rank ? RANK_COLORS[rank.rankTier] ?? "#B87333" : "#B87333";

  // 节日主题答题：跳转到游戏并传入主题标签
  const handleThemeGame = (themeTag: string) => {
    navigate(`/game?theme=${encodeURIComponent(themeTag)}`);
  };

  // 是否是元宵节当天（正月十五前后）
  const isLanternDay = useMemo(() => shouldShowLanternEgg(), []);

  return (
    <div className="min-h-screen page-content bg-background">
      <WelcomeModal />
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
            {/* 个人主页按钮 */}
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}
            >
              <span style={{ fontSize: "14px" }}>👤</span>
              <span className="text-xs max-w-[80px] truncate text-foreground">
                {localState?.nickname ?? "诗词侠客"}
              </span>
            </button>
          </div>
        </div>

        {/* ===== 节日/节气 Hero Banner ===== */}
        {(() => {
          // 元宵节使用深色灯笼风格，其他节日使用原有浅色风格
          const isDarkBanner = isLanternDay && todayDisplay.name === "元宵节";
          const bannerTextColor = isDarkBanner ? "#FFD700" : todayDisplay.color;
          const bannerSubColor = isDarkBanner ? "#FFA040" : todayDisplay.color;
          const bannerMutedColor = isDarkBanner ? "rgba(255,200,100,0.7)" : "var(--ink-pale)";
          const bannerSubtitleColor = isDarkBanner ? "rgba(255,180,80,0.8)" : undefined;
          return (
            <div
              className="relative rounded-2xl overflow-hidden mb-4 border"
              style={{
                background: todayDisplay.bgGradient,
                borderColor: isDarkBanner ? "rgba(255,200,50,0.5)" : todayDisplay.color + "30",
                boxShadow: isDarkBanner
                  ? "0 4px 24px rgba(232,69,69,0.35), 0 0 40px rgba(255,150,0,0.1)"
                  : `0 4px 20px ${todayDisplay.color}15`,
              }}
            >
              {/* 装饰性大字 */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 select-none pointer-events-none"
                style={{
                  fontSize: isDarkBanner ? "90px" : "72px",
                  fontFamily: "'Noto Serif SC', serif",
                  color: isDarkBanner ? "rgba(255,200,50,0.12)" : todayDisplay.color + "10",
                  fontWeight: 900,
                  lineHeight: 1,
                }}>
                {todayDisplay.emoji}
              </div>
              {/* 元宵节额外装饰 */}
              {isDarkBanner && (
                <div className="absolute left-3 bottom-3 select-none pointer-events-none text-4xl" style={{ opacity: 0.15 }}>🏮</div>
              )}

              <div className="relative z-10 p-5">
                {/* 节日/节气标签 */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: isDarkBanner ? "rgba(255,200,50,0.2)" : todayDisplay.color + "15",
                      color: bannerTextColor,
                      border: isDarkBanner ? "1px solid rgba(255,200,50,0.4)" : `1px solid ${todayDisplay.color}30`,
                      fontFamily: "Huiwen-MinchoGBK, 'Noto Serif SC', serif",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {todayDisplay.emoji} {todayDisplay.name}
                  </span>
                  <span className="text-xs" style={{ color: isDarkBanner ? "rgba(255,200,100,0.6)" : "var(--muted-foreground)" }}>
                    {todayDisplay.dateDesc}
                  </span>
                  {isDarkBanner && (
                    <span className="text-xs px-2 py-0.5 rounded-full animate-pulse"
                      style={{ background: "rgba(232,69,69,0.3)", color: "#FF8C00", border: "1px solid rgba(232,69,69,0.4)" }}>
                      正月十五
                    </span>
                  )}
                </div>

                {/* 诗句引用 */}
                <div className="mb-4">
                  <p className="font-serif-poem mb-1"
                    style={{ fontSize: "15px", color: bannerSubColor, letterSpacing: "0.08em", lineHeight: 1.7 }}>
                    「{todayDisplay.poem.length > 28 ? todayDisplay.poem.slice(0, 28) + "…" : todayDisplay.poem}」
                  </p>
                  <p className="text-xs font-serif-poem" style={{ color: bannerMutedColor }}>
                    —— {todayDisplay.poemAuthor}
                  </p>
                </div>

                {/* 副标题 */}
                <p className="text-xs mb-4" style={{ letterSpacing: "0.04em", color: bannerSubtitleColor ?? "var(--muted-foreground)" }}>
                  {todayDisplay.subtitle}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate("/game")}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 text-white"
                    style={{
                      background: isDarkBanner ? "linear-gradient(135deg, #E84545, #FF8C00)" : todayDisplay.color,
                      boxShadow: isDarkBanner ? "0 4px 14px rgba(232,69,69,0.5)" : `0 4px 14px ${todayDisplay.color}40`,
                      letterSpacing: "0.06em",
                    }}
                  >
                    开始答题
                  </button>
                  {/* 节日主题专题按鈕 */}
                  <button
                    onClick={() => isDarkBanner ? navigate("/lantern-riddle") : handleThemeGame(todayDisplay.themeTag)}
                    className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 border"
                    style={{
                      background: "transparent",
                      borderColor: isDarkBanner ? "rgba(255,200,50,0.5)" : todayDisplay.color + "50",
                      color: bannerTextColor,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {isDarkBanner ? "🏮 猜灯谜" : `${todayDisplay.name}专题`}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Stats Row */}
        {localState && (
          <div className="grid grid-cols-3 gap-3 mb-4 animate-slide-up">
            <div className="rounded-xl p-3 text-center border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="font-bold font-display" style={{ fontSize: "20px", color: "var(--gold)" }}>
                {localState.totalScore}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-serif-poem">总积分</div>
            </div>
            <div className="rounded-xl p-3 text-center border"
              style={{ background: "var(--card)", borderColor: rankColor + "40" }}>
              <div className="font-bold" style={{ fontSize: "20px", color: rankColor }}>
                {rank?.iconEmoji ?? "🗡️"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 truncate font-serif-poem">
                {rank?.tierName ?? "青铜剑"}
              </div>
            </div>
            <div className="rounded-xl p-3 text-center border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="font-bold font-display" style={{ fontSize: "20px", color: "var(--celadon)" }}>
                {localState.consecutiveWins}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-serif-poem">连胜</div>
            </div>
          </div>
        )}

        {/* Destiny Poet Card */}
        {localState?.destinyPoetId && destinyPoet?.poet && (
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
                  <span className="text-xs text-muted-foreground">{localState.destinyMatchScore}% 契合</span>
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

        {/* 未解锁本命诗人时的引导提示 */}
        {localState && !localState.destinyPoetId && (
          <div
            className="rounded-2xl p-4 mb-4 border cursor-pointer transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, oklch(0.97 0.015 28 / 0.4), var(--card))",
              borderColor: "oklch(0.50 0.19 22 / 0.15)",
              borderStyle: "dashed",
            }}
            onClick={() => navigate("/destiny")}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "var(--secondary)", border: "1.5px dashed var(--border)" }}>
                ✨
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground mb-0.5">本命诗人尚未觉醒</div>
                <div className="text-xs text-muted-foreground">
                  {localState.totalAnswered < 100
                    ? `再答 ${100 - localState.totalAnswered} 题即可解锁`
                    : "点击前往解锁你的本命诗人"}
                </div>
              </div>
              <span className="text-muted-foreground text-lg">›</span>
            </div>
          </div>
        )}

        {/* ===== 即将到来的节日/节气预告 ===== */}
        {upcomingEvents.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-muted-foreground font-serif-poem">📅 近期节日节气</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {upcomingEvents.slice(0, 4).map((ev, i) => (
                <button
                  key={i}
                  onClick={() => handleThemeGame(ev.themeTag)}
                  className="flex-shrink-0 rounded-xl px-3 py-2.5 text-center border transition-all active:scale-95"
                  style={{
                    background: ev.bgGradient,
                    borderColor: ev.color + "30",
                    minWidth: "80px",
                  }}
                >
                  <div className="text-xl mb-1">{ev.emoji}</div>
                  <div className="text-xs font-semibold" style={{ color: ev.color, letterSpacing: "0.04em" }}>
                    {ev.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {ev.daysUntil === 1 ? "明天" : `${ev.daysUntil}天后`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 诗词灯谜馆常驻入口 */}
        {isLanternFestivalSeason() && (
          <button
            onClick={() => navigate("/lantern-riddle")}
            className="w-full rounded-2xl p-4 mb-4 text-left transition-all active:scale-[0.98] relative overflow-hidden"
            style={{
              background: isLanternDay
                ? "linear-gradient(135deg, #2A0A00 0%, #5A1A00 40%, #8B2500 70%, #5A1A00 100%)"
                : "linear-gradient(135deg, #1A0A00 0%, #3D1500 50%, #1A0A00 100%)",
              border: isLanternDay ? "1px solid rgba(255,200,50,0.7)" : "1px solid rgba(255,200,50,0.4)",
              boxShadow: isLanternDay
                ? "0 4px 24px rgba(232,69,69,0.45), 0 0 40px rgba(255,150,0,0.15)"
                : "0 4px 20px rgba(232,69,69,0.25)",
            }}
          >
            {/* 背景装饰灯笼 */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 select-none"
              style={{ fontSize: isLanternDay ? "80px" : "64px", opacity: isLanternDay ? 0.25 : 0.2 }}>🏮</div>
            {/* 元宵节当天额外装饰灯笼 */}
            {isLanternDay && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 select-none" style={{ fontSize: "40px", opacity: 0.2 }}>🏮</div>
            )}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">🏮</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: isLanternDay ? "rgba(255,200,50,0.3)" : "rgba(255,200,50,0.2)",
                    color: "#FFD700",
                    border: isLanternDay ? "1px solid rgba(255,200,50,0.6)" : "1px solid rgba(255,200,50,0.3)",
                  }}>
                  {isLanternDay ? "🏮 元宵节当天" : "元宵节彩蛋"}
                </span>
                {isLanternDay && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold animate-pulse"
                    style={{ background: "rgba(232,69,69,0.3)", color: "#FF8C00", border: "1px solid rgba(232,69,69,0.5)" }}>
                    今日开放
                  </span>
                )}
              </div>
              <div className="font-bold text-base mb-0.5" style={{ color: "#FFD700", letterSpacing: "0.08em", fontSize: isLanternDay ? "18px" : "16px" }}>
                诗词灯谜馆
              </div>
              <div className="text-xs" style={{ color: isLanternDay ? "#FFA040CC" : "#FFA04099" }}>
                {isLanternDay
                  ? "正月十五元宵夜 · 灯谜大会正式开始！"
                  : "传统文化趣味问答 · 诗词文字典故"}
              </div>
            </div>
          </button>
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
        {localState && (
          <div className="rounded-xl p-3 mb-4 flex items-center gap-3 border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <span className="text-xs font-serif-poem text-muted-foreground shrink-0">墨滴</span>
            <div className="flex gap-1 flex-1 flex-wrap">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    background: i < (localState.inkDrops ?? 0)
                      ? "var(--celadon)"
                      : "var(--border)",
                  }}
                />
              ))}
            </div>
            <span className="text-sm font-bold shrink-0 font-display" style={{ color: "var(--celadon)" }}>
              {localState.inkDrops}/20
            </span>
          </div>
        )}

        {/* 答题统计 */}
        {localState && localState.totalAnswered > 0 && (
          <div className="rounded-xl p-3 mb-4 border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif-poem text-muted-foreground">答题统计</span>
              <span className="text-xs text-muted-foreground">
                正确率 {localState.totalAnswered > 0
                  ? Math.round(localState.totalCorrect / localState.totalAnswered * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex gap-4 mt-2">
              <div className="text-center">
                <div className="font-bold text-sm font-display" style={{ color: "var(--ink)" }}>
                  {localState.totalAnswered}
                </div>
                <div className="text-[10px] text-muted-foreground">总答题</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-sm font-display" style={{ color: "var(--celadon)" }}>
                  {localState.totalCorrect}
                </div>
                <div className="text-[10px] text-muted-foreground">答对</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-sm font-display" style={{ color: "var(--gold)" }}>
                  {localState.totalAnswered - localState.totalCorrect}
                </div>
                <div className="text-[10px] text-muted-foreground">答错</div>
              </div>
            </div>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  );
}
