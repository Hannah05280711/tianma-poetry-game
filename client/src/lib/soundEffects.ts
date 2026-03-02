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
