import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createCharacter, flashCharacter, resetCharacterColors, SKINS } from './CharacterModel.js';
import { BOT } from './constants.js';

const MAX_ENEMIES = 10;
const UPDATE_RANGE = 120;

function createBotGun() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.35), mat);
  body.position.set(0.05, 0, -0.15);
  group.add(body);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6), mat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0.05, 0.02, -0.38);
  group.add(barrel);
  group.position.set(0.42, 0.85, 0.15);
  group.rotation.y = -Math.PI / 6;
  return group;
}

export class Enemy {
  constructor(scene, world, position, id) {
    this.id = id;
    this.scene = scene;
    this.world = world;
    this.alive = true;
    this.health = 100;
    this.maxHealth = 100;
    this.attackCooldown = 0;
    this.fireCooldown = 1.5 + Math.random();
    this.speed = BOT.speedMin + Math.random() * (BOT.speedMax - BOT.speedMin);
    this.skinIndex = id % SKINS.length;
    this.shootRange = BOT.shootRange;
    this.meleeRange = BOT.meleeRange;
    this.raycaster = new THREE.Raycaster();

    const { group, skin, headMesh } = createCharacter(false, this.skinIndex);
    this.mesh = group;
    this.skin = skin;
    this.headMesh = headMesh;
    this.gun = createBotGun();
    this.mesh.add(this.gun);
    this.mesh.position.copy(position);
    this.mesh.userData.enemyId = id;
    scene.add(this.mesh);

    this.body = new CANNON.Body({
      mass: 70,
      shape: new CANNON.Sphere(0.5),
      linearDamping: 0.02,
      fixedRotation: true,
    });
    this.body.position.set(position.x, position.y + 1, position.z);
    world.addBody(this.body);
  }

  takeDamage(amount, isHeadshot = false) {
    if (!this.alive) return;
    this.health -= amount;
    flashCharacter(this.mesh, isHeadshot ? 0xffff00 : 0xffffff);
    setTimeout(() => {
      if (this.mesh && this.alive) resetCharacterColors(this.mesh, this.skin);
    }, isHeadshot ? 120 : 60);
    if (this.health <= 0) this.die(this.onDeathCallback);
    return isHeadshot;
  }

  die(onDeath) {
    const pos = new THREE.Vector3(this.body.position.x, this.body.position.y, this.body.position.z);
    this.alive = false;
    this.scene.remove(this.mesh);
    this.world.removeBody(this.body);
    if (onDeath) onDeath(pos);
  }

  getEyePosition() {
    const p = this.body.position;
    return new THREE.Vector3(p.x, p.y + 0.6, p.z);
  }

  tryShoot(player, blockers = []) {
    const eye = this.getEyePosition();
    const target = new THREE.Vector3(
      player.body.position.x,
      player.body.position.y + 0.8,
      player.body.position.z
    );
    const toPlayer = target.clone().sub(eye);
    const dist = toPlayer.length();
    if (dist > this.shootRange) return false;

    const dir = toPlayer.normalize();
    dir.x += (Math.random() - 0.5) * BOT.aimSpread;
    dir.y += (Math.random() - 0.5) * BOT.aimSpread * 0.7;
    dir.z += (Math.random() - 0.5) * BOT.aimSpread;
    dir.normalize();

    this.raycaster.set(eye, dir);
    this.raycaster.far = dist;
    const hits = this.raycaster.intersectObjects(blockers, true);
    if (hits.length > 0 && hits[0].distance < dist - 0.8) return false;

    const dmg = BOT.shootDamageMin + Math.floor(Math.random() * (BOT.shootDamageMax - BOT.shootDamageMin + 1));
    player.takeDamage(dmg, { fromBot: true });
    return true;
  }

  update(dt, player, blockers = []) {
    if (!this.alive || !player.alive) return;

    const px = player.body.position.x;
    const py = player.body.position.y;
    const pz = player.body.position.z;
    const ex = this.body.position.x;
    const ey = this.body.position.y;
    const ez = this.body.position.z;
    const distSq = (px - ex) ** 2 + (pz - ez) ** 2;
    const vertDiff = Math.abs(py - ey);

    if (distSq > UPDATE_RANGE * UPDATE_RANGE) {
      this.body.velocity.x *= 0.5;
      this.body.velocity.z *= 0.5;
      return;
    }

    this.attackCooldown -= dt;
    this.fireCooldown -= dt;
    const dist = Math.sqrt(distSq);

    if (dist > this.meleeRange + 1) {
      this.body.velocity.x = (px - ex) / dist * this.speed;
      this.body.velocity.z = (pz - ez) / dist * this.speed;
    } else {
      this.body.velocity.x *= 0.5;
      this.body.velocity.z *= 0.5;
    }

    if (dist > this.meleeRange && dist < this.shootRange && vertDiff < 2.5 && this.fireCooldown <= 0) {
      if (this.tryShoot(player, blockers)) {
        this.fireCooldown = BOT.fireCooldownMin + Math.random() * (BOT.fireCooldownMax - BOT.fireCooldownMin);
        this.gun.rotation.x = -0.15;
        setTimeout(() => { if (this.gun) this.gun.rotation.x = 0; }, 80);
      } else {
        this.fireCooldown = 0.6;
      }
    }

    if (dist <= this.meleeRange && vertDiff < 1.2 && this.attackCooldown <= 0) {
      player.takeDamage(BOT.meleeDamage, { fromBot: true });
      this.attackCooldown = BOT.meleeCooldown;
    }

    this.mesh.position.set(ex, this.body.position.y - 0.2, ez);
    this.mesh.lookAt(px, this.mesh.position.y, pz);
    if (this.gun) this.gun.visible = dist > this.meleeRange * 0.8;
  }
}

export function spawnEnemies(scene, world, count, center, radius, existingCount = 0) {
  const enemies = [];
  const toSpawn = Math.min(count, MAX_ENEMIES - existingCount);
  for (let i = 0; i < toSpawn; i++) {
    const angle = (i / Math.max(1, toSpawn)) * Math.PI * 2 + Math.random() * 0.5;
    const r = radius * 0.5 + Math.random() * radius * 0.5;
    const pos = new THREE.Vector3(
      center.x + Math.cos(angle) * r,
      0,
      center.z + Math.sin(angle) * r
    );
    enemies.push(new Enemy(scene, world, pos, Math.floor(Math.random() * 999)));
  }
  return enemies;
}

export { MAX_ENEMIES, UPDATE_RANGE };
