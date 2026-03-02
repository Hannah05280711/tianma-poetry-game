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
// 助手函数：圆角矩形
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function generateShareCard(params: {
  poetName: string;
  poetEmoji: string;
  dynasty: string;
  mbtiType: string;
  matchScore: number;
  matchLabel: string;
  matchColor: string;  // kept for fallback
  acrosticPoem: string;
  nickname: string;
}): Promise<string> {
  const { poetName, poetEmoji, dynasty, mbtiType, matchScore, matchLabel, acrosticPoem, nickname } = params;
  // 使用诗人专属古风配色
  const theme = getPoetThemeColor(poetName, matchScore);
  const matchColor = theme.primary;
  const W = 750, H = 1334; // iPhone 比例
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ===== 背景：诗人专属色调 =====
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, theme.bg1);
  bgGrad.addColorStop(0.6, theme.bg2);
  bgGrad.addColorStop(1, theme.bg1);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ===== 水墨渗渍圆形装饰 =====
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = matchColor;
  ctx.beginPath(); ctx.arc(650, 120, 180, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(100, 700, 220, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(700, 1100, 150, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ===== 外框装饰 =====
  // 外圈边框
  ctx.strokeStyle = matchColor + "50";
  ctx.lineWidth = 3;
  roundRect(ctx, 20, 20, W - 40, H - 40, 24);
  ctx.stroke();
  // 内圈边框
  ctx.strokeStyle = matchColor + "25";
  ctx.lineWidth = 1;
  roundRect(ctx, 32, 32, W - 64, H - 64, 18);
  ctx.stroke();

  // ===== 顶部标题区 =====
  // 顶部装饰色块
  ctx.save();
  roundRect(ctx, 20, 20, W - 40, 100, 24);
  ctx.clip();
  const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
  headerGrad.addColorStop(0, matchColor + "18");
  headerGrad.addColorStop(0.5, matchColor + "30");
  headerGrad.addColorStop(1, matchColor + "18");
  ctx.fillStyle = headerGrad;
  ctx.fillRect(20, 20, W - 40, 100);
  ctx.restore();

  // 标题文字
  ctx.font = "bold 30px 'PingFang SC', 'Hiragino Sans GB', sans-serif";
  ctx.fillStyle = matchColor;
  ctx.textAlign = "center";
  ctx.fillText("天马行空", W / 2, 62);
  ctx.font = "22px 'PingFang SC', 'Hiragino Sans GB', sans-serif";
  ctx.fillStyle = matchColor + "99";
  ctx.fillText("你的本命诗人是谁", W / 2, 92);

  // ===== 诗人头像圆 =====
  const circleX = W / 2, circleY = 260, circleR = 100;
  // 外圈光晓
  ctx.save();
  const outerGlow = ctx.createRadialGradient(circleX, circleY, circleR * 0.7, circleX, circleY, circleR * 1.4);
  outerGlow.addColorStop(0, matchColor + "30");
  outerGlow.addColorStop(1, "transparent");
  ctx.fillStyle = outerGlow;
  ctx.beginPath(); ctx.arc(circleX, circleY, circleR * 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // 圆底色
  const circleGrad = ctx.createRadialGradient(circleX, circleY - 20, 10, circleX, circleY, circleR);
  circleGrad.addColorStop(0, "#FFFFFF");
  circleGrad.addColorStop(1, matchColor + "20");
  ctx.beginPath(); ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
  ctx.fillStyle = circleGrad; ctx.fill();
  ctx.strokeStyle = matchColor + "80"; ctx.lineWidth = 3; ctx.stroke();
  // emoji
  ctx.font = "90px serif";
  ctx.textAlign = "center";
  ctx.fillText(poetEmoji, circleX, circleY + 32);
  // 契合度徽章
  ctx.save();
  ctx.beginPath(); ctx.arc(circleX + circleR * 0.72, circleY + circleR * 0.72, 34, 0, Math.PI * 2);
  ctx.fillStyle = matchColor; ctx.fill();
  ctx.strokeStyle = "white"; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  ctx.font = "bold 22px 'PingFang SC', sans-serif";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(`${matchScore}%`, circleX + circleR * 0.72, circleY + circleR * 0.72 + 8);

  // ===== 诗人信息 =====
  const infoY = 400;
  // 匹配标签胶囊
  const labelW = 160, labelH = 38;
  ctx.save();
  roundRect(ctx, W/2 - labelW/2, infoY - 28, labelW, labelH, 19);
  ctx.fillStyle = matchColor + "18"; ctx.fill();
  ctx.strokeStyle = matchColor + "60"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
  ctx.font = "bold 22px 'PingFang SC', 'Hiragino Sans GB', serif";
  ctx.fillStyle = matchColor;
  ctx.textAlign = "center";
  ctx.fillText(matchLabel, W / 2, infoY + 2);

  // 诗人名（使用专属强调色）
  ctx.font = "bold 88px 'PingFang SC', 'Hiragino Sans GB', serif";
  ctx.fillStyle = theme.accent;
  ctx.textAlign = "center";
  ctx.fillText(poetName, W / 2, infoY + 100);

  // 朝代 & MBTI
  ctx.font = "28px 'PingFang SC', 'Hiragino Sans GB', sans-serif";
  ctx.fillStyle = theme.secondary;
  ctx.textAlign = "center";
  ctx.fillText(`${dynasty}代  ·  ${mbtiType}`, W / 2, infoY + 148);

  // ===== 装饰分隔线 =====
  const divY = infoY + 178;
  // 中间菱形装饰
  ctx.fillStyle = matchColor;
  ctx.save();
  ctx.translate(W / 2, divY);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.moveTo(0, -12); ctx.lineTo(5, -5); ctx.lineTo(12, 0);
    ctx.lineTo(5, 5); ctx.lineTo(0, 12); ctx.lineTo(-5, 5);
    ctx.lineTo(-12, 0); ctx.lineTo(-5, -5);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // 两侧线条
  const lineGrad1 = ctx.createLinearGradient(60, divY, W/2 - 30, divY);
  lineGrad1.addColorStop(0, "transparent"); lineGrad1.addColorStop(1, matchColor + "80");
  ctx.strokeStyle = lineGrad1; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(60, divY); ctx.lineTo(W/2 - 30, divY); ctx.stroke();
  const lineGrad2 = ctx.createLinearGradient(W/2 + 30, divY, W - 60, divY);
  lineGrad2.addColorStop(0, matchColor + "80"); lineGrad2.addColorStop(1, "transparent");
  ctx.strokeStyle = lineGrad2;
  ctx.beginPath(); ctx.moveTo(W/2 + 30, divY); ctx.lineTo(W - 60, divY); ctx.stroke();

  // ===== 藏头诗区域 =====
  const acrosticStartY = divY + 50;
  // 标题
  ctx.font = "bold 26px 'PingFang SC', 'Hiragino Sans GB', sans-serif";
  ctx.fillStyle = theme.secondary;
  ctx.textAlign = "center";
  ctx.fillText("——  专属藏头诗  ——", W / 2, acrosticStartY);

  const lines = acrosticPoem.split("\n").filter(Boolean).slice(0, 4);
  const lineH = 80;
  lines.forEach((line, i) => {
    const ly = acrosticStartY + 55 + i * lineH;
    // 行底色（奇偶行轻微不同）
    if (i % 2 === 0) {
      ctx.fillStyle = matchColor + "08";
      ctx.fillRect(60, ly - 48, W - 120, lineH - 8);
    }
    // 藏头字（加大加色）
    ctx.font = `bold 46px 'PingFang SC', 'Hiragino Sans GB', serif`;
    ctx.fillStyle = matchColor;
    ctx.textAlign = "left";
    ctx.fillText(line.charAt(0), 80, ly);
    // 剩余诗句
    ctx.font = `40px 'PingFang SC', 'Hiragino Sans GB', serif`;
    ctx.fillStyle = "#2C1810";
    ctx.textAlign = "left";
    ctx.fillText(line.slice(1), 140, ly);
  });

  // ===== 底部区域 =====
  const footerY = H - 140;
  // 底部分隔线
  const footerLineGrad = ctx.createLinearGradient(60, footerY, W - 60, footerY);
  footerLineGrad.addColorStop(0, "transparent");
  footerLineGrad.addColorStop(0.3, matchColor + "60");
  footerLineGrad.addColorStop(0.7, matchColor + "60");
  footerLineGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = footerLineGrad; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, footerY); ctx.lineTo(W - 60, footerY); ctx.stroke();

  // 用户名号
  ctx.font = "bold 28px 'PingFang SC', 'Hiragino Sans GB', sans-serif";
  ctx.fillStyle = theme.accent;
  ctx.textAlign = "center";
  ctx.fillText(`「${nickname}」 的本命诗人`, W / 2, footerY + 44);

  // 小字底标
  ctx.font = "22px 'PingFang SC', 'Hiragino Sans GB', sans-serif";
  ctx.fillStyle = matchColor + "99";
  ctx.textAlign = "center";
  ctx.fillText("天马行空 · 你的本命诗人是谁", W / 2, footerY + 80);
  ctx.font = "20px 'PingFang SC', 'Hiragino Sans GB', sans-serif";
  ctx.fillStyle = matchColor + "55";
  ctx.fillText("www.tianmapoet.click", W / 2, footerY + 112);

  return canvas.toDataURL("image/png");
}

const POET_EMOJIS: Record<string, string> = {
  "李白": "🌙", "杜甫": "📜", "王维": "🏔️", "苏轼": "🌊",
  "李清照": "🌸", "辛弃疾": "⚔️", "白居易": "🎵", "陶渊明": "🌿",
  "王昌龄": "🌅", "孟浩然": "🍃", "杜牧": "🍂", "李商隐": "🌹",
  "贺知章": "🍶", "张若虚": "🌕", "王之浣": "🦅", "岑参": "❄️",
  "高适": "🏹", "韦应物": "🍵", "刘禹锡": "🪷", "柳宗元": "🐟",
  "元稹": "💌", "韩愈": "📚", "温庭筠": "🎶", "李煎": "😢",
  "冯延巳": "🌫️", "花蔢夫人": "🌺", "韦庄": "🍁", "欧阳修": "🎯",
  "晏殊": "🎴", "柳永": "🌧️", "晏几道": "🌷", "秦观": "🌙",
  "黄庭坚": "🖌️", "周邦彦": "🎻", "陆游": "🗡️", "范成大": "🌾",
  "杨万里": "☀️", "朱熙": "📖", "姜夔": "🎵", "吴文英": "🌀",
  "关汉卿": "🎭", "马致远": "🍂", "张养浩": "⚖️", "萨都刺": "🌊",
  "白朴": "🎪", "郑光祖": "🎨", "王实甫": "💕", "乔吉": "🌸",
  "刘基": "🔮", "归有光": "🏠", "汤显祖": "🎭", "袁宏道": "🌿",
  "徐渭": "🔊", "王世贞": "📜", "纳兰性德": "❄️", "蒲松龄": "👻",
  "龚自珍": "🌋", "梁启超": "🔥", "曹操": "⚔️", "屈原": "🌊", "李璊": "🌙",
};

/**
 * 诗人专属古风配色系统
 * 每位诗人根据其风格、朝代、代表意象定制主色调
 */
export const POET_THEME_COLORS: Record<string, {
  primary: string;    // 主色（标题、藏头字、徽章）
  secondary: string;  // 辅助色（分隔线、边框）
  bg1: string;        // 背景渐变起始色
  bg2: string;        // 背景渐变结束色
  accent: string;     // 强调色（诗人名字颜色）
  label: string;      // 契合标签文字色
}> = {
  // 李白：月白仙气，青莲居士，青白色调
  "李白": { primary: "#2E6DA4", secondary: "#5B9BD5", bg1: "#EEF6FF", bg2: "#DBEAFE", accent: "#1A4F8A", label: "#2E6DA4" },
  // 杜甫：忧国忧民，山河大地，深棕色调
  "杜甫": { primary: "#5C4033", secondary: "#8B6355", bg1: "#FDF6F0", bg2: "#F5E6D8", accent: "#3E2723", label: "#5C4033" },
  // 王维：诗中有画，青翠山色，翠绿色调
  "王维": { primary: "#2D7D5A", secondary: "#4CAF85", bg1: "#F0FBF5", bg2: "#DCFCE7", accent: "#1B5E40", label: "#2D7D5A" },
  // 苏轼：豪放大气，大江东去，水墨蓝色
  "苏轼": { primary: "#1565C0", secondary: "#42A5F5", bg1: "#EFF8FF", bg2: "#DBEAFE", accent: "#0D47A1", label: "#1565C0" },
  // 李清照：婉约清丽，海棠红梅，粉红色调
  "李清照": { primary: "#B5446E", secondary: "#E879A0", bg1: "#FFF0F6", bg2: "#FCE7F3", accent: "#831843", label: "#B5446E" },
  // 辛弃疾：爱国豪情，剑气山河，次红色调
  "辛弃疾": { primary: "#B71C1C", secondary: "#EF5350", bg1: "#FFF5F5", bg2: "#FEE2E2", accent: "#7F0000", label: "#B71C1C" },
  // 白居易：现实主义，江南风情，吴红色调
  "白居易": { primary: "#C0392B", secondary: "#E74C3C", bg1: "#FFF8F7", bg2: "#FDECEA", accent: "#922B21", label: "#C0392B" },
  // 陶渊明：归隐田园，采菊东篱，绿茂色调
  "陶渊明": { primary: "#4A7C59", secondary: "#76B887", bg1: "#F2FBF4", bg2: "#DCFCE7", accent: "#2D5A3D", label: "#4A7C59" },
  // 屈原：橚江投水，汇求上下，潐蓝色调
  "屈原": { primary: "#1A5276", secondary: "#2E86C1", bg1: "#EBF5FB", bg2: "#D6EAF8", accent: "#0D2B40", label: "#1A5276" },
  // 李商隐：沉郁美丽，无题红豆，深紫色调
  "李商隐": { primary: "#6B2D8B", secondary: "#9B59B6", bg1: "#F9F0FF", bg2: "#F3E8FF", accent: "#4A1A6B", label: "#6B2D8B" },
  // 李煎：春花秋月，江山故国，幽蓝色调
  "李煎": { primary: "#2C5F8A", secondary: "#5B9BD5", bg1: "#EEF6FF", bg2: "#DBEAFE", accent: "#1A3A5C", label: "#2C5F8A" },
  // 孟浩然：隔山隆隆，绿水青山，青翠色调
  "孟浩然": { primary: "#1B7A5A", secondary: "#34A87E", bg1: "#F0FBF7", bg2: "#D1FAE5", accent: "#0F5240", label: "#1B7A5A" },
  // 杜牧：秋天红叶，山行偷坐，欺红色调
  "杜牧": { primary: "#C0392B", secondary: "#E74C3C", bg1: "#FFF5F5", bg2: "#FEE2E2", accent: "#922B21", label: "#C0392B" },
  // 纳兰性德：冰雪情怀，山海关外，冰蓝色调
  "纳兰性德": { primary: "#1A6B8A", secondary: "#2E9EC1", bg1: "#EEF9FF", bg2: "#CCEEFF", accent: "#0D3F55", label: "#1A6B8A" },
  // 陆游：报国情怀，剑门求败，深棕红色调
  "陆游": { primary: "#8B2500", secondary: "#C0392B", bg1: "#FFF3F0", bg2: "#FFE4DC", accent: "#5C1800", label: "#8B2500" },
  // 柳永：浅唱低唱，济南烟雨，烟雨灰蓝色调
  "柳永": { primary: "#546E7A", secondary: "#78909C", bg1: "#F5F8FA", bg2: "#ECEFF1", accent: "#37474F", label: "#546E7A" },
  // 欧阳修：醒翁赋水，山色有无中，翠绿色调
  "欧阳修": { primary: "#2E7D32", secondary: "#43A047", bg1: "#F1FBF2", bg2: "#DCFCE7", accent: "#1B5E20", label: "#2E7D32" },
  // 刘禹锡：汉宫秋月，山上兰花，谷黄色调
  "刘禹锡": { primary: "#B8860B", secondary: "#DAA520", bg1: "#FFFDF0", bg2: "#FEF9C3", accent: "#7A5800", label: "#B8860B" },
  // 曹操：对酒当歌，气吸山河，钢铁灰色调
  "曹操": { primary: "#455A64", secondary: "#607D8B", bg1: "#F4F7F9", bg2: "#ECEFF1", accent: "#263238", label: "#455A64" },
  // 张若虚：春江花月，天海一色，月白色调
  "张若虚": { primary: "#4A6FA5", secondary: "#7BA7D4", bg1: "#EEF5FF", bg2: "#DBEAFE", accent: "#2C4A7A", label: "#4A6FA5" },
  // 王之浣：登鸹雀楼，落霞孤鹜，澄金色调
  "王之浣": { primary: "#C8860C", secondary: "#E6A817", bg1: "#FFFBEB", bg2: "#FEF3C7", accent: "#8A5A00", label: "#C8860C" },
  // 岑参：雪山天山，幽幽幽幽，冰雪白色调
  "岑参": { primary: "#1E6B8A", secondary: "#2E9EC1", bg1: "#EEF9FF", bg2: "#E0F2FE", accent: "#0D3F55", label: "#1E6B8A" },
  // 周邦彦：周密婷约，宫商流音，沉香紫色调
  "周邦彦": { primary: "#7B3F8A", secondary: "#9B59B6", bg1: "#F9F0FF", bg2: "#F3E8FF", accent: "#4A1A6B", label: "#7B3F8A" },
  // 黄庭坚：江西诗派，水墨丹青，湖蓝色调
  "黄庭坚": { primary: "#1B6B8A", secondary: "#2E9EC1", bg1: "#EEF9FF", bg2: "#E0F2FE", accent: "#0D3F55", label: "#1B6B8A" },
  // 姜夔：山水清音，白石道人，沉静灰蓝色调
  "姜夔": { primary: "#4A6B7A", secondary: "#6B8FA0", bg1: "#F2F8FA", bg2: "#E0EEF3", accent: "#2C4A55", label: "#4A6B7A" },
};

/** 获取诗人主题色（没有专属配色则根据契合度回退） */
function getPoetThemeColor(poetName: string, matchScore: number) {
  const poetTheme = POET_THEME_COLORS[poetName];
  if (poetTheme) return poetTheme;
  // 回退：根据契合度分配色
  if (matchScore >= 90) return { primary: "#C0392B", secondary: "#E74C3C", bg1: "#FFF5F5", bg2: "#FEE2E2", accent: "#922B21", label: "#C0392B" };
  if (matchScore >= 75) return { primary: "#C8960C", secondary: "#E6A817", bg1: "#FFFBEB", bg2: "#FEF3C7", accent: "#8A5A00", label: "#C8960C" };
  if (matchScore >= 60) return { primary: "#2D7D5A", secondary: "#4CAF85", bg1: "#F0FBF5", bg2: "#DCFCE7", accent: "#1B5E40", label: "#2D7D5A" };
  return { primary: "#546E7A", secondary: "#78909C", bg1: "#F5F8FA", bg2: "#ECEFF1", accent: "#37474F", label: "#546E7A" };
}

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
          className="fixed inset-0 z-50 flex flex-col items-center justify-end"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCardModal(false); }}
        >
          <div
            className="w-full max-w-md rounded-t-3xl p-5"
            style={{ background: "#FAF3E8", paddingBottom: "env(safe-area-inset-bottom, 24px)" }}
          >
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
            </div>
            <h3 className="text-center font-display text-base font-bold mb-1" style={{ color: "#2C1810" }}>🎨 分享卡片已生成</h3>
            <p className="text-center text-xs mb-3" style={{ color: "#8B6B4A" }}>
              微信中长按图片可保存到相册，浏览器可点「保存图片」
            </p>
            {/* 卡片预览 */}
            <div
              className="rounded-2xl overflow-hidden mb-4 mx-auto"
              style={{ maxHeight: "52vh", overflowY: "auto", boxShadow: "0 4px 24px rgba(0,0,0,0.18)", maxWidth: "320px" }}
            >
              <img
                src={cardDataUrl}
                alt="本命诗人分享卡片"
                className="w-full block"
                style={{ display: "block" }}
              />
            </div>
            {/* 保存按钮：同时支持 download 和长按提示 */}
            <button
              onClick={() => {
                // 尝试使用 download 属性
                const a = document.createElement("a");
                a.href = cardDataUrl;
                a.download = "天马本命诗人.png";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                // 微信内置浏览器不支持 download，提示用户长按
                setTimeout(() => {
                  toast.success("如未自动保存，请长按图片选「保存到相册」", { duration: 4000 });
                }, 500);
              }}
              className="w-full py-3.5 rounded-2xl font-bold text-base text-white mb-2 transition-all active:scale-95"
              style={{ background: "var(--vermilion)" }}
            >
              💾 保存到相册
            </button>
            <button
              onClick={() => {
                // 复制分享文案
                const text = `我的本命诗人是「${destiny?.poet ? (destiny.poet as {name:string}).name : "诗词达人"}」！www.tianmapoet.click`;
                navigator.clipboard?.writeText(text).then(() => toast.success("分享文案已复制，可直接发微信"));
              }}
              className="w-full py-3 rounded-2xl font-semibold text-sm mb-2 transition-all active:scale-95 border"
              style={{ background: "#07C160", color: "white", borderColor: "#07C160" }}
            >
              📱 复制分享文案
            </button>
            <button
              onClick={() => setShowCardModal(false)}
              className="w-full py-2 text-sm"
              style={{ color: "#8B6B4A" }}
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
