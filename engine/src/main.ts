import * as PIXI from 'pixi.js';
import { Game } from './engine/game';
import { Parallax } from './engine/parallax';
import { Hero } from './engine/hero';
import { Tilemap } from './engine/tilemap';
import { TileRenderer } from './engine/tiles';
import { Enemy, Shuriken } from './engine/enemy';
import { Pickup, Door, Lever, Boss, Goal } from './engine/interactables';
import { loadPalette } from './data/assets';
import { Music } from './engine/audio';
import { level1Ladders2D, level1Spawns2D, LEVEL1_W, LEVEL1_H } from './levels/level1_full';
import { LEVEL1_SOLIDS } from './levels/level1_collision';

const VW = 320;
const VH = 192;

const app = new PIXI.Application({ width: VW, height: VH, backgroundColor: 0x0a0e1a });
document.getElementById('app')!.appendChild(app.view as HTMLCanvasElement);

const world = new PIXI.Container();
app.stage.addChild(world);

const parallax = new Parallax(world);
parallax.buildPlaceholder(app);

const map = new Tilemap();
const tiles = new TileRenderer();
const hero = new Hero();
const start = level1Spawns2D.find((s) => s.kind === 'hero');
hero.body.x = (start?.tx ?? 6) * 16;
hero.body.y = (start?.ty ?? 55) * 16;
world.addChild(hero.sprite);

const enemies: Enemy[] = level1Spawns2D
  .filter((s) => s.kind === 'enemy')
  .slice(0, 6)
  .map((s) => {
    const e = new Enemy(s.tx, s.ty);
    world.addChild(e.sprite);
    return e;
  });
const shuriken = new Shuriken();
world.addChild(shuriken.sprite);
shuriken.sprite.visible = false;
let facing = 1;

// Interactables from the level overlay: pickups, doors, lever, boss, exit.
const pickups = level1Spawns2D
  .filter((s) => s.kind === 'item' || s.kind === 'key')
  .map((s) => new Pickup(s.tx, s.ty, s.kind === 'key' ? 'key' : 'item'));
const doors = level1Spawns2D
  .filter((s) => s.kind === 'door')
  .map((s) => new Door(s.tx, s.ty, 1, 3));
const levers = level1Spawns2D.filter((s) => s.kind === 'lever').map((s) => new Lever(s.tx, s.ty));
const bossSpawn = level1Spawns2D.find((s) => s.kind === 'boss');
const boss = bossSpawn ? new Boss(bossSpawn.tx, bossSpawn.ty) : null;
const goal = new Goal(306, 59);
for (const o of pickups) world.addChild(o.sprite);
for (const o of doors) world.addChild(o.sprite);
for (const o of levers) world.addChild(o.sprite);
if (boss) world.addChild(boss.sprite);
world.addChild(goal.sprite);

let keysHeld = 0;
let won = false;
const winText = new PIXI.Text('LEVEL CLEAR', { fontFamily: 'monospace', fontSize: 20, fill: 0x66ffcc });
winText.position.set(VW / 2, VH / 2 - 12);
winText.anchor.set(0.5, 0.5);
winText.visible = false;
app.stage.addChild(winText);

const doorSolid = (tx: number, ty: number) => doors.some((d) => d.blocks(tx, ty));

// HUD: energy bars (shrink with energy), counter, shuriken icon
const hud = new PIXI.Container();
const hudG = new PIXI.Graphics();
hud.addChild(hudG);
function drawHud() {
  hudG.clear();
  const w = Math.max(0, Math.round((hero.energy / 100) * 12));
  hudG.beginFill(0x00c8ff);
  hudG.drawRect(8, VH - 16, 6, w);
  hudG.drawRect(16, VH - 16, 6, Math.max(0, w - 2));
  hudG.endFill();
  hudG.beginFill(0x222222);
  for (let i = 0; i < 2; i++) hudG.drawRect(148 + i * 10, VH - 18, 8, 14);
  hudG.endFill();
  hudG.beginFill(shuriken.alive ? 0x555555 : 0xdddddd);
  hudG.drawRect(VW - 20, VH - 18, 12, 12);
  hudG.endFill();
  // keys held
  hudG.beginFill(0xf2c14e);
  for (let i = 0; i < keysHeld; i++) hudG.drawRect(30 + i * 8, VH - 16, 4, 8);
  hudG.endFill();
  // boss health bar (top center) while the leader is alive
  if (boss && boss.active && boss.alive) {
    hudG.beginFill(0x330000);
    hudG.drawRect(VW / 2 - 50, 6, 100, 6);
    hudG.endFill();
    hudG.beginFill(0xd23b3b);
    hudG.drawRect(VW / 2 - 50, 6, (100 * boss.hp) / boss.maxHp, 6);
    hudG.endFill();
  }
}
app.stage.addChild(hud);
const music = new Music();
music.load('forest', 'assets/forest.mp3');
music.load('boss', 'assets/boss.mp3');

const keys = new Set<string>();
const pressed = new Set<string>();
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  pressed.add(e.code);
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

let camX = 0;
let camY = 0;

function overlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

