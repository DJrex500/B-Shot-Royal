import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { MAP_SIZE, COLORS } from './constants.js';
import {
  createGrassTexture, createBrickTexture, createStoneTexture,
  createWaterTexture, createMetalTexture, mat,
} from './textures.js';

export class World {
  constructor(scene, physicsWorld, groundMaterial) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.groundMaterial = groundMaterial;
    this.groundMesh = null;
    this.obstacles = [];
    this.harvestables = [];
    this.lootSpawnPoints = [];
    this.textures = {};

    this.textures.grass = createGrassTexture();
    this.textures.grass.repeat.set(40, 40);
    this.textures.brick = createBrickTexture();
    this.textures.brick.repeat.set(2, 2);
    this.textures.stone = createStoneTexture();
    this.textures.metal = createMetalTexture();
    this.textures.water = createWaterTexture();
    this.textures.water.repeat.set(4, 4);

    this.mats = {
      ground: mat(this.textures.grass, { roughness: 0.95 }),
      brick: mat(this.textures.brick, { roughness: 0.82 }),
      roof: new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.75 }),
      trunk: new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.95 }),
      leaves: new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 }),
      rock: mat(this.textures.stone, { roughness: 0.92 }),
      scrap: mat(this.textures.metal, { roughness: 0.35, metalness: 0.75 }),
      water: mat(this.textures.water, { roughness: 0.15, metalness: 0.35 }),
    };
  }

  build() {
    this.scene.background = new THREE.Color(0x7ec8e3);
    this.scene.fog = new THREE.Fog(0x9dd4ef, 140, MAP_SIZE * 0.8);

    const hemi = new THREE.HemisphereLight(0xbde0fe, 0x4a7c3f, 0.55);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff4e0, 1.25);
    sun.position.set(120, 160, 80);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 500;
    const s = MAP_SIZE * 0.55;
    sun.shadow.camera.left = -s;
    sun.shadow.camera.right = s;
    sun.shadow.camera.top = s;
    sun.shadow.camera.bottom = -s;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x8888ff, 0.25);
    fill.position.set(-80, 60, -60);
    this.scene.add(fill);

    const groundGeo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, 64, 64);
    const verts = groundGeo.attributes.position;
    for (let i = 0; i < verts.count; i++) {
      const x = verts.getX(i);
      const y = verts.getY(i);
      verts.setZ(i, Math.sin(x * 0.02) * Math.cos(y * 0.02) * 0.8);
    }
    groundGeo.computeVertexNormals();

    this.groundMesh = new THREE.Mesh(groundGeo, this.mats.ground);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.groundMesh.userData.isGround = true;
    this.scene.add(this.groundMesh);

    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: this.groundMaterial,
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.physicsWorld.addBody(groundBody);

    this.addLake();
    this.addPOIs();
    this.addForest();
    this.addRocks();
  }

  addLake() {
    const lake = new THREE.Mesh(new THREE.CircleGeometry(35, 48), this.mats.water);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(60, 0.08, -50);
    this.scene.add(lake);
  }

  addPOIs() {
    const pois = [
      { x: -80, z: -80, buildings: 6 },
      { x: 90, z: 70, buildings: 5 },
      { x: -100, z: 90, buildings: 4 },
      { x: 110, z: -90, buildings: 4 },
      { x: 0, z: 0, buildings: 3 },
    ];

    for (const poi of pois) {
      for (let i = 0; i < poi.buildings; i++) {
        const w = 6 + Math.random() * 8;
        const h = 4 + Math.random() * 8;
        const d = 6 + Math.random() * 8;
        const bx = poi.x + (Math.random() - 0.5) * 40;
        const bz = poi.z + (Math.random() - 0.5) * 40;

        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.mats.brick);
        body.position.set(bx, h / 2, bz);
        body.castShadow = true;
        body.receiveShadow = true;
        this.scene.add(body);
        this.obstacles.push(body);

        const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.5, d + 1), this.mats.roof);
        roof.position.set(bx, h + 0.25, bz);
        roof.castShadow = true;
        this.scene.add(roof);
        this.obstacles.push(roof);

        this.physicsWorld.addBody(new CANNON.Body({
          mass: 0,
          shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)),
          position: new CANNON.Vec3(bx, h / 2, bz),
        }));

        this.lootSpawnPoints.push(new THREE.Vector3(bx, 1, bz));
      }
      this.lootSpawnPoints.push(new THREE.Vector3(poi.x, 1, poi.z));
    }
  }

  addForest() {
    for (let i = 0; i < 80; i++) {
      const x = (Math.random() - 0.5) * (MAP_SIZE - 40);
      const z = (Math.random() - 0.5) * (MAP_SIZE - 40);
      if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
      if (Math.hypot(x - 60, z + 50) < 38) continue;

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 3.5, 8), this.mats.trunk);
      trunk.position.set(x, 1.75, z);
      trunk.castShadow = true;
      trunk.userData.harvestable = true;
      trunk.userData.harvestType = 'wood';
      trunk.userData.health = 100;
      this.scene.add(trunk);
      this.obstacles.push(trunk);
      this.harvestables.push(trunk);

      const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.2, 4.5, 8), this.mats.leaves);
      leaves.position.set(x, 5.2, z);
      leaves.castShadow = false;
      leaves.userData.harvestable = true;
      leaves.userData.harvestType = 'wood';
      leaves.userData.health = 100;
      leaves.userData.parentTrunk = trunk;
      this.scene.add(leaves);
      this.obstacles.push(leaves);
      this.harvestables.push(leaves);
    }
  }

  addRocks() {
    for (let i = 0; i < 45; i++) {
      const x = (Math.random() - 0.5) * (MAP_SIZE - 60);
      const z = (Math.random() - 0.5) * (MAP_SIZE - 60);
      const metal = i >= 28;
      const s = 1.2 + Math.random() * 2;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(s, 0),
        metal ? this.mats.scrap : this.mats.rock
      );
      rock.position.set(x, s * 0.6, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.userData.harvestable = true;
      rock.userData.harvestType = metal ? 'metal' : 'stone';
      rock.userData.health = metal ? 150 : 120;
      this.scene.add(rock);
      this.obstacles.push(rock);
      this.harvestables.push(rock);
      this.lootSpawnPoints.push(new THREE.Vector3(x, 1, z));

      this.physicsWorld.addBody(new CANNON.Body({
        mass: 0,
        shape: new CANNON.Sphere(s * 0.7),
        position: new CANNON.Vec3(x, s * 0.6, z),
      }));
    }
  }

  getRandomSpawnPoint() {
    const angle = Math.random() * Math.PI * 2;
    const r = 30 + Math.random() * (MAP_SIZE * 0.35);
    return new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r);
  }

  getPOIs() {
    return [
      { x: -80, z: -80, name: 'Tilted' },
      { x: 90, z: 70, name: 'Retail' },
      { x: -100, z: 90, name: 'Pleasant' },
      { x: 110, z: -90, name: 'Salty' },
      { x: 0, z: 0, name: 'Center' },
    ];
  }

  getRaycastTargets() {
    return [this.groundMesh, ...this.obstacles];
  }

  getHarvestables() {
    return this.harvestables;
  }

  getLootSpawnPoints() {
    return this.lootSpawnPoints;
  }
}
