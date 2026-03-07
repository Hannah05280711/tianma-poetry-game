/**
 * 游戏音效模块
 * 使用 Web Audio API 合成音效，无需外部音频文件
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** 播放烟花声效（答对时：欢快的升调爆炸声） */
export function playFireworkSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // 恢复被暂停的AudioContext（移动端需要用户手势后才能播放）
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;

  // 第一声：短促的爆炸声（噪声爆发）
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
  }
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.6, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 800;
  noiseFilter.Q.value = 0.5;
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noiseSource.start(now);

  // 第二声：欢快的上升音调（叮叮声）
  const tones = [523, 659, 784, 1047]; // C5, E5, G5, C6
  tones.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.06);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + i * 0.06 + 0.1);
    gain.gain.setValueAtTime(0.3, now + i * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.06);
    osc.stop(now + i * 0.06 + 0.25);
  });

  // 第三声：散射的高频闪光声
  for (let i = 0; i < 5; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + 0.1 + i * 0.04;
    const freq = 1200 + Math.random() * 800;
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.12);
  }
}

/** 播放鞭炮声效（答错时：降调的爆裂声） */
export function playFirecrackerSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;

  // 连续几声短促的爆裂声（模拟鞭炮）
  const crackerCount = 3;
  for (let i = 0; i < crackerCount; i++) {
    const delay = i * 0.12;

    // 爆裂噪声
    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < bufferSize; j++) {
      data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.05));
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5 - i * 0.1, now + delay);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 400;
    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now + delay);

    // 降调音调（失落感）
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300 - i * 40, now + delay);
    osc.frequency.exponentialRampToValueAtTime(80, now + delay + 0.15);
    gain.gain.setValueAtTime(0.2, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.18);
  }
}

/** 初始化音频上下文（需要在用户手势事件中调用） */
export function initAudio(): void {
  getAudioContext();
}

// ═══════════════════════════════════════════════════════════════════════════
// V2「解救樊登」章节音效 - 8-bit Chiptune 风格
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 播放简单的正弦波音调
 */
