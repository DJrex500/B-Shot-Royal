import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {
  GRID_SIZE, BUILD_COST, COLORS, BUILD_PIECES,
  FLOOR_HALF, BUILD_RANGE, TURBO_BUILD_DELAY,
} from './constants.js';
import { createWoodTexture, createFloorTexture, mat } from './textures.js';

let _woodTex = null;
let _floorTex = null;

function getWoodMat() {
  if (!_woodTex) _woodTex = createWoodTexture();
  return mat(_woodTex, { roughness: 0.9 });
}

function getFloorMat() {
  if (!_floorTex) _floorTex = createFloorTexture();
  return mat(_floorTex, { roughness: 0.88 });
}

function getRampMat() {
  if (!_floorTex) _floorTex = createFloorTexture();
  const m = mat(_floorTex, { roughness: 0.88, color: 0xbbdd66 });
  m.side = THREE.DoubleSide;
  return m;
}

function cellKey(type, gx, gy, gz) {
  return `${type}:${gx},${gy},${gz}`;
}

function snapIndex(v) {
  return Math.round(v / GRID_SIZE);
}

function snapWorld(i) {
  return i * GRID_SIZE;
}

function createWallMesh() {
  return new THREE.Mesh(
    new THREE.BoxGeometry(GRID_SIZE, GRID_SIZE, 0.25),
    getWoodMat()
  );
}

function createFloorMesh() {
  return new THREE.Mesh(
    new THREE.BoxGeometry(GRID_SIZE, FLOOR_HALF * 2, GRID_SIZE),
    getFloorMat()
  );
}

function createRampMesh() {
  const hw = GRID_SIZE / 2;
  const h = GRID_SIZE;
  const positions = [];
  const tri = (a, b, c) => positions.push(...a, ...b, ...c);

  // Bottom
  tri([-hw, 0, hw], [-hw, 0, -hw], [hw, 0, -hw]);
  tri([-hw, 0, hw], [hw, 0, -hw], [hw, 0, hw]);
  // Slope (walkable top)
  tri([-hw, 0, hw], [-hw, h, -hw], [hw, h, -hw]);
  tri([-hw, 0, hw], [hw, h, -hw], [hw, 0, hw]);
  // Back vertical face
  tri([-hw, 0, -hw], [hw, 0, -hw], [hw, h, -hw]);
  tri([-hw, 0, -hw], [hw, h, -hw], [-hw, h, -hw]);
  // Left triangle side
  tri([-hw, 0, hw], [-hw, 0, -hw], [-hw, h, -hw]);
  // Right triangle side
  tri([hw, 0, hw], [hw, h, -hw], [hw, 0, -hw]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, getRampMat());
}

function createRampTrimesh() {
  const hw = GRID_SIZE / 2;
  const h = GRID_SIZE;
  const vertices = [-hw, 0, hw, hw, 0, hw, hw, 0, -hw, -hw, 0, -hw, -hw, h, -hw, hw, h, -hw];
  const indices = [0, 1, 2, 0, 2, 3, 0, 4, 5, 0, 5, 1, 0, 3, 4, 1, 5, 2, 3, 2, 5, 3, 5, 4];
  return new CANNON.Trimesh(vertices, indices);
}

function getLevelFromHit(hit) {
  const y = hit.point.y;
  if (!hit.object.userData.isBuildPiece) {
    return Math.max(0, Math.floor((y + 0.01) / GRID_SIZE));
  }
  const type = hit.object.userData.pieceType;
  const py = hit.object.position.y;
  if (type === 'floor') return Math.round((py - FLOOR_HALF) / GRID_SIZE) + 1;
  if (type === 'wall') return Math.floor((py - GRID_SIZE / 2) / GRID_SIZE) + 1;
  if (type === 'ramp') return Math.max(0, Math.floor(y / GRID_SIZE));
  return Math.floor(y / GRID_SIZE);
}

function getWorldNormal(hit) {
  const n = new THREE.Vector3(0, 1, 0);
  if (hit.face && hit.object) {
    n.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
  }
  return n;
}

export class BuildingSystem {
  constructor(scene, world, buildMeshes) {
    this.scene = scene;
    this.world = world;
    this.buildMeshes = buildMeshes;
    this.buildMaterial = new CANNON.Material('build');

    this.enabled = false;
    this.pieceType = 'wall';
    this.rotationSteps = 0;
    this.occupancy = new Set();
    this.pieces = [];
    this.placeCooldown = 0;

    this.preview = new THREE.Group();
    this.scene.add(this.preview);
    this.previewValid = false;
    this.raycaster = new THREE.Raycaster();
  }

