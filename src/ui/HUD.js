import { BUILD_PIECES, MAP_SIZE } from '../game/constants.js';
import { WEAPONS } from '../game/weapons.js';
import { loadSettings, saveSettings } from '../game/Settings.js';

export class HUD {
  constructor() {
    this.menu = document.getElementById('menu');
    this.hud = document.getElementById('hud');
    this.deathScreen = document.getElementById('death-screen');
    this.victoryScreen = document.getElementById('victory-screen');
    this.playBtn = document.getElementById('play-btn');
    this.respawnBtn = document.getElementById('respawn-btn');
    this.victoryBtn = document.getElementById('victory-btn');

    this.healthFill = document.getElementById('health-fill');
    this.shieldFill = document.getElementById('shield-fill');
    this.healthText = document.getElementById('health-text');
    this.shieldText = document.getElementById('shield-text');
    this.matCount = document.getElementById('mat-count');
    this.weaponName = document.getElementById('weapon-name');
    this.ammoCurrent = document.getElementById('ammo-current');
    this.ammoReserve = document.getElementById('ammo-reserve');
    this.buildInfo = document.getElementById('build-info');
    this.buildPiece = document.getElementById('build-piece');
    this.modeBadge = document.getElementById('mode-badge');
    this.killFeed = document.getElementById('kill-feed');
    this.lootFeed = document.getElementById('loot-feed');
    this.deathStats = document.getElementById('death-stats');
    this.victoryStats = document.getElementById('victory-stats');
    this.stormInfo = document.getElementById('storm-info');
    this.interactHint = document.getElementById('interact-hint');
    this.hitMarker = document.getElementById('hit-marker');
    this.damageFlash = document.getElementById('damage-flash');
    this.reloadBar = document.getElementById('reload-bar');
    this.reloadFill = document.getElementById('reload-fill');
    this.weaponSlots = document.querySelectorAll('#weapon-slots .slot');
    this.buildSlots = document.querySelectorAll('#build-slots .slot');
    this.crosshair = document.getElementById('crosshair');
    this.scopeOverlay = document.getElementById('scope-overlay');
    this.stormVignette = document.getElementById('storm-vignette');
    this.minimap = document.getElementById('minimap');
    this.minimapCtx = this.minimap?.getContext('2d');

    this.settings = loadSettings();
    this.kills = 0;
    this.pois = [];

    this.bindMenu();
    this.applySettingsToUI();
  }

