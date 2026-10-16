import * as PIXI from 'pixi.js';
import { Game } from './engine/game';
import { Parallax } from './engine/parallax';
import { Hero } from './engine/hero';
import { Tilemap } from './engine/tilemap';
import { TileRenderer } from './engine/tiles';
import { Enemy, Shuriken } from './engine/enemy';
import { loadPalette } from './data/assets';
import { level1Ladders2D, level1Spawns2D, LEVEL1_W, LEVEL1_H } from './levels/level1_full';

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
}
app.stage.addChild(hud);

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
  await map.load('assets/level1_grid.json');
  await loadPalette('assets/l1_palette.json');
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
    mapObj ? mapObj.isSolid(Math.floor(px / 16), Math.floor(py / 16)) : false;
  const game = new Game(
    (dt) => {
      const input = {
        left: keys.has('ArrowLeft') || keys.has('KeyA'),
        right: keys.has('ArrowRight') || keys.has('KeyD'),
        jump: keys.has('ArrowUp') || keys.has('KeyW') || keys.has('Space'),
        up: keys.has('ArrowUp') || keys.has('KeyW'),
        down: keys.has('ArrowDown') || keys.has('KeyS'),
      };
      if (input.left) facing = -1;
      if (input.right) facing = 1;
      hero.update(dt, input, mapObj, level1Ladders2D);
      // fire shuriken (Z), one at a time
      if ((pressed.has('KeyZ')) && !shuriken.alive) {
        shuriken.fire(hero.body.x + hero.body.w / 2, hero.body.y + 4, facing);
      }
      pressed.clear();
      shuriken.update(dt, solidAt);
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
      if (hero.energy <= 0 && hero.lives > 0) {
        hero.lives -= 1;
        hero.energy = 100;
        hero.body.x = (start?.tx ?? 6) * 16;
        hero.body.y = (start?.ty ?? 55) * 16;
      }
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
