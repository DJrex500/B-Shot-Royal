import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {
  GRID_SIZE, BUILD_COST, COLORS, BUILD_PIECES,
  FLOOR_HALF, BUILD_RANGE, TURBO_BUILD_DELAY, MAT_HP,
} from './constants.js';
import {
  createWoodTexture, createFloorTexture, createBrickBuildTexture,
  createMetalTexture, mat,
} from './textures.js';

const _tex = {};

function tex(kind) {
  if (_tex[kind]) return _tex[kind];
  if (kind === 'wood') _tex[kind] = createWoodTexture();
  else if (kind === 'brick') _tex[kind] = createBrickBuildTexture();
  else if (kind === 'metal') _tex[kind] = createMetalTexture();
  else _tex[kind] = createFloorTexture();
  return _tex[kind];
}

function buildMat(matType, extra = {}) {
  const kind = matType === 'brick' ? 'brick' : matType === 'metal' ? 'metal' : 'wood';
  const opts = kind === 'metal'
    ? { roughness: 0.32, metalness: 0.72 }
    : kind === 'brick'
      ? { roughness: 0.86, metalness: 0 }
      : { roughness: 0.9, metalness: 0 };
  return mat(tex(kind), { ...opts, ...extra });
}

function getPieceMat(matType, pieceType) {
  const m = buildMat(matType, pieceType === 'floor' && matType === 'wood' ? { color: 0xc4a35a } : {});
  if (pieceType === 'ramp') m.side = THREE.DoubleSide;
  return m;
}

function snapIndex(v) {
  return Math.round(v / GRID_SIZE);
}

function snapWorld(i) {
  return i * GRID_SIZE;
}

function cellFromPoint(x, y, z) {
  return {
    cx: snapIndex(x),
    cy: Math.max(0, Math.floor((y + 0.02) / GRID_SIZE)),
    cz: snapIndex(z),
  };
}

function facingFromPlayer(player) {
  const fx = Math.sin(player.yaw);
  const fz = -Math.cos(player.yaw);
  if (Math.abs(fx) >= Math.abs(fz)) return fx >= 0 ? 1 : 3;
  return fz >= 0 ? 2 : 0;
}

function quantizeYaw(radians) {
  const step = ((Math.round(radians / (Math.PI / 2)) % 4) + 4) % 4;
  return step * (Math.PI / 2);
}

function wallFacePos(cx, cy, cz, face) {
  const x = snapWorld(cx) + (face === 1 ? GRID_SIZE / 2 : face === 3 ? -GRID_SIZE / 2 : 0);
  const y = cy * GRID_SIZE + GRID_SIZE / 2;
  const z = snapWorld(cz) + (face === 2 ? GRID_SIZE / 2 : face === 0 ? -GRID_SIZE / 2 : 0);
  const rotationY = face === 1 || face === 3 ? Math.PI / 2 : 0;
  return { position: new THREE.Vector3(x, y, z), rotationY };
}

function wallKey(cx, cy, cz, face) {
  if (face === 1) return `wallX:${cx + 1},${cy},${cz}`;
  if (face === 3) return `wallX:${cx},${cy},${cz}`;
  if (face === 2) return `wallZ:${cx},${cy},${cz + 1}`;
  return `wallZ:${cx},${cy},${cz}`;
}

function floorKey(cx, cy, cz) {
  return `floor:${cx},${cy},${cz}`;
}

function rampKey(cx, cy, cz) {
  return `ramp:${cx},${cy},${cz}`;
}

function createWallMesh(matType = 'wood') {
  return new THREE.Mesh(
    new THREE.BoxGeometry(GRID_SIZE, GRID_SIZE, 0.25),
    getPieceMat(matType, 'wall')
  );
}

