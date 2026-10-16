import * as PIXI from 'pixi.js';
import { Tilemap } from './tilemap';

export interface Body {
  x: number; y: number; w: number; h: number;
  vx: number; vy: number;
}

// Hero with optional tilemap collision (AABB vs grid). Falls back to flat
// groundY when no tilemap is loaded.
export class Hero {
  body: Body = { x: 96, y: 800, w: 12, h: 18, vx: 0, vy: 0 };
  sprite: PIXI.Graphics = new PIXI.Graphics();
  onGround = false;
  energy = 100;
  lives = 3;

  constructor() {
    this.sprite.beginFill(0xc0392b);
    this.sprite.drawRect(0, 0, this.body.w, this.body.h);
    this.sprite.endFill();
  }

  private solidAt(map: Tilemap | null, px: number, py: number): boolean {
    if (!map || !map.loaded) return false;
    return map.isSolid(Math.floor(px / 16), Math.floor(py / 16));
  }

  update(
    dt: number,
    input: { left: boolean; right: boolean; jump: boolean; up: boolean; down: boolean },
    map: Tilemap | null,
    ladders: { tx: number; ty0: number; ty1: number }[],
    flatGroundY = 176,
  ) {
    const speed = 90;
    const jumpV = -260;
    const gravity = 900;
    const climb = 70;
    const b = this.body;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;

    const onLadder = ladders.some(
      (l) => Math.abs(cx - (l.tx * 16 + 8)) < 10 && cy >= l.ty0 * 16 && cy <= (l.ty1 + 1) * 16,
    );

    if (onLadder && (input.up || input.down)) {
      b.vy = (input.down ? climb : 0) - (input.up ? climb : 0);
      b.x += ((input.right ? speed : 0) - (input.left ? speed : 0)) * dt * 0.5;
      b.y += b.vy * dt;
      this.onGround = false;
    } else {
      b.vx = (input.right ? speed : 0) - (input.left ? speed : 0);
      if (input.jump && this.onGround) {
        b.vy = jumpV;
        this.onGround = false;
      }
      b.vy += gravity * dt;
      // integrate X then resolve
      b.x += b.vx * dt;
      this.collideAxis(map, true);
      b.y += b.vy * dt;
      this.onGround = false;
      this.collideAxis(map, false);
      if (!map || !map.loaded) {
        if (b.y + b.h >= flatGroundY) {
          b.y = flatGroundY - b.h;
          b.vy = 0;
          this.onGround = true;
        }
      }
    }
    this.sprite.position.set(Math.round(b.x), Math.round(b.y));
  }

  private collideAxis(map: Tilemap | null, isX: boolean) {
    if (!map || !map.loaded) return;
    const b = this.body;
    const x0 = Math.floor(b.x / 16), x1 = Math.floor((b.x + b.w - 0.01) / 16);
    const y0 = Math.floor(b.y / 16), y1 = Math.floor((b.y + b.h - 0.01) / 16);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!map.isSolid(tx, ty)) continue;
        if (isX) {
          b.x = b.vx > 0 ? tx * 16 - b.w - 0.01 : (tx + 1) * 16 + 0.01;
          b.vx = 0;
        } else if (b.vy > 0) {
          b.y = ty * 16 - b.h - 0.01;
          b.vy = 0;
          this.onGround = true;
        } else if (b.vy < 0) {
          b.y = (ty + 1) * 16 + 0.01;
          b.vy = 0;
        }
      }
    }
  }
}
