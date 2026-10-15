import * as PIXI from 'pixi.js';
import { Game } from './engine/game';
import { Parallax } from './engine/parallax';
import { Hero } from './engine/hero';
import { level1 } from './levels/level1';

const app = new PIXI.Application({
  width: 320,
  height: 192, // Amiga-ish viewport scaled up by CSS
  backgroundColor: 0x000000,
});
document.getElementById('app')!.appendChild(app.view as HTMLCanvasElement);

const stage = new PIXI.Container();
stage.scale.set(1);
app.stage.addChild(stage);

const parallax = new Parallax(stage);
parallax.buildPlaceholder(app);

const hero = new Hero();
stage.addChild(hero.sprite);

// draw solids as placeholders
for (const s of level1.solids) {
  const g = new PIXI.Graphics();
  g.beginFill(s.kind === 'ground' ? 0x2e4a22 : 0x5a5a5a);
  g.drawRect(s.x, s.y, s.w, s.h);
  g.endFill();
  parallax.near.addChild(g);
}

const keys = new Set<string>();
window.addEventListener('keydown', (e) => keys.add(e.code));
window.addEventListener('keyup', (e) => keys.delete(e.code));

let camX = 0;
const game = new Game(
  (dt) => {
    const input = {
      left: keys.has('ArrowLeft') || keys.has('KeyA'),
      right: keys.has('ArrowRight') || keys.has('KeyD'),
      jump: keys.has('ArrowUp') || keys.has('KeyW') || keys.has('Space'),
    };
    hero.update(dt, input, level1.groundY);
    camX = Math.max(0, Math.min(level1.width - 320, hero.body.x - 140));
    parallax.scroll(camX);
    // camera: shift stage so hero stays in view (near layer already scrolls)
    stage.x = 0;
  },
  () => {
    app.render();
  },
);
game.start();
