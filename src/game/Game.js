import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Input } from './Input.js';
import { Player } from './Player.js';
import { World } from './World.js';
import { BuildingSystem } from './BuildingSystem.js';
import { WeaponSystem } from './WeaponSystem.js';
import { LootSystem } from './LootSystem.js';
import { HarvestSystem } from './HarvestSystem.js';
import { StormSystem } from './StormSystem.js';
import { spawnEnemies, MAX_ENEMIES } from './Enemy.js';
import { HUD } from '../ui/HUD.js';
import { loadSettings } from './Settings.js';
import { STORM, PLAYER } from './constants.js';
import { AudioManager } from './Audio.js';
import { Effects } from './Effects.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.running = false;
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.physicsWorld = new CANNON.World();
    this.physicsWorld.gravity.set(0, -20, 0);
    this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);

    const defaultMat = new CANNON.Material('default');
    const groundMat = new CANNON.Material('ground');

    this.physicsWorld.addContactMaterial(new CANNON.ContactMaterial(defaultMat, defaultMat, {
      friction: 0.35,
      restitution: 0,
    }));
    this.physicsWorld.defaultContactMaterial = new CANNON.ContactMaterial(defaultMat, defaultMat, {
      friction: 0.35,
      restitution: 0,
    });

    this.world = new World(this.scene, this.physicsWorld, groundMat);
    this.world.build();

    this.buildMeshes = [...this.world.getRaycastTargets()];
    this.spawnPoint = this.world.getRandomSpawnPoint();
    this.player = new Player(this.scene, this.physicsWorld, this.spawnPoint);
    this.building = new BuildingSystem(this.scene, this.physicsWorld, this.buildMeshes);

    this.physicsWorld.addContactMaterial(new CANNON.ContactMaterial(
      this.player.body.material,
      this.building.getBuildMaterial(),
      { friction: 0.55, restitution: 0 }
    ));
    this.physicsWorld.addContactMaterial(new CANNON.ContactMaterial(
      this.player.body.material,
      groundMat,
      { friction: 0.45, restitution: 0 }
    ));
    this.physicsWorld.addContactMaterial(new CANNON.ContactMaterial(
      this.building.getBuildMaterial(),
      groundMat,
      { friction: 0.4, restitution: 0 }
    ));

    this.weapons = new WeaponSystem(this.player, this.scene);
    this.weapons.building = this.building;
    this.audio = new AudioManager();
    this.effects = new Effects(this.scene);
    this.weapons.audio = this.audio;
    this.weapons.effects = this.effects;
    this.weapons.onPlayerHit = (isHeadshot) => this.hud.flashHitMarker(isHeadshot);

    this.loot = new LootSystem(this.scene);
    this.loot.generate(this.world.getLootSpawnPoints());
    this.harvest = new HarvestSystem(this.scene);
    this.storm = new StormSystem(this.scene);
    this.input = new Input(canvas);
    this.hud = new HUD();
    this.hud.setPOIs(this.world.getPOIs());
    this.settings = this.hud.getSettings();

    this.enemies = [];
    this.enemiesKilled = 0;
    this.botsEnabled = this.settings.botsEnabled;
    this.matchTime = 0;
    this.won = false;
    this.harvestables = this.world.getHarvestables();

    this.player.onDamage = () => {
      this.audio.damageTaken();
      this.hud.flashDamage();
    };

    this.weapons.onHit = (enemy, _dmg, isHeadshot) => {
      if (!enemy.alive) {
        const name = enemy.mesh?.userData?.skinName || `Bot #${enemy.id + 1}`;
        this.hud.addKill(name, isHeadshot);
        this.enemiesKilled += 1;
      }
    };
    this.weapons.onHeadshot = () => {
      this.hud.addHeadshot();
    };

    this.groundRayResult = new CANNON.RaycastResult();

    this.hud.onPlay((settings) => this.start(settings));
    this.hud.onRespawn(() => this.respawn());
    this.hud.onVictory(() => this.resetMatch());
    window.addEventListener('resize', () => this.onResize());

    this.player.syncCamera();
    this.loop();
  }

  start(settings = loadSettings()) {
    this.settings = settings;
    this.botsEnabled = settings.botsEnabled;
    this.storm.shrinkSpeedMult = settings.stormSpeed ?? 1;
    this.player.mouseSensitivity = settings.mouseSensitivity ?? 1;
    this.audio.setVolume(settings.volume ?? 0.7);
    this.won = false;
    this.matchTime = 0;
    this.enemiesKilled = 0;
    this.hud.kills = 0;
    this.hud.hideVictory();

    if (this.botsEnabled) {
      for (const e of this.enemies) { if (e.alive) e.die(); }
      this.enemies = spawnEnemies(this.scene, this.physicsWorld, 7, this.spawnPoint, 80, 0);
      this.wireEnemies();
    } else {
      for (const e of this.enemies) { if (e.alive) e.die(); }
      this.enemies = [];
    }

    this.running = true;
    this.audio.init();
    this.hud.showGame();
    this.player.syncCamera();
    this.requestPointerLock();
    this.clock.start();
  }

  requestPointerLock() {
    this.input.requestLock();
    if (!this._lockClickBound) {
      this._lockClickBound = () => {
        if (this.running && this.player.alive && !this.input.locked) {
          this.input.requestLock();
        }
      };
      this.canvas.addEventListener('click', this._lockClickBound);
    }
  }

  wireEnemies() {
    for (const e of this.enemies) {
      e.onDeathCallback = (pos) => this.onEnemyDeath(pos);
    }
  }

  onEnemyDeath(pos) {
    this.effects.deathBurst(new THREE.Vector3(pos.x, pos.y + 0.5, pos.z));
    if (Math.random() < 0.55) {
      const types = ['wood', 'brick', 'metal', 'ammo_rifle', 'ammo_shells', 'ammo_sniper', 'shield'];
      this.loot.spawnLootAt(pos.x + (Math.random() - 0.5) * 2, pos.z + (Math.random() - 0.5) * 2, types[Math.floor(Math.random() * types.length)]);
    }
    this.checkVictory();
  }

  checkVictory() {
    if (!this.botsEnabled || this.won) return;
    if (this.enemies.length > 0 && this.enemies.every((e) => !e.alive)) {
      this.won = true;
      this.running = false;
      document.exitPointerLock();
      this.audio.victory();
      this.hud.showVictory(this.enemiesKilled, this.matchTime);
    }
  }

  resetMatch() {
    this.hud.hideVictory();
    this.hud.hideDeath();
    this.spawnPoint = this.world.getRandomSpawnPoint();
    this.player.respawn(this.spawnPoint);
    this.start(this.settings);
  }

  respawn() {
    this.spawnPoint = this.world.getRandomSpawnPoint();
    this.player.respawn(this.spawnPoint);
    this.hud.hideDeath();
    this.player.syncCamera();
    this.requestPointerLock();
    this.running = true;
  }

  onResize() {
    this.player.camera.aspect = window.innerWidth / window.innerHeight;
    this.player.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  spendMaterials(amount) {
    const key = this.player.buildMat || 'wood';
    if ((this.player.mats[key] || 0) >= amount) {
      this.player.mats[key] -= amount;
      return true;
    }
    return false;
  }

  updatePlayerGround() {
    const p = this.player.body.position;
    const feet = p.y - PLAYER.radius;
    const offsets = [
      [0, 0],
      [0.2, 0],
      [-0.2, 0],
      [0, 0.2],
      [0, -0.2],
    ];

    let grounded = false;
    for (const [ox, oz] of offsets) {
      const from = new CANNON.Vec3(p.x + ox, feet + 0.12, p.z + oz);
      const to = new CANNON.Vec3(p.x + ox, feet - 0.28, p.z + oz);
      this.physicsWorld.raycastAll(from, to, {}, (result) => {
        if (grounded) return;
        if (result.hasHit && result.body && result.body !== this.player.body) {
          grounded = true;
        }
      });
      if (grounded) break;
    }

    const notRising = this.player.body.velocity.y <= 2.5;
    this.player.onGround = Boolean(grounded && notRising && this.player.jumpLock <= 0);
  }

  onPickup(msg, type) {
    this.hud.addLoot(msg, type);
    this.audio.pickup();
  }

  handleInput(dt) {
    const { dx, dy } = this.input.consumeMouseDelta();
    if (this.input.locked) {
      this.player.updateRotation(dx, dy, this.settings.mouseSensitivity ?? 1);
    }

    const inBuild = this.building.enabled;
    const scoped = !inBuild && this.input.buttons.right;
    const weapon = this.weapons.current;
    const moveMult = scoped ? weapon.adsMoveMult : 1;

    this.player.updateAds(dt, weapon, scoped);
    this.player.applyMovement(this.input, dt, moveMult);
    this.updatePlayerGround();

    if (this.input.wasPressed('KeyB')) {
      this.building.toggle();
      this.player.setViewMode(this.building.enabled ? 'build' : 'combat');
    }

    if (this.input.wasPressed('KeyQ')) {
      this.player.cycleBuildMat();
    }

    if (this.input.wasAnyPressed('KeyE')) {
      if (this.loot.tryOpenChest(this.player, this.weapons, (msg, type) => this.onPickup(msg, type))) {
        this.audio.chest();
      }
    }

    if (this.input.wasAnyPressed('KeyF') && !inBuild) {
      if (this.harvest.tryHarvest(this.player, this.harvestables, (msg, type) => {
        this.onPickup(msg, type);
        this.audio.harvest();
      })) this.audio.harvest();
    }

    if (inBuild) {
      if (this.input.wasAnyPressed('Digit1', 'Numpad1')) this.building.setPieceType('wall');
      if (this.input.wasAnyPressed('Digit2', 'Numpad2')) this.building.setPieceType('floor');
      if (this.input.wasAnyPressed('Digit3', 'Numpad3')) this.building.setPieceType('ramp');
    } else {
      if (this.input.wasAnyPressed('Digit1', 'Numpad1')) this.weapons.switchTo(0);
      if (this.input.wasAnyPressed('Digit2', 'Numpad2')) this.weapons.switchTo(1);
      if (this.input.wasAnyPressed('Digit3', 'Numpad3')) this.weapons.switchTo(2);
    }

    const wheel = this.input.consumeWheel();
    if (wheel !== 0) {
      if (inBuild) {
        const pieces = ['wall', 'floor', 'ramp'];
        let idx = pieces.indexOf(this.building.pieceType);
        idx = (idx + wheel + pieces.length) % pieces.length;
        this.building.setPieceType(pieces[idx]);
      } else {
        let idx = this.weapons.currentIndex;
        idx = (idx + wheel + 3) % 3;
        this.weapons.switchTo(idx);
      }
    }

    if (inBuild) {
      if (this.input.buttons.right) {
        this.building.rotate();
        this.input.buttons.right = false;
      }
      if (this.input.buttons.left) {
        const placed = this.building.tryPlace(this.player, (cost) => this.spendMaterials(cost));
        if (placed) this.audio.buildPlace();
      }
    } else {
      this.building.preview.visible = false;
      this.weapons.setEnemyTargets(this.enemies);
      this.weapons.update(dt, this.input, this.enemies, this.buildMeshes, scoped);
    }

    this.building.update(dt, this.player, () => this.player.mats[this.player.buildMat] || 0);
    this.weapons.updateTracers(dt);
    this.input.endFrame();
  }

  updateEnemies(dt) {
    if (!this.botsEnabled) return;
    for (const enemy of this.enemies) {
      enemy.update(dt, this.player, this.buildMeshes);
    }
    this.damageEnemiesInStorm(dt);
  }

  damageEnemiesInStorm(dt) {
    if (!this.storm.active) return;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dist = Math.hypot(
        e.body.position.x - this.storm.center.x,
        e.body.position.z - this.storm.center.z
      );
      if (dist > this.storm.radius) {
        e.health -= STORM.damagePerSecond * dt;
        if (e.health <= 0) e.die(e.onDeathCallback);
      }
    }
  }

  update(dt) {
    if (!this.running) return;

    try {
      this.handleInput(dt);
      this.physicsWorld.step(1 / 60, dt, 3);
      this.matchTime += dt;
      this.player.syncCamera(dt);
      this.updateEnemies(dt);
      this.loot.update(dt, this.player, this.weapons, (msg, type) => this.onPickup(msg, type));
      this.harvest.update(dt);
      this.effects.update(dt);
      const stormState = this.storm.update(dt, this.player);

      const harvestTarget = this.harvest.getTarget(this.player, this.harvestables);
      this.hud.update(
        this.player,
        this.weapons,
        this.building.enabled,
        this.building.pieceType,
        this.weapons.scoped,
        stormState,
        {
          nearChest: this.loot.getNearbyChest(this.player),
          harvestTarget: harvestTarget?.type,
        },
        this.enemies
      );

      if (!this.player.alive) {
        this.running = false;
        document.exitPointerLock();
        this.hud.showDeath(this.enemiesKilled, this.matchTime);
      }
    } catch (err) {
      console.error('Game update error:', err);
    }
  }

  render() {
    this.renderer.render(this.scene, this.player.camera);
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.running) this.update(dt);
    this.render();
  }
}
