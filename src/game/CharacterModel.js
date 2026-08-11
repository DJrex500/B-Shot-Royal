import * as THREE from 'three';

export const SKINS = [
  { name: 'Default', body: 0x3b82f6, shirt: 0x1d4ed8, pants: 0x1e293b, skin: 0xd4a574, hair: 0x3b2f2f },
  { name: 'Renegade', body: 0xef4444, shirt: 0xb91c1c, pants: 0x111827, skin: 0x8d5524, hair: 0x1a1a1a },
  { name: 'Shadow', body: 0x6366f1, shirt: 0x4338ca, pants: 0x0f172a, skin: 0xf5cba7, hair: 0xfbbf24 },
  { name: 'Toxic', body: 0x22c55e, shirt: 0x15803d, pants: 0x14532d, skin: 0xc68642, hair: 0x2d2d2d },
  { name: 'Blaze', body: 0xf97316, shirt: 0xea580c, pants: 0x292524, skin: 0xe0ac69, hair: 0x0a0a0a },
  { name: 'Ghost', body: 0xe2e8f0, shirt: 0x94a3b8, pants: 0x475569, skin: 0xffdbac, hair: 0xc0c0c0 },
  { name: 'Violet', body: 0xa855f7, shirt: 0x7e22ce, pants: 0x1e1b4b, skin: 0x6b4423, hair: 0x4c1d95 },
  { name: 'Gold', body: 0xfbbf24, shirt: 0xd97706, pants: 0x78350f, skin: 0xd4a574, hair: 0x1c1917 },
];

function part(geo, color, opts = {}) {
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.7,
      metalness: opts.metalness ?? 0,
    })
  );
  m.castShadow = !opts.noShadow;
  return m;
}

export function createCharacter(isPlayer = false, skinIndex = 0) {
  const skin = SKINS[skinIndex % SKINS.length];
  const group = new THREE.Group();

  const torso = part(new THREE.BoxGeometry(0.72, 0.88, 0.42), skin.shirt);
  torso.position.y = 1.05;
  group.add(torso);

  const chestStripe = part(new THREE.BoxGeometry(0.74, 0.18, 0.44), skin.body, { roughness: 0.5 });
  chestStripe.position.y = 1.2;
  group.add(chestStripe);

  const pelvis = part(new THREE.BoxGeometry(0.66, 0.32, 0.4), skin.pants);
  pelvis.position.y = 0.52;
  group.add(pelvis);

  const head = part(new THREE.BoxGeometry(0.44, 0.44, 0.44), skin.skin, { roughness: 0.8 });
  head.position.y = 1.68;
  head.userData.isHead = true;
  group.add(head);

  const hair = part(new THREE.BoxGeometry(0.46, 0.16, 0.46), skin.hair);
  hair.position.y = 1.96;
  group.add(hair);

  const visor = part(new THREE.BoxGeometry(0.46, 0.11, 0.1), 0x111827, { roughness: 0.3, metalness: 0.5 });
  visor.position.set(0, 1.7, 0.21);
  group.add(visor);

  const shoulderGeo = new THREE.BoxGeometry(0.28, 0.22, 0.28);
  const shoulderL = part(shoulderGeo, skin.body, { roughness: 0.55 });
  shoulderL.position.set(-0.5, 1.35, 0);
  group.add(shoulderL);
  const shoulderR = part(shoulderGeo, skin.body, { roughness: 0.55 });
  shoulderR.position.set(0.5, 1.35, 0);
  group.add(shoulderR);

  const armGeo = new THREE.BoxGeometry(0.22, 0.72, 0.22);
  const armL = part(armGeo, skin.body);
  armL.position.set(-0.5, 0.98, 0);
  group.add(armL);
  const armR = part(armGeo, skin.body);
  armR.position.set(0.5, 0.98, 0);
  group.add(armR);

  const legGeo = new THREE.BoxGeometry(0.27, 0.78, 0.27);
  const legL = part(legGeo, skin.pants);
  legL.position.set(-0.18, 0.02, 0);
  group.add(legL);
  const legR = part(legGeo, skin.pants);
  legR.position.set(0.18, 0.02, 0);
  group.add(legR);

  const bootGeo = new THREE.BoxGeometry(0.3, 0.14, 0.34);
  const bootL = part(bootGeo, 0x1a1a1a, { roughness: 0.85 });
  bootL.position.set(-0.18, -0.32, 0.04);
  group.add(bootL);
  const bootR = part(bootGeo, 0x1a1a1a, { roughness: 0.85 });
  bootR.position.set(0.18, -0.32, 0.04);
  group.add(bootR);

  if (!isPlayer) {
    const backpack = part(new THREE.BoxGeometry(0.5, 0.55, 0.22), skin.body, { roughness: 0.6 });
    backpack.position.set(0, 1.05, -0.28);
    group.add(backpack);
  }

  group.userData.skinName = skin.name;
  if (!isPlayer) group.userData.enemySkin = skin;

  return { group, skin, headMesh: head, torsoMesh: torso };
}

export function createFPSArms(skinIndex = 0) {
  const skin = SKINS[skinIndex % SKINS.length];
  const group = new THREE.Group();

  const sleeveGeo = new THREE.BoxGeometry(0.1, 0.22, 0.1);
  const foreGeo = new THREE.BoxGeometry(0.08, 0.18, 0.08);
  const gloveGeo = new THREE.BoxGeometry(0.09, 0.08, 0.09);

  const armR = part(sleeveGeo, skin.body);
  armR.position.set(0.12, 0.02, 0.08);
  armR.rotation.z = -0.1;
  group.add(armR);

  const foreR = part(foreGeo, skin.skin, { roughness: 0.85 });
  foreR.position.set(0.14, -0.14, 0.02);
  foreR.rotation.x = 0.4;
  group.add(foreR);

  const gloveR = part(gloveGeo, 0x1e293b, { roughness: 0.9 });
  gloveR.position.set(0.14, -0.24, -0.04);
  group.add(gloveR);

  const armL = part(sleeveGeo, skin.body);
  armL.position.set(-0.18, -0.02, 0.04);
  armL.rotation.z = 0.15;
  group.add(armL);

  const foreL = part(foreGeo, skin.skin, { roughness: 0.85 });
  foreL.position.set(-0.2, -0.18, -0.02);
  foreL.rotation.x = 0.3;
  group.add(foreL);

  return group;
}

export function flashCharacter(group, color = 0xffffff) {
  group.traverse((c) => {
    if (c.isMesh && c.material?.color) {
      c.material.color.setHex(color);
    }
  });
}

export function resetCharacterColors(group, skin) {
  const colorMap = [
    skin.shirt, skin.body, skin.pants, skin.skin, skin.hair, null,
    skin.body, skin.body, skin.body, skin.body,
    skin.pants, skin.pants, null, null, skin.body,
  ];
  group.children.forEach((child, idx) => {
    const color = colorMap[idx];
    if (color != null && child?.material?.color) child.material.color.setHex(color);
  });
}
