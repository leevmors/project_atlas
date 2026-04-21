// Web Audio + speech-synthesis effects for the shift: switch clacks, button
// presses, success/failure cues, phone ringer/dial/voice, lightning rumble,
// tablet lift, and final victory jingle.
//
// The `audio` singleton holds the AudioContext + master gain bus. Call
// `ensureAudio()` once after any user interaction to bootstrap it; every
// play* function is a no-op if the context has not been initialized.

export const audio = {
  ctx: null,
  master: null,
  rainGain: null,
  humGain: null,
  started: false,
  noiseBuffer: null
};

export function ensureAudio() {
  if (!audio.ctx) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);

    const humGain = ctx.createGain();
    humGain.gain.value = 0.012;
    humGain.connect(master);

    audio.ctx = ctx;
    audio.master = master;
    audio.humGain = humGain;
    audio.noiseBuffer = createNoiseBuffer(ctx);

    const hum = ctx.createOscillator();
    hum.type = "triangle";
    hum.frequency.value = 47;
    hum.connect(humGain);
    hum.start();
  }

  if (audio.ctx.state === "suspended") {
    audio.ctx.resume();
  }
}

export function createNoiseBuffer(ctx) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.55;
  }
  return buffer;
}

export function playSwitch(direction) {
  if (!audio.ctx) return;
  const time = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(direction > 0 ? 310 : 220, time);
  osc.frequency.exponentialRampToValueAtTime(direction > 0 ? 260 : 180, time + 0.08);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.05, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(time);
  osc.stop(time + 0.11);
}

export function playButton(type) {
  if (!audio.ctx) return;
  const time = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type === "red" ? "sawtooth" : "square";
  osc.frequency.setValueAtTime(type === "red" ? 120 : 180, time);
  osc.frequency.exponentialRampToValueAtTime(type === "red" ? 75 : 130, time + 0.13);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.08, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(time);
  osc.stop(time + 0.18);
}

export function playSuccess() {
  if (!audio.ctx) return;
  const notes = [260, 330, 420];
  notes.forEach((note, index) => {
    const time = audio.ctx.currentTime + index * 0.06;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = note;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.04, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(time);
    osc.stop(time + 0.15);
  });
}

export function playExplosion() {
  if (!audio.ctx) return;
  const time = audio.ctx.currentTime;
  const noise = audio.ctx.createBufferSource();
  noise.buffer = audio.noiseBuffer;
  const filter = audio.ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, time);
  filter.frequency.exponentialRampToValueAtTime(180, time + 1.2);
  const gain = audio.ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.28, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.4);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audio.master);
  noise.start(time);
  noise.stop(time + 1.45);

  const thump = audio.ctx.createOscillator();
  const thumpGain = audio.ctx.createGain();
  thump.type = "square";
  thump.frequency.setValueAtTime(110, time);
  thump.frequency.exponentialRampToValueAtTime(30, time + 0.5);
  thumpGain.gain.setValueAtTime(0.0001, time);
  thumpGain.gain.exponentialRampToValueAtTime(0.18, time + 0.02);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);
  thump.connect(thumpGain);
  thumpGain.connect(audio.master);
  thump.start(time);
  thump.stop(time + 0.65);
}

export function playFailure() {
  if (!audio.ctx) return;
  const time = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(220, time);
  osc.frequency.exponentialRampToValueAtTime(52, time + 0.35);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.07, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.38);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(time);
  osc.stop(time + 0.42);
}

