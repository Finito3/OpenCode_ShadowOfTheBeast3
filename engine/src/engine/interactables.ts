import * as PIXI from 'pixi.js';
import { Body } from './hero';

export type PickupKind = 'item' | 'key';

// Collectible: meat/energy (item) or a door key.
export class Pickup {
  body: Body = { x: 0, y: 0, w: 12, h: 12, vx: 0, vy: 0 };
  sprite: PIXI.Graphics = new PIXI.Graphics();
  taken = false;

  constructor(tx: number, ty: number, public kind: PickupKind) {
    this.body.x = tx * 16 + 2;
    this.body.y = ty * 16 + 2;
    const g = this.sprite;
    if (kind === 'key') {
      g.beginFill(0xf2c14e);
      g.drawRect(2, 5, 8, 2);
      g.drawRect(7, 3, 2, 6);
      g.drawRect(9, 3, 2, 2);
      g.drawRect(9, 7, 2, 2);
      g.endFill();
    } else {
      g.beginFill(0xd23b3b);
      g.drawRoundedRect(1, 2, 10, 9, 3);
      g.endFill();
      g.beginFill(0xf7e7c4);
      g.drawRect(6, 4, 3, 5);
      g.endFill();
    }
    this.sprite.position.set(this.body.x, this.body.y);
  }
}

// Locked door: solid rectangle until a key is used on it.
export class Door {
  body: Body = { x: 0, y: 0, w: 0, h: 0, vx: 0, vy: 0 };
  sprite: PIXI.Container = new PIXI.Container();
  open = false;
  private bars = new PIXI.Graphics();
  private frame = new PIXI.Graphics();

  constructor(tx: number, ty: number, wTiles = 1, hTiles = 3) {
    this.body = { x: tx * 16, y: ty * 16, w: wTiles * 16, h: hTiles * 16, vx: 0, vy: 0 };
    this.frame.beginFill(0x6b4a2a);
    this.frame.drawRect(0, 0, wTiles * 16, hTiles * 16);
    this.frame.endFill();
    this.bars.beginFill(0x3a2a18);
    for (let i = 0; i < wTiles * 16; i += 4) this.bars.drawRect(i + 1, 2, 2, hTiles * 16 - 4);
    this.bars.endFill();
    this.bars.beginFill(0xf2c14e);
    this.bars.drawRect(wTiles * 8 - 2, hTiles * 8 - 4, 4, 6);
    this.bars.endFill();
    this.sprite.addChild(this.frame, this.bars);
    this.sprite.position.set(this.body.x, this.body.y);
  }

  blocks(tx: number, ty: number): boolean {
    if (this.open) return false;
    const x = tx * 16, y = ty * 16;
    return x + 15 >= this.body.x && x <= this.body.x + this.body.w - 1 &&
      y + 15 >= this.body.y && y <= this.body.y + this.body.h - 1;
  }

  setOpen() {
    if (this.open) return;
    this.open = true;
    this.bars.visible = false;
    this.frame.alpha = 0.45;
  }
}

// Lever: press a key when overlapping to toggle a mechanism.
export class Lever {
  body: Body;
  sprite: PIXI.Graphics = new PIXI.Graphics();
  on = false;

  constructor(tx: number, ty: number) {
    this.body = { x: tx * 16 + 3, y: ty * 16, w: 10, h: 16, vx: 0, vy: 0 };
    const g = this.sprite;
    g.beginFill(0x555a60);
    g.drawRect(3, 10, 4, 6);
    g.endFill();
    this.sprite.position.set(this.body.x, this.body.y);
    this.draw();
  }

  private draw() {
    const g = this.sprite;
    g.beginFill(0xc23b3b);
    if (this.on) g.drawRect(7, 0, 3, 11);
    else g.drawRect(0, 0, 3, 11);
    g.endFill();
  }

  toggle() {
    this.on = !this.on;
    this.sprite.clear();
    this.sprite.beginFill(0x555a60);
    this.sprite.drawRect(3, 10, 4, 6);
    this.sprite.endFill();
    this.draw();
  }
}

