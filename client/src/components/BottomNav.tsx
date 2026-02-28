import { useLocation } from "wouter";

// SVG 图标组件（国风线条风格）
function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  );
}

function IconSword({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2.5L21 9l-9 9-1.5-1.5"/>
      <path d="M3 21l4-4"/>
      <path d="M5 19l-2 2"/>
      <path d="M9.5 14.5L5 19"/>
      <path d="M14.5 2.5L3 14l2 2 9.5-9.5"/>
    </svg>
  );
}

function IconCalendar({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </svg>
  );
}

function IconTrophy({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4"/>
      <path d="M7 4H4v4c0 2.2 1.8 4 4 4"/>
      <path d="M17 4h3v4c0 2.2-1.8 4-4 4"/>
      <path d="M7 4h10v6c0 2.8-2.2 5-5 5s-5-2.2-5-5V4z"/>
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}

const navItems = [
  { path: "/", label: "主页", Icon: IconHome },
  { path: "/game", label: "答题", Icon: IconSword },
  { path: "/daily", label: "任务", Icon: IconCalendar },
  { path: "/leaderboard", label: "排行", Icon: IconTrophy },
  { path: "/profile", label: "我的", Icon: IconUser },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50"
      style={{
        background: "oklch(0.99 0.005 75 / 0.97)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--border)",
        boxShadow: "0 -2px 16px oklch(0.14 0.025 55 / 0.06)",
      }}
    >
      <div
        className="flex items-center justify-around px-2"
        style={{ paddingTop: "8px", paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
      >
        {navItems.map(({ path, label, Icon }) => {
          const isActive = location === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200"
              style={{
                color: isActive ? "var(--vermilion)" : "var(--ink-pale)",
                background: isActive ? "var(--vermilion-pale)" : "transparent",
                minWidth: "52px",
              }}
            >
              <Icon active={isActive} />
              <span
                className="leading-none font-serif-poem"
                style={{ fontSize: "10px", fontWeight: isActive ? 600 : 400 }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
