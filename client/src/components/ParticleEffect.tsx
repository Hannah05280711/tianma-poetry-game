import React, { useEffect, useState } from "react";
import { generateParticles } from "@/lib/gameVisualEffects";

interface ParticleEffectProps {
  trigger?: boolean;
  count?: number;
  colors?: string[];
  position?: { x: number; y: number };
  onComplete?: () => void;
}

/**
 * 粒子爆裂效果组件 - 用于满分通关、连胜里程碑等场景
 */
export default function ParticleEffect({
  trigger = false,
  count = 50,
  colors = ["#FFD700", "#FFA500", "#FF69B4", "#00CED1"],
  position = { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  onComplete,
}: ParticleEffectProps) {
  const [particles, setParticles] = useState<ReturnType<typeof generateParticles>>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      const newParticles = generateParticles(count, colors);
      setParticles(newParticles);

      // 动画完成后清理
      const timer = setTimeout(() => {
        setIsActive(false);
        setParticles([]);
        onComplete?.();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [trigger, count, colors, onComplete]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            backgroundColor: particle.color,
            boxShadow: `0 0 8px ${particle.color}`,
            ...particle.style,
          }}
        />
      ))}
    </div>
  );
}