  bindMenu() {
    document.querySelectorAll('.menu-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.menu-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.menu-tab-content').forEach((c) => c.classList.add('hidden'));
        document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
      });
    });

    const botsEl = document.getElementById('setting-bots');
    const sensEl = document.getElementById('setting-sens');
    const sensVal = document.getElementById('setting-sens-val');
    const stormEl = document.getElementById('setting-storm');
    const stormVal = document.getElementById('setting-storm-val');
    const volEl = document.getElementById('setting-volume');
    const volVal = document.getElementById('setting-volume-val');

    botsEl.checked = this.settings.botsEnabled;
    sensEl.value = this.settings.mouseSensitivity;
    stormEl.value = this.settings.stormSpeed;
    volEl.value = this.settings.volume ?? 0.7;
    sensVal.textContent = this.settings.mouseSensitivity.toFixed(1);
    stormVal.textContent = this.settings.stormSpeed.toFixed(1);
    volVal.textContent = (this.settings.volume ?? 0.7).toFixed(1);

    const persist = () => {
      this.settings.botsEnabled = botsEl.checked;
      this.settings.mouseSensitivity = parseFloat(sensEl.value);
      this.settings.stormSpeed = parseFloat(stormEl.value);
      this.settings.volume = parseFloat(volEl.value);
      sensVal.textContent = this.settings.mouseSensitivity.toFixed(1);
      stormVal.textContent = this.settings.stormSpeed.toFixed(1);
      volVal.textContent = this.settings.volume.toFixed(1);
      saveSettings(this.settings);
    };

    botsEl.addEventListener('change', persist);
    sensEl.addEventListener('input', persist);
    stormEl.addEventListener('input', persist);
    volEl.addEventListener('input', persist);
  }

  applySettingsToUI() {
    const botsEl = document.getElementById('setting-bots');
    const sensEl = document.getElementById('setting-sens');
    const stormEl = document.getElementById('setting-storm');
    if (botsEl) botsEl.checked = this.settings.botsEnabled;
    if (sensEl) sensEl.value = this.settings.mouseSensitivity;
    if (stormEl) stormEl.value = this.settings.stormSpeed;
  }

  getSettings() {
    return this.settings;
  }

  setPOIs(pois) {
    this.pois = pois;
  }

  onPlay(callback) {
    this.playBtn.addEventListener('click', () => {
      this.settings.botsEnabled = document.getElementById('setting-bots').checked;
      this.settings.mouseSensitivity = parseFloat(document.getElementById('setting-sens').value);
      this.settings.stormSpeed = parseFloat(document.getElementById('setting-storm').value);
      this.settings.volume = parseFloat(document.getElementById('setting-volume').value);
      saveSettings(this.settings);
      callback(this.settings);
    });
  }

  onVictory(callback) {
    this.victoryBtn.addEventListener('click', callback);
  }

  onRespawn(callback) {
    this.respawnBtn.addEventListener('click', callback);
  }

  showGame() {
    this.menu.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.deathScreen.classList.add('hidden');
    this.victoryScreen.classList.add('hidden');
  }

  showDeath(kills, timeAlive = 0) {
    this.deathScreen.classList.remove('hidden');
    this.deathStats.textContent = `Eliminations: ${kills} · Survived ${Math.floor(timeAlive)}s`;
  }

  showVictory(kills, timeAlive = 0) {
    this.victoryScreen.classList.remove('hidden');
    this.victoryStats.textContent = `#1 Victory · ${kills} eliminations · ${Math.floor(timeAlive)}s survived`;
  }

  hideVictory() {
    this.victoryScreen.classList.add('hidden');
  }

  flashHitMarker(isHeadshot = false) {
    if (!this.hitMarker) return;
    this.hitMarker.className = isHeadshot ? 'headshot-hit' : 'show';
    clearTimeout(this._hitTimer);
    this._hitTimer = setTimeout(() => {
      this.hitMarker.className = 'hidden';
    }, isHeadshot ? 200 : 120);
  }

  flashDamage() {
    if (!this.damageFlash) return;
    this.damageFlash.classList.add('active');
    clearTimeout(this._dmgTimer);
    this._dmgTimer = setTimeout(() => this.damageFlash.classList.remove('active'), 200);
  }

  hideDeath() {
    this.deathScreen.classList.add('hidden');
  }

  addKill(name, isHeadshot = false) {
    this.kills += 1;
    const el = document.createElement('div');
    el.className = isHeadshot ? 'kill-entry headshot-kill' : 'kill-entry';
    el.textContent = isHeadshot ? `💀 HEADSHOT — ${name}` : `Eliminated ${name}`;
    this.killFeed.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  addHeadshot() {
    const el = document.createElement('div');
    el.className = 'headshot-popup';
    el.textContent = 'HEADSHOT!';
    this.hud.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 200);
    }, 700);
  }

  addLoot(text) {
    const el = document.createElement('div');
    el.className = 'loot-entry';
    el.textContent = text;
    this.lootFeed.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  drawMinimap(player, stormState, enemies) {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = this.minimap.width;
    const h = this.minimap.height;
    const half = MAP_SIZE / 2;
    const scale = (w * 0.46) / half;

    const toMap = (x, z) => ({
      x: w / 2 + x * scale,
      y: h / 2 + z * scale,
    });

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(10, 20, 14, 0.92)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(61, 107, 53, 0.6)';
    ctx.lineWidth = 1;
    for (let i = -half; i <= half; i += 40) {
      const a = toMap(i, -half);
      const b = toMap(i, half);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      const c = toMap(-half, i);
      const d = toMap(half, i);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.font = '8px Segoe UI, sans-serif';
    for (const poi of this.pois) {
      const p = toMap(poi.x, poi.z);
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      if (poi.name) ctx.fillText(poi.name, p.x + 5, p.y + 3);
    }

    if (stormState.radius) {
      const cx = stormState.centerX ?? 0;
      const cz = stormState.centerZ ?? 0;
      const center = toMap(cx, cz);
      ctx.beginPath();
      ctx.strokeStyle = stormState.inStorm ? 'rgba(239, 68, 68, 0.9)' : 'rgba(147, 51, 234, 0.85)';
      ctx.lineWidth = 2;
      ctx.arc(center.x, center.y, stormState.radius * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = stormState.active ? 'rgba(147, 51, 234, 0.12)' : 'rgba(148, 163, 184, 0.08)';
      ctx.fill();
    }

    ctx.fillStyle = '#ef4444';
    for (const e of enemies) {
      if (!e.alive) continue;
      const p = toMap(e.body.position.x, e.body.position.z);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const pp = toMap(player.body.position.x, player.body.position.z);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.stroke();

    const yaw = player.yaw;
    ctx.strokeStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(pp.x, pp.y);
    ctx.lineTo(pp.x - Math.sin(yaw) * 10, pp.y - Math.cos(yaw) * 10);
    ctx.stroke();
  }

  update(player, weaponSystem, buildMode, pieceType, scoped = false, stormState = {}, interact = {}, enemies = []) {
    const maxH = player.maxHealth || 100;
    const maxS = player.maxShield || 100;
    const health = Number.isFinite(player.health) ? Math.max(0, player.health) : 0;
    const shield = Number.isFinite(player.shield) ? Math.max(0, player.shield) : 0;
    const mats = Number.isFinite(player.materials) ? player.materials : 0;

    this.healthFill.style.width = `${(health / maxH) * 100}%`;
    this.shieldFill.style.width = `${(shield / maxS) * 100}%`;
    this.healthText.textContent = Math.ceil(health);
    this.shieldText.textContent = Math.ceil(shield);
    this.matCount.textContent = mats;

    const w = WEAPONS[weaponSystem.currentId];
    const st = weaponSystem.currentState;
    this.weaponName.textContent = scoped ? `${w.name} [ADS]` : w.name;
    this.ammoCurrent.textContent = st.reloading ? '...' : st.ammo;
    this.ammoReserve.textContent = st.reserve;

    if (st.reloading) {
      this.reloadBar.classList.remove('hidden');
      const prog = 1 - st.reloadTimer / weaponSystem.current.reloadTime;
      this.reloadFill.style.width = `${Math.max(0, Math.min(100, prog * 100))}%`;
    } else {
      this.reloadBar.classList.add('hidden');
    }

    if (player.damageFlash > 0) {
      this.damageFlash.style.opacity = String(Math.min(0.5, player.damageFlash * 1.2));
    } else {
      this.damageFlash.style.opacity = '0';
    }

    if (!buildMode && scoped) {
      this.scopeOverlay.className = `scope-overlay scope-${weaponSystem.currentId}`;
      this.crosshair.classList.add('hidden');
    } else {
      this.scopeOverlay.className = 'scope-overlay hidden';
      this.crosshair.classList.remove('hidden');
    }

    if (stormState.inStorm) {
      this.stormVignette.classList.add('active');
      this.stormInfo.textContent = `⚠ IN STORM — Phase ${stormState.phase}`;
      this.stormInfo.classList.add('storm-active');
    } else if (stormState.timeUntilStorm > 0) {
      this.stormVignette.classList.remove('active');
      this.stormInfo.textContent = `Storm in ${Math.ceil(stormState.timeUntilStorm)}s`;
      this.stormInfo.classList.remove('storm-active');
    } else {
      this.stormVignette.classList.remove('active');
      this.stormInfo.textContent = `Storm Phase ${stormState.phase || 0} — ${Math.ceil(stormState.shrinkTimer || 0)}s`;
      this.stormInfo.classList.remove('storm-active');
    }

    if (interact.nearChest) {
      this.interactHint.textContent = '[E] Open Chest';
      this.interactHint.classList.remove('hidden');
    } else if (interact.harvestTarget) {
      this.interactHint.textContent = `[F] Harvest ${interact.harvestTarget}`;
      this.interactHint.classList.remove('hidden');
    } else if (!buildMode) {
      this.interactHint.classList.add('hidden');
    } else {
      this.interactHint.classList.add('hidden');
    }

    if (buildMode) {
      this.buildInfo.classList.remove('hidden');
      this.buildPiece.textContent = BUILD_PIECES[pieceType].name;
      this.modeBadge.textContent = 'BUILD';
      this.modeBadge.classList.add('build-mode');
      this.weaponSlots.forEach((el) => el.classList.remove('active'));
      this.buildSlots.forEach((el) => {
        el.classList.toggle('active', el.dataset.slot === pieceType);
      });
    } else {
      this.buildInfo.classList.add('hidden');
      this.modeBadge.textContent = 'COMBAT';
      this.modeBadge.classList.remove('build-mode');
      this.buildSlots.forEach((el) => el.classList.remove('active'));
      this.weaponSlots.forEach((el, i) => {
        el.classList.toggle('active', i === weaponSystem.currentIndex);
      });
    }

    this.drawMinimap(player, stormState, enemies);
  }
}
