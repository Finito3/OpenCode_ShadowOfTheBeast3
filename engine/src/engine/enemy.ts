import * as PIXI from 'pixi.js';
import { Body } from './hero';

// Patrolling beast (gray humanoid w/ red eyes, per fb_3a renders).
// Walks on platforms, turns at walls/ledges, hurts hero on touch.
export class Enemy {
  body: Body = { x: 0, y: 0, w: 12, h: 20, vx: 0, vy: 0 };
  sprite: PIXI.Container = new PIXI.Container();
  dir = 1;
  alive = true;
  touchCd = 0;
  private speed = 34;

  constructor(tx: number, ty: number) {
    this.body.x = tx * 16;
    this.body.y = ty * 16;
    const g = new PIXI.Graphics();
    g.beginFill(0x8a8a92); // gray hide
    g.drawRect(1, 6, 10, 12); // torso
    g.drawRoundedRect(2, 0, 8, 7, 2); // head
    g.endFill();
    g.beginFill(0xc00000); // red eyes
    g.drawRect(4, 3, 2, 1);
    g.drawRect(7, 3, 2, 1);
    g.endFill();
    g.beginFill(0x5a5a62); // legs
    g.drawRect(2, 18, 3, 2);
    g.drawRect(7, 18, 3, 2);
    g.endFill();
    this.sprite.addChild(g);
    this.sprite.position.set(this.body.x, this.body.y);
  }

  update(
    dt: number,
    solidAt: (px: number, py: number) => boolean,
  ) {
    if (!this.alive) return;
    const b = this.body;
    if (this.touchCd > 0) this.touchCd -= dt;
    b.vx = this.dir * this.speed;
    b.vy += 900 * dt;
    // X + resolve
    b.x += b.vx * dt;
    const aheadX = this.dir > 0 ? b.x + b.w : b.x;
    if (solidAt(aheadX, b.y + b.h / 2)) {
      this.dir *= -1;
      b.x += this.dir * 2;
    }
    // Y + resolve
    b.y += b.vy * dt;
    const feetY = b.y + b.h;
    if (solidAt(b.x + 2, feetY) || solidAt(b.x + b.w - 2, feetY)) {
      // snap to ground
      const ty = Math.floor(feetY / 16);
      b.y = ty * 16 - b.h;
      b.vy = 0;
    }
    // ledge check: turn if no ground ahead
    const lookX = this.dir > 0 ? b.x + b.w + 2 : b.x - 2;
    if (b.vy === 0 && !solidAt(lookX, b.y + b.h + 4)) this.dir *= -1;
    this.sprite.position.set(Math.round(b.x), Math.round(b.y));
    this.sprite.scale.x = this.dir >= 0 ? 1 : -1;
  }
}

// Shuriken projectile (Z key). Flies straight, kills on hit.
export class Shuriken {
  body: Body = { x: 0, y: 0, w: 8, h: 8, vx: 0, vy: 0 };
  sprite: PIXI.Graphics = new PIXI.Graphics();
  alive = false;

  constructor() {
    const g = this.sprite;
    g.beginFill(0xdddddd);
    g.drawRect(3, 0, 2, 8);
    g.drawRect(0, 3, 8, 2);
    g.endFill();
  }

  fire(x: number, y: number, dir: number) {
    this.body.x = x;
    this.body.y = y;
    this.body.vx = dir * 320;
    this.alive = true;
    this.sprite.visible = true;
  }

  update(dt: number, solidAt: (px: number, py: number) => boolean) {
    if (!this.alive) return;
    const b = this.body;
    b.x += b.vx * dt;
    this.sprite.rotation += dt * 12;
    if (solidAt(b.x + 4, b.y + 4)) this.alive = false;
    this.sprite.position.set(Math.round(b.x), Math.round(b.y));
    this.sprite.visible = this.alive;
    if (!this.alive) this.sprite.visible = false;
  }
}
