/**
 * 游戏视觉反馈系统 - 学习Candy Crush的设计
 * 包含选项颜色编码、答题反馈动画、粒子效果等
 */

/**
 * 选项颜色编码（A红B蓝C绿D黄）
 * 建立用户的肌肉记忆，提升游戏体验
 */
export const OPTION_COLORS = {
  A: { hex: "#EF4444", name: "红", rgb: "239, 68, 68" },      // 鲜红
  B: { hex: "#3B82F6", name: "蓝", rgb: "59, 130, 246" },      // 天蓝
  C: { hex: "#10B981", name: "绿", rgb: "16, 185, 129" },      // 翠绿
  D: { hex: "#F59E0B", name: "黄", rgb: "245, 158, 11" },      // 金黄
} as const;

export type OptionKey = keyof typeof OPTION_COLORS;

/**
 * 获取选项的颜色
 */
export function getOptionColor(option: OptionKey): string {
  return OPTION_COLORS[option].hex;
}

/**
 * 获取选项的RGB值（用于阴影效果）
 */
export function getOptionRGB(option: OptionKey): string {
  return OPTION_COLORS[option].rgb;
}

/**
 * 答题反馈类型
 */
export type FeedbackType = "correct" | "incorrect" | "timeout";

/**
 * 答题反馈配置
 */
export const FEEDBACK_CONFIG = {
  correct: {
    duration: 600,
    color: "#10B981",
    borderColor: "#059669",
    glowColor: "rgba(16, 185, 129, 0.5)",
    animation: "pulse-glow",
    sound: "correct",
  },
  incorrect: {
    duration: 400,
    color: "#EF4444",
    borderColor: "#DC2626",
    glowColor: "rgba(239, 68, 68, 0.5)",
    animation: "shake",
    sound: "incorrect",
  },
  timeout: {
    duration: 300,
    color: "#6B7280",
    borderColor: "#4B5563",
    glowColor: "rgba(107, 114, 128, 0.3)",
    animation: "fade-out",
    sound: "timeout",
  },
} as const;

/**
 * 连胜里程碑配置
 */
export const STREAK_MILESTONES = [
  { streak: 3, label: "连胜×3", icon: "🔥", color: "#F59E0B", sound: "milestone_3" },
  { streak: 5, label: "连胜×5", icon: "⚡", color: "#3B82F6", sound: "milestone_5" },
  { streak: 10, label: "连胜×10", icon: "👑", color: "#9B2335", sound: "milestone_10" },
  { streak: 20, label: "连胜×20", icon: "🌟", color: "#F59E0B", sound: "milestone_20" },
] as const;

/**
 * 获取连胜里程碑信息
 */
export function getStreakMilestone(streak: number) {
  return STREAK_MILESTONES.filter((m) => streak >= m.streak).pop();
}

/**
 * 完美通关配置
 */
export const PERFECT_CLEAR_CONFIG = {
  duration: 1500,
  particleCount: 50,
  particleColors: ["#FFD700", "#FFA500", "#FF69B4", "#00CED1"],
  sound: "perfect_clear",
  text: "满分通关！",
} as const;

/**
 * CSS动画定义（应在全局样式中定义）
 */
export const ANIMATION_KEYFRAMES = `
@keyframes pulse-glow {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes fade-out {
  0% { opacity: 1; }
  100% { opacity: 0.3; }
}

@keyframes float-up {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px) scale(0.8);
  }
}

@keyframes particle-burst {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--tx), var(--ty)) scale(0);
  }
}
`;

/**
 * 生成粒子爆裂效果的样式
 * @param count 粒子数量
 * @param colors 粒子颜色数组
 * @returns 粒子元素配置数组
 */
export function generateParticles(
  count: number,
  colors: string[] = [...PERFECT_CLEAR_CONFIG.particleColors]
) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const distance = 80 + Math.random() * 40;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    const color = colors[i % colors.length];
    const delay = Math.random() * 100;

    particles.push({
      id: i,
      color,
      style: {
        "--tx": `${tx}px`,
        "--ty": `${ty}px`,
        animation: `particle-burst 1s ease-out ${delay}ms forwards`,
      } as React.CSSProperties,
    });
  }
  return particles;
}

/**
 * 获取答题反馈的CSS类名
 */
export function getFeedbackClassName(feedback: FeedbackType): string {
  return `feedback-${feedback}`;
}

/**
 * 生成答题反馈的样式对象
 */
export function getFeedbackStyle(feedback: FeedbackType, optionColor?: string) {
  const config = FEEDBACK_CONFIG[feedback];
  return {
    borderColor: config.borderColor,
    boxShadow: `0 0 20px ${config.glowColor}`,
    animation: `${config.animation} ${config.duration}ms ease-out`,
  };
}

/**
 * 检查是否应该显示连胜提示
 */
export function shouldShowStreakMilestone(currentStreak: number, previousStreak: number): boolean {
  const milestone = getStreakMilestone(currentStreak);
  return milestone ? currentStreak > previousStreak && currentStreak === milestone.streak : false;
}

/**
 * 生成浮动文字的样式
 */
export function getFloatingTextStyle(
  text: string,
  color: string = "#FFD700"
): React.CSSProperties {
  return {
    position: "fixed",
    fontSize: "24px",
    fontWeight: "bold",
    color: color,
    textShadow: `0 2px 8px rgba(0, 0, 0, 0.3)`,
    pointerEvents: "none",
    zIndex: 1000,
    animation: "float-up 1.5s ease-out forwards",
  };
}

/**
 * 验证选项颜色配置的完整性
 */
export function validateColorConfig(): boolean {
  const requiredOptions: OptionKey[] = ["A", "B", "C", "D"];
  return requiredOptions.every((opt) => OPTION_COLORS[opt] && OPTION_COLORS[opt].hex);
}

/**
 * 获取所有选项的颜色映射
 */
export function getAllOptionColors(): Record<OptionKey, string> {
  return {
    A: OPTION_COLORS.A.hex,
    B: OPTION_COLORS.B.hex,
    C: OPTION_COLORS.C.hex,
    D: OPTION_COLORS.D.hex,
  };
}