  toggle() {
    this.enabled = !this.enabled;
    this.preview.visible = this.enabled;
    return this.enabled;
  }

  setPieceType(type) {
    if (BUILD_PIECES[type]) this.pieceType = type;
  }

  rotate() {
    this.rotationSteps = (this.rotationSteps + 1) % 4;
  }

  update(dt, player, getMaterials) {
    if (this.placeCooldown > 0) this.placeCooldown -= dt;
    if (this.enabled) this.updatePreview(player, getMaterials);
  }

  updatePreview(player, getMaterials) {
    this.preview.clear();
    if (!this.enabled) {
      this.preview.visible = false;
      return;
    }
    this.preview.visible = true;

    const placement = this.computePlacement(player);
    this.previewValid = placement.valid && getMaterials() >= BUILD_COST;

    const ghost = this.createGhost(this.pieceType);
    ghost.traverse((c) => {
      if (c.isMesh) {
        c.material = c.material.clone();
        c.material.transparent = true;
        c.material.opacity = 0.5;
        c.material.color.setHex(this.previewValid ? COLORS.previewValid : COLORS.previewInvalid);
        c.material.depthWrite = false;
      }
    });

    if (placement.valid) {
      ghost.position.copy(placement.position);
      ghost.rotation.copy(placement.rotation);
    } else {
      ghost.position.set(0, -999, 0);
    }
    this.preview.add(ghost);
  }

  createGhost(type) {
    const g = new THREE.Group();
    if (type === 'wall') g.add(createWallMesh());
    else if (type === 'floor') g.add(createFloorMesh());
    else g.add(createRampMesh());
    return g;
  }

  computePlacement(player) {
    const eye = player.eyePosition;
    const dir = new THREE.Vector3();
    player.camera.getWorldDirection(dir);

    this.raycaster.set(eye, dir);
    this.raycaster.far = BUILD_RANGE;
    const hits = this.raycaster.intersectObjects(this.buildMeshes, true);
    const hit = hits.find((h) => {
      if (h.object.userData.harvestable) return false;
      if (h.distance > BUILD_RANGE) return false;
      return true;
    });
    if (!hit) {
      return { valid: false };
    }

    const normal = getWorldNormal(hit);

    if (this.pieceType === 'floor') return this.placeFloor(hit, normal);
    if (this.pieceType === 'wall') return this.placeWall(hit, normal, player);
    return this.placeRamp(hit, normal, player);
  }

  placeFloor(hit, normal) {
    if (normal.y < 0.4) return { valid: false };

    const level = getLevelFromHit(hit);
    const gx = snapIndex(hit.point.x);
    const gz = snapIndex(hit.point.z);
    const cells = [cellKey('floor', gx, level, gz)];

    return {
      valid: cells.every((c) => !this.occupancy.has(c)),
      position: new THREE.Vector3(snapWorld(gx), level * GRID_SIZE + FLOOR_HALF, snapWorld(gz)),
      rotation: new THREE.Euler(0, 0, 0),
      cells,
      type: 'floor',
    };
  }

  placeWall(hit, normal, player) {
    const level = getLevelFromHit(hit);
    const posY = level * GRID_SIZE + GRID_SIZE / 2;

    let gx = snapIndex(hit.point.x);
    let gz = snapIndex(hit.point.z);
    let rotationY = this.rotationSteps * (Math.PI / 2);

    if (Math.abs(normal.y) >= 0.5) {
      const fwd = player.forward.clone();
      fwd.y = 0;
      if (fwd.lengthSq() < 0.001) fwd.set(0, 0, -1);
      fwd.normalize();
      rotationY = Math.atan2(-fwd.x, -fwd.z) + this.rotationSteps * (Math.PI / 2);
    } else if (Math.abs(normal.x) > Math.abs(normal.z)) {
      gx = snapIndex(hit.point.x + normal.x * GRID_SIZE * 0.5);
      rotationY = (normal.x > 0 ? -Math.PI / 2 : Math.PI / 2) + this.rotationSteps * (Math.PI / 2);
    } else {
      gz = snapIndex(hit.point.z + normal.z * GRID_SIZE * 0.5);
      rotationY = (normal.z > 0 ? 0 : Math.PI) + this.rotationSteps * (Math.PI / 2);
    }

    const cells = [cellKey('wall', gx, level, gz)];
    return {
      valid: cells.every((c) => !this.occupancy.has(c)),
      position: new THREE.Vector3(snapWorld(gx), posY, snapWorld(gz)),
      rotation: new THREE.Euler(0, rotationY, 0),
      cells,
      type: 'wall',
      rotationY,
    };
  }

