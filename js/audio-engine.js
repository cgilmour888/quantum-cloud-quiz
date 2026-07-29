export class AudioEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.enabled = false;
    this.noiseBuffer = null;
  }

  async unlock() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = 0.38;
      this.master.connect(this.context.destination);
      this.noiseBuffer = this.createNoiseBuffer(5);
    }
    if (this.context.state === 'suspended') await this.context.resume();
    return true;
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
    if (this.enabled) this.unlock().catch(() => {});
  }

  createNoiseBuffer(seconds) {
    const length = Math.floor(this.context.sampleRate * seconds);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const channel = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.15;
      channel[i] = last * (0.75 + Math.random() * 0.25);
    }
    return buffer;
  }

  createNoiseSource() {
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    return source;
  }

  clickPulse(correct = true) {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    osc.type = correct ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(correct ? 420 : 190, now);
    osc.frequency.exponentialRampToValueAtTime(correct ? 980 : 95, now + 0.24);
    filter.type = 'lowpass';
    filter.frequency.value = correct ? 2400 : 700;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(correct ? 0.14 : 0.09, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    osc.connect(filter).connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  lightningCrack(intensity = 0.7, delay = 0) {
    if (!this.enabled || !this.context) return;
    const start = this.context.currentTime + delay;
    const noise = this.createNoiseSource();
    const highpass = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    highpass.type = 'highpass';
    highpass.frequency.value = 1300 + Math.random() * 900;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18 * intensity, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
    noise.connect(highpass).connect(gain).connect(this.master);
    noise.start(start, Math.random() * 1.5);
    noise.stop(start + 0.17);
  }

  thunder(intensity = 0.7, delay = 0) {
    if (!this.enabled || !this.context) return;
    const start = this.context.currentTime + delay;
    const duration = 2.8 + intensity * 2.2;

    const rumble = this.createNoiseSource();
    const lowpass = this.context.createBiquadFilter();
    const rumbleGain = this.context.createGain();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(240 + intensity * 160, start);
    lowpass.frequency.exponentialRampToValueAtTime(65, start + duration);
    rumbleGain.gain.setValueAtTime(0.0001, start);
    rumbleGain.gain.exponentialRampToValueAtTime(0.2 * intensity, start + 0.12);
    rumbleGain.gain.exponentialRampToValueAtTime(0.055 * intensity, start + 1.3);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    rumble.connect(lowpass).connect(rumbleGain).connect(this.master);
    rumble.start(start, Math.random() * 1.7);
    rumble.stop(start + duration);

    const sub = this.context.createOscillator();
    const subGain = this.context.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(52 + Math.random() * 12, start);
    sub.frequency.exponentialRampToValueAtTime(28, start + duration * 0.8);
    subGain.gain.setValueAtTime(0.0001, start);
    subGain.gain.exponentialRampToValueAtTime(0.12 * intensity, start + 0.08);
    subGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    sub.connect(subGain).connect(this.master);
    sub.start(start);
    sub.stop(start + duration);

    this.lightningCrack(intensity, delay);
  }

  successChord(score = 100) {
    if (!this.enabled || !this.context) return;
    const root = 180 + score * 1.4;
    const now = this.context.currentTime;
    [1, 1.25, 1.5, 2].forEach((ratio, index) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = index === 3 ? 'sine' : 'triangle';
      osc.frequency.value = root * ratio;
      gain.gain.setValueAtTime(0.0001, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.045, now + index * 0.08 + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2 + index * 0.08);
      osc.connect(gain).connect(this.master);
      osc.start(now + index * 0.08);
      osc.stop(now + 2.4 + index * 0.08);
    });
  }
}
