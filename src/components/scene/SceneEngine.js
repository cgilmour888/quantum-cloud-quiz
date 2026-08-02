const DEFAULT_GEOMETRY = Object.freeze({
  width: 1,
  height: 1,
  devicePixelRatio: 1,
});

function createEngineErrorEvent(id, phase, error) {
  return {
    id,
    phase,
    message: error instanceof Error ? error.message : String(error),
    error,
  };
}

export class SceneEngine {
  #engines = new Map();
  #events = new EventTarget();
  #frameId = null;
  #lastTime = 0;
  #elapsed = 0;
  #running = false;
  #geometry = DEFAULT_GEOMETRY;

  constructor({ quality = 'high', resources = {} } = {}) {
    this.quality = quality;
    this.resources = resources;
    this.handleVisibility = this.handleVisibility.bind(this);
    globalThis.document?.addEventListener('visibilitychange', this.handleVisibility);
  }

  #orderedEntries() {
    return [...this.#engines.values()].sort((left, right) => {
      const priorityDelta = left.priority - right.priority;
      return priorityDelta || left.order - right.order;
    });
  }

  #invoke(entry, phase, ...args) {
    if (!entry || entry.failed) return undefined;
    const callback = entry.engine?.[phase];
    if (typeof callback !== 'function') return undefined;

    try {
      return callback.apply(entry.engine, args);
    } catch (error) {
      entry.failed = true;
      const detail = createEngineErrorEvent(entry.engine.id, phase, error);
      this.emit('scene:engine-error', detail);
      console.error(`[SceneEngine] ${entry.engine.id}.${phase} failed`, error);
      return undefined;
    }
  }

  register(engine) {
    if (!engine?.id) throw new Error('Every scene engine requires a unique id.');
    if (this.#engines.has(engine.id)) throw new Error(`Engine already registered: ${engine.id}`);

    const entry = {
      engine,
      priority: Number.isFinite(engine.priority) ? engine.priority : 0,
      order: this.#engines.size,
      failed: false,
    };

    this.#engines.set(engine.id, entry);
    this.#invoke(entry, 'init', {
      scene: this,
      quality: this.quality,
      resources: this.resources,
      geometry: this.#geometry,
    });
    this.#invoke(entry, 'resize', this.#geometry);

    return () => this.unregister(engine.id);
  }

  unregister(id) {
    const entry = this.#engines.get(id);
    if (!entry) return false;

    this.#invoke(entry, 'destroy');
    this.#engines.delete(id);
    return true;
  }

  getEngine(id) {
    return this.#engines.get(id)?.engine ?? null;
  }

  on(eventName, listener) {
    this.#events.addEventListener(eventName, listener);
    return () => this.#events.removeEventListener(eventName, listener);
  }

  emit(eventName, detail = {}) {
    const CustomEventConstructor = globalThis.CustomEvent;
    if (typeof CustomEventConstructor === 'function') {
      this.#events.dispatchEvent(new CustomEventConstructor(eventName, { detail }));
    }

    for (const entry of this.#orderedEntries()) {
      this.#invoke(entry, 'handleEvent', eventName, detail);
    }
  }

  resize(width, height, devicePixelRatio = globalThis.devicePixelRatio || 1) {
    this.#geometry = {
      width: Math.max(1, Number(width) || 1),
      height: Math.max(1, Number(height) || 1),
      devicePixelRatio: Math.max(1, Number(devicePixelRatio) || 1),
    };

    for (const entry of this.#orderedEntries()) {
      this.#invoke(entry, 'resize', this.#geometry);
    }
  }

  start() {
    if (this.#running || typeof globalThis.requestAnimationFrame !== 'function') return;
    this.#running = true;
    this.#lastTime = globalThis.performance?.now?.() ?? Date.now();
    this.#frameId = globalThis.requestAnimationFrame(this.tick);
  }

  stop() {
    this.#running = false;
    if (this.#frameId !== null && typeof globalThis.cancelAnimationFrame === 'function') {
      globalThis.cancelAnimationFrame(this.#frameId);
    }
    this.#frameId = null;
  }

  tick = (time) => {
    if (!this.#running) return;

    const delta = Math.min(Math.max((time - this.#lastTime) / 1000, 0), 0.1);
    this.#lastTime = time;
    this.#elapsed += delta;

    const entries = this.#orderedEntries();
    for (const entry of entries) this.#invoke(entry, 'update', delta, this.#elapsed);
    for (const entry of entries) this.#invoke(entry, 'render');

    this.#frameId = globalThis.requestAnimationFrame(this.tick);
  };

  handleVisibility() {
    const hidden = Boolean(globalThis.document?.hidden);
    this.emit('scene:visibility-changed', { hidden });
    if (hidden) this.stop();
    else this.start();
  }

  destroy() {
    this.stop();
    globalThis.document?.removeEventListener('visibilitychange', this.handleVisibility);

    for (const entry of this.#orderedEntries().reverse()) {
      this.#invoke(entry, 'destroy');
    }
    this.#engines.clear();
  }
}
