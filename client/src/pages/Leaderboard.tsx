import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";

const RANK_COLORS: Record<string, string> = {
  bronze: "#CD7F32", silver: "#C0C0C0", gold: "#FFD700",
  platinum: "#E5E4E2", diamond: "#B9F2FF", star: "#FFB347", king: "#FF6B35",
};

const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];

function getWeekKey() {
  const now = new Date();
  const year = now.getFullYear();
  const week = Math.ceil((now.getDate() - now.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export default function Leaderboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: leaderboard, isLoading } = trpc.game.getWeeklyLeaderboard.useQuery();
  const { data: gameState } = trpc.game.getState.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const weekKey = getWeekKey();
  const myRank = leaderboard?.findIndex((e) => e.userName === user?.name);

  return (
    <div className="min-h-screen page-content px-4 pt-safe" style={{ background: "oklch(0.10 0.025 270)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 py-4 mb-2">
        <button onClick={() => navigate("/")} className="text-muted-foreground text-xl">‹</button>
        <div>
          <h1 className="font-bold text-lg font-display">🏆 周赛排行榜</h1>
          <p className="text-xs text-muted-foreground">{weekKey} · 每周一重置</p>
        </div>
      </div>

      {/* My rank */}
      {isAuthenticated && gameState && (
        <div className="rounded-2xl p-4 mb-4"
          style={{
            background: "linear-gradient(135deg, oklch(0.72 0.18 35 / 0.1), oklch(0.16 0.03 270))",
            border: "1px solid oklch(0.72 0.18 35 / 0.3)",
          }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: "oklch(0.72 0.18 35 / 0.2)", color: "oklch(0.72 0.18 35)" }}>
              {myRank !== undefined && myRank >= 0 ? `#${myRank + 1}` : "—"}
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm">{user?.name ?? "你"}</div>
              <div className="text-xs text-muted-foreground">
                {gameState.rank?.rankName ?? "青铜剑·Ⅲ"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">本周积分</div>
              <div className="font-bold" style={{ color: "oklch(0.78 0.18 85)" }}>
                {leaderboard?.find(e => e.userName === user?.name)?.weekScore ?? 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      {leaderboard && leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-5">
          {/* 2nd place */}
          <div className="flex-1 text-center">
            <div className="text-3xl mb-1">🥈</div>
            <div className="rounded-t-xl py-4 px-2"
              style={{ background: "oklch(0.18 0.04 270)", border: "1px solid #C0C0C040" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-1"
                style={{ background: "#C0C0C020" }}>
                {leaderboard[1]?.userName?.charAt(0) ?? "?"}
              </div>
              <div className="text-xs font-bold truncate">{leaderboard[1]?.userName ?? "—"}</div>
              <div className="text-sm font-bold mt-0.5" style={{ color: "#C0C0C0" }}>
                {leaderboard[1]?.weekScore ?? 0}
              </div>
            </div>
          </div>
          {/* 1st place */}
          <div className="flex-1 text-center">
            <div className="text-4xl mb-1">🥇</div>
            <div className="rounded-t-xl py-5 px-2"
              style={{ background: "oklch(0.20 0.05 270)", border: "1px solid #FFD70060", boxShadow: "0 0 20px #FFD70020" }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-1"
                style={{ background: "#FFD70020", border: "2px solid #FFD70050" }}>
                {leaderboard[0]?.userName?.charAt(0) ?? "?"}
              </div>
              <div className="text-xs font-bold truncate">{leaderboard[0]?.userName ?? "—"}</div>
              <div className="text-base font-bold mt-0.5" style={{ color: "#FFD700" }}>
                {leaderboard[0]?.weekScore ?? 0}
              </div>
            </div>
          </div>
          {/* 3rd place */}
          <div className="flex-1 text-center">
            <div className="text-3xl mb-1">🥉</div>
            <div className="rounded-t-xl py-3 px-2"
              style={{ background: "oklch(0.18 0.04 270)", border: "1px solid #CD7F3240" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-1"
                style={{ background: "#CD7F3220" }}>
                {leaderboard[2]?.userName?.charAt(0) ?? "?"}
              </div>
              <div className="text-xs font-bold truncate">{leaderboard[2]?.userName ?? "—"}</div>
              <div className="text-sm font-bold mt-0.5" style={{ color: "#CD7F32" }}>
                {leaderboard[2]?.weekScore ?? 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full list */}
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">完整排名</h2>
      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-2 float-anim">📜</div>
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {leaderboard?.map((entry, idx) => {
            const isMe = entry.userName === user?.name;
            const rankColor = entry.rankTier ? (RANK_COLORS[entry.rankTier] ?? "#CD7F32") : "#CD7F32";
            return (
              <div key={entry.userId}
                className="rounded-xl p-3 flex items-center gap-3 transition-all"
                style={{
                  background: isMe ? "oklch(0.72 0.18 35 / 0.1)" : "oklch(0.16 0.03 270)",
                  border: `1px solid ${isMe ? "oklch(0.72 0.18 35 / 0.3)" : "oklch(0.26 0.05 270)"}`,
                }}>
                {/* Rank number */}
                <div className="w-8 text-center flex-shrink-0">
                  {idx < 3 ? (
                    <span className="text-xl">{MEDAL_EMOJIS[idx]}</span>
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: `${rankColor}20`, border: `1px solid ${rankColor}40` }}>
                  {entry.userName?.charAt(0) ?? "?"}
                </div>

                {/* Name & rank */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm truncate">{entry.userName ?? "匿名"}</span>
                    {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: "oklch(0.72 0.18 35 / 0.2)", color: "oklch(0.72 0.18 35)" }}>我</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{entry.rankTier ?? "bronze"} 段</div>
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-sm" style={{ color: "oklch(0.78 0.18 85)" }}>
                    {entry.weekScore}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {entry.weekCorrect}/{entry.weekAnswered}题
                  </div>
                </div>
              </div>
            );
          })}

          {(!leaderboard || leaderboard.length === 0) && (
            <div className="text-center py-10">
              <div className="text-4xl mb-2">📜</div>
              <p className="text-sm text-muted-foreground">本周还没有人参与，快去答题吧！</p>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
