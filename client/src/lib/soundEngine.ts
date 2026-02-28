/**
 * 天马行空·诗词游戏 音效引擎
 *
 * 基于 Web Audio API 实时合成中国传统乐器音色。
 * 所有音符取自五声音阶（宫商角徵羽 = C-D-E-G-A），
 * 无需加载外部音频文件，避免网络延迟。
 */

// ─── 五声音阶频率表（Hz） ───────────────────────────────────────────────────
export const PENTATONIC: Record<string, number> = {
  C3: 130.81,
  B2: 123.47,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392.0,
  A4: 440.0,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 784.0,
};

// ─── AudioContext 单例（懒初始化，避免浏览器自动播放策略限制） ──────────────
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx || _ctx.state === "closed") {
    try {
      _ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  // 浏览器可能因自动播放策略将 context 挂起，需要在用户交互后恢复
  if (_ctx.state === "suspended") {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

/** 在用户首次交互时调用，解锁 AudioContext */
export function unlockAudio(): void {
  getCtx();
}

// ─── 基础音符播放器 ─────────────────────────────────────────────────────────

interface NoteOptions {
  frequency: number;
  type?: OscillatorType;
  startTime?: number; // 相对于 ctx.currentTime 的偏移（秒）
  duration?: number; // 秒
  gainPeak?: number; // 0-1
  attack?: number; // 秒
  decay?: number; // 秒
  release?: number; // 秒
  pitchSlide?: number; // 音高滑落比例（0.98 = 滑落 2%）
  filterFreq?: number; // 低通滤波截止频率
  harmonics?: number[]; // 泛音倍数（编钟用）
  harmonicGains?: number[]; // 各泛音增益
}

function playNote(ctx: AudioContext, opts: NoteOptions): void {
  const {
    frequency,
    type = "triangle",
    startTime = 0,
    duration = 0.2,
    gainPeak = 0.5,
    attack = 0.005,
    decay = duration * 0.8,
    release = duration * 0.2,
    pitchSlide,
    filterFreq,
    harmonics,
    harmonicGains,
  } = opts;

  const t0 = ctx.currentTime + startTime;

  const freqList = harmonics
    ? [frequency, ...harmonics.map((h) => frequency * h)]
    : [frequency];
  const gainList = harmonics
    ? [gainPeak, ...(harmonicGains ?? harmonics.map(() => gainPeak * 0.2))]
    : [gainPeak];

  freqList.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (pitchSlide && i === 0) {
      osc.frequency.exponentialRampToValueAtTime(
        freq * pitchSlide,
        t0 + duration
      );
    }

    // ADSR 包络
    gainNode.gain.setValueAtTime(0, t0);
    gainNode.gain.linearRampToValueAtTime(gainList[i]!, t0 + attack);
    gainNode.gain.linearRampToValueAtTime(
      gainList[i]! * 0.6,
      t0 + attack + decay
    );
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    if (filterFreq) {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterFreq, t0);
      filter.frequency.exponentialRampToValueAtTime(
        filterFreq * 0.3,
        t0 + duration
      );
      osc.connect(filter);
      filter.connect(gainNode);
    } else {
      osc.connect(gainNode);
    }

    gainNode.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + release);
  });
}

// ─── 乐器音色 ────────────────────────────────────────────────────────────────

/**
 * 古筝轻拨音（选项点击确认）
 * 三角波 + 快速衰减，模拟拨弦后止音
 */
function guzhengTap(ctx: AudioContext, freq: number, volume = 0.3): void {
  playNote(ctx, {
    frequency: freq,
    type: "triangle",
    duration: 0.1,
    gainPeak: volume,
    attack: 0.004,
    decay: 0.07,
    pitchSlide: 0.985,
  });
}

/**
 * 古筝双音上行（答对）
 * 两个十六分音符，间隔 80ms，第二音略强
 */
function guzhengCorrect(ctx: AudioContext, volume = 0.65): void {
  // 徵（G4）→ 宫（C5）上行纯四度
  playNote(ctx, {
    frequency: PENTATONIC.G4!,
    type: "triangle",
    startTime: 0,
    duration: 0.18,
    gainPeak: volume * 0.8,
    attack: 0.004,
    pitchSlide: 0.99,
  });
  playNote(ctx, {
    frequency: PENTATONIC.C5!,
    type: "triangle",
    startTime: 0.09,
    duration: 0.22,
    gainPeak: volume,
    attack: 0.004,
    pitchSlide: 0.985,
  });
}

