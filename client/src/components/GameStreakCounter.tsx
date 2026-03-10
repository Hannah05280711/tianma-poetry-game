import React, { useEffect, useState } from "react";
import { getStreakMilestone, STREAK_MILESTONES } from "@/lib/gameVisualEffects";
import { playSound } from "@/lib/soundEffects";

interface GameStreakCounterProps {
  streak: number;
  visible?: boolean;
}

/**
 * 连胜计数器组件 - 显示当前连胜数和里程碑提示
 */
export default function GameStreakCounter({ streak, visible = true }: GameStreakCounterProps) {
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneData, setMilestoneData] = useState<(typeof STREAK_MILESTONES)[0] | null>(null);

  useEffect(() => {
    if (streak > 0) {
      const milestone = getStreakMilestone(streak);
      if (milestone && streak === milestone.streak) {
        setMilestoneData(milestone);
        setShowMilestone(true);
        // 播放里程碑音效
        playSound(milestone.sound);
        // 3秒后隐藏里程碑提示
        const timer = setTimeout(() => setShowMilestone(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [streak]);

  if (!visible || streak === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
      {/* 连胜计数器 */}
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold shadow-lg"
        style={{
          animation: streak > 0 ? "pulse 0.6s ease-out" : "none",
        }}
      >
        <span className="text-lg">🔥</span>
        <span className="text-xl">{streak}</span>
      </div>

      {/* 里程碑提示 */}
      {showMilestone && milestoneData && (
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-white font-bold text-center whitespace-nowrap shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${milestoneData.color}, ${milestoneData.color}dd)`,
            animation: "float-up 1.5s ease-out forwards",
            fontSize: "18px",
          }}
        >
          <span className="text-2xl mr-2">{milestoneData.icon}</span>
          {milestoneData.label}
        </div>
      )}
    </div>
  );
}
