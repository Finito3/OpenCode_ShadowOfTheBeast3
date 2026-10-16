import * as PIXI from 'pixi.js';
import { Game } from './engine/game';
import { Parallax } from './engine/parallax';
import { Hero } from './engine/hero';
import { Tilemap } from './engine/tilemap';
import { loadPalette } from './data/assets';
import { level1Ladders2D, level1Spawns2D, LEVEL1_W, LEVEL1_H } from './levels/level1_full';

const VW = 320;
const VH = 192;

const app = new PIXI.Application({ width: VW, height: VH, backgroundColor: 0x000000 });
document.getElementById('app')!.appendChild(app.view as HTMLCanvasElement);

const world = new PIXI.Container();
app.stage.addChild(world);

const parallax = new Parallax(world);
parallax.buildPlaceholder(app);

const map = new Tilemap();
const hero = new Hero();
// hero start from spawns (tile 6,55 -> px)
hero.body.x = 6 * 16;
hero.body.y = 55 * 16;
world.addChild(hero.sprite);

// HUD (layout from reference screenshot: bars left, counter middle, icon right)
const hud = new PIXI.Container();
{
  const g = new PIXI.Graphics();
  g.beginFill(0x00c8ff);
  g.drawRect(8, VH - 16, 6, 12);
  g.drawRect(16, VH - 16, 6, 12);
  g.endFill();
  g.beginFill(0x222222);
  for (let i = 0; i < 2; i++) g.drawRect(148 + i * 10, VH - 18, 8, 14);
  g.endFill();
  g.beginFill(0xdddddd);
  g.drawRect(VW - 20, VH - 18, 12, 12);
  g.endFill();
  hud.addChild(g);
}
app.stage.addChild(hud);

const keys = new Set<string>();
window.addEventListener('keydown', (e) => keys.add(e.code));
window.addEventListener('keyup', (e) => keys.delete(e.code));

let mapLayer: PIXI.Container | null = null;
let camX = 0;
let camY = 0;

async function boot() {
  await map.load('assets/level1_grid.json');
  await loadPalette('assets/l1_palette.json');
  if (map.loaded) {
    mapLayer = map.buildDebugLayer();
    world.addChildAt(mapLayer, 1);
  }
  const game = new Game(
    (dt) => {
      const input = {
        left: keys.has('ArrowLeft') || keys.has('KeyA'),
        right: keys.has('ArrowRight') || keys.has('KeyD'),
        jump: keys.has('ArrowUp') || keys.has('KeyW') || keys.has('Space'),
        up: keys.has('ArrowUp') || keys.has('KeyW'),
        down: keys.has('ArrowDown') || keys.has('KeyS'),
      };
      hero.update(dt, input, map.loaded ? map : null, level1Ladders2D);
      const maxX = LEVEL1_W * 16 - VW;
      const maxY = LEVEL1_H * 16 - VH;
      camX = Math.max(0, Math.min(maxX, hero.body.x + hero.body.w / 2 - VW / 2));
      camY = Math.max(0, Math.min(maxY, hero.body.y + hero.body.h / 2 - VH / 2));
      world.x = -Math.round(camX);
      world.y = -Math.round(camY);
      void level1Spawns2D;
    },
    () => {
      app.render();
    },
  );
  game.start();
}
void boot();
