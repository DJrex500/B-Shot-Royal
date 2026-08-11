export const MAP_SIZE = 400;
export const GRID_SIZE = 4;
export const BUILD_COST = 10;
export const FLOOR_HALF = 0.125;
export const BUILD_RANGE = 22;
export const TURBO_BUILD_DELAY = 0.1;

export const PLAYER = {
  height: 1.8,
  radius: 0.4,
  walkSpeed: 12,
  sprintSpeed: 24,
  jumpForce: 6,
  maxHealth: 100,
  maxShield: 100,
  baseFov: 75,
  damageCooldown: 0.4,
};

export const BOT = {
  speedMin: 7,
  speedMax: 10,
  shootRange: 45,
  meleeRange: 1.5,
  shootDamageMin: 4,
  shootDamageMax: 7,
  meleeDamage: 7,
  fireCooldownMin: 1.4,
  fireCooldownMax: 2.2,
  meleeCooldown: 2.0,
  aimSpread: 0.12,
};

export const BUILD_PIECES = {
  wall: { name: 'Wall', cost: 10 },
  floor: { name: 'Floor', cost: 10 },
  ramp: { name: 'Ramp', cost: 10 },
};

export const COLORS = {
  wall: 0x8b6914,
  floor: 0x6b8e23,
  ramp: 0x9acd32,
  previewValid: 0x22d3ee,
  previewInvalid: 0xef4444,
  enemy: 0xdc2626,
  ground: 0x3d6b35,
  water: 0x2563eb,
  loot: 0xfbbf24,
  chest: 0xd97706,
};

export const LOOT = {
  pickupRange: 2.5,
  chestRange: 3.5,
  harvestRange: 4,
  harvestDamage: 34,
};

export const STORM = {
  startDelay: 90,
  shrinkInterval: 45,
  initialRadius: 180,
  minRadius: 25,
  shrinkAmount: 35,
  damagePerSecond: 6,
};
