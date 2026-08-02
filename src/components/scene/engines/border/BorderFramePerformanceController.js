import { BORDER_FRAME_QUALITY } from './borderFrameConfig.js';

const QUALITY_ORDER = ['conservative', 'balanced', 'high'];

export class BorderFramePerformanceController {
  #samples = new Float32Array(180);
  #sampleCount = 0;
  #sampleIndex = 0;
  #qualityIndex = 1;
  #slowDuration = 0;
  #verySlowDuration = 0;
  #fastDuration = 0;

  constructor({ initial = 'balanced', reducedMotion = false } = {}) {
    this.reducedMotion = Boolean(reducedMotion);
    this.#qualityIndex = Math.max(0, QUALITY_ORDER.indexOf(initial));
    if (this.reducedMotion) this.#qualityIndex = 0;
  }

  record(delta) {
    const frameMs = Math.max(0, Number(delta) || 0) * 1000;
    this.#samples[this.#sampleIndex] = frameMs;
    this.#sampleIndex = (this.#sampleIndex + 1) % this.#samples.length;
    this.#sampleCount = Math.min(this.#samples.length, this.#sampleCount + 1);

    const average = this.averageFrameMs;
    const seconds = Math.max(0, Number(delta) || 0);

    this.#slowDuration = average > 20 ? this.#slowDuration + seconds : 0;
    this.#verySlowDuration = average > 27 ? this.#verySlowDuration + seconds : 0;
    this.#fastDuration = average < 12 ? this.#fastDuration + seconds : 0;

    if (this.#verySlowDuration >= 2 && this.#qualityIndex > 0) {
      this.#qualityIndex = 0;
      this.#verySlowDuration = 0;
      this.#slowDuration = 0;
      this.#fastDuration = 0;
    } else if (this.#slowDuration >= 3 && this.#qualityIndex > 0) {
      this.#qualityIndex -= 1;
      this.#slowDuration = 0;
      this.#fastDuration = 0;
    } else if (this.#fastDuration >= 10 && this.#qualityIndex < QUALITY_ORDER.length - 1) {
      this.#qualityIndex += 1;
      this.#fastDuration = 0;
    }
  }

  get averageFrameMs() {
    if (this.#sampleCount === 0) return 16.67;
    let total = 0;
    for (let index = 0; index < this.#sampleCount; index += 1) total += this.#samples[index];
    return total / this.#sampleCount;
  }

  get state() {
    const tier = this.reducedMotion ? 'conservative' : QUALITY_ORDER[this.#qualityIndex];
    return {
      tier,
      averageFrameMs: this.averageFrameMs,
      ...BORDER_FRAME_QUALITY[tier],
    };
  }
}