function playTone(
  frequency: number,
  duration: number,
  volume: number = 0.3,
  envelope?: { attack?: number; decay?: number; sustain?: number; release?: number }
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = frequency;

  const att = envelope?.attack ?? 0.01;
  const dec = envelope?.decay ?? 0.1;
  const sus = envelope?.sustain ?? 0.5;
  const rel = envelope?.release ?? 0.1;

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + att);
  gain.gain.linearRampToValueAtTime(volume * sus, now + att + dec);
  gain.gain.setValueAtTime(volume * sus, now + att + dec + (duration - att - dec - rel));
  gain.gain.linearRampToValueAtTime(0, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

/**
 * 播放带有延迟效果的音调 - 用于答对反馈
 */
function playToneWithDelay(
  frequency: number,
  duration: number,
  volume: number = 0.3
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const delay = ctx.createDelay();
  const delayGain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.1);
  gain.gain.linearRampToValueAtTime(0, now + duration);

  delay.delayTime.value = 0.15;
  delayGain.gain.value = 0.4;

  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

/**
 * 播放带有频率下行效果的音调 - 用于答错反馈
 */
function playToneWithPitchDrop(
  startFreq: number,
  endFreq: number,
  duration: number,
  volume: number = 0.3
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.linearRampToValueAtTime(0, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

/**
 * 播放方波 - 用于更"8-bit"的音效
 */
function playSquareTone(
  frequency: number,
  duration: number,
  volume: number = 0.2
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.linearRampToValueAtTime(0, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

// ─────────────────────────────────────────────────────────────────────────
// 第一章：【空山禅音】- 电子木鱼、清脆古磬
// ─────────────────────────────────────────────────────────────────────────

export const chapter1Sounds = {
  correct: () => playToneWithDelay(220, 0.4, 0.3),
  incorrect: () => playToneWithPitchDrop(400, 150, 0.3, 0.3),
  levelUp: () => playTone(660, 0.8, 0.4, { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.2 })
};

// ─────────────────────────────────────────────────────────────────────────
// 第二章：【塞上风云】- 电子琵琶、急促鼓点
// ─────────────────────────────────────────────────────────────────────────

export const chapter2Sounds = {
  correct: () => {
    playSquareTone(880, 0.15, 0.25);
    setTimeout(() => playSquareTone(660, 0.1, 0.2), 80);
  },
  incorrect: () => playToneWithPitchDrop(1200, 300, 0.25, 0.35),
  levelUp: () => {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => playSquareTone(880 - i * 100, 0.1, 0.2), i * 80);
    }
    setTimeout(() => playTone(110, 0.3, 0.4), 400);
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 第三章：【九霄惊雷】- 电子古筝、白噪声雷声
// ─────────────────────────────────────────────────────────────────────────

export const chapter3Sounds = {
  correct: () => {
    playSquareTone(1320, 0.08, 0.25);
    setTimeout(() => playSquareTone(1100, 0.08, 0.2), 100);
  },
  incorrect: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  },
  levelUp: () => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playSquareTone(880 + i * 220, 0.1, 0.25), i * 120);
    }
    setTimeout(() => playTone(150, 0.4, 0.35, { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.1 }), 600);
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 第四章：【沧海幻梦】- 电子排箫、空灵水滴
// ─────────────────────────────────────────────────────────────────────────

export const chapter4Sounds = {
  correct: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(550, now + 0.3);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  },
  incorrect: () => playToneWithPitchDrop(300, 100, 0.25, 0.25),
  levelUp: () => {
    const frequencies = [440, 550, 660, 550, 440];
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }, i * 150);
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 第五章：【须弥见方】- 电子编钟、厚重金属感
// ─────────────────────────────────────────────────────────────────────────

export const chapter5Sounds = {
  correct: () => playTone(660, 0.3, 0.35, { attack: 0.02, decay: 0.15, sustain: 0.3, release: 0.1 }),
  incorrect: () => {
    playSquareTone(800, 0.2, 0.3);
    setTimeout(() => playSquareTone(500, 0.15, 0.25), 100);
  },
  levelUp: () => {
    const frequencies = [330, 440, 550, 660];
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        playTone(freq, 0.5, 0.3, { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.15 });
      }, i * 100);
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 第六章：【浮世清响】- 电子笛子、喧闹背景音
// ─────────────────────────────────────────────────────────────────────────

export const chapter6Sounds = {
  correct: () => playSquareTone(1000, 0.12, 0.25),
  incorrect: () => playToneWithPitchDrop(1500, 600, 0.25, 0.3),
  levelUp: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.5);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }
};

// ─────────────────────────────────────────────────────────────────────────
// 第七章：【万重归一】- 电子古琴、极简正弦波
// ─────────────────────────────────────────────────────────────────────────

export const chapter7Sounds = {
  correct: () => playTone(330, 0.5, 0.25, { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.2 }),
  incorrect: () => playToneWithPitchDrop(400, 200, 0.3, 0.25),
  levelUp: () => {
    const frequencies = [220, 330, 440, 550, 660];
    frequencies.forEach((freq) => {
      playTone(freq, 0.4, 0.2, { attack: 0.05, decay: 0.15, sustain: 0.2, release: 0.1 });
    });
    setTimeout(() => {
      playTone(440, 1.2, 0.3, { attack: 0.1, decay: 0.3, sustain: 0.5, release: 0.3 });
    }, 500);
  }
};

// 所有章节音效
const chapterSounds = [chapter1Sounds, chapter2Sounds, chapter3Sounds, chapter4Sounds, chapter5Sounds, chapter6Sounds, chapter7Sounds];

/**
 * 根据章节ID获取对应的音效
 */
export function getChapterSounds(chapterId: number) {
  const index = chapterId - 1;
  if (index >= 0 && index < chapterSounds.length) {
    return chapterSounds[index];
  }
  return chapter1Sounds;
}