// Boss "leader": pursues the hero, drains energy on contact, dies to shuriken.
export class Boss {
  body: Body = { x: 0, y: 0, w: 20, h: 30, vx: 0, vy: 0 };
  sprite: PIXI.Container = new PIXI.Container();
  hp = 10;
  readonly maxHp = 10;
  dir = -1;
  alive = true;
  active = false;
  touchCd = 0;
  private hurtFlash = 0;
  private speed = 30;

  constructor(tx: number, ty: number) {
    this.body.x = tx * 16;
    this.body.y = ty * 16;
    this.draw(false);
    this.sprite.position.set(this.body.x, this.body.y);
  }

  private draw(flash: boolean) {
    const g = new PIXI.Graphics();
    const hide = flash ? 0xffffff : 0x3b2a4a;
    const trim = flash ? 0xffffff : 0x8a2be2;
    g.beginFill(hide);
    g.drawRoundedRect(2, 0, 16, 22, 4);
    g.endFill();
    g.beginFill(trim);
    g.drawRect(0, 2, 3, 4);
    g.drawRect(17, 2, 3, 4);
    g.endFill();
    g.beginFill(0xff2d2d);
    g.drawRect(5, 6, 3, 2);
    g.drawRect(12, 6, 3, 2);
    g.endFill();
    g.beginFill(0x241a2e);
    g.drawRect(3, 28, 6, 2);
    g.drawRect(11, 28, 6, 2);
    g.endFill();
    this.sprite.removeChildren();
    this.sprite.addChild(g);
  }

  update(dt: number, solidAt: (px: number, py: number) => boolean, target: Body) {
    if (!this.alive) return;
    const b = this.body;
    if (this.touchCd > 0) this.touchCd -= dt;
    if (this.hurtFlash > 0) {
      this.hurtFlash -= dt;
      if (this.hurtFlash <= 0) this.draw(false);
    }
    const dx = target.x + target.w / 2 - (b.x + b.w / 2);
    this.dir = dx >= 0 ? 1 : -1;
    // stationary guard at the arena; the player must shoot it
    b.vx = 0;
    b.vy += 900 * dt;
    b.x += b.vx * dt;
    const aheadX = this.dir > 0 ? b.x + b.w : b.x;
    if (solidAt(aheadX, b.y + b.h / 2)) {
      b.x -= b.vx * dt;
      b.vx = 0;
    }
    b.y += b.vy * dt;
    const feetY = b.y + b.h;
    if (solidAt(b.x + 3, feetY) || solidAt(b.x + b.w - 3, feetY)) {
      b.y = Math.floor(feetY / 16) * 16 - b.h;
      b.vy = 0;
    }
    this.sprite.position.set(Math.round(b.x), Math.round(b.y));
    this.sprite.scale.x = this.dir >= 0 ? 1 : -1;
  }

  hit(): boolean {
    if (!this.alive) return false;
    this.hp -= 1;
    this.hurtFlash = 0.12;
    this.draw(true);
    if (this.hp <= 0) {
      this.alive = false;
      this.sprite.visible = false;
      return true;
    }
    return false;
  }
}

// Level exit: reachable once the boss is defeated.
export class Goal {
  body: Body;
  sprite: PIXI.Graphics = new PIXI.Graphics();
  reached = false;

  constructor(tx: number, ty: number) {
    this.body = { x: tx * 16, y: ty * 16, w: 16, h: 32, vx: 0, vy: 0 };
    const g = this.sprite;
    g.beginFill(0x1e3a2a, 0.7);
    g.drawRect(0, 0, 16, 32);
    g.endFill();
    g.lineStyle(1, 0x66ffcc, 0.9);
    g.drawRect(0, 0, 16, 32);
    this.sprite.position.set(this.body.x, this.body.y);
  }

  win() {
    this.reached = true;
    this.sprite.tint = 0x66ffcc;
  }
}
