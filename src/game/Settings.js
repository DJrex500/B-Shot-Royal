const STORAGE_KEY = 'build-battle-settings';

export const DEFAULT_SETTINGS = {
  botsEnabled: true,
  mouseSensitivity: 1.0,
  stormSpeed: 1.0,
  volume: 0.7,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
