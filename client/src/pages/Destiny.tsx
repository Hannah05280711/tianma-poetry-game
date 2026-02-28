import { useState, useEffect } from "react";
import { fbDestinyMatch, unlockAudio } from "@/lib/feedback";
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
  "龚自珍": "🌋", "梁启超": "🔥", "曹操": "⚔️", "屈原": "🌊", "李璟": "🌙",
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

// 游客答题统计存储键
const GUEST_STATS_KEY = "tianma_guest_stats";

interface GuestStats {
  totalAnswered: number;
  totalCorrect: number;
  poetCorrectMap: Record<string, number>;
  typePreferMap: Record<string, number>;
  avgResponseTime: number;
}

function loadGuestStats(): GuestStats {
  try {
    const raw = localStorage.getItem(GUEST_STATS_KEY);
    if (raw) return JSON.parse(raw) as GuestStats;
  } catch { /* ignore */ }
  return { totalAnswered: 0, totalCorrect: 0, poetCorrectMap: {}, typePreferMap: {}, avgResponseTime: 5.0 };
}

const GAME_URL = "https://tianmapoet-4lhgiefm.manus.space";

// 本命诗人结果类型（游客模式下本地存储）
interface DestinyResult {
  id: number;
  userId: number;
  poetId: number;
  matchScore: number;
  analysisReport: string | null;
  acrosticPoem: string | null;
  shareCount: number;
  generatedAt: Date | string;
  updatedAt: Date | string;
  poet: {
    name: string; dynasty: string; mbtiType: string;
    mbtiDescription: string; personalityTags: unknown; signaturePoems: unknown;
  } | null;
}