/**
 * 木鱼双击（答错）
 * 方波 + 低通滤波，模拟木质叩击感
 */
function muyuWrong(ctx: AudioContext, volume = 0.5): void {
  // 第一击
  playNote(ctx, {
    frequency: PENTATONIC.C3!,
    type: "square",
    startTime: 0,
    duration: 0.09,
    gainPeak: volume,
    attack: 0.003,
    filterFreq: 900,
  });
  // 第二击（略低，模拟余韵）
  playNote(ctx, {
    frequency: PENTATONIC.B2!,
    type: "square",
    startTime: 0.07,
    duration: 0.11,
    gainPeak: volume * 0.8,
    attack: 0.003,
    filterFreq: 600,
  });
}

/**
 * 编钟单音（连击）
 * 正弦波 + 泛音叠加，模拟金属余韵
 */
function bianzhouSingle(
  ctx: AudioContext,
  freq: number,
  volume = 0.65
): void {
  playNote(ctx, {
    frequency: freq,
    type: "sine",
    duration: 0.6,
    gainPeak: volume,
    attack: 0.008,
    harmonics: [2.76, 5.4],
    harmonicGains: [volume * 0.25, volume * 0.08],
  });
}

/**
 * 编钟三音上行琶音（关卡完成 / 段位晋升）
 * E4 → G4 → C5，间隔 90ms
 */
function bianzhouArpeggio(ctx: AudioContext, volume = 0.75): void {
  const notes = [PENTATONIC.E4!, PENTATONIC.G4!, PENTATONIC.C5!];
  notes.forEach((freq, i) => {
    playNote(ctx, {
      frequency: freq,
      type: "sine",
      startTime: i * 0.09,
      duration: 0.7 + i * 0.1,
      gainPeak: volume * (0.7 + i * 0.15),
      attack: 0.008,
      harmonics: [2.76, 5.4],
      harmonicGains: [volume * 0.2, volume * 0.06],
    });
  });
}

/**
 * 编钟大三和弦（段位晋升专用）
 * C4 + E4 + G4 同时响起，余音 1.5s
 */
function bianzhouChord(ctx: AudioContext, volume = 0.7): void {
  [PENTATONIC.C4!, PENTATONIC.E4!, PENTATONIC.G4!].forEach((freq) => {
    playNote(ctx, {
      frequency: freq,
      type: "sine",
      duration: 1.5,
      gainPeak: volume * 0.6,
      attack: 0.01,
      harmonics: [2.76],
      harmonicGains: [volume * 0.15],
    });
  });
}

/**
 * 古琴单音（开始答题 / 界面入场）
 * 正弦波 + 轻微泛音，模拟古琴空弦
 */
function guqinSingle(ctx: AudioContext, freq: number, volume = 0.5): void {
  playNote(ctx, {
    frequency: freq,
    type: "sine",
    duration: 0.5,
    gainPeak: volume,
    attack: 0.012,
    pitchSlide: 0.995,
    harmonics: [2.0, 3.0],
    harmonicGains: [volume * 0.12, volume * 0.04],
  });
}

/**
 * 古琴双弦（本命诗人匹配）
 * C4 + G4 同时，余音悠长
 */
function guqinDuo(ctx: AudioContext, volume = 0.6): void {
  [PENTATONIC.C4!, PENTATONIC.G4!].forEach((freq) => {
    playNote(ctx, {
      frequency: freq,
      type: "sine",
      duration: 1.8,
      gainPeak: volume * 0.65,
      attack: 0.015,
      pitchSlide: 0.993,
      harmonics: [2.0],
      harmonicGains: [volume * 0.1],
    });
  });
}

/**
 * 五声音阶上行琶音（关卡完成庆祝）
 * C4→D4→E4→G4→A4→C5，间隔 80ms
 */