async function boot() {
  map.fromRects(LEVEL1_W, LEVEL1_H, LEVEL1_SOLIDS);
  void loadPalette('assets/l1_palette.json');
  const mapObj = map.loaded ? map : null;
  if (map.loaded) {
    if (await tiles.load('assets/l1_tileset.png')) {
      const layer = tiles.bake(app, map);
      if (layer) {
        world.addChildAt(layer, 1);
        world.addChild(tiles.buildLadders(level1Ladders2D));
      } else {
        world.addChildAt(map.buildDebugLayer(), 1);
      }
    } else {
      world.addChildAt(map.buildDebugLayer(), 1);
      world.addChild(tiles.buildLadders(level1Ladders2D));
    }
  }
  const solidAt = (px: number, py: number) =>
    doorSolid(Math.floor(px / 16), Math.floor(py / 16)) ||
    (mapObj ? mapObj.isSolid(Math.floor(px / 16), Math.floor(py / 16)) : false);
  const game = new Game(
    (dt) => {
      if (won) {
        app.render();
        return;
      }
      const input = {
        left: keys.has('ArrowLeft') || keys.has('KeyA'),
        right: keys.has('ArrowRight') || keys.has('KeyD'),
        jump: keys.has('ArrowUp') || keys.has('KeyW') || keys.has('Space'),
        up: keys.has('ArrowUp') || keys.has('KeyW'),
        down: keys.has('ArrowDown') || keys.has('KeyS'),
      };
      if (input.left) facing = -1;
      if (input.right) facing = 1;
      hero.update(dt, input, mapObj, level1Ladders2D, 176, doorSolid);
      // fire shuriken (Z), one at a time; M toggles music; X uses lever
      if (pressed.has('KeyZ') && !shuriken.alive) {
        shuriken.fire(hero.body.x + hero.body.w / 2, hero.body.y + 4, facing);
      }
      if (pressed.has('KeyM')) music.toggleMute();
      if (pressed.has('KeyX')) {
        const lv = levers.find((l) => l.body.x < hero.body.x + hero.body.w && l.body.x + l.body.w > hero.body.x && Math.abs(l.body.y - hero.body.y) < 24);
        lv?.toggle();
      }
      pressed.clear();
      shuriken.update(dt, solidAt);

      // pickups
      for (const p of pickups) {
        if (p.taken) continue;
        if (overlap(hero.body, p.body)) {
          p.taken = true;
          p.sprite.visible = false;
          if (p.kind === 'key') keysHeld += 1;
          else hero.energy = Math.min(100, hero.energy + 25);
        }
      }
      // doors: open with a held key when the hero is close
      for (const d of doors) {
        if (d.open || keysHeld <= 0) continue;
        if (overlap(hero.body, { x: d.body.x - 24, y: d.body.y, w: d.body.w + 48, h: d.body.h })) {
          d.setOpen();
          keysHeld -= 1;
        }
      }

      for (const e of enemies) {
        if (!e.alive) continue;
        e.update(dt, solidAt);
        if (overlap(hero.body, e.body)) {
          // stomp kills, side touch hurts
          const stomp = hero.body.vy > 60 && hero.body.y + hero.body.h - e.body.y < 10;
          if (stomp) {
            e.alive = false;
            e.sprite.visible = false;
            hero.body.vy = -180;
          } else if (e.touchCd <= 0) {
            hero.energy = Math.max(0, hero.energy - 12);
            e.touchCd = 1.0;
          }
        }
        if (shuriken.alive && overlap(shuriken.body, e.body)) {
          e.alive = false;
          e.sprite.visible = false;
          shuriken.alive = false;
          shuriken.sprite.visible = false;
        }
      }

      // boss: wakes in the arena, drains energy on touch, dies to shuriken
      if (boss && !boss.active && hero.body.x > 185 * 16) boss.active = true;
      if (boss && boss.active && boss.alive) {
        boss.update(dt, solidAt, hero.body);
        if (overlap(hero.body, boss.body) && boss.touchCd <= 0) {
          hero.energy = Math.max(0, hero.energy - 20);
          boss.touchCd = 1.0;
        }
        if (shuriken.alive && overlap(shuriken.body, boss.body)) {
          const died = boss.hit();
          shuriken.alive = false;
          shuriken.sprite.visible = false;
          if (died) goal.win();
        }
      }

      // exit opens once the leader falls
      if (boss && !boss.alive && overlap(hero.body, goal.body)) {
        won = true;
        winText.visible = true;
      }

      if (hero.energy <= 0 && hero.lives > 0) {
        hero.lives -= 1;
        hero.energy = 100;
        hero.body.x = (start?.tx ?? 6) * 16;
        hero.body.y = (start?.ty ?? 55) * 16;
      }
      // music zone: leader/arena switches to the boss track
      music.setTrack(hero.body.x > 250 * 16 ? 'boss' : 'forest');
      drawHud();
      const maxX = LEVEL1_W * 16 - VW;
      const maxY = LEVEL1_H * 16 - VH;
      camX = Math.max(0, Math.min(maxX, hero.body.x + hero.body.w / 2 - VW / 2));
      camY = Math.max(0, Math.min(maxY, hero.body.y + hero.body.h / 2 - VH / 2));
      world.x = -Math.round(camX);
      world.y = -Math.round(camY);
    },
    () => {
      app.render();
    },
  );
  game.start();
}
void boot();

if (import.meta.env.DEV) {
  (window as unknown as { __sotb?: unknown }).__sotb = {
    hero,
    boss,
    goal,
    map,
    doors,
    get won() {
      return won;
    },
    get keys() {
      return keysHeld;
    },
  };
}
