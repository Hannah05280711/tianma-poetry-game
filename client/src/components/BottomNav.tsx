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
        background: "oklch(0.12 0.03 270 / 0.95)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid oklch(0.26 0.05 270)",
      }}
    >
      <div className="flex items-center justify-around px-2 pb-safe" style={{ paddingTop: "8px", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
              style={{
                color: isActive ? "oklch(0.72 0.18 35)" : "oklch(0.55 0.05 80)",
                background: isActive ? "oklch(0.72 0.18 35 / 0.12)" : "transparent",
                minWidth: "52px",
              }}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium leading-none mt-0.5">{item.label}</span>
              {isActive && (
                <div
                  className="absolute bottom-0 w-1 h-1 rounded-full"
                  style={{ background: "oklch(0.72 0.18 35)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
