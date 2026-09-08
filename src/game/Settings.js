const STORAGE_KEY = 'build-battle-settings';

export const DEFAULT_BINDS = {
  forward: 'KeyW',
  back: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  sprint: 'ShiftLeft',
  jump: 'Space',
  build: 'KeyB',
  harvest: 'KeyF',
  interact: 'KeyE',
  cycleMat: 'KeyQ',
  reload: 'KeyR',
  slot1: 'Digit1',
  slot2: 'Digit2',
  slot3: 'Digit3',
};

export const BIND_ACTIONS = [
  { id: 'forward', label: 'Move Forward' },
  { id: 'back', label: 'Move Back' },
  { id: 'left', label: 'Move Left' },
  { id: 'right', label: 'Move Right' },
  { id: 'sprint', label: 'Sprint' },
  { id: 'jump', label: 'Jump' },
  { id: 'build', label: 'Build Mode' },
  { id: 'harvest', label: 'Harvest' },
  { id: 'interact', label: 'Open Chest' },
  { id: 'cycleMat', label: 'Cycle Material' },
  { id: 'reload', label: 'Reload' },
  { id: 'slot1', label: 'Slot 1 / Wall' },
  { id: 'slot2', label: 'Slot 2 / Floor' },
  { id: 'slot3', label: 'Slot 3 / Ramp' },
];

const KEY_LABELS = {
  Space: 'Space',
  ShiftLeft: 'Left Shift',
  ShiftRight: 'Right Shift',
  ControlLeft: 'Left Ctrl',
  ControlRight: 'Right Ctrl',
  AltLeft: 'Left Alt',
  AltRight: 'Right Alt',
  ArrowUp: 'Up Arrow',
  ArrowDown: 'Down Arrow',
  ArrowLeft: 'Left Arrow',
  ArrowRight: 'Right Arrow',
  Escape: 'Esc',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Semicolon: ';',
  Quote: "'",
  Backquote: '`',
  Backslash: '\\',
  Comma: ',',
  Period: '.',
  Slash: '/',
  CapsLock: 'Caps Lock',
};

export function formatKeyCode(code) {
  if (!code) return 'Unbound';
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
  return code;
}

export const DEFAULT_SETTINGS = {
  botsEnabled: true,
  mouseSensitivity: 1.0,
  fov: 75,
  stormSpeed: 1.0,
  volume: 0.7,
  binds: { ...DEFAULT_BINDS },
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS, binds: { ...DEFAULT_BINDS } };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      binds: { ...DEFAULT_BINDS, ...(parsed.binds || {}) },
    };
  } catch {
    return { ...DEFAULT_SETTINGS, binds: { ...DEFAULT_BINDS } };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
