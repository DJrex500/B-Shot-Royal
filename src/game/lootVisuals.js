import * as THREE from 'three';

export const LOOT_DEFS = {
  wood: { color: 0xb45309, label: 'Wood', hudClass: 'wood', y: 0.55 },
  brick: { color: 0xb91c1c, label: 'Brick', hudClass: 'brick', y: 0.55 },
  metal: { color: 0x94a3b8, label: 'Metal', hudClass: 'metal', y: 0.55 },
  materials: { color: 0xfbbf24, label: 'Wood', hudClass: 'wood', y: 0.55 },
  ammo: { color: 0x60a5fa, label: 'Rifle Ammo', hudClass: 'ammo', y: 0.45 },
  ammo_rifle: { color: 0x60a5fa, label: 'Rifle Ammo', hudClass: 'ammo', y: 0.45 },
  ammo_shells: { color: 0xf87171, label: 'Shotgun Shells', hudClass: 'ammo_shells', y: 0.45 },
  ammo_sniper: { color: 0xfacc15, label: 'Sniper Ammo', hudClass: 'ammo_sniper', y: 0.45 },
  shield: { color: 0x22d3ee, label: 'Shield Potion +25', hudClass: 'shield', y: 0.55 },
  medkit: { color: 0xef4444, label: 'Medkit +50', hudClass: 'medkit', y: 0.45 },
  ar: { color: 0x94a3b8, label: 'Assault Rifle', hudClass: 'ar', y: 0.4 },
  shotgun: { color: 0xd6d3d1, label: 'Pump Shotgun', hudClass: 'shotgun', y: 0.4 },
  sniper: { color: 0x334155, label: 'Bolt Sniper', hudClass: 'sniper', y: 0.4 },
};

const spriteCache = new Map();
const pngLoader = new THREE.TextureLoader();
const AMMO_PNG = {
  ammo: 'sprites/ammo-rifle.png',
  ammo_rifle: 'sprites/ammo-rifle.png',
  ammo_shells: 'sprites/ammo-shells.png',
  ammo_sniper: 'sprites/ammo-sniper.png',
};
const pngMaps = {};
for (const [key, url] of Object.entries(AMMO_PNG)) {
  const tex = pngLoader.load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  pngMaps[key] = tex;
}

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function plate(ctx, w, h, fill, stroke) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, 18, 18, w - 36, h - 36, 28);
  ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, 28, 28, w - 56, h - 88, 22);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 6;
  ctx.stroke();
}

function caption(ctx, w, h, text, color) {
  ctx.font = 'bold 36px Segoe UI, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000';
  ctx.fillText(text, w / 2 + 2, h - 42);
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h - 44);
}

function drawWood(ctx, w, h) {
  plate(ctx, w, h, '#3f2a14', '#fbbf24');
  [[70, 96, 140, 28, '#b45309'], [62, 128, 156, 28, '#d97706'], [78, 160, 128, 28, '#92400e']].forEach(([x, y, pw, ph, col]) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, pw, ph);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x, y + 8, pw, 4);
  });
  caption(ctx, w, h, 'WOOD', '#fde68a');
}

function drawBrick(ctx, w, h) {
  plate(ctx, w, h, '#7f1d1d', '#fca5a5');
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const ox = row % 2 ? 12 : 0;
      ctx.fillStyle = `rgb(${160 + (col * 10)},${60 + row * 8},45)`;
      ctx.fillRect(70 + col * 40 + ox, 92 + row * 26, 34, 20);
    }
  }
  caption(ctx, w, h, 'BRICK', '#fecaca');
}

function drawMetal(ctx, w, h) {
  plate(ctx, w, h, '#334155', '#cbd5e1');
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(78, 96, 100, 88);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(86, 108, 84, 12);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(86, 130, 84, 8);
  ctx.fillRect(86, 148, 84, 8);
  caption(ctx, w, h, 'METAL', '#e2e8f0');
}

