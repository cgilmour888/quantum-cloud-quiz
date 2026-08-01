export class SceneEngine {
  #engines = new Map();
  #events = new EventTarget();
  #frameId = null;
  #lastTime = 0;
  #elapsed = 0;
  #running = false;

  constructor({ quality = 'high' } = {}) {
    this.quality = quality;
    this.handleVisibility = this.handleVisibility.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  register(engine) {
    if (!engine?.id) throw new Error('Every scene engine requires a unique id.');
    if (this.#engines.has(engine.id)) throw new Error(`Engine already registered: ${engine.id}`);
    this.#engines.set(engine.id, engine);
    engine.init?.({ scene: this, quality: this.quality });
    return () => this.unregister(engine.id);
  }

  unregister(id) {
    const engine = this.#engines.get(id);
    engine?.destroy?.();
    this.#engines.delete(id);
  }

  on(eventName, listener) {
    this.#events.addEventListener(eventName, listener);
    return () => this.#events.removeEventListener(eventName, listener);
  }

  emit(eventName, detail = {}) {
    this.#events.dispatchEvent(new CustomEvent(eventName, { detail }));
    for (const engine of this.#engines.values()) {
      engine.handleEvent?.(eventName, detail);
    }
  }

  resize(width, height, devicePixelRatio = window.devicePixelRatio || 1) {
    const geometry = { width, height, devicePixelRatio };
    for (const engine of this.#engines.values()) engine.resize?.(geometry);
  }

  start() {
    if (this.#running) return;
    this.#running = true;
    this.#lastTime = performance.now();
    this.#frameId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.#running = false;
    if (this.#frameId) cancelAnimationFrame(this.#frameId);
    this.#frameId = null;
  }

  tick = (time) => {
    if (!this.#running) return;
    const delta = Math.min((time - this.#lastTime) / 1000, 0.1);
    this.#lastTime = time;
    this.#elapsed += delta;

    for (const engine of this.#engines.values()) {
      engine.update?.(delta, this.#elapsed);
      engine.render?.();
    }

    this.#frameId = requestAnimationFrame(this.tick);
  };

  handleVisibility() {
    if (document.hidden) this.stop();
    else this.start();
  }

  destroy() {
    this.stop();
    document.removeEventListener('visibilitychange', this.handleVisibility);
    for (const id of [...this.#engines.keys()]) this.unregister(id);
  }
}
