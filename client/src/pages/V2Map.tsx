import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// 本地 sessionKey（无需登录）
function getSessionKey(): string {
  let key = localStorage.getItem("v2_session_key");
  if (!key) {
    key = `v2_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("v2_session_key", key);
  }
  return key;
}

const TIER_INFO: Record<string, { label: string; emoji: string; color: string; bgColor: string; borderColor: string }> = {
  bronze:   { label: "青铜剑",  emoji: "🗡️",  color: "#CD7F32", bgColor: "rgba(205,127,50,0.08)",  borderColor: "rgba(205,127,50,0.3)" },
  silver:   { label: "白银枪",  emoji: "🔱",  color: "#A8A9AD", bgColor: "rgba(168,169,173,0.08)", borderColor: "rgba(168,169,173,0.3)" },
  gold:     { label: "黄金刀",  emoji: "⚔️",  color: "#FFD700", bgColor: "rgba(255,215,0,0.08)",   borderColor: "rgba(255,215,0,0.3)" },
  platinum: { label: "铂金戟",  emoji: "🏆",  color: "#5B8FA8", bgColor: "rgba(91,143,168,0.08)",  borderColor: "rgba(91,143,168,0.3)" },
  diamond:  { label: "钻石弓",  emoji: "💎",  color: "#B9F2FF", bgColor: "rgba(185,242,255,0.08)", borderColor: "rgba(185,242,255,0.3)" },
  star:     { label: "星耀扇",  emoji: "✨",  color: "#F0C040", bgColor: "rgba(240,192,64,0.08)",  borderColor: "rgba(240,192,64,0.3)" },
  king:     { label: "王者笔",  emoji: "👑",  color: "#FF6B35", bgColor: "rgba(255,107,53,0.08)",  borderColor: "rgba(255,107,53,0.3)" },
};

const TIER_ORDER = ["bronze", "silver", "gold", "platinum", "diamond", "star", "king"];

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
            你需要通过21关诗词考验，打破封印，解救樊登！
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

        {/* 关卡地图 */}
        {TIER_ORDER.map((tierKey) => {
          const tierStages = grouped[tierKey] ?? [];
          const info = TIER_INFO[tierKey];
          if (tierStages.length === 0) return null;

          const tierCompleted = tierStages.filter(s => s.status === "completed").length;
          const tierTotal = tierStages.length;

          return (
            <div key={tierKey} className="mb-6">
              {/* 段位标题 */}
              <div className="flex items-center gap-3 mb-3 px-1">
                <span className="text-2xl">{info.emoji}</span>
                <div>
                  <h2 className="font-bold text-base" style={{ color: info.color }}>{info.label}</h2>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {tierCompleted}/{tierTotal} 关通过
                  </div>
                </div>
                <div className="flex-1 h-px ml-2" style={{ background: `linear-gradient(to right, ${info.color}40, transparent)` }} />
              </div>

              {/* 关卡卡片 */}
              <div className="space-y-3">
                {tierStages.map((stage) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    tierInfo={info}
                    sessionKey={sessionKey}
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
              你完成了全部21关，打败了毒龙，解救了樊登。<br />
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
  tierInfo: { color: string; bgColor: string; borderColor: string };
  sessionKey: string;
  onStart: () => void;
}

function StageCard({ stage, tierInfo, onStart }: StageCardProps) {
  const { data: debtInfo } = trpc.v2.checkDebts.useQuery(
    { sessionKey: localStorage.getItem("v2_session_key") ?? "", stageId: stage.id },
    { enabled: stage.status !== "locked" }
  );

  const isLocked = stage.status === "locked";
  const isCompleted = stage.status === "completed";
  const hasDebt = debtInfo?.hasDebt ?? false;

  return (
    <div
      className="rounded-xl p-4 transition-all duration-200"
      style={{
        background: isLocked ? "rgba(255,255,255,0.03)" : tierInfo.bgColor,
        border: `1px solid ${isLocked ? "rgba(255,255,255,0.08)" : tierInfo.borderColor}`,
        opacity: isLocked ? 0.6 : 1,
      }}
    >
      <div className="flex items-center gap-3">
        {/* 状态图标 */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: isCompleted
              ? "rgba(74,222,128,0.2)"
              : isLocked
                ? "rgba(255,255,255,0.05)"
                : `rgba(${tierInfo.color === "#D4AF37" ? "212,175,55" : "255,255,255"},0.1)`,
            border: `1px solid ${isCompleted ? "rgba(74,222,128,0.4)" : isLocked ? "rgba(255,255,255,0.1)" : tierInfo.borderColor}`,
          }}>
          {isCompleted ? "✅" : isLocked ? "🔒" : stage.weaponEmoji ?? "⚔️"}
        </div>

        {/* 关卡信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              第{stage.stageNumber}关
            </span>
            {hasDebt && (
              <Badge className="text-xs px-1.5 py-0"
                style={{ background: "rgba(239,68,68,0.2)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                📜 诗债未还
              </Badge>
            )}
            {isCompleted && stage.bestCorrect === 10 && (
              <Badge className="text-xs px-1.5 py-0"
                style={{ background: "rgba(212,175,55,0.2)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.3)" }}>
                满分
              </Badge>
            )}
          </div>
          <div className="font-medium text-sm truncate"
            style={{ color: isLocked ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.9)" }}>
            {stage.stageName}
          </div>
          {!isLocked && stage.attemptCount > 0 && (
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              最高 {stage.bestCorrect}/10 · 挑战 {stage.attemptCount} 次
            </div>
          )}
          {/* 难度星级 */}
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-xs"
                style={{ color: i < stage.difficulty ? "#D4AF37" : "rgba(255,255,255,0.15)" }}>
                ★
              </span>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        {!isLocked && (
          <Button
            size="sm"
            onClick={onStart}
            className="flex-shrink-0 text-xs px-3"
            style={{
              background: hasDebt
                ? "linear-gradient(135deg, #EF4444, #DC2626)"
                : isCompleted
                  ? "linear-gradient(135deg, rgba(74,222,128,0.3), rgba(34,197,94,0.3))"
                  : `linear-gradient(135deg, ${tierInfo.color}40, ${tierInfo.color}20)`,
              border: `1px solid ${hasDebt ? "rgba(239,68,68,0.5)" : tierInfo.borderColor}`,
              color: hasDebt ? "white" : isCompleted ? "#4ADE80" : tierInfo.color,
            }}>
            {hasDebt ? "还债" : isCompleted ? "再战" : "开始"}
          </Button>
        )}
      </div>
    </div>
  );
}
