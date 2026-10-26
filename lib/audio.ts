// Synthetische Soundeffekte über die Web Audio API – keine Audiodateien nötig.

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function ac(): AudioContext | null {
  if (typeof window === "undefined" || !enabled) return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; gain?: number; delay?: number; slide?: number } = {}) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + (opts.delay ?? 0);
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t);
  if (opts.slide) osc.frequency.exponentialRampToValueAtTime(opts.slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.15, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(dur: number, opts: { gain?: number; delay?: number; freq?: number } = {}) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + (opts.delay ?? 0);
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = opts.freq ?? 2500;
  const g = a.createGain();
  g.gain.value = opts.gain ?? 0.2;
  src.connect(filter).connect(g).connect(a.destination);
  src.start(t);
}

export const sfx = {
  card() {
    noise(0.09, { gain: 0.25, freq: 3200 });
  },
  /** Glasmurmel klackert über n Felder. */
  steps(n: number, stepMs: number) {
    for (let i = 0; i < Math.min(n, 14); i++) tone(1800 + Math.random() * 400, 0.04, { type: "triangle", gain: 0.05, delay: (i * stepMs) / 1000 });
  },
  land(delayMs = 0) {
    tone(2600, 0.12, { type: "sine", gain: 0.12, delay: delayMs / 1000 });
    tone(3900, 0.08, { type: "sine", gain: 0.06, delay: delayMs / 1000 + 0.01 });
  },
  capture(delayMs = 0) {
    const d = delayMs / 1000;
    tone(220, 0.25, { type: "square", gain: 0.08, delay: d, slide: 80 });
    noise(0.15, { gain: 0.3, freq: 600, delay: d });
  },
  home(delayMs = 0) {
    [880, 1109, 1319].forEach((f, i) => tone(f, 0.25, { gain: 0.08, delay: delayMs / 1000 + i * 0.08 }));
  },
  tac() {
    tone(300, 0.3, { type: "sawtooth", gain: 0.06, slide: 900 });
    noise(0.2, { gain: 0.15, freq: 1500, delay: 0.05 });
  },
  swap() {
    tone(500, 0.18, { type: "triangle", gain: 0.1, slide: 1000 });
    tone(1000, 0.18, { type: "triangle", gain: 0.1, slide: 500, delay: 0.05 });
  },
  turn() {
    tone(660, 0.12, { gain: 0.07 });
    tone(990, 0.15, { gain: 0.06, delay: 0.09 });
  },
  win() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.3, { type: "triangle", gain: 0.1, delay: i * 0.14 }));
  },
  lose() {
    [392, 349, 311, 262].forEach((f, i) => tone(f, 0.35, { type: "triangle", gain: 0.08, delay: i * 0.18 }));
  },
};
