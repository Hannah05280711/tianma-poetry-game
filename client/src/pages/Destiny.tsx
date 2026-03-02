import { useState, useEffect, useRef } from "react";
import { fbDestinyMatch, unlockAudio } from "@/lib/feedback";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import {
  loadLocalState,
  saveLocalDestinyPoet,
  resetLocalDestinyPoet,
} from "@/lib/localGameState";

// Canvas分享卡片生成
async function generateShareCard(params: {
  poetName: string;
  poetEmoji: string;
  dynasty: string;
  mbtiType: string;
  matchScore: number;
  matchLabel: string;
  matchColor: string;
  acrosticPoem: string;
  nickname: string;
}): Promise<string> {
  const { poetName, poetEmoji, dynasty, mbtiType, matchScore, matchLabel, matchColor, acrosticPoem, nickname } = params;
  const W = 750, H = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // 背景渐变色
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#1a0a00");
  bgGrad.addColorStop(0.4, "#2d1200");
  bgGrad.addColorStop(1, "#0d0500");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 水墨纹理装饰
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, 60 + Math.random() * 120, 0, Math.PI * 2);
    ctx.fillStyle = matchColor;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 顶部装饰线
  const topGrad = ctx.createLinearGradient(0, 0, W, 0);
  topGrad.addColorStop(0, "transparent");
  topGrad.addColorStop(0.3, matchColor);
  topGrad.addColorStop(0.7, matchColor);
  topGrad.addColorStop(1, "transparent");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 4);

  // 标题
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "bold 28px serif";
  ctx.textAlign = "center";
  ctx.fillText("天马行空·本命诗人", W / 2, 60);

  // 诗人 emoji 大圈
  const circleY = 200;
  const circleR = 90;
  const circleGrad = ctx.createRadialGradient(W/2, circleY, 0, W/2, circleY, circleR);
  circleGrad.addColorStop(0, matchColor + "30");
  circleGrad.addColorStop(1, matchColor + "08");
  ctx.beginPath();
  ctx.arc(W / 2, circleY, circleR, 0, Math.PI * 2);
  ctx.fillStyle = circleGrad;
  ctx.fill();
  ctx.strokeStyle = matchColor + "60";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = "80px serif";
  ctx.textAlign = "center";
  ctx.fillText(poetEmoji, W / 2, circleY + 28);

  // 契合度徽章
  ctx.font = "bold 22px sans-serif";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(`${matchScore}%`, W / 2 + circleR - 10, circleY + circleR - 10);

  // 匹配标签
  const labelY = 320;
  ctx.font = "26px serif";
  ctx.fillStyle = matchColor;
  ctx.textAlign = "center";
  ctx.fillText(matchLabel, W / 2, labelY);

  // 诗人名
  ctx.font = "bold 72px serif";
  ctx.fillStyle = matchColor;
  ctx.textAlign = "center";
  ctx.fillText(poetName, W / 2, labelY + 80);

  // 朝代和 MBTI
  ctx.font = "28px serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "center";
  ctx.fillText(`${dynasty}代 · ${mbtiType}`, W / 2, labelY + 130);

  // 分隔线
  ctx.strokeStyle = matchColor + "40";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, labelY + 160);
  ctx.lineTo(W - 80, labelY + 160);
  ctx.stroke();

  // 藏头诗标题
  const acrosticY = labelY + 210;
  ctx.font = "bold 28px serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "center";
  ctx.fillText("— 专属藏头诗 —", W / 2, acrosticY);

  // 藏头诗内容
  const lines = acrosticPoem.split("\n").filter(Boolean).slice(0, 5);
  lines.forEach((line, i) => {
    const ly = acrosticY + 55 + i * 65;
    ctx.font = "bold 36px serif";
    ctx.fillStyle = matchColor;
    ctx.textAlign = "center";
    ctx.fillText(line.charAt(0), W / 2 - 100, ly);
    ctx.font = "34px serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(line.slice(1), W / 2 + 20, ly);
  });

  // 底部用户名号和游戏信息
  const bottomY = H - 100;
  ctx.strokeStyle = matchColor + "30";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, bottomY - 20);
  ctx.lineTo(W - 80, bottomY - 20);
  ctx.stroke();

  ctx.font = "24px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.textAlign = "center";
  ctx.fillText(`「${nickname}」的本命诗人`, W / 2, bottomY + 10);

  ctx.font = "22px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillText("天马行空·你的本命诗人是谁", W / 2, bottomY + 45);

  return canvas.toDataURL("image/png");
}

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

function safeParseArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

const GAME_URL = "https://www.tianmapoet.click";

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

// 本地存储本命诗人结果
const LOCAL_DESTINY_KEY = "tianma_destiny_result";

function loadLocalDestiny(): DestinyResult | null {
  try {
    const raw = localStorage.getItem(LOCAL_DESTINY_KEY);
    if (raw) return JSON.parse(raw) as DestinyResult;
  } catch { /* ignore */ }
  return null;
}

function saveLocalDestiny(result: DestinyResult) {
  try {
    localStorage.setItem(LOCAL_DESTINY_KEY, JSON.stringify(result));
  } catch { /* ignore */ }
}

export default function Destiny() {
  const [, navigate] = useLocation();
  const [generating, setGenerating] = useState(false);
  const [showShareGuide, setShowShareGuide] = useState(false);
  const [destiny, setDestiny] = useState<DestinyResult | null>(null);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [generatingCard, setGeneratingCard] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [nickname, setNickname] = useState("");

  // 加载本地状态
  useEffect(() => {
    const state = loadLocalState();
    setTotalAnswered(state.totalAnswered);
    setNickname(state.nickname);

    // 优先从本地存储读取完整的本命诗人结果（含AI分析）
    const localDestiny = loadLocalDestiny();
    if (localDestiny) {
      setDestiny(localDestiny);
    }
  }, []);

  const handleGenerateCard = async (poetName: string, poetEmoji: string, dynasty: string, mbtiType: string, matchScore: number, matchLabel: string, matchColor: string, acrosticPoem: string) => {
    setGeneratingCard(true);
    try {
      const dataUrl = await generateShareCard({
        poetName, poetEmoji, dynasty, mbtiType, matchScore, matchLabel, matchColor,
        acrosticPoem: acrosticPoem || "",
        nickname: nickname || "诗词达人",
      });
      setCardDataUrl(dataUrl);
      setShowCardModal(true);
    } catch (e) {
      toast.error("卡片生成失败，请重试");
    } finally {
      setGeneratingCard(false);
    }
  };

  // 每次页面可见时刷新
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        const state = loadLocalState();
        setTotalAnswered(state.totalAnswered);
        const localDestiny = loadLocalDestiny();
        if (localDestiny) setDestiny(localDestiny);
      }
    };
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, []);

  const canGenerate = totalAnswered >= 10;

  const generateMutation = trpc.game.generateDestinyPoet.useMutation({
    onSuccess: (data) => {
      toast.success("✨ 本命诗人已觉醒！");
      setTimeout(() => fbDestinyMatch(), 300);
      const result = data as DestinyResult;
      setDestiny(result);
      // 保存完整结果到本地（含AI分析文本）
      saveLocalDestiny(result);
      // 更新本地状态中的诗人ID和契合度
      if (result.poetId) {
        saveLocalDestinyPoet(result.poetId, result.matchScore);
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
    const state = loadLocalState();
    // 传入本地统计数据（游客模式）
    generateMutation.mutate({
      guestStats: {
        totalAnswered: state.totalAnswered,
        totalCorrect: state.totalCorrect,
        poetCorrectMap: state.poetCorrectMap,
        typePreferMap: state.typePreferMap,
        avgResponseTime: state.avgResponseTime,
      },
    });
  };

  const handleShare = () => {
    const poetName = destiny?.poet ? (destiny.poet as { name: string }).name : "诗词达人";
    const emoji = POET_EMOJIS[poetName] ?? "📜";
    const matchScore = destiny?.matchScore ?? 0;

    const shareText = [
      `${emoji} 我的本命诗人是「${poetName}」！`,
      `灵魂契合度 ${matchScore}%`,
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

          <p className="mt-4 text-xs text-muted-foreground">
            游戏数据存储在本设备，换设备后需重新答题
          </p>
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
            {/* 主卡片 */}
            <div className="rounded-2xl mb-4 overflow-hidden border"
              style={{
                background: `linear-gradient(160deg, ${matchInfo.color}08 0%, var(--card) 40%)`,
                borderColor: matchInfo.color + "35",
                boxShadow: `0 4px 24px ${matchInfo.color}12`,
              }}>
              <div className="h-1.5 w-full"
                style={{ background: `linear-gradient(90deg, ${matchInfo.color}, ${matchInfo.color}60)` }} />

              <div className="p-5 text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto float-anim"
                    style={{
                      background: `radial-gradient(circle, ${matchInfo.color}18, ${matchInfo.color}08)`,
                      border: `2px solid ${matchInfo.color}40`,
                      boxShadow: `0 4px 16px ${matchInfo.color}20`,
                    }}>
                    {poetEmoji}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: matchInfo.color, boxShadow: `0 2px 8px ${matchInfo.color}50` }}>
                    <span style={{ color: "white", fontSize: "11px", fontWeight: 700 }}>{destiny.matchScore}%</span>
                  </div>
                </div>

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

                <h2 className="font-display mb-1"
                  style={{ color: matchInfo.color, fontSize: "32px", letterSpacing: "0.12em" }}>
                  {poet.name}
                </h2>
                <p className="font-serif-poem text-muted-foreground mb-4"
                  style={{ fontSize: "16px", letterSpacing: "0.06em" }}>
                  {poet.dynasty}代 · {poet.mbtiType}
                </p>

                <div className="divider-ink mx-8 mb-4" />

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

                <div className="font-serif-poem text-left">
                  {(() => {
                    const desc = poet.mbtiDescription;
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
                <div className="font-serif-poem text-muted-foreground"
                  style={{ fontSize: "15px", lineHeight: "2.0" }}>
                  {(() => {
                    const report = destiny.analysisReport!;
                    const MBTI_KWS = ['MBTI', 'INFJ', 'INFP', 'INTJ', 'INTP', 'ISFJ', 'ISFP', 'ISTJ', 'ISTP',
                      'ENFJ', 'ENFP', 'ENTJ', 'ENTP', 'ESFJ', 'ESFP', 'ESTJ', 'ESTP'];

                    const rawParas = report.split('\n').map(p => p.trim()).filter(Boolean);
                    if (rawParas.length >= 2) {
                      const result: string[] = [];
                      for (const para of rawParas) {
                        const hasMbti = MBTI_KWS.some(kw => para.includes(kw));
                        if (hasMbti && result.length > 0 && !MBTI_KWS.some(kw => result[result.length-1].includes(kw))) {
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

                    const sentences = report.split('\u3002').filter(s => s.trim());
                    if (sentences.length <= 1) return <p>{report}</p>;

                    const greeting = sentences[0] + '\u3002';
                    const remaining = sentences.slice(1);

                    let mbtiSentIdx = -1;
                    for (let i = 0; i < remaining.length; i++) {
                      if (MBTI_KWS.some(kw => remaining[i].includes(kw))) {
                        mbtiSentIdx = i;
                        break;
                      }
                    }

                    if (mbtiSentIdx > 0) {
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

            {/* 操作按钮 */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleGenerateCard(
                  poet.name,
                  poetEmoji,
                  poet.dynasty,
                  poet.mbtiType,
                  destiny.matchScore,
                  matchInfo.label,
                  matchInfo.color,
                  destiny.acrosticPoem ?? ""
                )}
                disabled={generatingCard}
                className="w-full py-3.5 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${matchInfo.color}, ${matchInfo.color}cc)`,
                  color: "white",
                  fontSize: "16px",
                  minHeight: "52px",
                  letterSpacing: "0.04em",
                  boxShadow: `0 4px 16px ${matchInfo.color}40`,
                }}
              >
                {generatingCard ? "生成卡片中..." : "🎨 生成分享卡片"}
              </button>
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
              <button
                onClick={() => {
                  localStorage.removeItem(LOCAL_DESTINY_KEY);
                  resetLocalDestinyPoet();
                  setDestiny(null);
                  navigate("/game");
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

      {/* Canvas分享卡片弹窗 */}
      {showCardModal && cardDataUrl && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCardModal(false); }}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl p-5"
            style={{ background: "#1a0a00", paddingBottom: "env(safe-area-inset-bottom, 24px)" }}
          >
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <h3 className="text-center font-display text-white text-base mb-1">🎨 分享卡片已生成</h3>
            <p className="text-center text-white/50 text-xs mb-4">在微信中长按图片即可保存到相册</p>
            <div className="rounded-xl overflow-hidden mb-4" style={{ maxHeight: "55vh", overflowY: "auto" }}>
              <img
                src={cardDataUrl}
                alt="分享卡片"
                className="w-full block"
                style={{ borderRadius: "12px" }}
              />
            </div>
            <a
              href={cardDataUrl}
              download="天马本命诗人.png"
              className="block w-full py-3 rounded-2xl font-bold text-base text-center text-white mb-2 transition-all active:scale-95"
              style={{ background: "var(--vermilion)" }}
            >
              保存到相册
            </a>
            <button
              onClick={() => setShowCardModal(false)}
              className="w-full py-2 text-sm text-white/40"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
