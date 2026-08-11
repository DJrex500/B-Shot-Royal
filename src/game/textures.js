import * as THREE from 'three';

function canvasTex(draw, size = 256) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createGrassTexture() {
  return canvasTex((ctx, s) => {
    ctx.fillStyle = '#3d6b35';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const g = 80 + Math.random() * 60;
      ctx.fillStyle = `rgb(${g * 0.4},${g},${g * 0.35})`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 3);
    }
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(45,90,40,${0.1 + Math.random() * 0.15})`;
      ctx.beginPath();
      ctx.arc(Math.random() * s, Math.random() * s, 2 + Math.random() * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 512);
}

export function createWoodTexture() {
  return canvasTex((ctx, s) => {
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 4) {
      ctx.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.04})`;
      ctx.fillRect(0, y, s, 1);
    }
    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = `rgba(60,40,10,${0.15 + Math.random() * 0.1})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * s, 0);
      ctx.bezierCurveTo(Math.random() * s, s * 0.3, Math.random() * s, s * 0.7, Math.random() * s, s);
      ctx.stroke();
    }
  });
}

export function createFloorTexture() {
  return canvasTex((ctx, s) => {
    ctx.fillStyle = '#6b8e23';
    ctx.fillRect(0, 0, s, s);
    const tile = s / 4;
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        ctx.fillStyle = (x + y) % 2 ? '#5f7d1f' : '#759929';
        ctx.fillRect(x * tile + 2, y * tile + 2, tile - 4, tile - 4);
      }
    }
  });
}

export function createStoneTexture() {
  return canvasTex((ctx, s) => {
    ctx.fillStyle = '#78716c';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const r = 3 + Math.random() * 12;
      ctx.fillStyle = `rgba(${100 + Math.random() * 40},${95 + Math.random() * 35},${90 + Math.random() * 30},0.5)`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function createBrickTexture() {
  return canvasTex((ctx, s) => {
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(0, 0, s, s);
    const bw = s / 4;
    const bh = s / 8;
    for (let row = 0; row < 8; row++) {
      const offset = row % 2 ? bw / 2 : 0;
      for (let col = -1; col < 5; col++) {
        ctx.fillStyle = `rgb(${140 + Math.random() * 30},${145 + Math.random() * 25},${150 + Math.random() * 20})`;
        ctx.fillRect(col * bw + offset + 2, row * bh + 2, bw - 4, bh - 4);
      }
    }
  });
}

export function createWaterTexture() {
  return canvasTex((ctx, s) => {
    const grad = ctx.createLinearGradient(0, 0, s, s);
    grad.addColorStop(0, '#1d4ed8');
    grad.addColorStop(1, '#2563eb');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.08})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * s);
      ctx.bezierCurveTo(s * 0.3, Math.random() * s, s * 0.7, Math.random() * s, s, Math.random() * s);
      ctx.stroke();
    }
  });
}

export function mat(map, opts = {}) {
  return new THREE.MeshStandardMaterial({
    map,
    roughness: opts.roughness ?? 0.85,
    metalness: opts.metalness ?? 0,
    color: opts.color ?? 0xffffff,
  });
}