function drawAmmo(ctx, w, h) {
  plate(ctx, w, h, '#1e3a5f', '#93c5fd');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(64, 80, 128, 110);
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(64, 80, 128, 28);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 28px Segoe UI, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AMMO', 128, 102);
  for (let i = 0; i < 4; i++) {
    const x = 86 + i * 24;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(x, 128);
    ctx.lineTo(x + 8, 138);
    ctx.lineTo(x + 8, 186);
    ctx.lineTo(x - 8, 186);
    ctx.lineTo(x - 8, 138);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x - 6, 148, 12, 32);
  }
  caption(ctx, w, h, 'AMMO', '#bfdbfe');
}

function drawShield(ctx, w, h) {
  plate(ctx, w, h, '#083344', '#22d3ee');
  ctx.fillStyle = '#155e75';
  ctx.fillRect(112, 72, 32, 22);
  ctx.fillStyle = '#67e8f9';
  ctx.beginPath();
  ctx.moveTo(86, 100);
  ctx.lineTo(170, 100);
  ctx.lineTo(158, 198);
  ctx.lineTo(98, 198);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a5f3fc';
  ctx.beginPath();
  ctx.ellipse(128, 148, 18, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px Segoe UI, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('+25', 128, 168);
  caption(ctx, w, h, 'SHIELD', '#a5f3fc');
}

function drawMedkit(ctx, w, h) {
  plate(ctx, w, h, '#7f1d1d', '#fca5a5');
  ctx.fillStyle = '#dc2626';
  roundRect(ctx, 78, 86, 100, 90, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(116, 104, 24, 56);
  ctx.fillRect(90, 120, 76, 24);
  caption(ctx, w, h, 'MEDKIT', '#fecaca');
}

function drawGun(ctx, w, h, kind) {
  const bg = kind === 'ar' ? '#334155' : kind === 'shotgun' ? '#44403c' : '#1e293b';
  const stroke = kind === 'ar' ? '#94a3b8' : kind === 'shotgun' ? '#d6d3d1' : '#facc15';
  plate(ctx, w, h, bg, stroke);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(56, 132, kind === 'sniper' ? 160 : 128, 16);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(88, 118, 54, 22);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(100, 148, 14, 36);
  if (kind === 'shotgun') {
    ctx.fillStyle = '#78716c';
    ctx.fillRect(70, 128, 40, 24);
  }
  if (kind === 'sniper') {
    ctx.fillStyle = '#111827';
    ctx.fillRect(118, 100, 44, 16);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(200, 128, 18, 10);
  }
  const label = kind === 'ar' ? 'RIFLE' : kind === 'shotgun' ? 'SHOTGUN' : 'SNIPER';
  caption(ctx, w, h, label, '#f8fafc');
}

function drawChestIcon(ctx, w, h) {
  plate(ctx, w, h, '#78350f', '#fbbf24');
  ctx.fillStyle = '#d97706';
  ctx.fillRect(70, 110, 116, 72);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(70, 96, 116, 24);
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(128, 148, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#78350f';
  ctx.fillRect(124, 148, 8, 16);
  caption(ctx, w, h, 'CHEST', '#fde68a');
}

const DRAW = {
  wood: drawWood,
  brick: drawBrick,
  metal: drawMetal,
  materials: drawWood,
  ammo: drawAmmo,
  ammo_rifle: drawAmmo,
  ammo_shells: drawAmmo,
  ammo_sniper: drawAmmo,
  shield: drawShield,
  medkit: drawMedkit,
  ar: (ctx, w, h) => drawGun(ctx, w, h, 'ar'),
  shotgun: (ctx, w, h) => drawGun(ctx, w, h, 'shotgun'),
  sniper: (ctx, w, h) => drawGun(ctx, w, h, 'sniper'),
  chest: drawChestIcon,
};

export function getLootSpriteTexture(type) {
  if (!spriteCache.has(type)) {
    const draw = DRAW[type] || DRAW.materials;
    spriteCache.set(type, canvasTexture(256, 320, draw));
  }
  return spriteCache.get(type);
}

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.15,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}

function add(parent, mesh, x, y, z, rx = 0, ry = 0, rz = 0) {
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeWoodModel() {
  const g = new THREE.Group();
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.28), mat(0xb45309, { roughness: 0.9 })), 0, 0.06, 0);
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.28), mat(0xd97706, { roughness: 0.9 })), 0.04, 0.18, 0.02);
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.28), mat(0x92400e, { roughness: 0.9 })), -0.03, 0.3, -0.02);
  return g;
}

