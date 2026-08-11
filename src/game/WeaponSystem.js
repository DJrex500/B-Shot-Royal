import * as THREE from 'three';
import { WEAPONS, WEAPON_ORDER } from './weapons.js';

function createWeaponMesh(weapon) {
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(0.08, 0.12, 0.55);
  const bodyMat = new THREE.MeshStandardMaterial({ color: weapon.color, metalness: 0.6, roughness: 0.35 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  const barrelLen = weapon.id === 'sniper' ? 0.7 : weapon.id === 'shotgun' ? 0.35 : 0.45;
  const barrelGeo = new THREE.CylinderGeometry(0.025, 0.025, barrelLen, 8);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, bodyMat);
  barrel.position.set(0, 0.04, -0.35 - barrelLen / 2 + 0.2);
  group.add(barrel);

  if (weapon.id === 'shotgun') {
    const pump = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.05, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x44403c })
    );
    pump.position.set(0, -0.02, -0.15);
    group.add(pump);
  }

  if (weapon.id === 'sniper') {
    const scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8),
      new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 })
    );
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.1, -0.1);
    group.add(scope);
  }

  return group;
}

export class WeaponSystem {
  constructor(player, scene) {
    this.player = player;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();

    this.state = {};
    for (const id of WEAPON_ORDER) {
      const w = WEAPONS[id];
      this.state[id] = {
        ammo: w.magSize,
        reserve: w.reserve,
        cooldown: 0,
        reloading: false,
        reloadTimer: 0,
      };
    }

    this.currentIndex = 0;
    this.meshes = {};
    for (const id of WEAPON_ORDER) {
      this.meshes[id] = createWeaponMesh(WEAPONS[id]);
    }
    this.equip(WEAPON_ORDER[0]);

    this.tracers = [];
    this.onHit = null;
    this.onHeadshot = null;
    this.scoped = false;
    this.enemyTargets = [];
    this.maxTracers = 16;
    this.audio = null;
    this.effects = null;
    this.building = null;
    this.onPlayerHit = null;
  }

  setEnemyTargets(enemies) {
    this.enemyTargets = enemies.filter((e) => e.alive).map((e) => e.mesh);
  }

  get currentId() {
    return WEAPON_ORDER[this.currentIndex];
  }

  get current() {
    return WEAPONS[this.currentId];
  }

  get currentState() {
    return this.state[this.currentId];
  }

  equip(id) {
    const idx = WEAPON_ORDER.indexOf(id);
    if (idx >= 0) {
      this.currentIndex = idx;
      this.player.setWeaponModel(this.meshes[id]);
    }
  }

  switchTo(index) {
    if (index >= 0 && index < WEAPON_ORDER.length) {
      this.currentIndex = index;
      this.player.setWeaponModel(this.meshes[this.currentId]);
    }
  }

  giveWeapon(id) {
    const idx = WEAPON_ORDER.indexOf(id);
    if (idx < 0) return;
    const w = WEAPONS[id];
    const st = this.state[id];
    st.ammo = w.magSize;
    st.reserve += Math.floor(w.reserve * 0.5);
    this.switchTo(idx);
  }

  addAmmo(id, amount) {
    if (this.state[id]) this.state[id].reserve += amount;
  }

  getEffectiveSpread(weapon) {
    return this.scoped ? weapon.spread * weapon.adsSpreadMult : weapon.spread;
  }

  update(dt, input, enemies, buildMeshes, scoped = false) {
    this.scoped = scoped;
    const st = this.currentState;
    const w = this.current;

    if (st.cooldown > 0) st.cooldown -= dt;
    if (st.reloading) {
      st.reloadTimer -= dt;
      if (st.reloadTimer <= 0) {
        const needed = w.magSize - st.ammo;
        const taken = Math.min(needed, st.reserve);
        st.ammo += taken;
        st.reserve -= taken;
        st.reloading = false;
      }
      return;
    }

    if (input.wasPressed('KeyR') && st.ammo < w.magSize && st.reserve > 0) {
      st.reloading = true;
      st.reloadTimer = w.reloadTime;
      if (this.audio) this.audio.reload();
      return;
    }

    const wantsFire = w.automatic ? input.buttons.left : input.buttons.left;
    if (!wantsFire || st.cooldown > 0 || st.ammo <= 0) {
      if (input.buttons.left && st.ammo <= 0 && st.reserve > 0 && !st.reloading) {
        st.reloading = true;
        st.reloadTimer = w.reloadTime;
      }
      return;
    }

    if (input.buttons.left && st.cooldown <= 0 && st.ammo > 0) {
      this.fire(w, st, enemies, buildMeshes);
      if (!w.automatic) {
        input.buttons.left = false;
      }
    }
  }

