/**
 * useSoundSettings — 声音与震动开关 Hook
 *
 * 将用户偏好持久化到 localStorage，并提供全局读写接口。
 * 在 soundEngine / haptics 调用前，先通过此 hook 检查开关状态。
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY_SOUND = "tianma_sound_enabled";
const STORAGE_KEY_HAPTIC = "tianma_haptic_enabled";

function readBool(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    return stored === "true";
  } catch {
    return defaultValue;
  }
}

interface SoundSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  toggleSound: () => void;
  toggleHaptic: () => void;
  setSoundEnabled: (v: boolean) => void;
  setHapticEnabled: (v: boolean) => void;
}

export function useSoundSettings(): SoundSettings {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() =>
    readBool(STORAGE_KEY_SOUND, true)
  );
  const [hapticEnabled, setHapticEnabledState] = useState<boolean>(() =>
    readBool(STORAGE_KEY_HAPTIC, true)
  );

  // 同步到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SOUND, String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HAPTIC, String(hapticEnabled));
  }, [hapticEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((v) => !v);
  }, []);

  const toggleHaptic = useCallback(() => {
    setHapticEnabledState((v) => !v);
  }, []);

  const setSoundEnabled = useCallback((v: boolean) => {
    setSoundEnabledState(v);
  }, []);

  const setHapticEnabled = useCallback((v: boolean) => {
    setHapticEnabledState(v);
  }, []);

  return {
    soundEnabled,
    hapticEnabled,
    toggleSound,
    toggleHaptic,
    setSoundEnabled,
    setHapticEnabled,
  };
}

// ─── 全局单例读取（非 React 环境使用） ──────────────────────────────────────

export function isSoundEnabled(): boolean {
  return readBool(STORAGE_KEY_SOUND, true);
}

export function isHapticEnabled(): boolean {
  return readBool(STORAGE_KEY_HAPTIC, true);
}