function makeBrickModel() {
  const g = new THREE.Group();
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.32), mat(0xb91c1c, { roughness: 0.85 })), 0, 0.12, 0);
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.28), mat(0xdc2626, { roughness: 0.85 })), 0.04, 0.32, 0.02);
  return g;
}

function makeMetalModel() {
  const g = new THREE.Group();
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.34), mat(0x94a3b8, { metalness: 0.75, roughness: 0.3 })), 0, 0.12, 0);
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.3), mat(0xcbd5e1, { metalness: 0.8, roughness: 0.25 })), 0, 0.26, 0);
  return g;
}

function makeBullet(len, radius, tipColor, caseColor) {
  const g = new THREE.Group();
  const casing = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 8), mat(caseColor, { metalness: 0.7, roughness: 0.28 }));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.95, len * 0.35, 8), mat(tipColor, { metalness: 0.55, roughness: 0.35 }));
  tip.position.y = len * 0.5 + len * 0.12;
  g.add(casing, tip);
  return g;
}

function makeAmmoRifleModel() {
  const g = new THREE.Group();
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.48), mat(0xb45309, { roughness: 0.7 })), 0, 0.14, 0);
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.44), mat(0xf8fafc, { roughness: 0.4 })), 0, 0.3, 0);
  for (let i = 0; i < 5; i++) {
    const round = makeBullet(0.22, 0.028, 0xc2410c, 0xfbbf24);
    add(g, round, -0.2 + i * 0.1, 0.42, 0, Math.PI / 2, 0, 0);
  }
  return g;
}

function makeAmmoShellsModel() {
  const g = new THREE.Group();
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.34), mat(0x44403c, { roughness: 0.8 })), 0, 0.05, 0);
  for (let i = 0; i < 5; i++) {
    const shell = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 8), mat(0xdc2626, { roughness: 0.45 }));
    const brass = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.06, 8), mat(0xfbbf24, { metalness: 0.7, roughness: 0.3 }));
    brass.position.y = -0.12;
    shell.add(body, brass);
    add(g, shell, -0.2 + i * 0.1, 0.22, 0);
  }
  return g;
}

function makeAmmoSniperModel() {
  const g = new THREE.Group();
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.3), mat(0x1e293b, { metalness: 0.4 })), 0, 0.08, 0);
  for (let i = 0; i < 3; i++) {
    const round = makeBullet(0.38, 0.03, 0xcbd5e1, 0xf59e0b);
    add(g, round, -0.14 + i * 0.14, 0.28, 0, Math.PI / 2, 0, 0);
  }
  return g;
}

function makeAmmoModel(kind = 'ammo') {
  if (kind === 'ammo_shells') return makeAmmoShellsModel();
  if (kind === 'ammo_sniper') return makeAmmoSniperModel();
  return makeAmmoRifleModel();
}

function makeShieldModel() {
  const g = new THREE.Group();
  add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.42, 10), mat(0x22d3ee, {
    roughness: 0.2,
    metalness: 0.2,
    emissive: 0x0891b2,
    emissiveIntensity: 0.35,
  })), 0, 0.28, 0);
  add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 8), mat(0x155e75)), 0, 0.54, 0);
  add(g, new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), mat(0x67e8f9, { metalness: 0.3 })), 0, 0.62, 0);
  return g;
}

function makeMedkitModel() {
  const g = new THREE.Group();
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.36), mat(0xdc2626, { roughness: 0.45 })), 0, 0.16, 0);
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.38), mat(0xffffff)), 0, 0.32, 0);
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.12), mat(0xffffff)), 0, 0.32, 0);
  return g;
}