  placeRamp(hit, normal, player) {
    if (normal.y < 0.25) return { valid: false };

    const level = getLevelFromHit(hit);
    const gx = snapIndex(hit.point.x);
    const gz = snapIndex(hit.point.z);

    const fwd = player.forward.clone();
    fwd.y = 0;
    if (fwd.lengthSq() < 0.001) fwd.set(0, 0, -1);
    fwd.normalize();
    const rotationY = Math.atan2(fwd.x, -fwd.z) + this.rotationSteps * (Math.PI / 2);

    const cells = [cellKey('ramp', gx, level, gz)];
    return {
      valid: cells.every((c) => !this.occupancy.has(c)),
      position: new THREE.Vector3(snapWorld(gx), level * GRID_SIZE, snapWorld(gz)),
      rotation: new THREE.Euler(0, rotationY, 0),
      cells,
      type: 'ramp',
      rotationY,
    };
  }

  tryPlace(player, spendMaterials) {
    if (this.placeCooldown > 0) return false;
    if (!this.enabled) return false;

    const placement = this.computePlacement(player);
    if (!placement.valid) return false;
    if (!spendMaterials(BUILD_COST)) return false;

    let mesh;
    if (placement.type === 'wall') mesh = createWallMesh();
    else if (placement.type === 'floor') mesh = createFloorMesh();
    else mesh = createRampMesh();

    mesh.position.copy(placement.position);
    mesh.rotation.copy(placement.rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isBuildPiece = true;
    mesh.userData.pieceType = placement.type;
    mesh.userData.buildHp = placement.type === 'wall' ? 150 : placement.type === 'floor' ? 100 : 120;
    this.scene.add(mesh);
    this.buildMeshes.push(mesh);

    const body = this.createPhysicsBody(placement);
    this.world.addBody(body);

    placement.cells.forEach((c) => this.occupancy.add(c));
    this.pieces.push({ mesh, body, cells: placement.cells, type: placement.type });
    this.placeCooldown = TURBO_BUILD_DELAY;
    return true;
  }

  createPhysicsBody(placement) {
    const body = new CANNON.Body({ mass: 0, material: this.buildMaterial });

    if (placement.type === 'wall') {
      body.addShape(new CANNON.Box(new CANNON.Vec3(GRID_SIZE / 2, GRID_SIZE / 2, 0.125)));
    } else if (placement.type === 'floor') {
      body.addShape(new CANNON.Box(new CANNON.Vec3(GRID_SIZE / 2, FLOOR_HALF, GRID_SIZE / 2)));
    } else {
      body.addShape(createRampTrimesh());
    }

    body.position.set(placement.position.x, placement.position.y, placement.position.z);
    if (placement.type === 'ramp') {
      body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), placement.rotationY);
    } else {
      body.quaternion.setFromEuler(placement.rotation.x, placement.rotation.y, placement.rotation.z);
    }
    return body;
  }

  getBuildMaterial() {
    return this.buildMaterial;
  }

  damagePiece(mesh, amount) {
    if (!mesh?.userData?.isBuildPiece) return false;
    mesh.userData.buildHp = (mesh.userData.buildHp ?? 100) - amount;
    if (mesh.userData.buildHp <= 0) {
      this.removePiece(mesh);
      return true;
    }
    return false;
  }

  removePiece(mesh) {
    const idx = this.pieces.findIndex((p) => p.mesh === mesh);
    if (idx < 0) return;
    const piece = this.pieces[idx];
    piece.cells.forEach((c) => this.occupancy.delete(c));
    this.scene.remove(piece.mesh);
    this.world.removeBody(piece.body);
    const mi = this.buildMeshes.indexOf(piece.mesh);
    if (mi >= 0) this.buildMeshes.splice(mi, 1);
    this.pieces.splice(idx, 1);
  }
}
