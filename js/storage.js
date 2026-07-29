import { STORAGE_KEYS } from './constants.js';

export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`Unable to read ${key}`, error);
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Unable to write ${key}`, error);
    return false;
  }
}

export function loadProfile() {
  return readJSON(STORAGE_KEYS.PROFILE, {
    name: '',
    email: '',
    avatarMode: 'generated',
    avatarSymbol: '⚛',
    avatarAccent: 'aqua',
    avatarImage: '',
  });
}

export function saveProfile(profile) {
  return writeJSON(STORAGE_KEYS.PROFILE, profile);
}

export function loadResults() {
  return readJSON(STORAGE_KEYS.RESULTS, []);
}

export function saveResults(results) {
  return writeJSON(STORAGE_KEYS.RESULTS, results.slice(-250));
}

export function loadMissed() {
  return readJSON(STORAGE_KEYS.MISSED, []);
}

export function saveMissed(ids) {
  return writeJSON(STORAGE_KEYS.MISSED, [...new Set(ids)]);
}

export function loadCustomBanks() {
  return readJSON(STORAGE_KEYS.CUSTOM_BANKS, []);
}

export function saveCustomBanks(banks) {
  return writeJSON(STORAGE_KEYS.CUSTOM_BANKS, banks);
}

export function loadSettings() {
  return readJSON(STORAGE_KEYS.SETTINGS, {
    shuffleQuestions: true,
    shuffleOptions: false,
    soundEnabled: false,
  });
}

export function saveSettings(settings) {
  return writeJSON(STORAGE_KEYS.SETTINGS, settings);
}
