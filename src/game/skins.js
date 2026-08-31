/**
 * ============================================================
 *  SKIN CUSTOMIZATION — edit THIS file
 * ============================================================
 *
 * This game has no PNG sprites. Characters are 3D blocks.
 * Each skin is just a set of colors. Change a hex value, save,
 * then refresh the game (or the Skin Lab at /skin-lab.html).
 *
 * Hex format:  0xRRGGBB
 * Example:     0xff0000 = bright red
 *              0x00ff00 = bright green
 *              0x0000ff = bright blue
 *              0xffffff = white
 *              0x000000 = black
 *
 * What each color paints:
 *   name    Kill-feed label
 *   body    Sleeves, shoulders, chest stripe, backpack
 *   shirt   Main torso
 *   pants   Pelvis + legs
 *   skin    Face + inner arms (FPS view)
 *   hair    Hair / hat block
 *   visor   Goggles on the face
 *   boots   Shoes
 *   gloves  Hands in first-person
 *
 * Add a new skin: copy BLANK_SKIN, paste it into SKINS, rename it.
 * Delete a skin:  remove that object from the SKINS array.
 *
 * Visual editor (color pickers + live preview):
 *   npm run dev  →  http://localhost:5173/skin-lab.html
 */

/** Which skin YOU use in first-person. 0 = first skin in the list. */
export const PLAYER_SKIN_INDEX = 0;

/** Copy this, paste into SKINS, then change the colors. */
export const BLANK_SKIN = {
  name: 'Untitled',
  body: 0x888888,
  shirt: 0x666666,
  pants: 0x444444,
  skin: 0xd4a574,
  hair: 0x222222,
  visor: 0x111827,
  boots: 0x1a1a1a,
  gloves: 0x1e293b,
};

export const SKINS = [
  {
    name: 'Default',
    body: 0x3b82f6,
    shirt: 0x1d4ed8,
    pants: 0x1e293b,
    skin: 0xd4a574,
    hair: 0x3b2f2f,
    visor: 0x111827,
    boots: 0x1a1a1a,
    gloves: 0x1e293b,
  },
  {
    name: 'Renegade',
    body: 0xef4444,
    shirt: 0xb91c1c,
    pants: 0x111827,
    skin: 0x8d5524,
    hair: 0x1a1a1a,
    visor: 0x111827,
    boots: 0x1a1a1a,
    gloves: 0x1e293b,
  },
  {
    name: 'Shadow',
    body: 0x6366f1,
    shirt: 0x4338ca,
    pants: 0x0f172a,
    skin: 0xf5cba7,
    hair: 0xfbbf24,
    visor: 0x111827,
    boots: 0x1a1a1a,
    gloves: 0x1e293b,
  },
  {
    name: 'Toxic',
    body: 0x22c55e,
    shirt: 0x15803d,
    pants: 0x14532d,
    skin: 0xc68642,
    hair: 0x2d2d2d,
    visor: 0x111827,
    boots: 0x1a1a1a,
    gloves: 0x1e293b,
  },
  {
    name: 'Blaze',
    body: 0xf97316,
    shirt: 0xea580c,
    pants: 0x292524,
    skin: 0xe0ac69,
    hair: 0x0a0a0a,
    visor: 0x111827,
    boots: 0x1a1a1a,
    gloves: 0x1e293b,
  },
  {
    name: 'Ghost',
    body: 0xe2e8f0,
    shirt: 0x94a3b8,
    pants: 0x475569,
    skin: 0xffdbac,
    hair: 0xc0c0c0,
    visor: 0x111827,
    boots: 0x1a1a1a,
    gloves: 0x1e293b,
  },
  {
    name: 'Violet',
    body: 0xa855f7,
    shirt: 0x7e22ce,
    pants: 0x1e1b4b,
    skin: 0x6b4423,
    hair: 0x4c1d95,
    visor: 0x111827,
    boots: 0x1a1a1a,
    gloves: 0x1e293b,
  },
  {
    name: 'Gold',
    body: 0xfbbf24,
    shirt: 0xd97706,
    pants: 0x78350f,
    skin: 0xd4a574,
    hair: 0x1c1917,
    visor: 0x111827,
    boots: 0x1a1a1a,
    gloves: 0x1e293b,
  },
];

export function getSkin(index = 0) {
  if (!SKINS.length) return { ...BLANK_SKIN };
  const skin = SKINS[((index % SKINS.length) + SKINS.length) % SKINS.length];
  return { ...BLANK_SKIN, ...skin };
}

export function toCssHex(value) {
  return `#${Number(value).toString(16).padStart(6, '0')}`;
}

export function fromCssHex(css) {
  return parseInt(String(css).replace('#', ''), 16);
}
