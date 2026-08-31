export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, dx: 0, dy: 0 };
    this.buttons = { left: false, right: false };
    this.locked = false;
    this.justPressed = new Set();
    this.wheelDelta = 0;

    this._onKeyDown = (e) => {
      if (e.repeat) {
        if (['Space', 'Tab'].includes(e.code)) e.preventDefault();
        return;
      }
      this.keys.add(e.code);
      this.justPressed.add(e.code);
      if (['Space', 'Tab'].includes(e.code)) e.preventDefault();
    };
    this._onKeyUp = (e) => this.keys.delete(e.code);
    this._onMouseMove = (e) => {
      this.mouse.dx = e.movementX;
      this.mouse.dy = e.movementY;
    };
    this._onMouseDown = (e) => {
      if (e.button === 0) this.buttons.left = true;
      if (e.button === 2) this.buttons.right = true;
    };
    this._onMouseUp = (e) => {
      if (e.button === 0) this.buttons.left = false;
      if (e.button === 2) this.buttons.right = false;
    };
    this._onContextMenu = (e) => e.preventDefault();
    this._onWheel = (e) => {
      this.wheelDelta += Math.sign(e.deltaY);
      e.preventDefault();
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('contextmenu', this._onContextMenu);
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
    this.bindPointerLock();
  }

  requestLock() {
    if (document.pointerLockElement === this.canvas) {
      this.locked = true;
      return;
    }
    this.canvas.requestPointerLock?.().catch(() => {
      this.locked = false;
    });
  }

  bindPointerLock() {
    if (this._lockBound) return;
    this._lockBound = () => {
      this.locked = document.pointerLockElement === this.canvas;
    };
    document.addEventListener('pointerlockchange', this._lockBound);
  }

  isDown(code) {
    return this.keys.has(code);
  }

  consumeMouseDelta() {
    const dx = this.mouse.dx;
    const dy = this.mouse.dy;
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    return { dx, dy };
  }

  wasPressed(code) {
    if (this.justPressed.has(code)) {
      this.justPressed.delete(code);
      return true;
    }
    return false;
  }

  wasAnyPressed(...codes) {
    for (const code of codes) {
      if (this.wasPressed(code)) return true;
    }
    return false;
  }

  consumeWheel() {
    const delta = this.wheelDelta;
    this.wheelDelta = 0;
    return delta;
  }

  endFrame() {
    this.justPressed.clear();
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('contextmenu', this._onContextMenu);
    this.canvas.removeEventListener('wheel', this._onWheel);
  }
}
