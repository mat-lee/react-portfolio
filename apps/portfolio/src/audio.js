// Synthesized Web Audio SFX for crane/theme-toggle interactions — no audio
// files, so no licensing concerns. Ported from the origami-portfolio
// reference (src/audio.ts), types stripped.
export class AudioSystem {
  context = null;
  enabled = true;

  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.context.state === "suspended") {
      this.context.resume();
    }
  }

  toggle(enabled) {
    this.enabled = enabled;
  }

  // `pitch` (default 1) scales the base frequencies — Crane3D passes each
  // crane its own fixed pitch (derived from its color) so different cranes
  // consistently sound a little different, not just the same fixed SFX
  // played back identically every time. On top of that, every call also
  // gets a small random jitter of its own, so even the SAME crane doesn't
  // sound exactly identical twice.
  playShimmer(pitch = 1) {
    if (!this.enabled) return;
    this.init();
    if (!this.context) return;
    const p = pitch * (0.97 + Math.random() * 0.06);

    // High-pitched crystalline paper shimmer
    const ctx = this.context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1200 * p, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2400 * p, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  playTug(pitch = 1) {
    if (!this.enabled) return;
    this.init();
    if (!this.context) return;
    const p = pitch * (0.97 + Math.random() * 0.06);

    // String tension / paper creak
    const ctx = this.context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100 * p, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40 * p, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500 * p;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  playFly(pitch = 1) {
    if (!this.enabled) return;
    this.init();
    if (!this.context) return;
    const p = pitch * (0.97 + Math.random() * 0.06);

    // Airy paper swoosh
    const ctx = this.context;
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800 * p, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(4000 * p, ctx.currentTime + 0.4);
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  }

  playUnfold() {
    if (!this.enabled) return;
    this.init();
    if (!this.context) return;

    // A quick burst of paper-crinkle taps for the kami transition's start.
    const ctx = this.context;
    for (let j = 0; j < 5; j++) {
      const startTime = ctx.currentTime + j * 0.1;

      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 1000 + Math.random() * 1000;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.05, startTime + 0.01);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(startTime);
    }
  }
}

export const audio = new AudioSystem();
