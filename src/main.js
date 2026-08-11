import { Game } from './game/Game.js';

const canvas = document.getElementById('game-canvas');

try {
  const game = new Game(canvas);
  window.game = game;
} catch (err) {
  console.error(err);
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.innerHTML = `<div id="menu"><h1>Failed to load</h1><p style="color:#fca5a5;max-width:520px;text-align:center">${err.message}</p><p>Try running: npm install && npm run dev</p></div>`;
  }
}
