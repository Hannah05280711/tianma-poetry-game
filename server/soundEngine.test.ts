/**
 * soundEngine 单元测试
 *
 * 由于 Web Audio API 在 Node.js 环境中不可用，
 * 这里测试音效引擎的纯逻辑部分（频率表、函数导出、haptics 模式）。
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Web Audio API ───────────────────────────────────────────────────────
const mockOscillator = {
  type: "sine" as OscillatorType,
  frequency: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
};

const mockGain = {
  gain: {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
};

const mockFilter = {
  type: "lowpass" as BiquadFilterType,
  frequency: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
};

const mockDestination = {};

const mockCtx = {
  currentTime: 0,
  state: "running" as AudioContextState,
  resume: vi.fn().mockResolvedValue(undefined),
  createOscillator: vi.fn(() => ({ ...mockOscillator })),
  createGain: vi.fn(() => ({ ...mockGain })),
  createBiquadFilter: vi.fn(() => ({ ...mockFilter })),
  destination: mockDestination,
};

// 在 global 上挂载 AudioContext mock
vi.stubGlobal("AudioContext", vi.fn(() => mockCtx));
vi.stubGlobal("window", { AudioContext });

// ─── Mock navigator.vibrate ───────────────────────────────────────────────────
const mockVibrate = vi.fn().mockReturnValue(true);
vi.stubGlobal("navigator", { vibrate: mockVibrate });

// ─── 导入被测模块 ─────────────────────────────────────────────────────────────
import {
  PENTATONIC,
  isAudioSupported,
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
} from "../client/src/lib/soundEngine";

import {
  isVibrationSupported,
  hapticTap,
  hapticCorrect,
  hapticWrong,
  hapticCombo,
  hapticCombo3,
  hapticCombo5,
  hapticCombo10,
  hapticLevelComplete,
  hapticRankUp,
  hapticStreakBroken,
  hapticDestinyMatch,
  hapticGameStart,
  hapticTaskComplete,
} from "../client/src/lib/haptics";

import { isSoundEnabled, isHapticEnabled } from "../client/src/hooks/useSoundSettings";

// ─── 测试：五声音阶频率表 ─────────────────────────────────────────────────────
describe("PENTATONIC 频率表", () => {
  it("包含宫商角徵羽五音（C4-D4-E4-G4-A4）", () => {
    expect(PENTATONIC.C4).toBeCloseTo(261.63, 1);
    expect(PENTATONIC.D4).toBeCloseTo(293.66, 1);
    expect(PENTATONIC.E4).toBeCloseTo(329.63, 1);
    expect(PENTATONIC.G4).toBeCloseTo(392.0, 1);
    expect(PENTATONIC.A4).toBeCloseTo(440.0, 1);
  });

  it("包含高八度宫音 C5", () => {
    expect(PENTATONIC.C5).toBeCloseTo(523.25, 1);
  });

  it("C5 频率约为 C4 的两倍（八度关系）", () => {
    expect(PENTATONIC.C5! / PENTATONIC.C4!).toBeCloseTo(2.0, 1);
  });

  it("包含木鱼低音 C3 和 B2", () => {
    expect(PENTATONIC.C3).toBeCloseTo(130.81, 1);
    expect(PENTATONIC.B2).toBeCloseTo(123.47, 1);
  });
});

// ─── 测试：isAudioSupported ───────────────────────────────────────────────────
describe("isAudioSupported()", () => {
  it("在有 AudioContext 的环境中返回 true", () => {
    expect(isAudioSupported()).toBe(true);
  });
});

// ─── 测试：音效函数可调用 ─────────────────────────────────────────────────────
describe("音效函数调用", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx.createOscillator.mockReturnValue({ ...mockOscillator });
    mockCtx.createGain.mockReturnValue({ ...mockGain });
    mockCtx.createBiquadFilter.mockReturnValue({ ...mockFilter });
  });

  it("unlockAudio() 不抛出异常", () => {
    expect(() => unlockAudio()).not.toThrow();
  });

  it("playOptionTap() 不抛出异常", () => {
    expect(() => playOptionTap()).not.toThrow();
  });

  it("playCorrect() 不抛出异常", () => {
    expect(() => playCorrect()).not.toThrow();
  });

  it("playWrong() 不抛出异常", () => {
    expect(() => playWrong()).not.toThrow();
  });

  it("playCombo(3) 不抛出异常", () => {
    expect(() => playCombo(3)).not.toThrow();
  });

  it("playCombo(5) 不抛出异常", () => {
    expect(() => playCombo(5)).not.toThrow();
  });

  it("playCombo(10) 不抛出异常", () => {
    expect(() => playCombo(10)).not.toThrow();
  });

  it("playCombo(1) 不触发任何音效（低于3连击阈值）", () => {
    vi.clearAllMocks();
    playCombo(1);
    // 1连击不应触发编钟
    expect(mockCtx.createOscillator).not.toHaveBeenCalled();
  });

  it("playLevelComplete() 不抛出异常", () => {
    expect(() => playLevelComplete()).not.toThrow();
  });

  it("playRankUp() 不抛出异常", () => {
    expect(() => playRankUp()).not.toThrow();
  });

  it("playGameStart() 不抛出异常", () => {
    expect(() => playGameStart()).not.toThrow();
  });

  it("playDestinyMatch() 不抛出异常", () => {
    expect(() => playDestinyMatch()).not.toThrow();
  });

  it("playStreakBroken() 不抛出异常", () => {
    expect(() => playStreakBroken()).not.toThrow();
  });

  it("playTaskComplete() 不抛出异常", () => {
    expect(() => playTaskComplete()).not.toThrow();
  });
});

// ─── 测试：震动 API ───────────────────────────────────────────────────────────
describe("isVibrationSupported()", () => {
  it("在有 navigator.vibrate 的环境中返回 true", () => {
    expect(isVibrationSupported()).toBe(true);
  });
});

describe("haptics 震动模式", () => {
  beforeEach(() => {
    mockVibrate.mockClear();
  });

  it("hapticTap() 调用 vibrate(10)", () => {
    hapticTap();
    expect(mockVibrate).toHaveBeenCalledWith(10);
  });

  it("hapticCorrect() 调用 vibrate(40)", () => {
    hapticCorrect();
    expect(mockVibrate).toHaveBeenCalledWith(40);
  });

  it("hapticWrong() 调用双脉冲模式 [30,20,30]", () => {
    hapticWrong();
    expect(mockVibrate).toHaveBeenCalledWith([30, 20, 30]);
  });

  it("hapticCombo3() 调用 [20,10,20]", () => {
    hapticCombo3();
    expect(mockVibrate).toHaveBeenCalledWith([20, 10, 20]);
  });

  it("hapticCombo5() 调用 [20,10,20,10,20]", () => {
    hapticCombo5();
    expect(mockVibrate).toHaveBeenCalledWith([20, 10, 20, 10, 20]);
  });

  it("hapticCombo10() 调用渐强鼓点 [30,10,30,10,50]", () => {
    hapticCombo10();
    expect(mockVibrate).toHaveBeenCalledWith([30, 10, 30, 10, 50]);
  });

  it("hapticCombo(3) 触发 3连击模式", () => {
    hapticCombo(3);
    expect(mockVibrate).toHaveBeenCalledWith([20, 10, 20]);
  });

  it("hapticCombo(5) 触发 5连击模式", () => {
    hapticCombo(5);
    expect(mockVibrate).toHaveBeenCalledWith([20, 10, 20, 10, 20]);
  });

  it("hapticCombo(10) 触发 10连击模式", () => {
    hapticCombo(10);
    expect(mockVibrate).toHaveBeenCalledWith([30, 10, 30, 10, 50]);
  });

  it("hapticCombo(2) 不触发震动（低于3连击阈值）", () => {
    hapticCombo(2);
    expect(mockVibrate).not.toHaveBeenCalled();
  });

  it("hapticLevelComplete() 调用渐强庆祝模式", () => {
    hapticLevelComplete();
    expect(mockVibrate).toHaveBeenCalledWith([50, 20, 50, 20, 100]);
  });

  it("hapticRankUp() 调用段位晋升强震", () => {
    hapticRankUp();
    expect(mockVibrate).toHaveBeenCalledWith([100, 30, 100, 30, 200]);
  });

  it("hapticStreakBroken() 调用单次长震 80ms", () => {
    hapticStreakBroken();
    expect(mockVibrate).toHaveBeenCalledWith(80);
  });

  it("hapticDestinyMatch() 调用渐强心跳模式", () => {
    hapticDestinyMatch();
    expect(mockVibrate).toHaveBeenCalledWith([30, 50, 80]);
  });

  it("hapticGameStart() 调用极轻单震 20ms", () => {
    hapticGameStart();
    expect(mockVibrate).toHaveBeenCalledWith(20);
  });

  it("hapticTaskComplete() 调用轻快双震", () => {
    hapticTaskComplete();
    expect(mockVibrate).toHaveBeenCalledWith([20, 10, 20]);
  });
});

// ─── 测试：设置 Hook 默认值 ───────────────────────────────────────────────────
describe("useSoundSettings 默认值", () => {
  it("isSoundEnabled() 默认返回 true（localStorage 无值时）", () => {
    // Node 环境无 localStorage，函数应返回默认值 true
    expect(isSoundEnabled()).toBe(true);
  });

  it("isHapticEnabled() 默认返回 true（localStorage 无值时）", () => {
    expect(isHapticEnabled()).toBe(true);
  });
});
