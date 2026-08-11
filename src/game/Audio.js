export class AudioManager {
  constructor() {
    this.ctx = null;
    this.volume = 0.7;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
  }

  play(fn) {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.init();
      fn(this.ctx, this.volume);
    } catch {
      /* audio unavailable */
    }
  }

  gunshot(id) {
    this.play((ctx, vol) => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = id === 'sniper' ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(id === 'shotgun' ? 90 : id === 'sniper' ? 140 : 180, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
      filter.type = 'lowpass';
      filter.frequency.value = id === 'sniper' ? 800 : 1200;
      gain.gain.setValueAtTime(0.25 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (id === 'sniper' ? 0.2 : 0.1));
      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);

      const noise = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      noise.buffer = buf;
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.15 * vol, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      noise.connect(nGain).connect(ctx.destination);
      noise.start(t);
    });
  }

  hit(isHeadshot = false) {
    this.play((ctx, vol) => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isHeadshot ? 880 : 520, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.06);
      gain.gain.setValueAtTime(0.2 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    });
  }

  damageTaken() {
    this.play((ctx, vol) => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.linearRampToValueAtTime(60, t + 0.15);
      gain.gain.setValueAtTime(0.18 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  reload() {
    this.play((ctx, vol) => {
      const t = ctx.currentTime;
      [0, 0.12, 0.24].forEach((off, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 300 + i * 80;
        gain.gain.setValueAtTime(0.08 * vol, t + off);
        gain.gain.exponentialRampToValueAtTime(0.001, t + off + 0.06);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + off);
        osc.stop(t + off + 0.07);
      });
    });
  }

  buildPlace() {
    this.play((ctx, vol) => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.08);
      gain.gain.setValueAtTime(0.15 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  harvest() {
    this.play((ctx, vol) => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(100, t + 0.1);
      gain.gain.setValueAtTime(0.12 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  chest() {
    this.play((ctx, vol) => {
      const t = ctx.currentTime;
      [440, 554, 659].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1 * vol, t + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.25);
      });
    });
  }

  victory() {
    this.play((ctx, vol) => {
      const t = ctx.currentTime;
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12 * vol, t + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + i * 0.15);
        osc.stop(t + i * 0.15 + 0.45);
      });
    });
  }

  pickup() {
    this.play((ctx, vol) => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(900, t + 0.08);
      gain.gain.setValueAtTime(0.1 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    });
  }
}
