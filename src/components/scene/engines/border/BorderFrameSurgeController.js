const CHANNEL_INDEX = Object.freeze({ cyan: 0, orange: 1, purple: 2 });

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function envelopeValue(impulse) {
  const { age, attack, hold, decay } = impulse;
  if (age <= attack) return attack > 0 ? age / attack : 1;
  if (age <= attack + hold) return 1;
  const decayAge = age - attack - hold;
  if (decayAge >= decay) return 0;
  return 1 - (decayAge / Math.max(decay, 0.001));
}

export class BorderFrameSurgeController {
  #impulses;
  #limit;
  #channelGains = new Float32Array(3);
  #speedGain = 0;
  #junctionGain = 0;

  constructor(limit = 8) {
    this.#limit = Math.max(1, Number(limit) || 8);
    this.#impulses = Array.from({ length: this.#limit }, () => null);
  }

  trigger(profile = {}) {
    const channel = profile.channel ?? 'cyan';
    const channelIndex = CHANNEL_INDEX[channel] ?? 0;
    const amplitude = Math.max(0, Number(profile.amplitude) || 0);

    let slot = this.#impulses.findIndex((item) => item === null);
    if (slot < 0) {
      slot = this.#impulses.findIndex((item) => item.channelIndex === channelIndex);
    }
    if (slot < 0) slot = 0;

    const existing = this.#impulses[slot];
    this.#impulses[slot] = {
      channelIndex,
      age: 0,
      attack: Math.max(0.01, Number(profile.attack) || 0.08),
      hold: Math.max(0, Number(profile.hold) || 0.12),
      decay: Math.max(0.05, Number(profile.decay) || 0.85),
      amplitude: Math.max(amplitude, existing?.amplitude ?? 0),
      speedMultiplier: Math.max(0, Number(profile.speedMultiplier) || 0),
      junctionMultiplier: Math.max(0, Number(profile.junctionMultiplier) || 0),
    };
  }

  update(delta) {
    this.#channelGains.fill(0);
    this.#speedGain = 0;
    this.#junctionGain = 0;

    for (let index = 0; index < this.#impulses.length; index += 1) {
      const impulse = this.#impulses[index];
      if (!impulse) continue;

      impulse.age += Math.max(0, Number(delta) || 0);
      const envelope = clamp01(envelopeValue(impulse));
      if (envelope <= 0) {
        this.#impulses[index] = null;
        continue;
      }

      const value = envelope * impulse.amplitude;
      this.#channelGains[impulse.channelIndex] = Math.max(
        this.#channelGains[impulse.channelIndex],
        value,
      );
      this.#speedGain = Math.max(this.#speedGain, envelope * impulse.speedMultiplier);
      this.#junctionGain = Math.max(
        this.#junctionGain,
        envelope * impulse.junctionMultiplier,
      );
    }

    return this.snapshot();
  }

  snapshot() {
    return {
      channels: this.#channelGains,
      speedGain: this.#speedGain,
      junctionGain: this.#junctionGain,
      activeCount: this.#impulses.filter(Boolean).length,
    };
  }

  reset() {
    this.#impulses.fill(null);
    this.#channelGains.fill(0);
    this.#speedGain = 0;
    this.#junctionGain = 0;
  }
}