export function playLightning() {
  if (!audio.ctx) return;
  const time = audio.ctx.currentTime;

  // sharp crack
  const crack = audio.ctx.createBufferSource();
  crack.buffer = audio.noiseBuffer;
  const crackFilter = audio.ctx.createBiquadFilter();
  crackFilter.type = "bandpass";
  crackFilter.frequency.setValueAtTime(1500, time);
  crackFilter.Q.value = 0.9;
  const crackGain = audio.ctx.createGain();
  crackGain.gain.setValueAtTime(0.0001, time);
  crackGain.gain.exponentialRampToValueAtTime(0.22, time + 0.02);
  crackGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);
  crack.connect(crackFilter);
  crackFilter.connect(crackGain);
  crackGain.connect(audio.master);
  crack.start(time);
  crack.stop(time + 0.45);

  // rolling low thunder
  const delay = 0.25 + Math.random() * 0.35;
  const thunder = audio.ctx.createBufferSource();
  thunder.buffer = audio.noiseBuffer;
  const filter = audio.ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(260, time + delay);
  filter.frequency.exponentialRampToValueAtTime(85, time + delay + 2.2);
  const gain = audio.ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time + delay);
  gain.gain.exponentialRampToValueAtTime(0.32, time + delay + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.06, time + delay + 1.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + delay + 2.4);
  thunder.connect(filter);
  filter.connect(gain);
  gain.connect(audio.master);
  thunder.start(time + delay);
  thunder.stop(time + delay + 2.5);

  // sub rumble
  const rumble = audio.ctx.createOscillator();
  const rumbleGain = audio.ctx.createGain();
  rumble.type = "triangle";
  rumble.frequency.setValueAtTime(68, time + delay);
  rumble.frequency.exponentialRampToValueAtTime(28, time + delay + 2.1);
  rumbleGain.gain.setValueAtTime(0.0001, time + delay);
  rumbleGain.gain.exponentialRampToValueAtTime(0.12, time + delay + 0.2);
  rumbleGain.gain.exponentialRampToValueAtTime(0.0001, time + delay + 2.2);
  rumble.connect(rumbleGain);
  rumbleGain.connect(audio.master);
  rumble.start(time + delay);
  rumble.stop(time + delay + 2.4);
}

export function playTablet(opening) {
  if (!audio.ctx) return;
  const time = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(opening ? 460 : 330, time);
  osc.frequency.exponentialRampToValueAtTime(opening ? 560 : 240, time + 0.08);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.03, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(time);
  osc.stop(time + 0.14);
}

// --- PHONE AUDIO --------------------------------------------------------
export function playPhoneBellPulse() {
  if (!audio.ctx) return;
  const time = audio.ctx.currentTime;
  // Classic bell: mix of two high-frequency tones
  const freqs = [1040, 1700];
  for (const f of freqs) {
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(f, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.14, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(time);
    osc.stop(time + 0.08);
  }
}

export function playPhonePickup() {
  if (!audio.ctx) return;
  const time = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(70, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.07, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(time);
  osc.stop(time + 0.18);
}

export function playPhoneHangup() {
  if (!audio.ctx) return;
  const time = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.exponentialRampToValueAtTime(80, time + 0.12);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.08, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(time);
  osc.stop(time + 0.22);
}

export function playDialTone() {
  if (!audio.ctx || audio.dialToneNodes) return;
  const ctx = audio.ctx;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.1);
  gain.connect(audio.master);
  const freqs = [350, 440];
  const oscs = freqs.map((f) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    o.connect(gain);
    o.start();
    return o;
  });
  audio.dialToneNodes = { oscs, gain };
}

export function stopDialTone() {
  if (!audio.ctx || !audio.dialToneNodes) return;
  const { oscs, gain } = audio.dialToneNodes;
  const t = audio.ctx.currentTime;
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(gain.gain.value, t);
  gain.gain.linearRampToValueAtTime(0, t + 0.08);
  for (const o of oscs) {
    try { o.stop(t + 0.12); } catch (e) { /* ignore */ }
  }
  audio.dialToneNodes = null;
}

export function playPhoneStatic() {
  if (!audio.ctx || !audio.noiseBuffer) return;
  const time = audio.ctx.currentTime;
  const src = audio.ctx.createBufferSource();
  src.buffer = audio.noiseBuffer;
  const filter = audio.ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  filter.Q.value = 0.8;
  const gain = audio.ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.06, time + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.6);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audio.master);
  src.start(time);
  src.stop(time + 2.7);
}

export let activeVoiceUtter = null;
export function speakPhoneVoice(text) {
  if (!window.speechSynthesis || !text) return;
  try {
    window.speechSynthesis.cancel();
  } catch (e) { /* ignore */ }
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.92;
  utter.pitch = 0.75;
  utter.volume = 0.95;
  // Try to find a lower-pitched voice if available
  const voices = window.speechSynthesis.getVoices();
  const pick = voices.find((v) => /male|david|mark|james/i.test(v.name)) || voices[0];
  if (pick) utter.voice = pick;
  activeVoiceUtter = utter;
  window.speechSynthesis.speak(utter);
}

export function stopPhoneVoice() {
  if (!window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch (e) { /* ignore */ }
  activeVoiceUtter = null;
}

export function playVictory() {
  if (!audio.ctx) return;
  const notes = [220, 262, 330, 392, 494];
  notes.forEach((note, index) => {
    const time = audio.ctx.currentTime + index * 0.1;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = note;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.05, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(time);
    osc.stop(time + 0.26);
  });
}
