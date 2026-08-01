const STORAGE_KEYS = Object.freeze({
  RESULTS: 'quantumCloudQuiz.results.v1',
  MISSED: 'quantumCloudQuiz.missed.v1',
  SETTINGS: 'quantumCloudQuiz.settings.v1',
  ACTIVE_SESSION: 'quantumCloudQuiz.activeSession.v1',
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeRead(storage, key, fallback) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : clone(fallback);
  } catch (error) {
    console.warn(`Unable to read ${key}.`, error);
    return clone(fallback);
  }
}

function safeWrite(storage, key, value) {
  try {
    storage?.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Unable to write ${key}.`, error);
    return false;
  }
}

export class MemoryProgressRepository {
  constructor(seed = {}) {
    this.state = {
      results: clone(seed.results ?? []),
      missed: clone(seed.missed ?? []),
      settings: clone(seed.settings ?? {}),
      activeSession: clone(seed.activeSession ?? null),
    };
  }

  async getSnapshot() {
    return clone(this.state);
  }

  async saveResult(result) {
    this.state.results = [...this.state.results, clone(result)].slice(-250);
    return clone(result);
  }

  async saveMissed(questionIds) {
    this.state.missed = [...new Set(questionIds.map(String))];
    return clone(this.state.missed);
  }

  async saveSettings(settings) {
    this.state.settings = { ...this.state.settings, ...clone(settings) };
    return clone(this.state.settings);
  }

  async saveActiveSession(snapshot) {
    this.state.activeSession = clone(snapshot);
    return clone(snapshot);
  }

  async clearActiveSession() {
    this.state.activeSession = null;
  }
}

export class LocalProgressRepository {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
  }

  async getSnapshot() {
    return {
      results: safeRead(this.storage, STORAGE_KEYS.RESULTS, []),
      missed: safeRead(this.storage, STORAGE_KEYS.MISSED, []),
      settings: safeRead(this.storage, STORAGE_KEYS.SETTINGS, {}),
      activeSession: safeRead(this.storage, STORAGE_KEYS.ACTIVE_SESSION, null),
    };
  }

  async saveResult(result) {
    const snapshot = await this.getSnapshot();
    const results = [...snapshot.results, clone(result)].slice(-250);
    safeWrite(this.storage, STORAGE_KEYS.RESULTS, results);
    return clone(result);
  }

  async saveMissed(questionIds) {
    const missed = [...new Set(questionIds.map(String))];
    safeWrite(this.storage, STORAGE_KEYS.MISSED, missed);
    return missed;
  }

  async saveSettings(settings) {
    const snapshot = await this.getSnapshot();
    const merged = { ...snapshot.settings, ...clone(settings) };
    safeWrite(this.storage, STORAGE_KEYS.SETTINGS, merged);
    return merged;
  }

  async saveActiveSession(snapshot) {
    safeWrite(this.storage, STORAGE_KEYS.ACTIVE_SESSION, snapshot);
    return clone(snapshot);
  }

  async clearActiveSession() {
    try {
      this.storage?.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    } catch (error) {
      console.warn('Unable to clear active quiz session.', error);
    }
  }
}

export { STORAGE_KEYS };
