/**
 * feedback.ts — 统一的音效 + 震动调用入口
 *
 * 在调用前自动检查用户的声音/震动开关状态。
 * 游戏各页面只需 import 此文件，无需直接操作 soundEngine / haptics。
 */

import {
  playOptionTap,
  playCorrect,
  playWrong,
  playCombo,
  playLevelComplete,
  playRankUp,
  playGameStart,
  playDestinyMatch,
  playStreakBroken,
  playTaskComplete,
  unlockAudio,
} from "./soundEngine";

import {
  hapticTap,
  hapticCorrect,
  hapticWrong,
  hapticCombo,
  hapticLevelComplete,
  hapticRankUp,
  hapticGameStart,
  hapticDestinyMatch,
  hapticStreakBroken,
  hapticTaskComplete,
} from "./haptics";

import { isSoundEnabled, isHapticEnabled } from "../hooks/useSoundSettings";

// 重新导出 unlockAudio，供首次用户交互时调用
export { unlockAudio };

function sound(fn: () => void): void {
  if (isSoundEnabled()) fn();
}

function haptic(fn: () => void): void {
  if (isHapticEnabled()) fn();
}

/** 选项点击（按下瞬间） */
export function fbOptionTap(): void {
  sound(playOptionTap);
  haptic(hapticTap);
}

/** 答对 */
export function fbCorrect(): void {
  sound(playCorrect);
  haptic(hapticCorrect);
}

/** 答错 */
export function fbWrong(): void {
  sound(playWrong);
  haptic(hapticWrong);
}

/** 连击（传入当前连击数） */
export function fbCombo(comboCount: number): void {
  sound(() => playCombo(comboCount));
  haptic(() => hapticCombo(comboCount));
}

/** 关卡完成 */
export function fbLevelComplete(): void {
  sound(playLevelComplete);
  haptic(hapticLevelComplete);
}

/** 段位晋升 */
export function fbRankUp(): void {
  sound(playRankUp);
  haptic(hapticRankUp);
}

/** 开始答题 */
export function fbGameStart(): void {
  sound(playGameStart);
  haptic(hapticGameStart);
}

/** 本命诗人匹配完成 */
export function fbDestinyMatch(): void {
  sound(playDestinyMatch);
  haptic(hapticDestinyMatch);
}

/** 连胜中断 */
export function fbStreakBroken(): void {
  sound(playStreakBroken);
  haptic(hapticStreakBroken);
}

/** 每日任务完成 */
export function fbTaskComplete(): void {
  sound(playTaskComplete);
  haptic(hapticTaskComplete);
}
