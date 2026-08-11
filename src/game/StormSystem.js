import * as THREE from 'three';
import { STORM } from './constants.js';

export class StormSystem {
  constructor(scene) {
    this.scene = scene;
    this.center = new THREE.Vector3(0, 0, 0);
    this.radius = STORM.initialRadius;
    this.targetRadius = STORM.initialRadius;
    this.timer = STORM.startDelay;
    this.shrinkTimer = 0;
    this.phase = 0;
    this.active = false;
    this.damageTimer = 0;
    this.shrinkSpeedMult = 1;

    this.stormMesh = this.createGroundRing(STORM.initialRadius - 2, STORM.initialRadius + 8, 0x7c3aed, 0.4);
    this.safeMesh = this.createGroundRing(0, STORM.initialRadius - 2, 0x22d3ee, 0.12);
    this.previewRing = this.createGroundRing(STORM.initialRadius - 3, STORM.initialRadius, 0x94a3b8, 0.2);
    this.stormWall = this.createStormWall();

    this.scene.add(this.stormMesh, this.safeMesh, this.previewRing, this.stormWall);
    this.previewRing.visible = true;
    this.updateStormVisual();
  }

  createGroundRing(inner, outer, color, opacity) {
    const geo = new THREE.RingGeometry(inner, outer, 80);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.6;
    mesh.visible = false;
    return mesh;
  }

  createStormWall() {
    const geo = new THREE.CylinderGeometry(1, 1, 50, 80, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 25;
    mesh.visible = false;
    return mesh;
  }

  updateGroundRing(mesh, inner, outer) {
    mesh.geometry.dispose();
    mesh.geometry = new THREE.RingGeometry(Math.max(0, inner), outer, 80);
  }

  updateStormVisual() {
    this.updateGroundRing(this.stormMesh, this.radius - 2, this.radius + 10);
    this.updateGroundRing(this.safeMesh, 0, Math.max(0, this.radius - 2));
    this.stormWall.scale.set(this.radius, 1, this.radius);
    this.stormWall.position.set(this.center.x, 25, this.center.z);
  }

  update(dt, player) {
    if (!this.active) {
      this.timer -= dt;
      const t = Math.max(0, this.timer);
      this.previewRing.visible = t > 0;
      this.previewRing.material.opacity = 0.12 + Math.sin(performance.now() * 0.003) * 0.08;
      if (this.timer <= 0) {
        this.active = true;
        this.shrinkTimer = STORM.shrinkInterval;
        this.phase = 1;
        this.stormMesh.visible = true;
        this.safeMesh.visible = true;
        this.stormWall.visible = true;
        this.updateStormVisual();
      }
      return {
        inStorm: false,
        timeUntilStorm: t,
        phase: this.active ? 1 : 0,
        radius: this.radius,
        centerX: this.center.x,
        centerZ: this.center.z,
        active: this.active,
      };
    }

    this.previewRing.visible = false;
    this.stormMesh.visible = true;
    this.safeMesh.visible = true;
    this.stormWall.visible = true;

    this.shrinkTimer -= dt;
    if (this.shrinkTimer <= 0 && this.targetRadius > STORM.minRadius) {
      this.phase += 1;
      this.targetRadius = Math.max(STORM.minRadius, this.radius - STORM.shrinkAmount);
      this.shrinkTimer = STORM.shrinkInterval;
    }

    if (this.radius > this.targetRadius) {
      this.radius -= dt * 10 * this.shrinkSpeedMult;
      if (this.radius < this.targetRadius) this.radius = this.targetRadius;
      this.updateStormVisual();
    }

    const px = player.body.position.x;
    const pz = player.body.position.z;
    const dist = Math.hypot(px - this.center.x, pz - this.center.z);
    const inStorm = dist > this.radius;

    if (inStorm && player.alive) {
      this.damageTimer += dt;
      if (this.damageTimer >= 0.5) {
        player.takeDamage(STORM.damagePerSecond * 0.5);
        this.damageTimer = 0;
      }
    }

    return {
      inStorm,
      phase: this.phase,
      radius: this.radius,
      shrinkTimer: this.shrinkTimer,
      timeUntilStorm: 0,
      centerX: this.center.x,
      centerZ: this.center.z,
      active: true,
    };
  }
}
