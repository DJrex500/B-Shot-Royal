/**
 * Patch notes. Newest first.
 * When we ship a change, add a new object at the top of CHANGELOG.
 */
export const CHANGELOG = [
  {
    version: '0.3.2',
    date: '2026-08-31',
    title: 'Jump Fix',
    items: [
      'Jump only triggers once per Space press (no more fly-hops from key repeat)',
      'Ground check ignores the player body so landing and jumping stay consistent',
    ],
  },
  {
    version: '0.3.1',
    date: '2026-08-29',
    title: 'Ammo Sprites',
    items: [
      'New ground sprites for Rifle Ammo, Shotgun Shells, and Sniper Ammo',
      'Each ammo pickup now gives rounds for that weapon only',
      'Build pieces snap to a hidden 4m grid so walls, floors, and ramps line up',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-08-29',
    title: 'Build, Mats & Inventory',
    items: [
      'Fixed infinite jump (Space no longer lets you fly)',
      'Split materials into Wood, Brick, and Metal',
      'Harvest trees for wood, rocks for brick, scrap piles for metal',
      'Build pieces now use the selected material look and HP',
      'Placement snaps to a hidden grid — only the ghost piece is visible',
      'Ammo crates on the ground are labeled AMMO',
      'Fortnite-style hotbar and material stack',
      'Added this in-game Update Log',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-08-24',
    title: 'Loot & Branding',
    items: [
      'Ground loot sprites so pickups are readable',
      'Skin Lab for character colors',
      'B-Shot Royal logo and menu art',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-08-11',
    title: 'Island Drop',
    items: [
      'Open-world map with POIs and a shrinking storm',
      'Weapons, building, bots, and Victory Royale',
    ],
  },
];
