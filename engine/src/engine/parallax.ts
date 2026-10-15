import * as PIXI from 'pixi.js';

// Two parallax layers imitating the dual-playfield feel:
// far layer scrolls slowly, near layer scrolls 1:1. Own placeholder art.
export class Parallax {
  far: PIXI.Container = new PIXI.Container();
  near: PIXI.Container = new PIXI.Container();
  private farFactor = 0.35;

  constructor(private stage: PIXI.Container) {
    stage.addChild(this.far, this.near);
  }

  // Placeholder bands so motion is visible without assets.
  buildPlaceholder(app: PIXI.Application) {
    const mk = (color: number, y: number, h: number, w: number) => {
      const g = new PIXI.Graphics();
      g.beginFill(color);
      g.drawRect(0, y, w, h);
      g.endFill();
      return g;
    };
    // far: mountains silhouette band
    const far = mk(0x1c2a44, 90, 60, 960);
    this.far.addChild(far);
    // near: floor band
    const near = mk(0x3a2b1a, 150, 42, 960);
    this.near.addChild(near);
  }

  scroll(camX: number) {
    this.far.x = -camX * this.farFactor;
    this.near.x = -camX;
  }
}
