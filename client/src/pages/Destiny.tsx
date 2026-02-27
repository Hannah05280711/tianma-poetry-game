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
  "贺知章": "🍶", "张若虚": "🌕", "王之涣": "🦅", "岑参": "❄️",
  "高适": "🏹", "韦应物": "🍵", "刘禹锡": "🪷", "柳宗元": "🐟",
  "元稹": "💌", "韩愈": "📚", "温庭筠": "🎶", "李煜": "😢",
  "冯延巳": "🌫️", "花蕊夫人": "🌺", "韦庄": "🍁", "欧阳修": "🎯",
  "晏殊": "🎴", "柳永": "🌧️", "晏几道": "🌷", "秦观": "🌙",
  "黄庭坚": "🖌️", "周邦彦": "🎻", "陆游": "🗡️", "范成大": "🌾",
  "杨万里": "☀️", "朱熹": "📖", "姜夔": "🎵", "吴文英": "🌀",
  "关汉卿": "🎭", "马致远": "🍂", "张养浩": "⚖️", "萨都剌": "🌊",
  "白朴": "🎪", "郑光祖": "🎨", "王实甫": "💕", "乔吉": "🌸",
  "刘基": "🔮", "归有光": "🏠", "汤显祖": "🎭", "袁宏道": "🌿",
  "徐渭": "🖊️", "王世贞": "📜", "纳兰性德": "❄️", "蒲松龄": "👻",
  "龚自珍": "🌋", "梁启超": "🔥",
};

const MATCH_COLORS = [
  { min: 90, color: "#C0392B", bg: "#FEF2F2", label: "天命契合" },
  { min: 75, color: "#C8960C", bg: "#FFFBEB", label: "高度共鸣" },
  { min: 60, color: "#16A34A", bg: "#F0FDF4", label: "灵魂相近" },
  { min: 0,  color: "#6B7280", bg: "#F9FAFB", label: "初识缘分" },
];

function getMatchInfo(score: number) {
  return MATCH_COLORS.find(c => score >= c.min) ?? MATCH_COLORS[MATCH_COLORS.length - 1]!;
}

