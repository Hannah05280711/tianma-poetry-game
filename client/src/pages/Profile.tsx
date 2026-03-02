import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { isVibrationSupported } from "@/lib/haptics";
import { loadLocalState, saveLocalState, getRankByScore, updateLocalNickname, type LocalGameState } from "@/lib/localGameState";
import { toast } from "sonner";

// 随机生成诗意名号
function generateNickname(): string {
  const adjectives = ["飞花", "踏雪", "听雨", "望月", "抚琴", "煮酒", "赏梅", "问柳", "寻芳", "醉墨", "海棣", "天马", "山居", "江南", "山水"];
  const nouns = ["剑客", "书生", "侠士", "词人", "墨客", "诗仙", "才子", "雅士", "隐者", "游侠", "居士", "词客", "山人", "江客"];
  const num = Math.floor(Math.random() * 9000) + 1000;
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]!;
  const noun = nouns[Math.floor(Math.random() * nouns.length)]!;
  return `${adj}${noun}_${num}`;
}

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

  // 名号藏头诗
  const [showAcrostic, setShowAcrostic] = useState(false);
  const [acrosticPoem, setAcrosticPoem] = useState("");
  const acrosticMutation = trpc.game.generateNicknameAcrostic.useMutation({
    onSuccess: (data) => {
      setAcrosticPoem(data.acrostic);
      setShowAcrostic(true);
    },
    onError: () => toast.error("生成失败，请稍后重试"),
  });

  const handleGenerateAcrostic = () => {
    const nick = localState?.nickname ?? "";
    if (!nick) { toast.error("请先设置名号"); return; }
    acrosticMutation.mutate({ nickname: nick });
  };

  // 存档码导出
  const [showArchive, setShowArchive] = useState(false);
  const [archiveCode, setArchiveCode] = useState("");
  const [importInput, setImportInput] = useState("");
  const [importMode, setImportMode] = useState(false);

  const handleExport = () => {
    const state = loadLocalState();
    const json = JSON.stringify(state);
    const code = btoa(encodeURIComponent(json));
    setArchiveCode(code);
    setImportMode(false);
    setShowArchive(true);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(archiveCode);
      toast.success("存档码已复制到剪贴板");
    } catch {
      toast.error("复制失败，请手动长按选择复制");
    }
  };

  const handleImport = () => {
    try {
      const json = decodeURIComponent(atob(importInput.trim()));
      const parsed = JSON.parse(json) as Partial<LocalGameState>;
      if (typeof parsed.totalScore !== "number") throw new Error("格式错误");
      const current = loadLocalState();
      saveLocalState({ ...current, ...parsed });
      setLocalState(loadLocalState());
      setShowArchive(false);
      setImportInput("");
      toast.success("存档恢复成功！");
    } catch {
      toast.error("存档码无效，请检查后重试");
    }
  };

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
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-display text-foreground">{localState.nickname}</h2>
              <button onClick={() => setEditingName(true)}
                className="text-xs text-muted-foreground px-2 py-0.5 rounded border border-border">
                改名
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newNick = generateNickname();
                  updateLocalNickname(newNick);
                  setLocalState((prev) => prev ? { ...prev, nickname: newNick } : prev);
                  setNameInput(newNick);
                  toast.success(`新名号：${newNick}`);
                }}
                className="text-xs px-3 py-1 rounded-full border border-border text-muted-foreground active:scale-95 transition-all"
              >
                换一个名号
              </button>
              <button
                onClick={handleGenerateAcrostic}
                disabled={acrosticMutation.isPending}
                className="text-xs px-3 py-1 rounded-full text-white active:scale-95 transition-all disabled:opacity-60"
                style={{ background: "var(--vermilion)" }}
              >
                {acrosticMutation.isPending ? "生成中..." : "生成专属藏头诗"}
              </button>
            </div>
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

      {/* 存档码 */}
      <div className="rounded-2xl p-4 mb-4 bg-card border border-border">
        <h3 className="font-semibold text-sm mb-3 text-foreground">💾 数据备份</h3>
        <p className="text-xs text-muted-foreground mb-3">
          游戏数据存储在本设备浏览器中，清除缓存后数据将丢失。导出存档码可在换设备或清除数据后恢复进度。
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{ background: "var(--vermilion)" }}
          >
            📤 导出存档码
          </button>
          <button
            onClick={() => { setImportMode(true); setShowArchive(true); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            📥 导入存档码
          </button>
        </div>
      </div>

      {/* 存档码弹窗 */}
      {showArchive && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowArchive(false); }}
        >
          <div
            className="w-full max-w-md rounded-t-3xl p-6"
            style={{ background: "var(--background)", paddingBottom: "env(safe-area-inset-bottom, 24px)" }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
            </div>
            {!importMode ? (
              <>
                <h3 className="font-display text-lg font-bold text-foreground mb-1">📤 存档码</h3>
                <p className="text-xs text-muted-foreground mb-3">复制以下存档码，换设备后粘贴即可恢复进度</p>
                <div
                  className="rounded-xl p-3 mb-3 text-xs font-mono break-all select-all border"
                  style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)", maxHeight: "120px", overflowY: "auto", lineHeight: 1.5 }}
                >
                  {archiveCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="w-full py-3 rounded-2xl font-bold text-base text-white mb-2 transition-all active:scale-95"
                  style={{ background: "var(--vermilion)" }}
                >
                  复制存档码
                </button>
                <button onClick={() => setShowArchive(false)} className="w-full py-2 text-sm text-muted-foreground">关闭</button>
              </>
            ) : (
              <>
                <h3 className="font-display text-lg font-bold text-foreground mb-1">📥 导入存档码</h3>
                <p className="text-xs text-muted-foreground mb-3">粘贴之前导出的存档码以恢复进度（当前数据将被覆盖）</p>
                <textarea
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder="粘贴存档码..."
                  rows={4}
                  className="w-full rounded-xl px-3 py-2 text-xs font-mono border outline-none mb-3 resize-none"
                  style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
                <button
                  onClick={handleImport}
                  disabled={!importInput.trim()}
                  className="w-full py-3 rounded-2xl font-bold text-base text-white mb-2 transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: "var(--vermilion)" }}
                >
                  恢复存档
                </button>
                <button onClick={() => setShowArchive(false)} className="w-full py-2 text-sm text-muted-foreground">取消</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 藏头诗弹窗 */}
      {showAcrostic && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAcrostic(false); }}
        >
          <div
            className="w-full max-w-md rounded-t-3xl p-6"
            style={{ background: "var(--background)", paddingBottom: "env(safe-area-inset-bottom, 24px)" }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground mb-1 text-center">✨ 专属藏头诗</h3>
            <p className="text-xs text-muted-foreground mb-4 text-center">以「{localState.nickname.replace(/[^\u4e00-\u9fff]/g, "")}」为藏头，专属为你生成</p>
            <div
              className="rounded-2xl p-5 mb-4 text-center"
              style={{ background: "var(--vermilion-pale)", border: "1px solid var(--vermilion)20" }}
            >
              {acrosticPoem.split("\n").filter(Boolean).map((line, i) => (
                <div key={i} className="text-base font-display py-1" style={{ color: "var(--vermilion)" }}>
                  <span className="font-bold text-lg" style={{ color: "var(--gold)" }}>{line.charAt(0)}</span>
                  <span>{line.slice(1)}</span>
                </div>
              ))}
            </div>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(acrosticPoem);
                  toast.success("藏头诗已复制");
                } catch {
                  toast.error("复制失败，请手动选择复制");
                }
              }}
              className="w-full py-3 rounded-2xl font-bold text-base text-white mb-2 transition-all active:scale-95"
              style={{ background: "var(--vermilion)" }}
            >
              复制藏头诗
            </button>
            <button onClick={() => setShowAcrostic(false)} className="w-full py-2 text-sm text-muted-foreground">关闭</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
