/**
 * 天马行空·诗词游戏 震动反馈模块
 *
 * 封装 Web Vibration API，提供语义化的震动模式。
 * iOS Safari 不支持 Vibration API，调用时会静默忽略。
 * 所有震动均为渐进增强（Progressive Enhancement）。
 */

/** 检查是否支持 Web Vibration API */
export function isVibrationSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

/** 底层震动调用，自动处理不支持的情况 */
function vibrate(pattern: number | number[]): void {
  if (!isVibrationSupported()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // 静默忽略
  }
}

// ─── 语义化震动模式 ──────────────────────────────────────────────────────────

/** 选项点击确认（极轻，10ms） */
export function hapticTap(): void {
  vibrate(10);
}

/** 答对反馈（中等，40ms 单震） */
export function hapticCorrect(): void {
  vibrate(40);
}

/** 答错反馈（双脉冲，模拟"摇头"节律） */
export function hapticWrong(): void {
  vibrate([30, 20, 30]);
}

/** 3连击（轻快双震） */
export function hapticCombo3(): void {
  vibrate([20, 10, 20]);
}

/** 5连击（三震节奏加速） */
export function hapticCombo5(): void {
  vibrate([20, 10, 20, 10, 20]);
}

/** 10连击（渐强鼓点） */
export function hapticCombo10(): void {
  vibrate([30, 10, 30, 10, 50]);
}

/** 按连击数自动选择震动模式 */
export function hapticCombo(comboCount: number): void {
  if (comboCount >= 10) {
    hapticCombo10();
  } else if (comboCount >= 5) {
    hapticCombo5();
  } else if (comboCount >= 3) {
    hapticCombo3();
  }
}

/** 关卡完成庆祝（渐强节律） */
export function hapticLevelComplete(): void {
  vibrate([50, 20, 50, 20, 100]);
}

/** 段位晋升（强烈庆祝，加冕仪式感） */
export function hapticRankUp(): void {
  vibrate([100, 30, 100, 30, 200]);
}

/** 连胜中断（单次较长震动，沉重感） */
export function hapticStreakBroken(): void {
  vibrate(80);
}

/** 本命诗人匹配完成（三段渐强，心跳加速） */
export function hapticDestinyMatch(): void {
  vibrate([30, 50, 80]);
}

/** 开始答题（极轻单震，仪式感） */
export function hapticGameStart(): void {
  vibrate(20);
}

/** 每日任务完成（轻快双震） */
export function hapticTaskComplete(): void {
  vibrate([20, 10, 20]);
}
