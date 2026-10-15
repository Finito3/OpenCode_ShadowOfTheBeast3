import * as PIXI from 'pixi.js';

export interface Body {
  x: number; y: number; w: number; h: number;
  vx: number; vy: number;
}

// Minimal hero body with placeholder box. Physics tuned later from RE notes.
export class Hero {
  body: Body = { x: 40, y: 100, w: 12, h: 18, vx: 0, vy: 0 };
  sprite: PIXI.Graphics = new PIXI.Graphics();
  onGround = false;
  energy = 100;
  lives = 3;

  constructor() {
    this.sprite.beginFill(0xc0392b);
    this.sprite.drawRect(0, 0, this.body.w, this.body.h);
    this.sprite.endFill();
  }

  update(dt: number, input: { left: boolean; right: boolean; jump: boolean }, groundY: number) {
    const speed = 90;
    const jumpV = -260;
    const gravity = 900;
    const b = this.body;
    b.vx = (input.right ? speed : 0) - (input.left ? speed : 0);
    if (input.jump && this.onGround) {
      b.vy = jumpV;
      this.onGround = false;
    }
    b.vy += gravity * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y + b.h >= groundY) {
      b.y = groundY - b.h;
      b.vy = 0;
      this.onGround = true;
    }
    this.sprite.position.set(Math.round(b.x), Math.round(b.y));
  }
}
