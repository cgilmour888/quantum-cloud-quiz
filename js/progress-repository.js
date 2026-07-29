import {
  loadProfile,
  saveProfile,
  loadResults,
  saveResults,
  loadMissed,
  saveMissed,
  loadSettings,
  saveSettings,
  loadCustomBanks,
  saveCustomBanks,
} from './storage.js';

export class LocalProgressRepository {
  async getSnapshot() {
    return {
      profile: loadProfile(),
      results: loadResults(),
      missed: loadMissed(),
      settings: loadSettings(),
      customBanks: loadCustomBanks(),
    };
  }

  async saveProfile(profile) { saveProfile(profile); return profile; }
  async saveResults(results) { saveResults(results); return results; }
  async saveMissed(missed) { saveMissed(missed); return missed; }
  async saveSettings(settings) { saveSettings(settings); return settings; }
  async saveCustomBanks(customBanks) { saveCustomBanks(customBanks); return customBanks; }
}

// Dynamic migration point for profiles, results, adaptive metrics, and progress.
// Replace LocalProgressRepository with this adapter when a backend exists.
export class ApiProgressRepository {
  constructor(baseUrl, tokenProvider = async () => '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.tokenProvider = tokenProvider;
  }

  async request(path, options = {}) {
    const token = await this.tokenProvider();
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (!response.ok) throw new Error(`Progress API request failed (${response.status}).`);
    return response.status === 204 ? null : response.json();
  }

  getSnapshot() { return this.request('/me/progress'); }
  saveProfile(profile) { return this.request('/me/profile', { method: 'PUT', body: JSON.stringify(profile) }); }
  saveResults(results) { return this.request('/me/results', { method: 'PUT', body: JSON.stringify(results) }); }
  saveMissed(missed) { return this.request('/me/missed', { method: 'PUT', body: JSON.stringify(missed) }); }
  saveSettings(settings) { return this.request('/me/settings', { method: 'PUT', body: JSON.stringify(settings) }); }
}