function createFloorMesh(matType = 'wood') {
  return new THREE.Mesh(
    new THREE.BoxGeometry(GRID_SIZE, FLOOR_HALF * 2, GRID_SIZE),
    getPieceMat(matType, 'floor')
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
  return new THREE.Mesh(geo, getPieceMat('wood', 'ramp'));
}

function createRampMeshFor(matType = 'wood') {
  const mesh = createRampMesh();
  mesh.material = getPieceMat(matType, 'ramp');
  return mesh;
}

function createRampTrimesh() {
  const hw = GRID_SIZE / 2;
  const h = GRID_SIZE;
  const vertices = [-hw, 0, hw, hw, 0, hw, hw, 0, -hw, -hw, 0, -hw, -hw, h, -hw, hw, h, -hw];
  const indices = [0, 1, 2, 0, 2, 3, 0, 4, 5, 0, 5, 1, 0, 3, 4, 1, 5, 2, 3, 2, 5, 3, 5, 4];
  return new CANNON.Trimesh(vertices, indices);
}

function cellFromHit(hit) {
  const data = hit.object.userData;
  if (data.isBuildPiece && Number.isInteger(data.cx)) {
    return { cx: data.cx, cy: data.cy, cz: data.cz };
  }
  return cellFromPoint(hit.point.x, hit.point.y, hit.point.z);
}

function getWorldNormal(hit) {
  const n = new THREE.Vector3(0, 1, 0);
  if (hit.face?.normal && hit.object?.matrixWorld) {
    n.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
  } else if (hit.face?.normal) {
    n.copy(hit.face.normal);
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
    const matType = player.buildMat || 'wood';
    this.previewValid = placement.valid && getMaterials() >= BUILD_COST;

    const ghost = this.createGhost(this.pieceType, matType);
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

  createGhost(type, matType = 'wood') {
    const g = new THREE.Group();
    if (type === 'wall') g.add(createWallMesh(matType));
    else if (type === 'floor') g.add(createFloorMesh(matType));
    else g.add(createRampMeshFor(matType));
    return g;
  }

  computePlacement(player) {
    const eye = player.eyePosition;
    const dir = new THREE.Vector3();
    player.camera.getWorldDirection(dir);

    this.raycaster.set(eye, dir);
    this.raycaster.far = BUILD_RANGE;
    const hits = this.raycaster.intersectObjects(this.buildMeshes, true);
    let hit = hits.find((h) => {
      if (h.object.userData.harvestable) return false;
      if (h.distance > BUILD_RANGE) return false;
      return true;
    });

    if (!hit && dir.y < -0.08) {
      const t = -eye.y / dir.y;
      if (t > 0.4 && t <= BUILD_RANGE) {
        const point = eye.clone().addScaledVector(dir, t);
        hit = {
          point,
          object: { userData: {}, position: point },
          face: { normal: new THREE.Vector3(0, 1, 0) },
          distance: t,
        };
      }
    }

    if (!hit) return { valid: false };

    const normal = getWorldNormal(hit);
    if (this.pieceType === 'floor') return this.placeFloor(hit, normal);
    if (this.pieceType === 'wall') return this.placeWall(hit, normal, player);
    return this.placeRamp(hit, normal, player);
  }

  placeFloor(hit, normal) {
    const cell = cellFromHit(hit);
    let { cx, cy, cz } = cell;
    if (normal.y < 0.35 && hit.object.userData.isBuildPiece) {
      if (Math.abs(normal.x) > Math.abs(normal.z)) cx += normal.x > 0 ? 1 : -1;
      else cz += normal.z > 0 ? 1 : -1;
    } else if (hit.object.userData.pieceType === 'floor' || hit.object.userData.pieceType === 'ramp') {
      cy += 1;
    }
    cy = Math.max(0, cy);
    const cells = [floorKey(cx, cy, cz)];
    return {
      valid: cells.every((c) => !this.occupancy.has(c)),
      position: new THREE.Vector3(snapWorld(cx), cy * GRID_SIZE + FLOOR_HALF, snapWorld(cz)),
      rotation: new THREE.Euler(0, 0, 0),
      cells,
      type: 'floor',
      cx,
      cy,
      cz,
    };
  }

  placeWall(hit, normal, player) {
    const cell = cellFromHit(hit);
    let { cx, cy, cz } = cell;
    let face;

    if (normal.y >= 0.45) {
      if (hit.object.userData.pieceType === 'wall') cy += 1;
      face = (facingFromPlayer(player) + this.rotationSteps) % 4;
    } else if (Math.abs(normal.x) >= Math.abs(normal.z)) {
      face = normal.x >= 0 ? 1 : 3;
      if (hit.object.userData.pieceType === 'wall') {
        cx += normal.x >= 0 ? 1 : -1;
      }
      face = (face + this.rotationSteps) % 4;
    } else {
      face = normal.z >= 0 ? 2 : 0;
      if (hit.object.userData.pieceType === 'wall') {
        cz += normal.z >= 0 ? 1 : -1;
      }
      face = (face + this.rotationSteps) % 4;
    }

    cy = Math.max(0, cy);
    const snapped = wallFacePos(cx, cy, cz, face);
    const cells = [wallKey(cx, cy, cz, face)];
    return {
      valid: cells.every((c) => !this.occupancy.has(c)),
      position: snapped.position,
      rotation: new THREE.Euler(0, snapped.rotationY, 0),
      cells,
      type: 'wall',
      rotationY: snapped.rotationY,
      cx,
      cy,
      cz,
      face,
    };
  }

  placeRamp(hit, normal, player) {
    const cell = cellFromHit(hit);
    let { cx, cy, cz } = cell;
    if (normal.y < 0.2 && hit.object.userData.isBuildPiece) {
      if (Math.abs(normal.x) > Math.abs(normal.z)) cx += normal.x > 0 ? 1 : -1;
      else cz += normal.z > 0 ? 1 : -1;
    } else if (hit.object.userData.pieceType === 'floor' || hit.object.userData.pieceType === 'ramp') {
      if (this.pieceType === 'ramp' && hit.object.userData.pieceType === 'ramp') cy += 1;
    }
    cy = Math.max(0, cy);
    const face = (facingFromPlayer(player) + this.rotationSteps) % 4;
    const rotationY = quantizeYaw(face * (Math.PI / 2));
    const cells = [rampKey(cx, cy, cz)];
    return {
      valid: cells.every((c) => !this.occupancy.has(c)),
      position: new THREE.Vector3(snapWorld(cx), cy * GRID_SIZE, snapWorld(cz)),
      rotation: new THREE.Euler(0, rotationY, 0),
      cells,
      type: 'ramp',
      rotationY,
      cx,
      cy,
      cz,
    };
  }

  tryPlace(player, spendMaterials) {
    if (this.placeCooldown > 0) return false;
    if (!this.enabled) return false;

    const placement = this.computePlacement(player);
    if (!placement.valid) return false;
    if (!spendMaterials(BUILD_COST)) return false;

    const matType = player.buildMat || 'wood';
    let mesh;
    if (placement.type === 'wall') mesh = createWallMesh(matType);
    else if (placement.type === 'floor') mesh = createFloorMesh(matType);
    else mesh = createRampMeshFor(matType);

    const hpBase = placement.type === 'wall' ? 150 : placement.type === 'floor' ? 100 : 120;
    mesh.position.copy(placement.position);
    mesh.rotation.copy(placement.rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isBuildPiece = true;
    mesh.userData.pieceType = placement.type;
    mesh.userData.buildMat = matType;
    mesh.userData.cx = placement.cx;
    mesh.userData.cy = placement.cy;
    mesh.userData.cz = placement.cz;
    mesh.userData.face = placement.face;
    mesh.userData.buildHp = hpBase * (MAT_HP[matType] || 1);
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
