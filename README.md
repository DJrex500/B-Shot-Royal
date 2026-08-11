# Build Battle — 3D Shooter

Single-player Fortnite-style shooter with working build system and custom weapons.

## Run

**Option 1 — double-click `start.bat`** (easiest on Windows)

**Option 2 — terminal:**

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser, click **Play**, then **click the game screen once** to capture the mouse.

## Controls

| Key | Action |
|-----|--------|
| WASD | Move |
| Space | Jump |
| Shift | Sprint |
| Mouse | Look |
| LMB | Shoot / Place build |
| RMB | Rotate build piece |
| B | Toggle build mode |
| 1 / 2 / 3 | Wall / Floor / Ramp |
| 4 / 5 / 6 | Assault Rifle / Shotgun / Sniper |
| R | Reload |

## Features

- **3 custom weapons** — Assault Rifle, Pump Shotgun, Bolt Sniper (unique stats, models, tracers)
- **Build system** — Grid-snapped walls, floors, and ramps with physics collision
- **Single-player combat** — AI bots spawn in waves; build cover and take high ground
- **Health + shield** — Fortnite-style damage absorption

Built with Three.js, Cannon-es, and Vite.
