import * as PIXI from 'pixi.js';

// 2D tilemap over the collision grid (local assets/level1_grid.json, RLE rows).
// Falls back to empty map when assets are missing (committed repo has none).
export interface GridData { w: number; h: number; tile: number; rows: number[][][] }

export class Tilemap {
  w = 0; h = 0; tile = 16;
  solid: boolean[][] = [];
  loaded = false;

  async load(url: string): Promise<void> {
    try {
      const r = await fetch(url);
      if (!r.ok) return;
      const g = (await r.json()) as GridData;
      this.w = g.w; this.h = g.h; this.tile = g.tile || 16;
      this.solid = g.rows.map((row) => {
        const out: boolean[] = new Array(g.w).fill(false);
        for (const [x0, len, v] of row) {
          for (let x = x0; x < Math.min(x0 + len, g.w); x++) out[x] = v === 1;
        }
        return out;
      });
      this.loaded = true;
    } catch { /* fallback: empty */ }
  }

  isSolid(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return tx < 0 || tx >= this.w;
    return this.solid[ty]?.[tx] ?? false;
  }

  // Build a collision grid from authored solid rects (tiles).
  fromRects(w: number, h: number, rects: { x: number; y: number; w: number; h: number }[]): void {
    this.w = w;
    this.h = h;
    this.solid = Array.from({ length: h }, () => new Array<boolean>(w).fill(false));
    for (const r of rects) {
      for (let y = r.y; y < Math.min(r.y + r.h, h); y++) {
        for (let x = r.x; x < Math.min(r.x + r.w, w); x++) {
          if (x >= 0 && y >= 0) this.solid[y][x] = true;
        }
      }
    }
    this.loaded = true;
  }

  // Debug/placeholder render: moss top where exposed, rock fill else.
  // Replaced by real tileset when local assets are present.
  buildDebugLayer(): PIXI.Container {
    const c = new PIXI.Container();
    const t = this.tile;
    const top = new PIXI.Graphics();
    const fill = new PIXI.Graphics();
    top.beginFill(0x4a6b2a);
    fill.beginFill(0x5a4a3a);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (!this.isSolid(x, y)) continue;
        const g = !this.isSolid(x, y - 1) ? top : fill;
        g.drawRect(x * t, y * t, t, t);
      }
    }
    top.endFill();
    fill.endFill();
    // cull far outside: keep simple, Pixi culls off-screen anyway
    c.addChild(fill, top);
    return c;
  }
}