function pentatonicCelebration(ctx: AudioContext, volume = 0.7): void {
  const notes = [
    PENTATONIC.C4!,
    PENTATONIC.D4!,
    PENTATONIC.E4!,
    PENTATONIC.G4!,
    PENTATONIC.A4!,
    PENTATONIC.C5!,
  ];
  notes.forEach((freq, i) => {
    const isLast = i === notes.length - 1;
    playNote(ctx, {
      frequency: freq,
      type: "triangle",
      startTime: i * 0.08,
      duration: isLast ? 0.8 : 0.15,
      gainPeak: volume * (0.6 + i * 0.07),
      attack: 0.005,
      pitchSlide: isLast ? 0.99 : undefined,
    });
  });
}

/**
 * 古筝下行滑音（连胜中断）
 * A4 → C4 下行大六度，带颤音
 */
function guzhengFall(ctx: AudioContext, volume = 0.55): void {
  const ctx_ = ctx;
  const t0 = ctx_.currentTime;
  const osc = ctx_.createOscillator();
  const gain = ctx_.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(PENTATONIC.A4!, t0);
  osc.frequency.exponentialRampToValueAtTime(PENTATONIC.C4!, t0 + 0.4);

  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);

  osc.connect(gain);
  gain.connect(ctx_.destination);
  osc.start(t0);
  osc.stop(t0 + 0.5);
}

// ─── 公开 API ────────────────────────────────────────────────────────────────

/** 检查是否支持 Web Audio API */
export function isAudioSupported(): boolean {
  return typeof window !== "undefined" && "AudioContext" in window;
}

/** 播放选项点击音（古筝轻拨） */
export function playOptionTap(): void {
  const ctx = getCtx();
  if (!ctx) return;
  guzhengTap(ctx, PENTATONIC.G4!, 0.28);
}

/** 播放答对音（古筝上行双音） */
export function playCorrect(): void {
  const ctx = getCtx();
  if (!ctx) return;
  guzhengCorrect(ctx, 0.65);
}

/** 播放答错音（木鱼双击） */
export function playWrong(): void {
  const ctx = getCtx();
  if (!ctx) return;
  muyuWrong(ctx, 0.5);
}

/** 播放连击音（编钟，按连击数升调） */
export function playCombo(comboCount: number): void {
  const ctx = getCtx();
  if (!ctx) return;
  if (comboCount >= 10) {
    bianzhouArpeggio(ctx, 0.7);
  } else if (comboCount >= 5) {
    bianzhouSingle(ctx, PENTATONIC.G4!, 0.65);
  } else if (comboCount >= 3) {
    bianzhouSingle(ctx, PENTATONIC.E4!, 0.6);
  }
}

/** 播放关卡完成庆祝音（五声琶音） */
export function playLevelComplete(): void {
  const ctx = getCtx();
  if (!ctx) return;
  pentatonicCelebration(ctx, 0.72);
}

/** 播放段位晋升音（编钟大三和弦） */
export function playRankUp(): void {
  const ctx = getCtx();
  if (!ctx) return;
  bianzhouChord(ctx, 0.72);
}

/** 播放开始答题音（古琴单音） */
export function playGameStart(): void {
  const ctx = getCtx();
  if (!ctx) return;
  guqinSingle(ctx, PENTATONIC.C4!, 0.5);
}

/** 播放本命诗人匹配完成音（古琴双弦） */
export function playDestinyMatch(): void {
  const ctx = getCtx();
  if (!ctx) return;
  guqinDuo(ctx, 0.6);
}

/** 播放连胜中断音（古筝下行滑音） */
export function playStreakBroken(): void {
  const ctx = getCtx();
  if (!ctx) return;
  guzhengFall(ctx, 0.55);
}

/** 播放每日任务完成音（笛子短音，用古筝高音模拟） */
export function playTaskComplete(): void {
  const ctx = getCtx();
  if (!ctx) return;
  // G4 → A4 上行小二度，轻盈
  playNote(ctx, {
    frequency: PENTATONIC.G4!,
    type: "triangle",
    startTime: 0,
    duration: 0.12,
    gainPeak: 0.55,
    attack: 0.005,
  });
  playNote(ctx, {
    frequency: PENTATONIC.A4!,
    type: "triangle",
    startTime: 0.1,
    duration: 0.18,
    gainPeak: 0.6,
    attack: 0.005,
    pitchSlide: 0.99,
  });
}