  fire(weapon, st, enemies, buildMeshes) {
    st.ammo -= 1;
    st.cooldown = weapon.fireRate;
    this.player.recoilKick(weapon.id === 'sniper' ? 0.12 : weapon.id === 'shotgun' ? 0.08 : 0.04);
    if (this.audio) this.audio.gunshot(weapon.id);

    const muzzlePos = new THREE.Vector3();
    this.player.weaponGroup.getWorldPosition(muzzlePos);
    if (this.effects) this.effects.muzzleFlash(muzzlePos);

    const origin = this.player.eyePosition.clone();
    const direction = new THREE.Vector3();
    this.player.camera.getWorldDirection(direction);

    const spread = this.getEffectiveSpread(weapon);
    let hitEnemy = false;

    for (let p = 0; p < weapon.pellets; p++) {
      const spreadDir = direction.clone();
      spreadDir.x += (Math.random() - 0.5) * spread;
      spreadDir.y += (Math.random() - 0.5) * spread;
      spreadDir.z += (Math.random() - 0.5) * spread;
      spreadDir.normalize();

      this.raycaster.set(origin, spreadDir);
      this.raycaster.far = weapon.range;

      const targets = this.enemyTargets.length ? [...this.enemyTargets] : [];
      buildMeshes.forEach((m) => targets.push(m));

      const hits = this.raycaster.intersectObjects(targets, true);
      let hitPoint = origin.clone().add(spreadDir.clone().multiplyScalar(weapon.range));
      let isHeadshot = false;

      if (hits.length > 0) {
        hitPoint = hits[0].point;
        const hitObj = hits[0].object;
        isHeadshot = hitObj.userData.isHead === true;
        const enemy = this.findEnemy(hitObj, enemies);
        if (enemy && enemy.alive) {
          const dmg = Math.round(weapon.damage * (isHeadshot ? weapon.headshotMult : 1));
          enemy.takeDamage(dmg, isHeadshot);
          hitEnemy = true;
          if (this.audio) this.audio.hit(isHeadshot);
          if (this.onPlayerHit) this.onPlayerHit(isHeadshot);
          if (isHeadshot && this.onHeadshot) this.onHeadshot(enemy, dmg);
          if (this.onHit) this.onHit(enemy, dmg, isHeadshot);
        } else {
          let buildMesh = hitObj;
          while (buildMesh && !buildMesh.userData?.isBuildPiece) buildMesh = buildMesh.parent;
          if (buildMesh && this.building) {
            this.building.damagePiece(buildMesh, weapon.damage * 0.5);
            if (this.effects) this.effects.impact(hitPoint, 0xcc9966);
          } else if (this.effects) {
            this.effects.impact(hitPoint);
          }
        }
      }

      if (this.tracers.length < this.maxTracers) {
        this.spawnTracer(origin, hitPoint, weapon, isHeadshot);
      }
    }
  }

  spawnTracer(from, to, weapon, isHeadshot = false) {
    const color = isHeadshot ? 0xff4444 : weapon.id === 'sniper' ? 0xffff00 : weapon.id === 'shotgun' ? 0xff8800 : 0xffffff;
    const geo = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.tracers.push({ line, life: 0.06 });
  }

  findEnemy(object, enemies) {
    let current = object;
    while (current) {
      const found = enemies.find((e) => e.mesh === current);
      if (found) return found;
      current = current.parent;
    }
    return null;
  }

  updateTracers(dt) {
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      this.tracers[i].life -= dt;
      if (this.tracers[i].life <= 0) {
        this.scene.remove(this.tracers[i].line);
        this.tracers[i].line.geometry.dispose();
        this.tracers[i].line.material.dispose();
        this.tracers.splice(i, 1);
      }
    }
  }
}
