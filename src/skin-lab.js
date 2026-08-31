import { BLANK_SKIN, SKINS, toCssHex, fromCssHex } from './game/skins.js';

const PARTS = [
  ['body', 'Body'],
  ['shirt', 'Shirt'],
  ['pants', 'Pants'],
  ['skin', 'Skin'],
  ['hair', 'Hair'],
  ['visor', 'Visor'],
  ['boots', 'Boots'],
  ['gloves', 'Gloves'],
];

const skins = SKINS.map((s) => ({ ...BLANK_SKIN, ...s }));
let selected = 0;

const gallery = document.getElementById('gallery');
const fields = document.getElementById('fields');
const nameInput = document.getElementById('skin-name');
const codeOut = document.getElementById('code-out');
const mannequin = document.getElementById('mannequin');

function current() {
  return skins[selected];
}

function skinCode(skin) {
  const lines = PARTS.map(([key]) => `    ${key}: 0x${Number(skin[key]).toString(16).padStart(6, '0')},`);
  return `{
    name: '${skin.name.replace(/'/g, "\\'")}',
${lines.join('\n')}
  }`;
}

function allCode() {
  return `export const SKINS = [
${skins.map((s) => '  ' + skinCode(s).replace(/\n/g, '\n  ')).join(',\n')}
];`;
}

function paintMannequin(skin) {
  const map = {
    hair: skin.hair,
    head: skin.skin,
    visor: skin.visor,
    torso: skin.shirt,
    stripe: skin.body,
    'shoulder-l': skin.body,
    'shoulder-r': skin.body,
    'arm-l': skin.body,
    'arm-r': skin.body,
    'glove-l': skin.gloves,
    'glove-r': skin.gloves,
    pants: skin.pants,
    'leg-l': skin.pants,
    'leg-r': skin.pants,
    'boot-l': skin.boots,
    'boot-r': skin.boots,
  };
  Object.entries(map).forEach(([cls, color]) => {
    const el = mannequin.querySelector('.' + cls);
    if (el) el.style.background = toCssHex(color);
  });
}

function renderGallery() {
  gallery.innerHTML = '';
  skins.forEach((skin, i) => {
    const btn = document.createElement('button');
    btn.className = 'skin-btn' + (i === selected ? ' active' : '');
    btn.type = 'button';
    btn.innerHTML = `<div class="swatches">
      <span class="swatch" style="background:${toCssHex(skin.body)}"></span>
      <span class="swatch" style="background:${toCssHex(skin.shirt)}"></span>
      <span class="swatch" style="background:${toCssHex(skin.pants)}"></span>
    </div><span>${skin.name}</span>`;
    btn.addEventListener('click', () => {
      selected = i;
      render();
    });
    gallery.appendChild(btn);
  });
}

function renderFields() {
  const skin = current();
  nameInput.value = skin.name;
  fields.innerHTML = '';
  PARTS.forEach(([key, label]) => {
    const row = document.createElement('label');
    row.className = 'field';
    row.innerHTML = `<span>${label}</span>
      <input type="color" data-key="${key}" value="${toCssHex(skin[key])}" />
      <span class="hex">0x${Number(skin[key]).toString(16).padStart(6, '0')}</span>`;
    row.querySelector('input').addEventListener('input', (e) => {
      skin[key] = fromCssHex(e.target.value);
      render();
    });
    fields.appendChild(row);
  });
}

function render() {
  renderGallery();
  renderFields();
  paintMannequin(current());
  codeOut.value = `// Paste this object into SKINS in src/game/skins.js\n${skinCode(current())}`;
}

nameInput.addEventListener('input', () => {
  current().name = nameInput.value || 'Untitled';
  renderGallery();
  codeOut.value = `// Paste this object into SKINS in src/game/skins.js\n${skinCode(current())}`;
});

document.getElementById('btn-new').addEventListener('click', () => {
  skins.push({ ...BLANK_SKIN, name: `Custom ${skins.length + 1}` });
  selected = skins.length - 1;
  render();
});

document.getElementById('btn-dupe').addEventListener('click', () => {
  const copy = { ...current(), name: `${current().name} Copy` };
  skins.splice(selected + 1, 0, copy);
  selected += 1;
  render();
});

document.getElementById('btn-copy-one').addEventListener('click', async () => {
  await navigator.clipboard.writeText(skinCode(current()));
});

document.getElementById('btn-copy-all').addEventListener('click', async () => {
  await navigator.clipboard.writeText(allCode());
  codeOut.value = allCode();
});

render();
