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

  // Debug/placeholder render: white = solid. Replaced by tileset when present.
  buildDebugLayer(): PIXI.Container {
    const c = new PIXI.Container();
    const g = new PIXI.Graphics();
    g.beginFill(0x8a8a8a);
    const t = this.tile;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.isSolid(x, y)) g.drawRect(x * t, y * t, t, t);
      }
    }
    g.endFill();
    c.addChild(g);
    return c;
  }
}
