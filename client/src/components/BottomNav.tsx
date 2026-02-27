import { useLocation } from "wouter";

const navItems = [
  { path: "/", icon: "🏠", label: "主页" },
  { path: "/game", icon: "⚔️", label: "答题" },
  { path: "/daily", icon: "📅", label: "任务" },
  { path: "/leaderboard", icon: "🏆", label: "排行" },
  { path: "/profile", icon: "👤", label: "我的" },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50"
      style={{
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid oklch(0.90 0.01 80)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="flex items-center justify-around px-2"
        style={{ paddingTop: "8px", paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
      >
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
              style={{
                color: isActive ? "var(--vermilion)" : "oklch(0.55 0.02 270)",
                background: isActive ? "var(--vermilion-pale)" : "transparent",
                minWidth: "52px",
              }}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium leading-none mt-0.5"
                style={{ fontFamily: "'PingFang SC', sans-serif" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
