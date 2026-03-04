import { useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getSessionKey(): string {
  let key = localStorage.getItem("v2_session_key");
  if (!key) {
    key = `v2_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("v2_session_key", key);
  }
  return key;
}

// 7个剧情章节定义（与V1段位系统完全独立）
const CHAPTERS = [
  {
    key: "bronze",
    title: "空山禅音",
    subtitle: "第一章",
    emoji: "🏔️",
    color: "#7C9A7E",
    bgColor: "rgba(124,154,126,0.08)",
    borderColor: "rgba(124,154,126,0.3)",
    desc: "入空山，寻禅意，悟诗心",
  },
  {
    key: "silver",
    title: "塞上风云",
    subtitle: "第二章",
    emoji: "🏜️",
    color: "#C4956A",
    bgColor: "rgba(196,149,106,0.08)",
    borderColor: "rgba(196,149,106,0.3)",
    desc: "踏边塞烽烟，听羌笛，感豪情",
  },
  {
    key: "gold",
    title: "九霄惊雷",
    subtitle: "第三章",
    emoji: "⛰️",
    color: "#6B9EC4",
    bgColor: "rgba(107,158,196,0.08)",
    borderColor: "rgba(107,158,196,0.3)",
    desc: "登高望远，感天地之广阔",
  },
  {
    key: "platinum",
    title: "沧海幻梦",
    subtitle: "第四章",
    emoji: "🌊",
    color: "#8B7EC4",
    bgColor: "rgba(139,126,196,0.08)",
    borderColor: "rgba(139,126,196,0.3)",
    desc: "入沧海幻境，寻谪仙遗迹，破幻梦",
  },
  {
    key: "diamond",
    title: "须弥见方",
    subtitle: "第五章",
    emoji: "🌸",
    color: "#C47E9E",
    bgColor: "rgba(196,126,158,0.08)",
    borderColor: "rgba(196,126,158,0.3)",
    desc: "于须弥一粟中，见万象，悟无常",
  },
  {
    key: "star",
    title: "浮世清响",
    subtitle: "第六章",
    emoji: "🎶",
    color: "#9EC47E",
    bgColor: "rgba(158,196,126,0.08)",
    borderColor: "rgba(158,196,126,0.3)",
    desc: "听浮世清音，感人间百态，诗意永存",
  },
  {
    key: "king",
    title: "万重归一",
    subtitle: "第七章·终章",
    emoji: "🔮",
    color: "#D4AF37",
    bgColor: "rgba(212,175,55,0.10)",
    borderColor: "rgba(212,175,55,0.4)",
    desc: "集七章之力，破毒龙封印，解救樊登！",
  },
];

export default function V2Map() {
  const [, navigate] = useLocation();
  const sessionKey = useMemo(() => getSessionKey(), []);
  const { data: stages, isLoading } = trpc.v2.getStages.useQuery({ sessionKey });

  // 按 tierKey 分组
  const grouped = useMemo(() => {
    if (!stages) return {};
    const g: Record<string, typeof stages> = {};
    for (const s of stages) {
      if (!g[s.tierKey]) g[s.tierKey] = [];
      g[s.tierKey].push(s);
    }
    return g;
  }, [stages]);

  const totalCompleted = stages?.filter(s => s.status === "completed").length ?? 0;
  const totalStages = stages?.length ?? 21;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a0a 100%)" }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚔️</div>
          <p style={{ color: "#D4AF37" }} className="text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a0a 100%)" }}>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(10,10,26,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm"
          style={{ color: "#D4AF37" }}>
          ← 返回首页
        </button>
        <div className="text-center">
          <div className="text-xs" style={{ color: "rgba(212,175,55,0.7)" }}>解救樊登·诗词闯关</div>
        </div>
        <button onClick={() => navigate("/v2/cards")} className="flex items-center gap-2 text-sm"
          style={{ color: "#D4AF37" }}>
          📚 卡牌
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 主线剧情介绍 */}
        <div className="rounded-2xl p-5 mb-6 text-center"
          style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)" }}>
          <div className="text-3xl mb-2">🐉</div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "#D4AF37" }}>解救樊登·诗词闯关</h1>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
            樊登在研读古籍时，被毒龙卷入诗词秘境。<br />
            你需要通过七章二十一关诗词考验，打破封印，解救樊登！
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: "#D4AF37" }}>{totalCompleted}</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>已通关</div>
            </div>
            <div className="w-px h-8" style={{ background: "rgba(212,175,55,0.3)" }} />
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>{totalStages}</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>总关卡</div>
            </div>
            <div className="w-px h-8" style={{ background: "rgba(212,175,55,0.3)" }} />
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: "#FF6B35" }}>
                {Math.round((totalCompleted / totalStages) * 100)}%
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>进度</div>
            </div>
          </div>
        </div>

        {/* 七章关卡地图 */}
        {CHAPTERS.map((chapter) => {
          const chapterStages = grouped[chapter.key] ?? [];
          if (chapterStages.length === 0) return null;
          const chapterCompleted = chapterStages.filter(s => s.status === "completed").length;
          const chapterTotal = chapterStages.length;
          const isChapterUnlocked = chapterStages.some(s => s.status !== "locked");
          const isChapterComplete = chapterCompleted === chapterTotal;

          return (
            <div key={chapter.key} className="mb-8">
              {/* 章节标题 */}
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xl"
                  style={{
                    background: isChapterUnlocked ? chapter.bgColor : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${isChapterUnlocked ? chapter.borderColor : "rgba(255,255,255,0.1)"}`,
                  }}>
                  {isChapterComplete ? "✅" : isChapterUnlocked ? chapter.emoji : "🔒"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {chapter.subtitle}
                    </span>
                    <span className="font-bold text-base"
                      style={{ color: isChapterUnlocked ? chapter.color : "rgba(255,255,255,0.3)" }}>
                      {chapter.title}
                    </span>
                    <span className="text-xs" style={{ color: isChapterUnlocked ? chapter.color + "80" : "rgba(255,255,255,0.2)" }}>
                      {chapterCompleted}/{chapterTotal}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5 truncate"
                    style={{ color: isChapterUnlocked ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)" }}>
                    {chapter.desc}
                  </div>
                </div>
              </div>

              {/* 章节进度条 */}
              {isChapterUnlocked && (
                <div className="h-0.5 rounded-full mx-1 mb-3 overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(chapterCompleted / chapterTotal) * 100}%`,
                      background: `linear-gradient(to right, ${chapter.color}80, ${chapter.color})`,
                    }} />
                </div>
              )}

              {/* 关卡卡片 */}
              <div className="space-y-2.5">
                {chapterStages.map((stage) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    chapterColor={chapter.color}
                    chapterBgColor={chapter.bgColor}
                    chapterBorderColor={chapter.borderColor}
                    onStart={() => navigate(`/v2/stage/${stage.id}`)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* 全通关彩蛋 */}
        {totalCompleted === totalStages && (
          <div className="rounded-2xl p-6 text-center mt-4"
            style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(255,107,53,0.2))", border: "1px solid rgba(212,175,55,0.5)" }}>
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#D4AF37" }}>恭喜！樊登已获救！</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
              你完成了全部七章二十一关，打败了毒龙，解救了樊登。<br />
              诗词的力量，让你们跨越了千年的时空！
            </p>
          </div>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}

// ── 关卡卡片组件 ──────────────────────────────────────────────
interface StageCardProps {
  stage: {
    id: number;
    stageNumber: number;
    stageName: string;
    tierKey: string;
    subLevel: number;
    difficulty: number;
    status: "locked" | "available" | "completed";
    bestCorrect: number;
    attemptCount: number;
    weaponEmoji: string | null;
  };
  chapterColor: string;
  chapterBgColor: string;
  chapterBorderColor: string;
  onStart: () => void;
}

function StageCard({ stage, chapterColor, chapterBgColor, chapterBorderColor, onStart }: StageCardProps) {
  const { data: debtInfo } = trpc.v2.checkDebts.useQuery(
    { sessionKey: localStorage.getItem("v2_session_key") ?? "", stageId: stage.id },
    { enabled: stage.status !== "locked" }
  );
  const isLocked = stage.status === "locked";
  const isCompleted = stage.status === "completed";
  const hasDebt = debtInfo?.hasDebt ?? false;

  return (
    <div
      className="rounded-xl p-3.5 transition-all duration-200"
      style={{
        background: isLocked ? "rgba(255,255,255,0.03)" : chapterBgColor,
        border: `1px solid ${isLocked ? "rgba(255,255,255,0.07)" : chapterBorderColor}`,
        opacity: isLocked ? 0.55 : 1,
      }}
    >
      <div className="flex items-center gap-3">
        {/* 兵器图标 */}
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
          style={{
            background: isCompleted
              ? "rgba(74,222,128,0.15)"
              : isLocked
                ? "rgba(255,255,255,0.04)"
                : `${chapterColor}18`,
            border: `1px solid ${isCompleted ? "rgba(74,222,128,0.35)" : isLocked ? "rgba(255,255,255,0.08)" : chapterBorderColor}`,
          }}>
          {isCompleted ? "✅" : isLocked ? "🔒" : stage.weaponEmoji ?? "⚔️"}
        </div>

        {/* 关卡信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              第{stage.stageNumber}关
            </span>
            {hasDebt && (
              <Badge className="text-xs px-1.5 py-0"
                style={{ background: "rgba(239,68,68,0.18)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                📜 诗债
              </Badge>
            )}
            {isCompleted && stage.bestCorrect === 10 && (
              <Badge className="text-xs px-1.5 py-0"
                style={{ background: "rgba(212,175,55,0.18)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.3)" }}>
                满分
              </Badge>
            )}
          </div>
          <div className="font-medium text-sm truncate"
            style={{ color: isLocked ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.9)" }}>
            {stage.stageName}
          </div>
          {!isLocked && stage.attemptCount > 0 && (
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              最高 {stage.bestCorrect}/10 · 挑战 {stage.attemptCount} 次
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        {!isLocked && (
          <Button
            size="sm"
            onClick={onStart}
            className="flex-shrink-0 text-xs px-3 h-8"
            style={{
              background: hasDebt
                ? "linear-gradient(135deg, #EF4444, #DC2626)"
                : isCompleted
                  ? `${chapterColor}28`
                  : `${chapterColor}30`,
              border: `1px solid ${hasDebt ? "rgba(239,68,68,0.5)" : chapterBorderColor}`,
              color: hasDebt ? "white" : chapterColor,
            }}>
            {hasDebt ? "还债" : isCompleted ? "再战" : "开始"}
          </Button>
        )}
      </div>
    </div>
  );
}
