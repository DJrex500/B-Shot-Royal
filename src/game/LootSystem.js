import { LOOT } from './constants.js';
import { LOOT_DEFS, createLootPickup, createChest } from './lootVisuals.js';

export class LootSystem {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.chests = [];
    this.pickupFeed = [];
  }

  generate(spawnPoints) {
    for (let i = 0; i < 20; i++) {
      const pt = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
      const x = pt.x + (Math.random() - 0.5) * 20;
      const z = pt.z + (Math.random() - 0.5) * 20;
      this.spawnChest(x, z);
    }

    const types = ['wood', 'wood', 'brick', 'metal', 'ammo_rifle', 'ammo_rifle', 'ammo_shells', 'ammo_sniper', 'shield', 'medkit', 'ar', 'shotgun', 'sniper'];
    for (let i = 0; i < 40; i++) {
      const pt = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
      const x = pt.x + (Math.random() - 0.5) * 30;
      const z = pt.z + (Math.random() - 0.5) * 30;
      const type = types[Math.floor(Math.random() * types.length)];
      this.spawnGroundLoot(x, z, type);
    }
  }

  spawnChest(x, z) {
    const group = createChest(x, z);
    this.scene.add(group);
    this.chests.push(group);
  }

  spawnGroundLoot(x, z, type) {
    const group = createLootPickup(type);
    group.position.set(x, 0, z);
    this.scene.add(group);
    this.items.push(group);
  }

  update(dt, player, weapons, onPickup) {
    const t = performance.now() * 0.002;
    for (const item of this.items) {
      item.userData.spin += dt * 1.6;
      if (item.userData.model) {
        item.userData.model.rotation.y = item.userData.spin;
        item.userData.model.position.y = 0.08 + Math.sin(item.userData.spin + t) * 0.08;
      }
      if (item.userData.glow?.material) {
        item.userData.glow.material.opacity = 0.22 + Math.sin(t * 2 + item.userData.spin) * 0.1;
      }

      const dist = item.position.distanceTo(player.body.position);
      if (dist < LOOT.pickupRange) {
        const type = item.userData.lootType;
        this.applyLoot(type, player, weapons);
        this.scene.remove(item);
        this.items = this.items.filter((i) => i !== item);
        if (onPickup) onPickup(LOOT_DEFS[type].label, type);
      }
    }
  }

  tryOpenChest(player, weapons, onPickup) {
    for (const chest of this.chests) {
      if (chest.userData.opened) continue;
      const dist = chest.position.distanceTo(player.body.position);
      if (dist > LOOT.chestRange) continue;

      chest.userData.opened = true;
      if (chest.userData.lid) chest.userData.lid.rotation.x = -Math.PI / 2.4;
      if (chest.userData.body?.material) chest.userData.body.material.color.setHex(0x4b5563);
      if (chest.userData.labelSprite) chest.userData.labelSprite.visible = false;

      const lootRoll = Math.random();
      let type = 'medkit';
      if (lootRoll < 0.3) type = 'ar';
      else if (lootRoll < 0.5) type = 'shotgun';
      else if (lootRoll < 0.6) type = 'sniper';
      else if (lootRoll < 0.7) type = 'wood';
      else if (lootRoll < 0.78) type = 'brick';
      else if (lootRoll < 0.84) type = 'metal';
      else if (lootRoll < 0.9) type = 'shield';

      this.applyLoot(type, player, weapons);
      if (onPickup) onPickup(`Chest: ${LOOT_DEFS[type].label}`, type);
      return true;
    }
    return false;
  }

  applyLoot(type, player, weapons, amount) {
    switch (type) {
      case 'materials':
      case 'wood':
        player.addMats('wood', amount || 25 + Math.floor(Math.random() * 20));
        break;
      case 'brick':
        player.addMats('brick', amount || 20 + Math.floor(Math.random() * 16));
        break;
      case 'metal':
        player.addMats('metal', amount || 12 + Math.floor(Math.random() * 12));
        break;
      case 'ammo':
      case 'ammo_rifle':
        weapons.addAmmo('assault', amount || 24 + Math.floor(Math.random() * 18));
        break;
      case 'ammo_shells':
        weapons.addAmmo('shotgun', amount || 6 + Math.floor(Math.random() * 8));
        break;
      case 'ammo_sniper':
        weapons.addAmmo('sniper', amount || 4 + Math.floor(Math.random() * 5));
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
