import * as THREE from 'three';
import { COLORS, LOOT } from './constants.js';
import { WEAPON_ORDER } from './weapons.js';

const LOOT_DEFS = {
  materials: { color: 0xfbbf24, label: 'Materials', y: 0.8 },
  ammo: { color: 0x60a5fa, label: 'Ammo', y: 0.8 },
  shield: { color: 0x06b6d4, label: 'Shield Potion', y: 0.8 },
  medkit: { color: 0xef4444, label: 'Medkit', y: 0.8 },
  ar: { color: 0x64748b, label: 'Assault Rifle', y: 1 },
  shotgun: { color: 0x78716c, label: 'Shotgun', y: 1 },
  sniper: { color: 0x334155, label: 'Sniper', y: 1 },
};

export class LootSystem {
  constructor(scene, spawnPoints) {
    this.scene = scene;
    this.items = [];
    this.chests = [];
    this.pickupFeed = [];
    this.raycaster = new THREE.Raycaster();
  }

  generate(spawnPoints) {
    for (let i = 0; i < 20; i++) {
      const pt = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
      const x = pt.x + (Math.random() - 0.5) * 20;
      const z = pt.z + (Math.random() - 0.5) * 20;
      this.spawnChest(x, z);
    }

    const types = ['materials', 'materials', 'ammo', 'shield', 'medkit', 'ar', 'shotgun', 'sniper'];
    for (let i = 0; i < 40; i++) {
      const pt = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
      const x = pt.x + (Math.random() - 0.5) * 30;
      const z = pt.z + (Math.random() - 0.5) * 30;
      const type = types[Math.floor(Math.random() * types.length)];
      this.spawnGroundLoot(x, z, type);
    }
  }

  spawnChest(x, z) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.55, roughness: 0.35, emissive: 0x92400e, emissiveIntensity: 0.15 })
    );
    body.position.y = 0.5;
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.3, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.6, roughness: 0.3 })
    );
    lid.position.y = 1.1;
    group.add(body, lid);
    group.position.set(x, 0, z);
    group.userData.isChest = true;
    group.userData.opened = false;
    this.scene.add(group);
    this.chests.push(group);
  }

  spawnGroundLoot(x, z, type) {
    const def = LOOT_DEFS[type];
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35, 0),
      new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.25 })
    );
    mesh.position.set(x, def.y, z);
    mesh.userData.lootType = type;
    mesh.userData.spin = Math.random() * Math.PI * 2;
    this.scene.add(mesh);
    this.items.push(mesh);
  }

  update(dt, player, weapons, onPickup) {
    for (const item of this.items) {
      item.rotation.y += dt * 2;
      item.position.y = LOOT_DEFS[item.userData.lootType].y + Math.sin(item.userData.spin + performance.now() * 0.002) * 0.1;

      const dist = item.position.distanceTo(player.body.position);
      if (dist < LOOT.pickupRange) {
        this.applyLoot(item.userData.lootType, player, weapons);
        this.scene.remove(item);
        this.items = this.items.filter((i) => i !== item);
        if (onPickup) onPickup(LOOT_DEFS[item.userData.lootType].label);
      }
    }
  }

  tryOpenChest(player, weapons, onPickup) {
    for (const chest of this.chests) {
      if (chest.userData.opened) continue;
      const dist = chest.position.distanceTo(player.body.position);
      if (dist > LOOT.chestRange) continue;

      chest.userData.opened = true;
      chest.children[1].rotation.x = -Math.PI / 3;
      chest.children[0].material.color.setHex(0x4b5563);

      const lootRoll = Math.random();
      if (lootRoll < 0.3) this.applyLoot('ar', player, weapons);
      else if (lootRoll < 0.5) this.applyLoot('shotgun', player, weapons);
      else if (lootRoll < 0.6) this.applyLoot('sniper', player, weapons);
      else if (lootRoll < 0.75) this.applyLoot('materials', player, weapons, 50 + Math.floor(Math.random() * 40));
      else if (lootRoll < 0.9) this.applyLoot('shield', player, weapons);
      else this.applyLoot('medkit', player, weapons);

      if (onPickup) onPickup('Chest opened!');
      return true;
    }
    return false;
  }

  applyLoot(type, player, weapons, amount) {
    switch (type) {
      case 'materials':
        player.materials = (player.materials || 0) + (amount || 25 + Math.floor(Math.random() * 20));
        break;
      case 'ammo':
        for (const id of WEAPON_ORDER) weapons.addAmmo(id, 15 + Math.floor(Math.random() * 20));
        break;
      case 'shield':
        player.shield = Math.min(player.maxShield || 100, (player.shield || 0) + 25);
        break;
      case 'medkit':
        player.health = Math.min(player.maxHealth || 100, (player.health || 0) + 50);
        break;
      case 'ar':
        weapons.giveWeapon('assault');
        break;
      case 'shotgun':
        weapons.giveWeapon('shotgun');
        break;
      case 'sniper':
        weapons.giveWeapon('sniper');
        break;
    }
  }

  spawnLootAt(x, z, type) {
    this.spawnGroundLoot(x, z, type);
  }

  getNearbyChest(player) {
    for (const chest of this.chests) {
      if (chest.userData.opened) continue;
      if (chest.position.distanceTo(player.body.position) <= LOOT.chestRange) return true;
    }
    return false;
  }
}
