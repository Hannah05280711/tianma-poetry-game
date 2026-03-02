import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { isVibrationSupported } from "@/lib/haptics";
import { loadLocalState, getRankByScore, updateLocalNickname, type LocalGameState } from "@/lib/localGameState";
import { toast } from "sonner";

const RANK_COLORS: Record<string, string> = {
  bronze: "#B87333", silver: "#8A8A8A", gold: "#C8960C",
  platinum: "#6B7280", diamond: "#2563EB", star: "#D97706", king: "#DC2626",
};

export default function Profile() {
  const [, navigate] = useLocation();
  const { soundEnabled, hapticEnabled, toggleSound, toggleHaptic } = useSoundSettings();
  const [localState, setLocalState] = useState<LocalGameState | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    const state = loadLocalState();
    setLocalState(state);
    setNameInput(state.nickname);
  }, []);

  // 获取本命诗人信息
  const { data: destinyPoetData } = trpc.game.getPoet.useQuery(
    { id: localState?.destinyPoetId ?? 0 },
    { enabled: (localState?.destinyPoetId ?? 0) > 0, retry: false }
  );

  const rank = localState ? getRankByScore(localState.totalScore) : null;
  const rankColor = rank ? (RANK_COLORS[rank.rankTier] ?? "#B87333") : "#B87333";
  const accuracy = localState && localState.totalAnswered > 0
    ? Math.round((localState.totalCorrect / localState.totalAnswered) * 100)
    : 0;

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { toast.error("昵称不能为空"); return; }
    updateLocalNickname(trimmed);
    setLocalState((prev) => prev ? { ...prev, nickname: trimmed } : prev);
    setEditingName(false);
    toast.success("昵称已更新");
  };

  if (!localState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-4xl float-anim">📜</div>
      </div>
    );
  }

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
          background: `linear-gradient(135deg, ${rankColor}0D 0%, var(--card) 100%)`,
          borderColor: rankColor + "35",
        }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 font-bold"
          style={{ background: rankColor + "18", border: `3px solid ${rankColor}40`, color: rankColor }}>
          {localState.nickname.charAt(0)}
        </div>

        {/* 昵称（可编辑） */}
        {editingName ? (
          <div className="flex items-center justify-center gap-2 mb-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={10}
              className="border rounded-lg px-3 py-1 text-center text-sm bg-background text-foreground"
              style={{ borderColor: "var(--border)", width: "140px" }}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            />
            <button onClick={handleSaveName}
              className="px-3 py-1 rounded-lg text-sm text-white"
              style={{ background: "var(--vermilion)" }}>
              保存
            </button>
            <button onClick={() => setEditingName(false)}
              className="px-3 py-1 rounded-lg text-sm text-muted-foreground border border-border">
              取消
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-xl font-bold font-display text-foreground">{localState.nickname}</h2>
            <button onClick={() => setEditingName(true)}
              className="text-xs text-muted-foreground px-2 py-0.5 rounded border border-border">
              改名
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-lg">{rank?.iconEmoji ?? "🗡️"}</span>
          <span className="text-sm font-semibold" style={{ color: rankColor }}>
            {rank?.rankName ?? "青铜剑·Ⅲ"}
          </span>
        </div>
        {destinyPoetData && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
            style={{ background: "var(--vermilion-pale)", color: "var(--vermilion)" }}>
            ✨ 本命诗人：{destinyPoetData.name}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "总积分", value: localState.totalScore, color: "var(--gold)", emoji: "⭐" },
          { label: "答题总数", value: localState.totalAnswered, color: "var(--celadon)", emoji: "📝" },
          { label: "答对率", value: `${accuracy}%`, color: "var(--vermilion)", emoji: "✅" },
          { label: "最高连胜", value: localState.consecutiveWins, color: "#DC2626", emoji: "🔥" },
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
            { emoji: "💡", count: localState.hintsCount, label: "提示卡", color: "var(--vermilion)" },
            { emoji: "🛡️", count: localState.shieldsCount, label: "护盾", color: "var(--celadon)" },
            { emoji: "💧", count: localState.inkDrops, label: "墨滴", color: "#2563EB" },
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
              style={{ background: soundEnabled ? "var(--vermilion)" : "var(--muted)" }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: soundEnabled ? "26px" : "2px" }}
              />
            </button>
          </div>
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
              style={{ background: hapticEnabled && isVibrationSupported() ? "var(--vermilion)" : "var(--muted)" }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: hapticEnabled && isVibrationSupported() ? "26px" : "2px" }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 数据说明 */}
      <div className="rounded-xl p-3 mb-4 border text-center"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <p className="text-xs text-muted-foreground">
          游戏数据存储在本设备浏览器中，清除浏览器缓存后数据将丢失
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
