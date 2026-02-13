// Web Audio API sound synthesis - no external files needed

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// Era-specific shooting sounds
export function playShootSound(eraId: string) {
  const ctx = getCtx();
  const now = ctx.currentTime;

  switch (eraId) {
    case "ancient": {
      // Twang - bow string
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    }
    case "medieval": {
      // Thud - crossbow bolt
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
      break;
    }
    case "modern": {
      // Sharp crack - rifle
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 1000;
      src.buffer = buffer;
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start(now);
      break;
    }
    case "future": {
      // Laser zap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2000, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
      // Add harmonics
      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(3000, now);
      osc2.frequency.exponentialRampToValueAtTime(600, now + 0.12);
      g2.gain.setValueAtTime(0.1, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc2.connect(g2).connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.12);
      break;
    }
  }
}

// Hit impact - short percussive burst
export function playHitSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
  }
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buffer;
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  src.connect(gain).connect(ctx.destination);
  src.start(now);
}

// Footstep sound
let lastFootstep = 0;
export function playFootstep(eraId: string) {
  const now = performance.now();
  if (now - lastFootstep < 350) return; // Rate limit
  lastFootstep = now;

  const ctx = getCtx();
  const t = ctx.currentTime;
  const pitchMap: Record<string, number> = { ancient: 80, medieval: 60, modern: 100, future: 120 };
  const freq = pitchMap[eraId] || 80;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq + Math.random() * 20, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

// Reload sound - mechanical clicks
export function playReloadSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(600 + i * 200, now + i * 0.15);
    osc.frequency.exponentialRampToValueAtTime(200, now + i * 0.15 + 0.05);
    gain.gain.setValueAtTime(0.15, now + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.06);
  }
}

// Ambient background loops
let ambientNodes: { osc?: OscillatorNode; gain?: GainNode; src?: AudioBufferSourceNode }[] = [];

export function startAmbient(eraId: string) {
  stopAmbient();
  const ctx = getCtx();
  const now = ctx.currentTime;

  switch (eraId) {
    case "ancient": {
      // Wind drone
      const bufLen = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.02;
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = "lowpass";
      filter.frequency.value = 400;
      src.buffer = buf;
      src.loop = true;
      gain.gain.value = 0.3;
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start(now);
      ambientNodes.push({ src, gain });
      break;
    }
    case "medieval": {
      // Low pad
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 110;
      gain.gain.value = 0.04;
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      ambientNodes.push({ osc, gain });
      break;
    }
    case "modern": {
      // City hum
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 60;
      gain.gain.value = 0.02;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 200;
      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(now);
      ambientNodes.push({ osc, gain });
      break;
    }
    case "future": {
      // Electronic pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 220;
      gain.gain.value = 0.03;
      lfo.type = "sine";
      lfo.frequency.value = 2;
      lfoGain.gain.value = 50;
      lfo.connect(lfoGain).connect(osc.frequency);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      lfo.start(now);
      ambientNodes.push({ osc, gain });
      break;
    }
  }
}

export function stopAmbient() {
  for (const n of ambientNodes) {
    try { n.osc?.stop(); } catch {}
    try { n.src?.stop(); } catch {}
    try { n.gain?.disconnect(); } catch {}
  }
  ambientNodes = [];
}
