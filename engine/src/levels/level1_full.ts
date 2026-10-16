// Level 1 (forest) - hand-authored from: user screenshot, walkthrough
// (Solution), framebuffer renders (tree/crane/platforms/warriors),
// f20 topology hints. Tiles 16x16. Personal-use build; tileset+palette
// are local assets (see ../data/assets.ts), NOT committed.
export interface Zone {
  name: string;
  x0: number; x1: number; // tile X range
  groundY: number;        // ground row (tiles)
  notes: string;
}
export interface Platform { tx: number; ty: number; w: number; kind: string }
export interface Ladder { tx: number; ty0: number; ty1: number }
export interface EntitySpawn {
  kind: 'hero' | 'enemy' | 'item' | 'lever' | 'key' | 'door' | 'crane' | 'boulder' | 'boss';
  tx: number; ty: number; detail?: string;
}

// Map: 240 tiles wide (3840 px), 12 rows visible (192 px). Row 11 = ground.
export const LEVEL1_WIDTH_TILES = 240;
export const LEVEL1_GROUND_ROW = 10;

export const level1Zones: Zone[] = [
  { name: 'start-tree', x0: 0, x1: 24, groundY: 10, notes: 'Big tree (fb_L1_realpal), start going right' },
  { name: 'lever-platforms', x0: 25, x1: 49, groundY: 10, notes: 'Lever raises platform; gold above' },
  { name: 'crane', x0: 50, x1: 74, groundY: 10, notes: 'Crane wheel + chains + 2 platforms (fb_4); grenade pickup' },
  { name: 'guns', x0: 75, x1: 99, groundY: 10, notes: '4 platform guns to destroy; key on 4th' },
  { name: 'ladders-dragon', x0: 100, x1: 129, groundY: 10, notes: 'User screenshot: 2 ladders, dragon head left, door (key), meat' },
  { name: 'spikes', x0: 130, x1: 154, groundY: 10, notes: 'Swinging spikes; hungry pal door; rocket platform' },
  { name: 'boulder-hill', x0: 155, x1: 184, groundY: 10, notes: 'Hill + boulder push; floating platforms (fb_6 style)' },
  { name: 'boss', x0: 185, x1: 239, groundY: 10, notes: 'Leader fight (fb_3a warriors area); exit right' },
];

export const level1Platforms: Platform[] = [
  { tx: 28, ty: 7, w: 4, kind: 'wood' },
  { tx: 34, ty: 5, w: 4, kind: 'wood' },
  { tx: 52, ty: 6, w: 5, kind: 'crane-left' },
  { tx: 64, ty: 6, w: 5, kind: 'crane-right' },
  { tx: 76, ty: 7, w: 3, kind: 'stone' },
  { tx: 81, ty: 6, w: 3, kind: 'stone' },
  { tx: 86, ty: 5, w: 3, kind: 'stone' },
  { tx: 91, ty: 4, w: 3, kind: 'stone' },
  { tx: 158, ty: 7, w: 6, kind: 'float' },
  { tx: 170, ty: 5, w: 5, kind: 'float' },
];

export const level1Ladders: Ladder[] = [
  { tx: 110, ty0: 5, ty1: 10 },
  { tx: 120, ty0: 5, ty1: 10 },
];

export const level1Spawns: EntitySpawn[] = [
  { kind: 'hero', tx: 4, ty: 9, detail: 'start, faces right' },
  { kind: 'lever', tx: 27, ty: 9, detail: 'raises platform' },
  { kind: 'item', tx: 36, ty: 4, detail: 'grenade' },
  { kind: 'enemy', tx: 78, ty: 6, detail: 'platform gun 1' },
  { kind: 'enemy', tx: 83, ty: 5, detail: 'platform gun 2' },
  { kind: 'enemy', tx: 88, ty: 4, detail: 'platform gun 3' },
  { kind: 'enemy', tx: 93, ty: 3, detail: 'platform gun 4' },
  { kind: 'item', tx: 93, ty: 3, detail: 'key (door 1)' },
  { kind: 'door', tx: 104, ty: 8, detail: 'needs key 1' },
  { kind: 'item', tx: 118, ty: 9, detail: 'meat -> push right' },
  { kind: 'item', tx: 124, ty: 8, detail: 'key 2 (hungry pal door)' },
  { kind: 'door', tx: 132, ty: 8, detail: 'hungry pal' },
  { kind: 'crane', tx: 58, ty: 5, detail: 'wheel, moves platform' },
  { kind: 'item', tx: 160, ty: 6, detail: 'boulder top of hill' },
  { kind: 'boss', tx: 200, ty: 9, detail: 'leader; spikes cleared first' },
];
