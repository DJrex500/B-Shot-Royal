import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PLAYER } from './constants.js';
import { createFPSArms } from './CharacterModel.js';

export class Player {
  constructor(scene, world, spawnPos) {
    this.scene = scene;
    this.world = world;
    this.alive = true;

    this.health = PLAYER.maxHealth;
    this.shield = PLAYER.maxShield;
    this.maxHealth = PLAYER.maxHealth;
    this.maxShield = PLAYER.maxShield;
    this.materials = 100;

    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.velocity = new THREE.Vector3();

    this.body = new CANNON.Body({
      mass: 80,
      shape: new CANNON.Sphere(PLAYER.radius),
      linearDamping: 0.02,
      fixedRotation: true,
    });
    this.body.position.set(spawnPos.x, spawnPos.y + PLAYER.radius + 0.05, spawnPos.z);
    this.body.material = new CANNON.Material('player');
    world.addBody(this.body);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    this.cameraHolder = new THREE.Object3D();
    scene.add(this.cameraHolder);
    this.cameraHolder.add(this.camera);
    this.camera.position.set(0, 0.2, 0);

    this.weaponGroup = new THREE.Group();
    this.camera.add(this.weaponGroup);
    this.weaponGroup.position.set(0.35, -0.25, -0.5);

    this.armsGroup = createFPSArms(0);
    this.armsGroup.position.set(0.28, -0.48, -0.55);
    this.armsGroup.scale.setScalar(0.65);
    this.camera.add(this.armsGroup);

    this.viewMode = 'combat';

    this.weaponRestPos = new THREE.Vector3(0.35, -0.25, -0.5);
    this.weaponAdsPos = new THREE.Vector3(0, -0.14, -0.32);
    this.baseFov = PLAYER.baseFov;
    this.currentFov = PLAYER.baseFov;
    this.isScoped = false;
    this.mouseSensitivity = 1;
    this.bobTime = 0;
    this.damageFlash = 0;
    this.onDamage = null;
    this.wasMoving = false;
    this.lastDamageTime = 0;
  }

  get position() {
    return this.body.position;
  }

  get eyePosition() {
    return new THREE.Vector3(
      this.body.position.x,
      this.body.position.y + PLAYER.height * 0.35,
      this.body.position.z
    );
  }

  get forward() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    return dir;
  }

  updateRotation(dx, dy, sensitivity = 1) {
    const sens = 0.002 * sensitivity;
    this.yaw -= dx * sens;
    this.pitch -= dy * sens;
    this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch));
  }

  applyMovement(input, dt, moveMult = 1) {
    const speed = (input.isDown('ShiftLeft') || input.isDown('ShiftRight')
      ? PLAYER.sprintSpeed
      : PLAYER.walkSpeed) * moveMult;

    const move = new THREE.Vector3();
    if (input.isDown('KeyW')) move.z -= 1;
    if (input.isDown('KeyS')) move.z += 1;
    if (input.isDown('KeyA')) move.x -= 1;
    if (input.isDown('KeyD')) move.x += 1;

    if (move.lengthSq() > 0) {
      move.normalize();
      move.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.body.velocity.x = move.x * speed;
      this.body.velocity.z = move.z * speed;
      if (this.onGround) this.bobTime += dt * (speed > PLAYER.walkSpeed ? 14 : 10);
      this.wasMoving = true;
    } else {
      this.body.velocity.x *= 0.85;
      this.body.velocity.z *= 0.85;
      this.wasMoving = false;
    }

    if ((input.isDown('Space') || input.wasPressed('Space')) && this.onGround) {
      this.body.velocity.y = PLAYER.jumpForce;
      this.onGround = false;
    }
  }

  syncCamera(dt = 0) {
    const bob = this.onGround && this.wasMoving ? Math.sin(this.bobTime) * 0.035 : 0;
    this.cameraHolder.position.set(
      this.body.position.x,
      this.body.position.y + PLAYER.height * 0.35,
      this.body.position.z
    );
    this.cameraHolder.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.position.y = 0.2 + bob;
    if (this.damageFlash > 0) this.damageFlash = Math.max(0, this.damageFlash - dt);
  }

  takeDamage(amount, { fromBot = false } = {}) {
    if (!this.alive) return;
    const now = performance.now() / 1000;
    const cooldown = fromBot ? PLAYER.damageCooldown : 0.25;
    if (now - this.lastDamageTime < cooldown) return;
    this.lastDamageTime = now;

    this.damageFlash = 0.35;
    if (this.onDamage) this.onDamage(amount);
    let remaining = amount;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, remaining);
      this.shield -= absorbed;
      remaining -= absorbed;
    }
    this.health -= remaining;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
    }
  }

  respawn(pos) {
    this.alive = true;
    this.health = PLAYER.maxHealth;
    this.shield = PLAYER.maxShield;
    this.materials = 50;
    this.body.position.set(pos.x, pos.y + PLAYER.radius + 0.05, pos.z);
    this.body.velocity.set(0, 0, 0);
  }

  setWeaponModel(mesh) {
    while (this.weaponGroup.children.length) {
      this.weaponGroup.remove(this.weaponGroup.children[0]);
    }
    if (mesh) this.weaponGroup.add(mesh);
  }

  recoilKick(amount) {
    this.weaponGroup.rotation.x = -amount;
    setTimeout(() => {
      this.weaponGroup.rotation.x = 0;
    }, 80);
  }

  setViewMode(mode) {
    this.viewMode = mode;
    const inBuild = mode === 'build';
    this.weaponGroup.visible = !inBuild;
    this.armsGroup.visible = !inBuild && !this.isScoped;
  }

  updateAds(dt, weapon, scoped) {
    this.isScoped = scoped;
    const targetFov = scoped ? weapon.adsFov : this.baseFov;
    this.currentFov += (targetFov - this.currentFov) * Math.min(1, dt * 14);
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();

    const target = scoped ? this.weaponAdsPos : this.weaponRestPos;
    this.weaponGroup.position.lerp(target, Math.min(1, dt * 14));
    this.armsGroup.visible = this.viewMode !== 'build' && !scoped;
  }
}
