import * as THREE from 'three';

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.impacts = [];
    this.muzzleLights = [];
  }

  muzzleFlash(position) {
    const light = new THREE.PointLight(0xffaa44, 2.5, 4);
    light.position.copy(position);
    this.scene.add(light);
    this.muzzleLights.push({ light, life: 0.04 });
  }

  impact(point, color = 0xffcc88) {
    const group = new THREE.Group();
    group.position.copy(point);
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.06),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
      );
      p.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3,
        (Math.random() - 0.5) * 4
      );
      group.add(p);
    }
    this.scene.add(group);
    this.impacts.push({ group, life: 0.25 });
  }

  deathBurst(point) {
    const group = new THREE.Group();
    group.position.copy(point);
    for (let i = 0; i < 12; i++) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.1),
        new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xef4444 : 0xfbbf24, transparent: true, opacity: 0.85 })
      );
      p.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 1,
        (Math.random() - 0.5) * 6
      );
      group.add(p);
    }
    this.scene.add(group);
    this.impacts.push({ group, life: 0.5 });
  }

  update(dt) {
    for (let i = this.muzzleLights.length - 1; i >= 0; i--) {
      this.muzzleLights[i].life -= dt;
      if (this.muzzleLights[i].life <= 0) {
        this.scene.remove(this.muzzleLights[i].light);
        this.muzzleLights.splice(i, 1);
      }
    }

    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const fx = this.impacts[i];
      fx.life -= dt;
      fx.group.children.forEach((p) => {
        p.position.addScaledVector(p.userData.vel, dt);
        p.userData.vel.y -= 12 * dt;
        p.material.opacity = Math.max(0, fx.life * 3);
      });
      if (fx.life <= 0) {
        this.scene.remove(fx.group);
        fx.group.traverse((c) => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
        this.impacts.splice(i, 1);
      }
    }
  }
}
