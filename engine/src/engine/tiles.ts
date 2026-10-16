import * as PIXI from 'pixi.js';
import { Tilemap } from './tilemap';

// Static chunked tile renderer. Loads local tileset (16x16 tiles, 16 cols)
// and bakes map chunks into RenderTextures. Falls back to null when the
// tileset is missing (caller keeps debug layer).
// Edge-aware tiles (measured from extracted tileset):
// 239 = top edge (black above), 263 = right edge, 242 = top-right corner,
// 260 = uniform fill. (Left/bottom edges reuse fill for now.)
const TOP_EDGE = 239;
const RIGHT_EDGE = 263;
const TOP_RIGHT = 242;
const FILL = 260;

function hash2(x: number, y: number): number {
  let h = (x * 73856093) ^ (y * 19349663);
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
  return (h ^ (h >>> 15)) >>> 0;
}

export class TileRenderer {
  frames: PIXI.Texture[] = [];
  tw = 16;
  cols = 16;

  async load(url: string): Promise<boolean> {
    try {
      const tex = await PIXI.Assets.load<PIXI.Texture>(url);
      const perRow = Math.floor(tex.width / this.tw);
      const rows = Math.floor(tex.height / this.tw);
      for (let i = 0; i < perRow * rows; i++) {
        const fx = (i % perRow) * this.tw;
        const fy = Math.floor(i / perRow) * this.tw;
        this.frames.push(new PIXI.Texture(tex.baseTexture, new PIXI.Rectangle(fx, fy, this.tw, this.tw)));
      }
      return this.frames.length > 0;
    } catch {
      return false;
    }
  }

  pick(tx: number, ty: number, map: Tilemap): number {
    const top = !map.isSolid(tx, ty - 1);
    const right = !map.isSolid(tx + 1, ty);
    let idx = FILL;
    if (top && right) idx = TOP_RIGHT;
    else if (top) idx = TOP_EDGE;
    else if (right) idx = RIGHT_EDGE;
    return idx % Math.max(1, this.frames.length);
  }

  // Bake map into chunk sprites (each <= 2048px wide). Returns container.
  bake(app: PIXI.Application, map: Tilemap, chunkTilesW = 83): PIXI.Container | null {
    if (!map.loaded || this.frames.length === 0) return null;
    const c = new PIXI.Container();
    const t = map.tile;
    for (let cx = 0; cx < map.w; cx += chunkTilesW) {
      const cw = Math.min(chunkTilesW, map.w - cx);
      const rt = PIXI.RenderTexture.create({ width: cw * t, height: map.h * t });
      const g = new PIXI.Container();
      for (let y = 0; y < map.h; y++) {
        for (let x = cx; x < cx + cw; x++) {
          if (!map.isSolid(x, y)) continue;
          const s = new PIXI.Sprite(this.frames[this.pick(x, y, map)]);
          s.position.set((x - cx) * t, y * t);
          g.addChild(s);
        }
      }
      app.renderer.render(g, { renderTexture: rt });
      g.destroy({ children: true });
      const spr = new PIXI.Sprite(rt);
      spr.position.set(cx * t, 0);
      c.addChild(spr);
    }
    return c;
  }

  // Wooden ladders drawn over the map (positions in tiles).
  buildLadders(ladders: { tx: number; ty0: number; ty1: number }[]): PIXI.Container {
    const c = new PIXI.Container();
    const g = new PIXI.Graphics();
    for (const l of ladders) {
      const x = l.tx * 16;
      const y0 = l.ty0 * 16;
      const y1 = (l.ty1 + 1) * 16;
      g.beginFill(0x6b4a26);
      g.drawRect(x + 1, y0, 3, y1 - y0);
      g.drawRect(x + 12, y0, 3, y1 - y0);
      g.endFill();
      g.beginFill(0x8a6a3a);
      for (let y = y0 + 4; y < y1; y += 8) g.drawRect(x + 1, y, 14, 2);
      g.endFill();
    }
    c.addChild(g);
    return c;
  }
}