// 安全解析 JSON 字段（可能已是数组，也可能是字符串）
function safeParseArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
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
      toast.error("召唤失败：" + e.message);
      setGenerating(false);
    },
  });

  const handleGenerate = () => {
    setGenerating(true);
    generateMutation.mutate();
  };

  const GAME_URL = "https://tianmapoet-4lhgiefm.manus.space";

  const handleShare = () => {
    if (!destiny?.poet) return;
    const poetName = (destiny.poet as { name: string }).name;
    const rankName = gameState?.rank?.rankName ?? "青铜剑";
    const emoji = POET_EMOJIS[poetName] ?? "📜";
    const shareText = [
      `${emoji} 我的本命诗人是「${poetName}」！`,
      `灵魂契合度 ${destiny.matchScore}%，当前段位「${rankName}」`,
      ``,
      `🎮 天马行空·你的本命诗人是谁？`,
      `答题闯关·诗词测试·天命匹配`,
      GAME_URL,
    ].join("\n");
    if (navigator.share) {
      navigator.share({
        title: "天马行空·你的本命诗人是谁",
        text: shareText,
        url: GAME_URL,
      }).catch(() => {
        // 用户取消分享时降级到复制
        navigator.clipboard.writeText(shareText).then(() => toast.success("分享文案已复制！可粘贴到微信发送给好友"));
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() =>
        toast.success("分享文案已复制！可粘贴到微信发送给好友", { duration: 4000 })
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4 bg-background">
        <div className="text-5xl float-anim">✨</div>
        <p className="text-sm text-muted-foreground text-center">请先登录，发现你的本命诗人</p>
        <a href={getLoginUrl()}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: "var(--vermilion)", color: "white" }}>
          立即登录
        </a>
        <button onClick={() => navigate("/")} className="text-sm text-muted-foreground underline">
          返回首页
        </button>
      </div>
    );
  }

  const totalAnswered = gameState?.totalAnswered ?? 0;
  const canGenerate = totalAnswered >= 10;

  return (
    <div className="min-h-screen page-content px-4 pt-2 bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 mb-2">
        <button onClick={() => navigate("/")} className="text-muted-foreground text-xl leading-none">‹</button>
        <h1 className="font-semibold text-base font-display">✨ 本命诗人觉醒</h1>
      </div>

      {/* No destiny yet */}
      {!destiny && (
        <div className="text-center py-10">
          <div className="text-6xl mb-4 float-anim">🌙</div>
          <h2 className="text-lg font-semibold font-display mb-2 text-foreground">等待觉醒</h2>
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
            <div className="h-2 rounded-full overflow-hidden bg-muted">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (totalAnswered / 10) * 100)}%`,
                  background: "linear-gradient(90deg, var(--vermilion), #E74C3C)",
                }} />
            </div>
          </div>

          {canGenerate ? (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-8 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 text-white"
              style={{ background: "var(--vermilion)", boxShadow: "0 4px 16px oklch(0.55 0.20 25 / 0.30)" }}
            >
              {generating ? "✨ 觉醒中..." : "✨ 召唤本命诗人"}
            </button>
          ) : (
            <button
              onClick={() => navigate("/game")}
              className="px-8 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 border border-border text-foreground bg-card"
            >
              ⚔️ 去答题
            </button>
          )}
        </div>
      )}

      {/* Destiny revealed */}
      {destiny?.poet && (() => {
        const poet = destiny.poet as {
          name: string; dynasty: string; mbtiType: string;
          mbtiDescription: string; personalityTags: unknown; signaturePoems: unknown;
        };
        const matchInfo = getMatchInfo(destiny.matchScore);
        const poetEmoji = POET_EMOJIS[poet.name] ?? "✨";
        // 安全解析 JSON 字段（修复 bug：字段可能已是数组）
        const poems = safeParseArray(poet.signaturePoems);
        const tags  = safeParseArray(poet.personalityTags);

        return (
          <div className="animate-fade-in">
            {/* Main card */}
            <div className="rounded-2xl p-5 mb-4 text-center border"
              style={{ background: matchInfo.bg, borderColor: matchInfo.color + "40" }}>
              {/* Poet avatar */}
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-3 float-anim"
                style={{ background: matchInfo.color + "15", border: `2px solid ${matchInfo.color}50` }}>
                {poetEmoji}
              </div>

              {/* Match badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2"
                style={{ background: matchInfo.color + "15", color: matchInfo.color }}>
                ✨ {matchInfo.label}
              </div>

              <h2 className="text-2xl font-bold font-display mb-0.5" style={{ color: matchInfo.color }}>
                {poet.name}
              </h2>
              <p className="text-xs text-muted-foreground mb-3">
                {poet.dynasty}代 · {poet.mbtiType}
              </p>

              {/* Match score circle */}
              <div className="relative w-18 h-18 mx-auto mb-3" style={{ width: 72, height: 72 }}>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="28" fill="none" stroke={matchInfo.color + "20"} strokeWidth="5" />
                  <circle cx="36" cy="36" r="28" fill="none" stroke={matchInfo.color} strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - destiny.matchScore / 100)}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-bold" style={{ color: matchInfo.color }}>{destiny.matchScore}%</span>
                  <span className="text-[9px] text-muted-foreground">契合度</span>
                </div>
              </div>

              {/* Personality tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                  {tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: matchInfo.color + "12", color: matchInfo.color }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-sm text-muted-foreground leading-relaxed">
                {poet.mbtiDescription}
              </p>
            </div>

            {/* Analysis report */}
            {destiny.analysisReport && (
              <div className="rounded-xl p-4 mb-4 bg-card border border-border">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 text-foreground">
                  <span>📜</span> 灵魂分析报告
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {destiny.analysisReport}
                </p>
              </div>
            )}

            {/* Acrostic poem */}
            {destiny.acrosticPoem && (
              <div className="rounded-xl p-4 mb-4 bg-card border"
                style={{ borderColor: matchInfo.color + "30" }}>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-foreground">
                  <span>🖌️</span> 专属藏头诗
                </h3>
                <div className="space-y-1">
                  {destiny.acrosticPoem.split("\n").filter(Boolean).map((line, i) => (
                    <div key={i} className="text-sm font-display leading-relaxed text-foreground">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signature poems */}
            {poems.length > 0 && (
              <div className="rounded-xl p-4 mb-4 bg-card border border-border">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-foreground">
                  <span>📖</span> 代表作品
                </h3>
                <div className="space-y-2">
                  {poems.slice(0, 3).map((poem, i) => (
                    <div key={i} className="text-sm text-muted-foreground italic font-display leading-relaxed border-l-2 pl-3"
                      style={{ borderColor: matchInfo.color + "50" }}>
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
                className="w-full py-3.5 rounded-xl font-semibold transition-all active:scale-95"
                style={{ background: "#07C160", color: "white", fontSize: "16px", minHeight: "52px" }}
              >
                📱 分享到微信
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3.5 rounded-xl text-muted-foreground transition-all disabled:opacity-50 bg-card border border-border"
                style={{ fontSize: "15px", minHeight: "48px" }}
              >
                {generating ? "重新觉醒中..." : "🔄 重新觉醒（需再等10题）"}
              </button>
            </div>
          </div>
        );
      })()}

      <BottomNav />
    </div>
  );
}
