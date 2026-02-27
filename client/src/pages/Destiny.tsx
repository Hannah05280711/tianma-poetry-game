import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const POET_EMOJIS: Record<string, string> = {
  "李白": "🌙", "杜甫": "📜", "王维": "🏔️", "苏轼": "🌊",
  "李清照": "🌸", "辛弃疾": "⚔️", "白居易": "🎵", "陶渊明": "🌿",
  "王昌龄": "🌅", "孟浩然": "🍃", "杜牧": "🍂", "李商隐": "🌹",
};

const MATCH_COLORS = [
  { min: 90, color: "#FF6B35", label: "天命契合" },
  { min: 75, color: "#FFD700", label: "高度共鸣" },
  { min: 60, color: "#62D2A2", label: "灵魂相近" },
  { min: 0, color: "#C0C0C0", label: "初识缘分" },
];

function getMatchInfo(score: number) {
  return MATCH_COLORS.find(c => score >= c.min) ?? MATCH_COLORS[MATCH_COLORS.length - 1]!;
}

export default function Destiny() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [generating, setGenerating] = useState(false);

  const { data: destiny, refetch } = trpc.game.getDestinyPoet.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: gameState } = trpc.game.getState.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const generateMutation = trpc.game.generateDestinyPoet.useMutation({
    onSuccess: () => {
      toast.success("✨ 本命诗人已觉醒！");
      refetch();
      setGenerating(false);
    },
    onError: (e) => {
      toast.error(e.message);
      setGenerating(false);
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    generateMutation.mutate();
  };

  const handleShare = () => {
    if (!destiny?.poet) return;
    const text = `我在天马行空诗词游戏中，发现我的本命诗人是${destiny.poet.name}！契合度${destiny.matchScore}%，段位${gameState?.rank?.rankName ?? "青铜剑"}。快来测测你的本命诗人！`;
    if (navigator.share) {
      navigator.share({ title: "天马行空·本命诗人", text });
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success("已复制分享文案"));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4"
        style={{ background: "oklch(0.10 0.025 270)" }}>
        <div className="text-5xl float-anim">✨</div>
        <p className="text-muted-foreground text-sm">请先登录发现你的本命诗人</p>
        <a href={getLoginUrl()}
          className="px-6 py-2.5 rounded-xl font-bold text-sm"
          style={{ background: "oklch(0.72 0.18 35)", color: "oklch(0.10 0.02 270)" }}>
          立即登录
        </a>
      </div>
    );
  }

  const totalAnswered = gameState?.totalAnswered ?? 0;
  const canGenerate = totalAnswered >= 10;

  return (
    <div className="min-h-screen page-content px-4 pt-safe" style={{ background: "oklch(0.10 0.025 270)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 py-4 mb-2">
        <button onClick={() => navigate("/")} className="text-muted-foreground text-xl">‹</button>
        <h1 className="font-bold text-lg font-display">✨ 本命诗人觉醒</h1>
      </div>

      {/* No destiny yet */}
      {!destiny && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4 float-anim">🌙</div>
          <h2 className="text-xl font-bold font-display mb-2">等待觉醒</h2>
          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            {canGenerate
              ? "你已答够10题，可以解锁本命诗人了！"
              : `再答 ${10 - totalAnswered} 题即可解锁本命诗人`}
          </p>
          <div className="text-xs text-muted-foreground mb-6">
            已答题：{totalAnswered} / 10
          </div>

          {/* Progress */}
          <div className="max-w-xs mx-auto mb-6">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.04 270)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (totalAnswered / 10) * 100)}%`,
                  background: "linear-gradient(90deg, oklch(0.72 0.18 35), oklch(0.78 0.18 85))",
                }} />
            </div>
          </div>

          {canGenerate ? (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all active:scale-98 disabled:opacity-50"
              style={{ background: "oklch(0.72 0.18 35)", color: "oklch(0.10 0.02 270)", boxShadow: "0 4px 20px oklch(0.72 0.18 35 / 0.4)" }}
            >
              {generating ? "✨ 觉醒中..." : "✨ 召唤本命诗人"}
            </button>
          ) : (
            <button
              onClick={() => navigate("/game")}
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all active:scale-98"
              style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}
            >
              ⚔️ 去答题
            </button>
          )}
        </div>
      )}

      {/* Destiny revealed */}
      {destiny?.poet && (() => {
        const matchInfo = getMatchInfo(destiny.matchScore);
        const poetEmoji = POET_EMOJIS[destiny.poet.name] ?? "✨";
        const poems: string[] = destiny.poet.signaturePoems ? JSON.parse(destiny.poet.signaturePoems as string) : [];
        const tags: string[] = destiny.poet.personalityTags ? JSON.parse(destiny.poet.personalityTags as string) : [];

        return (
          <div className="animate-fade-in">
            {/* Main card */}
            <div className="rounded-2xl p-5 mb-4 text-center"
              style={{
                background: `linear-gradient(135deg, ${matchInfo.color}15, oklch(0.16 0.03 270))`,
                border: `1px solid ${matchInfo.color}50`,
              }}>
              {/* Poet avatar */}
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-3 float-anim"
                style={{ background: `${matchInfo.color}20`, border: `3px solid ${matchInfo.color}60` }}>
                {poetEmoji}
              </div>

              {/* Match badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2"
                style={{ background: `${matchInfo.color}20`, color: matchInfo.color }}>
                ✨ {matchInfo.label}
              </div>

              <h2 className="text-3xl font-bold font-display mb-1" style={{ color: matchInfo.color }}>
                {destiny.poet.name}
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                {destiny.poet.dynasty}代 · {destiny.poet.mbtiType}
              </p>

              {/* Match score circle */}
              <div className="relative w-20 h-20 mx-auto mb-3">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="oklch(0.22 0.04 270)" strokeWidth="6" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke={matchInfo.color} strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - destiny.matchScore / 100)}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold" style={{ color: matchInfo.color }}>{destiny.matchScore}%</span>
                  <span className="text-[9px] text-muted-foreground">契合度</span>
                </div>
              </div>

              {/* Personality tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                  {tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${matchInfo.color}15`, color: matchInfo.color }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-sm text-muted-foreground leading-relaxed">
                {destiny.poet.mbtiDescription}
              </p>
            </div>

            {/* Analysis report */}
            {destiny.analysisReport && (
              <div className="rounded-2xl p-4 mb-4"
                style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
                <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <span>📜</span> 灵魂分析报告
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {destiny.analysisReport}
                </p>
              </div>
            )}

            {/* Acrostic poem */}
            {destiny.acrosticPoem && (
              <div className="rounded-2xl p-4 mb-4"
                style={{ background: "oklch(0.16 0.03 270)", border: `1px solid ${matchInfo.color}30` }}>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <span>🖌️</span> 专属藏头诗
                </h3>
                <div className="space-y-1">
                  {destiny.acrosticPoem.split("\n").filter(Boolean).map((line, i) => (
                    <div key={i} className="text-sm font-display leading-relaxed" style={{ color: "oklch(0.88 0.01 80)" }}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signature poems */}
            {poems.length > 0 && (
              <div className="rounded-2xl p-4 mb-4"
                style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <span>📖</span> 代表作品
                </h3>
                <div className="space-y-2">
                  {poems.slice(0, 3).map((poem, i) => (
                    <div key={i} className="text-sm text-muted-foreground italic font-display leading-relaxed border-l-2 pl-3"
                      style={{ borderColor: `${matchInfo.color}50` }}>
                      {poem}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3 mb-4">
              <button
                onClick={handleShare}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-98"
                style={{ background: `${matchInfo.color}20`, border: `1px solid ${matchInfo.color}50`, color: matchInfo.color }}
              >
                📤 分享本命诗人
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3 rounded-xl text-sm text-muted-foreground transition-all disabled:opacity-50"
                style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}
              >
                {generating ? "重新觉醒中..." : "🔄 重新觉醒（需再答10题）"}
              </button>
            </div>
          </div>
        );
      })()}

      <BottomNav />
    </div>
  );
}
