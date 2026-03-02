import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";
import { loadLocalState, getRankByScore } from "@/lib/localGameState";

const RANK_COLORS: Record<string, string> = {
  bronze: "#B87333", silver: "#8A8A8A", gold: "#C8960C",
  platinum: "#6B7280", diamond: "#2563EB", star: "#D97706", king: "#DC2626",
};

const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];

function getWeekKey() {
  const now = new Date();
  const year = now.getFullYear();
  const week = Math.ceil((now.getDate() - now.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export default function Leaderboard() {
  const [, navigate] = useLocation();
  const [localNickname, setLocalNickname] = useState("我");
  const [localWeekScore, setLocalWeekScore] = useState(0);
  const [localRankName, setLocalRankName] = useState("青铜剑·Ⅲ");
  const [localRankTier, setLocalRankTier] = useState("bronze");

  useEffect(() => {
    const state = loadLocalState();
    setLocalNickname(state.nickname);
    setLocalWeekScore(state.weeklyScore ?? 0);
    const rank = getRankByScore(state.totalScore);
    setLocalRankName(rank.rankName);
    setLocalRankTier(rank.rankTier);
  }, []);

  const { data: leaderboard, isLoading } = trpc.game.getWeeklyLeaderboard.useQuery();

  const weekKey = getWeekKey();

  return (
    <div className="min-h-screen page-content px-4 pt-safe bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 mb-2 border-b border-border">
        <button onClick={() => navigate("/")} className="text-muted-foreground text-xl leading-none">‹</button>
        <div>
          <h1 className="font-semibold text-base font-display text-foreground">🏆 周赛排行榜</h1>
          <p className="text-xs text-muted-foreground">{weekKey} · 每周一重置</p>
        </div>
      </div>

      {/* 本地用户本周积分 */}
      <div className="rounded-2xl p-4 mb-4 border"
        style={{
          background: "linear-gradient(135deg, var(--vermilion-pale) 0%, var(--card) 100%)",
          borderColor: "oklch(0.55 0.20 25 / 0.22)",
        }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm"
            style={{ background: "var(--vermilion-pale)", color: "var(--vermilion)" }}>
            我
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-foreground">{localNickname}</div>
            <div className="text-xs text-muted-foreground">{localRankName}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">本周积分</div>
            <div className="font-bold" style={{ color: "var(--gold)" }}>
              {localWeekScore}
            </div>
          </div>
        </div>
        {localWeekScore === 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            去答题积累本周积分，上榜需登录账号
          </p>
        )}
      </div>

      {/* Top 3 podium */}
      {leaderboard && leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-5">
          {/* 2nd place */}
          <div className="flex-1 text-center">
            <div className="text-3xl mb-1">🥈</div>
            <div className="rounded-t-xl py-4 px-2 border border-b-0"
              style={{ background: "var(--card)", borderColor: "#8A8A8A30" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-1 font-semibold bg-muted text-foreground">
                {leaderboard[1]?.userName?.charAt(0) ?? "?"}
              </div>
              <div className="text-xs font-semibold truncate text-foreground">{leaderboard[1]?.userName ?? "—"}</div>
              <div className="text-sm font-bold mt-0.5" style={{ color: "#8A8A8A" }}>
                {leaderboard[1]?.weekScore ?? 0}
              </div>
            </div>
          </div>
          {/* 1st place */}
          <div className="flex-1 text-center">
            <div className="text-4xl mb-1">🥇</div>
            <div className="rounded-t-xl py-5 px-2 border border-b-0"
              style={{ background: "#FFFBF0", borderColor: "#C8960C50", boxShadow: "0 -4px 16px #C8960C18" }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-1 font-bold"
                style={{ background: "#C8960C18", border: "2px solid #C8960C40", color: "#C8960C" }}>
                {leaderboard[0]?.userName?.charAt(0) ?? "?"}
              </div>
              <div className="text-xs font-semibold truncate text-foreground">{leaderboard[0]?.userName ?? "—"}</div>
              <div className="text-base font-bold mt-0.5" style={{ color: "#C8960C" }}>
                {leaderboard[0]?.weekScore ?? 0}
              </div>
            </div>
          </div>
          {/* 3rd place */}
          <div className="flex-1 text-center">
            <div className="text-3xl mb-1">🥉</div>
            <div className="rounded-t-xl py-3 px-2 border border-b-0"
              style={{ background: "var(--card)", borderColor: "#B8733330" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-1 font-semibold bg-muted text-foreground">
                {leaderboard[2]?.userName?.charAt(0) ?? "?"}
              </div>
              <div className="text-xs font-semibold truncate text-foreground">{leaderboard[2]?.userName ?? "—"}</div>
              <div className="text-sm font-bold mt-0.5" style={{ color: "#B87333" }}>
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
            const rankColor = entry.rankTier ? (RANK_COLORS[entry.rankTier] ?? "#B87333") : "#B87333";
            return (
              <div key={entry.userId}
                className="rounded-xl p-3 flex items-center gap-3 transition-all border"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                }}>
                <div className="w-8 text-center flex-shrink-0">
                  {idx < 3 ? (
                    <span className="text-xl">{MEDAL_EMOJIS[idx]}</span>
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">#{idx + 1}</span>
                  )}
                </div>

                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 font-semibold"
                  style={{ background: rankColor + "18", border: `1px solid ${rankColor}35`, color: rankColor }}>
                  {entry.userName?.charAt(0) ?? "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate text-foreground">{entry.userName ?? "匿名"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{entry.rankTier ?? "bronze"} 段</div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-sm" style={{ color: "var(--gold)" }}>
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