export default function Destiny() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [generating, setGenerating] = useState(false);
  const [showShareGuide, setShowShareGuide] = useState(false);
  // 游客模式下的本地结果
  const [guestDestiny, setGuestDestiny] = useState<DestinyResult | null>(null);
  const [guestStats, setGuestStats] = useState<GuestStats>(() => loadGuestStats());

  // 刷新游客统计
  useEffect(() => {
    if (!isAuthenticated) {
      setGuestStats(loadGuestStats());
    }
  }, [isAuthenticated]);

  // 已登录用户：从服务器获取本命诗人
  const { data: serverDestiny, refetch } = trpc.game.getDestinyPoet.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: gameState } = trpc.game.getState.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const generateMutation = trpc.game.generateDestinyPoet.useMutation({
    onSuccess: (data) => {
      toast.success("✨ 本命诗人已觉醒！");
      // 本命诗人匹配完成音效（古琴双弦 + 渐强震动）
      setTimeout(() => fbDestinyMatch(), 300);
      if (isAuthenticated) {
        refetch();
      } else {
        // 游客模式：保存到本地状态
        setGuestDestiny(data as DestinyResult);
      }
      setGenerating(false);
    },
    onError: (e) => {
      toast.error("召唤失败：" + e.message);
      setGenerating(false);
    },
  });

  const handleGenerate = () => {
    unlockAudio();
    setGenerating(true);
    if (isAuthenticated) {
      // 已登录：不传 guestStats，后端从 DB 加载
      generateMutation.mutate({});
    } else {
      // 游客模式：传入本地统计数据
      generateMutation.mutate({ guestStats });
    }
  };

  // 当前展示的本命诗人数据（登录用服务器数据，游客用本地数据）
  const destiny = isAuthenticated ? serverDestiny : guestDestiny;
  const totalAnswered = isAuthenticated ? (gameState?.totalAnswered ?? 0) : guestStats.totalAnswered;
  const canGenerate = totalAnswered >= 10;

  // 微信分享：直接复制链接+文案，并显示操作指引
  const handleShare = () => {
    const poetName = destiny?.poet ? (destiny.poet as { name: string }).name : "诗词达人";
    const rankName = gameState?.rank?.rankName ?? "诗词达人";
    const emoji = POET_EMOJIS[poetName] ?? "📜";
    const matchScore = destiny?.matchScore ?? 0;

    const shareText = [
      `${emoji} 我的本命诗人是「${poetName}」！`,
      `灵魂契合度 ${matchScore}%，当前段位「${rankName}」`,
      ``,
      `🎮 天马行空·你的本命诗人是谁？`,
      `答题闯关·诗词测试·天命匹配`,
      GAME_URL,
    ].join("\n");

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        setShowShareGuide(true);
      }).catch(() => {
        setShowShareGuide(true);
      });
    } else {
      setShowShareGuide(true);
    }
  };

  const copyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(GAME_URL).then(() => {
        toast.success("链接已复制！", { duration: 2000 });
      });
    }
  };

  return (
    <div className="min-h-screen page-content px-4 pt-2 bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 mb-2">
        <button onClick={() => navigate("/")} className="text-muted-foreground text-xl leading-none">‹</button>
        <h1 className="font-semibold font-display" style={{ fontSize: "17px" }}>✨ 本命诗人觉醒</h1>
        {!isAuthenticated && (
          <a href={getLoginUrl()} className="ml-auto text-xs px-3 py-1 rounded-full font-medium"
            style={{ background: "var(--vermilion-pale)", color: "var(--vermilion)" }}>
            登录保存结果
          </a>
        )}
      </div>

      {/* 微信分享指引弹窗 */}
      {showShareGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowShareGuide(false)}>
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 pb-8" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-center mb-4" style={{ fontSize: "17px" }}>分享到微信</h3>
            <p className="text-muted-foreground text-center mb-5 leading-relaxed" style={{ fontSize: "15px" }}>
              分享文案已复制到剪贴板！
            </p>
            <div className="space-y-3">
              <div className="rounded-xl p-4 border border-border bg-muted/30">
                <p className="font-medium mb-1" style={{ fontSize: "14px" }}>方法一：发送给好友</p>
                <p className="text-muted-foreground" style={{ fontSize: "13px" }}>打开微信 → 选择好友 → 长按输入框粘贴</p>
              </div>
              <div className="rounded-xl p-4 border border-border bg-muted/30">
                <p className="font-medium mb-1" style={{ fontSize: "14px" }}>方法二：发朋友圈</p>
                <p className="text-muted-foreground" style={{ fontSize: "13px" }}>打开微信朋友圈 → 发文字 → 长按粘贴</p>
              </div>
              <button
                onClick={copyLink}
                className="w-full py-3 rounded-xl font-semibold border border-border bg-card"
                style={{ fontSize: "15px", color: "var(--ink)" }}
              >
                📋 单独复制游戏链接
              </button>
              <button
                onClick={() => setShowShareGuide(false)}
                className="w-full py-3 rounded-xl font-semibold text-white"
                style={{ background: "#07C160", fontSize: "16px", minHeight: "52px" }}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No destiny yet */}
      {!destiny && (
        <div className="text-center py-10">
          <div className="text-6xl mb-4 float-anim">🌙</div>
          <h2 className="font-semibold font-display mb-2 text-foreground" style={{ fontSize: "20px" }}>等待觉醒</h2>
          <p className="text-muted-foreground mb-2 leading-relaxed" style={{ fontSize: "16px" }}>
            {canGenerate
              ? "你已答够10题，可以解锁本命诗人了！"
              : `再答 ${10 - totalAnswered} 题即可解锁本命诗人`}
          </p>
          <div className="text-muted-foreground mb-6" style={{ fontSize: "14px" }}>
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
              className="px-8 py-3.5 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 text-white"
              style={{ background: "var(--vermilion)", fontSize: "16px", minHeight: "52px", boxShadow: "0 4px 16px oklch(0.55 0.20 25 / 0.30)" }}
            >
              {generating ? "✨ 觉醒中..." : "✨ 召唤本命诗人"}
            </button>
          ) : (
            <button
              onClick={() => navigate("/game")}
              className="px-8 py-3.5 rounded-xl font-semibold transition-all active:scale-95 border border-border text-foreground bg-card"
              style={{ fontSize: "16px", minHeight: "52px" }}
            >
              ⚔️ 去答题
            </button>
          )}

          {/* 游客提示：登录可保存进度 */}
          {!isAuthenticated && totalAnswered > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              游客模式下结果仅保存在本设备，<a href={getLoginUrl()} className="underline" style={{ color: "var(--vermilion)" }}>登录</a>可永久保存
            </p>
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
        const poems = safeParseArray(poet.signaturePoems);
        const tags  = safeParseArray(poet.personalityTags);

        return (
          <div className="animate-fade-in">
            {/* 主卡片 - 宣纸风格 */}
            <div className="rounded-2xl mb-4 overflow-hidden border"
              style={{
                background: `linear-gradient(160deg, ${matchInfo.color}08 0%, var(--card) 40%)`,
                borderColor: matchInfo.color + "35",
                boxShadow: `0 4px 24px ${matchInfo.color}12`,
              }}>
              {/* 头部装饰条 */}
              <div className="h-1.5 w-full"
                style={{ background: `linear-gradient(90deg, ${matchInfo.color}, ${matchInfo.color}60)` }} />

              <div className="p-5 text-center">
                {/* 诗人头像 - 更大更丰富 */}
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto float-anim"
                    style={{
                      background: `radial-gradient(circle, ${matchInfo.color}18, ${matchInfo.color}08)`,
                      border: `2px solid ${matchInfo.color}40`,
                      boxShadow: `0 4px 16px ${matchInfo.color}20`,
                    }}>
                    {poetEmoji}
                  </div>
                  {/* 契合度小徽章 */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: matchInfo.color, boxShadow: `0 2px 8px ${matchInfo.color}50` }}>
                    <span style={{ color: "white", fontSize: "11px", fontWeight: 700 }}>{destiny.matchScore}%</span>
                  </div>
                </div>

                {/* 契合等级标签 */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3"
                  style={{
                    background: matchInfo.color + "12",
                    color: matchInfo.color,
                    fontSize: "14px",
                    fontFamily: "Huiwen-MinchoGBK, 'Noto Serif SC', STSong, serif",
                    letterSpacing: "0.1em",
                    borderRadius: "2px",
                    border: `1px solid ${matchInfo.color}30`,
                  }}>
                  {matchInfo.label}
                </div>

                {/* 诗人名 - 大字宋体 */}
                <h2 className="font-display mb-1"
                  style={{ color: matchInfo.color, fontSize: "32px", letterSpacing: "0.12em" }}>
                  {poet.name}
                </h2>
                <p className="font-serif-poem text-muted-foreground mb-4"
                  style={{ fontSize: "16px", letterSpacing: "0.06em" }}>
                  {poet.dynasty}代 · {poet.mbtiType}
                </p>

                {/* 小分隔线 */}
                <div className="divider-ink mx-8 mb-4" />

                {/* 性格标签 */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                    {tags.map((tag) => (
                      <span key={tag}
                        style={{
                          background: matchInfo.color + "10",
                          color: matchInfo.color,
                          fontSize: "14px",
                          padding: "4px 12px",
                          borderRadius: "2px",
                          border: `1px solid ${matchInfo.color}25`,
                          fontFamily: "Huiwen-MinchoGBK, 'Noto Serif SC', STSong, serif",
                          letterSpacing: "0.06em",
                        }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* MBTI 描述：诗人描述一行，对用户描述重新起行，联系之处重新起行 */}
                <div className="font-serif-poem text-left">
                  {(() => {
                    const desc = poet.mbtiDescription;
                    // 按句号分割，过滤空行
                    const sentences = desc.split('\u3002').filter(s => s.trim());
                    if (sentences.length <= 1) {
                      return <p className="text-muted-foreground" style={{ fontSize: "15px", lineHeight: "2.0" }}>{desc}</p>;
                    }
                    return sentences.map((s, i) => (
                      <p
                        key={i}
                        className={i === 0 ? "text-foreground font-semibold" : "text-muted-foreground"}
                        style={{
                          fontSize: i === 0 ? "16px" : "14px",
                          lineHeight: "2.0",
                          marginBottom: i < sentences.length - 1 ? '0.6em' : 0,
                        }}
                      >
                        {s + '\u3002'}
                      </p>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* 灵魂分析报告 */}
            {destiny.analysisReport && (
              <div className="rounded-2xl p-4 mb-4 border"
                style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 1px 6px oklch(0.14 0.025 55 / 0.04)" }}>
                <h3 className="font-display mb-3 flex items-center gap-2 text-foreground"
                  style={{ fontSize: "17px", letterSpacing: "0.06em" }}>
                  <span style={{ color: "var(--gold)" }}>★</span> 灵魂分析报告
                </h3>
                {/* 分段显示：问候一行，正文重新起行，MBTI分析再次分段 */}
                <div className="font-serif-poem text-muted-foreground"
                  style={{ fontSize: "15px", lineHeight: "2.0" }}>
                  {(() => {
                    const report = destiny.analysisReport!;
                    const MBTI_KWS = ['MBTI', 'INFJ', 'INFP', 'INTJ', 'INTP', 'ISFJ', 'ISFP', 'ISTJ', 'ISTP',
                      'ENFJ', 'ENFP', 'ENTJ', 'ENTP', 'ESFJ', 'ESFP', 'ESTJ', 'ESTP'];

                    // 优先按 \n 分割段落（LLM 输出通常包含换行）
                    const rawParas = report.split('\n').map(p => p.trim()).filter(Boolean);
                    if (rawParas.length >= 2) {
                      // 在已分段的基础上，尝试将包含MBTI关键词的段落与前段分开
                      const result: string[] = [];
                      for (const para of rawParas) {
                        const hasMbti = MBTI_KWS.some(kw => para.includes(kw));
                        // 如果当前段落包含MBTI关键词，且上一段不包含，则单独成段
                        if (hasMbti && result.length > 0 && !MBTI_KWS.some(kw => result[result.length-1].includes(kw))) {
                          result.push(para);
                        } else if (result.length > 0 && !hasMbti) {
                          // 尝试将同一层次的正文内容合并（避免过多段落）
                          result.push(para);
                        } else {
                          result.push(para);
                        }
                      }
                      return result.map((para, i) => (
                        <p key={i} style={{ marginBottom: i < result.length - 1 ? '0.85em' : 0 }}>
                          {para}
                        </p>
                      ));
                    }

                    // 无换行符时：按句号分割
                    const sentences = report.split('\u3002').filter(s => s.trim());
                    if (sentences.length <= 1) return <p>{report}</p>;

                    // 第一句为问候
                    const greeting = sentences[0] + '\u3002';
                    const remaining = sentences.slice(1);

                    // 在剩余句子中找第一个包含MBTI关键词的句子位置
                    let mbtiSentIdx = -1;
                    for (let i = 0; i < remaining.length; i++) {
                      if (MBTI_KWS.some(kw => remaining[i].includes(kw))) {
                        mbtiSentIdx = i;
                        break;
                      }
                    }

                    if (mbtiSentIdx > 0) {
                      // 问候 | 正文（到MBTI前）| MBTI分析
                      const body = remaining.slice(0, mbtiSentIdx).join('\u3002') + '\u3002';
                      const mbtiPart = remaining.slice(mbtiSentIdx).join('\u3002') + '\u3002';
                      return (
                        <>
                          <p style={{ marginBottom: '0.85em' }}>{greeting}</p>
                          <p style={{ marginBottom: '0.85em' }}>{body}</p>
                          <p>{mbtiPart}</p>
                        </>
                      );
                    }

                    // 找不到MBTI关键词：问候 + 剩余内容
                    const rest = remaining.join('\u3002') + '\u3002';
                    return (
                      <>
                        <p style={{ marginBottom: '0.85em' }}>{greeting}</p>
                        <p>{rest}</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 专属藏头诗 */}
            {destiny.acrosticPoem && (
              <div className="rounded-2xl p-4 mb-4 border"
                style={{
                  background: `linear-gradient(135deg, ${matchInfo.color}05, var(--card))`,
                  borderColor: matchInfo.color + "25",
                }}>
                <h3 className="font-display mb-3 flex items-center gap-2 text-foreground"
                  style={{ fontSize: "17px", letterSpacing: "0.06em" }}>
                  <span style={{ color: "var(--vermilion)" }}>印</span> 专属藏头诗
                </h3>
                <div className="space-y-1.5 pl-2"
                  style={{ borderLeft: `2px solid ${matchInfo.color}40` }}>
                  {destiny.acrosticPoem.split("\n").filter(Boolean).map((line, i) => (
                    <div key={i} className="font-serif-poem text-foreground"
                      style={{ fontSize: "18px", lineHeight: "2.0", letterSpacing: "0.08em" }}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 代表作品 */}
            {poems.length > 0 && (
              <div className="rounded-2xl p-4 mb-4 border"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <h3 className="font-display mb-3 flex items-center gap-2 text-foreground"
                  style={{ fontSize: "17px", letterSpacing: "0.06em" }}>
                  <span style={{ color: "var(--celadon)" }}>卷</span> 代表作品
                </h3>
                <div className="space-y-3">
                  {poems.slice(0, 3).map((poem, i) => (
                    <div key={i} className="font-serif-poem text-muted-foreground leading-relaxed pl-3"
                      style={{
                        borderLeft: `2px solid ${matchInfo.color}50`,
                        fontSize: "16px",
                        lineHeight: "2.0",
                        letterSpacing: "0.06em",
                      }}>
                      {poem}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 游客提示 */}
            {!isAuthenticated && (
              <div className="rounded-xl p-3 mb-4 text-center border"
                style={{ background: "var(--card)", borderColor: "oklch(0.50 0.19 22 / 0.22)" }}>
                <p className="text-xs text-muted-foreground mb-2 font-serif-poem">游客结果仅保存在本设备，登录后可永久保存并解锁更多功能</p>
                <a href={getLoginUrl()}
                  className="inline-block px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: "var(--vermilion)", letterSpacing: "0.04em" }}>
                  登录保存
                </a>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleShare}
                className="w-full py-3.5 rounded-xl font-semibold transition-all active:scale-95 text-white"
                style={{ background: "#07C160", fontSize: "16px", minHeight: "52px", letterSpacing: "0.04em" }}
              >
                📱 分享到微信
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3.5 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 border text-foreground"
                style={{ background: "var(--card)", borderColor: "var(--border)", fontSize: "15px", minHeight: "48px", letterSpacing: "0.04em" }}
              >
                {generating ? "✨ 重新觉醒中..." : "重新匹配本命诗人"}
              </button>
              <button
                onClick={() => navigate("/game")}
                className="w-full py-3 rounded-xl transition-all active:scale-95 font-serif-poem"
                style={{ fontSize: "14px", minHeight: "44px", color: "var(--ink-pale)", letterSpacing: "0.04em" }}
              >
                继续答题提升契合度
              </button>
              {/* 重新解锁按鈕：清除本命诗人数据并跳转答题页 */}
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    // 已登录：重新匹配（即调用 generateMutation）
                    handleGenerate();
                  } else {
                    // 游客模式：清除本地数据并跳转答题
                    localStorage.removeItem('guest_destiny_result');
                    setGuestDestiny(null);
                    navigate("/game");
                  }
                }}
                className="w-full py-2.5 rounded-xl transition-all active:scale-95 font-serif-poem text-muted-foreground"
                style={{ fontSize: "13px", minHeight: "40px", letterSpacing: "0.04em", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "3px" }}
              >
                重新解锁本命诗人
              </button>
            </div>
          </div>
        );
      })()}

      <BottomNav />
    </div>
  );
}