function makeGunModel(kind) {
  const g = new THREE.Group();
  const bodyCol = kind === 'ar' ? 0x64748b : kind === 'shotgun' ? 0x78716c : 0x334155;
  const barrelLen = kind === 'sniper' ? 0.85 : kind === 'shotgun' ? 0.42 : 0.55;
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.42), mat(bodyCol, { metalness: 0.45 })), 0, 0.16, 0);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, barrelLen, 8), mat(0x111827, { metalness: 0.7 }));
  add(g, barrel, 0, 0.2, -0.22 - barrelLen / 4, Math.PI / 2, 0, 0);
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.08), mat(0x1f2937)), 0, 0.04, 0.1);
  if (kind === 'shotgun') {
    add(g, new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.18), mat(0x44403c)), 0, 0.12, -0.08);
  }
  if (kind === 'sniper') {
    add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), mat(0x111827, { metalness: 0.8 })), 0, 0.28, 0, Math.PI / 2, 0, 0);
  }
  g.rotation.y = Math.PI / 5;
  return g;
}

function makeChestModel() {
  const g = new THREE.Group();
  const body = add(g, new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 1.05), mat(0xb45309, {
    roughness: 0.55,
    metalness: 0.25,
    emissive: 0x78350f,
    emissiveIntensity: 0.12,
  })), 0, 0.48, 0);
  body.name = 'chestBody';
  const lid = add(g, new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.28, 1.12), mat(0xf59e0b, { metalness: 0.45, roughness: 0.35 })), 0, 1.05, 0);
  lid.name = 'chestLid';
  add(g, new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.08, 1.14), mat(0xfbbf24, { metalness: 0.6 })), 0, 0.92, 0);
  add(g, new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.95, 1.06), mat(0xfacc15, { metalness: 0.7 })), 0, 0.48, 0);
  add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10), mat(0xfde68a, { metalness: 0.8 })), 0, 0.72, 0.54, Math.PI / 2, 0, 0);
  return g;
}

function makeModel(type) {
  if (type === 'wood' || type === 'materials') return makeWoodModel();
  if (type === 'brick') return makeBrickModel();
  if (type === 'metal') return makeMetalModel();
  if (type === 'ammo' || type === 'ammo_rifle' || type === 'ammo_shells' || type === 'ammo_sniper') {
    return makeAmmoModel(type);
  }
  if (type === 'shield') return makeShieldModel();
  if (type === 'medkit') return makeMedkitModel();
  if (type === 'ar' || type === 'shotgun' || type === 'sniper') return makeGunModel(type);
  return makeWoodModel();
}

function makeGlow(color) {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 20),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.03;
  return mesh;
}

function makeSprite(type, scaleX = 1.15, scaleY = 1.45) {
  const map = pngMaps[type] || getLootSpriteTexture(type);
  const isAmmo = Boolean(pngMaps[type]);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map,
      transparent: true,
      depthWrite: false,
    })
  );
  sprite.scale.set(isAmmo ? 1.7 : scaleX, isAmmo ? 1.7 : scaleY, 1);
  sprite.center.set(0.5, 0);
  return sprite;
}

export function createLootPickup(type) {
  const def = LOOT_DEFS[type] || LOOT_DEFS.materials;
  const group = new THREE.Group();
  const model = makeModel(type);
  model.position.y = 0.05;
  const sprite = makeSprite(type);
  sprite.position.y = 1.15;
  const glow = makeGlow(def.color);
  group.add(glow, model, sprite);
  group.userData.lootType = type;
  group.userData.spin = Math.random() * Math.PI * 2;
  group.userData.model = model;
  group.userData.glow = glow;
  return group;
}

export function createChest(x, z) {
  const group = makeChestModel();
  group.position.set(x, 0, z);
  const sprite = makeSprite('chest', 1.3, 1.6);
  sprite.position.set(0, 1.55, 0);
  group.add(sprite);
  group.userData.isChest = true;
  group.userData.opened = false;
  group.userData.labelSprite = sprite;
  group.userData.lid = group.getObjectByName('chestLid');
  group.userData.body = group.getObjectByName('chestBody');
  return group;
}
