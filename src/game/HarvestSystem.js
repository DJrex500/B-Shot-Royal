import * as THREE from 'three';
import { LOOT } from './constants.js';

export class HarvestSystem {
  constructor(scene) {
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.swingCooldown = 0;
    this.pickaxeGroup = null;
  }

  createPickaxeMesh() {
    const g = new THREE.Group();
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a3728 })
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.1, -0.1, -0.2);
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.06, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 })
    );
    head.position.set(0.1, -0.05, -0.45);
    g.add(handle, head);
    return g;
  }

  getTarget(player, harvestables) {
    const origin = player.eyePosition.clone();
    const dir = new THREE.Vector3();
    player.camera.getWorldDirection(dir);
    this.raycaster.set(origin, dir);
    this.raycaster.far = LOOT.harvestRange;
    const hits = this.raycaster.intersectObjects(harvestables, false);
    if (!hits.length) return null;
    const obj = hits[0].object;
    if (!obj.userData.harvestable || obj.userData.health <= 0) return null;
    return { type: obj.userData.harvestType, object: obj };
  }

  update(dt) {
    if (this.swingCooldown > 0) this.swingCooldown -= dt;
  }

  tryHarvest(player, harvestables, onHarvest) {
    if (this.swingCooldown > 0) return false;

    const origin = player.eyePosition.clone();
    const dir = new THREE.Vector3();
    player.camera.getWorldDirection(dir);

    this.raycaster.set(origin, dir);
    this.raycaster.far = LOOT.harvestRange;
    const hits = this.raycaster.intersectObjects(harvestables, false);
    if (!hits.length) return false;

    const hit = hits[0];
    const obj = hit.object;
    if (!obj.userData.harvestable || obj.userData.health <= 0) return false;

    obj.userData.health -= LOOT.harvestDamage;
    const type = obj.userData.harvestType;
    const matKey = type === 'wood' ? 'wood' : type === 'metal' ? 'metal' : 'brick';
    const mats = matKey === 'wood' ? 15 + Math.floor(Math.random() * 10)
      : matKey === 'metal' ? 8 + Math.floor(Math.random() * 7)
      : 12 + Math.floor(Math.random() * 8);

    player.addMats(matKey, mats);
    this.swingCooldown = 0.45;
    player.recoilKick(0.06);

    if (obj.material) {
      const restore = type === 'wood' ? 0x4a3728 : type === 'metal' ? 0x64748b : 0x78716c;
      obj.material.color.setHex(0xffffff);
      setTimeout(() => {
        if (obj.material) obj.material.color.setHex(restore);
      }, 80);
    }

    if (obj.userData.health <= 0) {
      this.destroyHarvestable(obj, harvestables);
    }

    const label = matKey === 'wood' ? 'Wood' : matKey === 'metal' ? 'Metal' : 'Brick';
    if (onHarvest) onHarvest(`+${mats} ${label}`, matKey);
    return true;
  }

  destroyHarvestable(obj, harvestables) {
    this.scene.remove(obj);
    const idx = harvestables.indexOf(obj);
    if (idx >= 0) harvestables.splice(idx, 1);

    if (obj.userData.parentTrunk) {
      const trunk = obj.userData.parentTrunk;
      this.scene.remove(trunk);
      const ti = harvestables.indexOf(trunk);
      if (ti >= 0) harvestables.splice(ti, 1);
    }

    for (const h of [...harvestables]) {
      if (h.userData.parentTrunk === obj) {
        this.scene.remove(h);
        const i = harvestables.indexOf(h);
        if (i >= 0) harvestables.splice(i, 1);
      }
    }
  }
}
