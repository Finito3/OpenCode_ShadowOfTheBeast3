// Level 1 (forest) - 2D map rebuilt from HOL collision grid + walkthrough.
// Collision grid (332x64, RLE rows) lives in local assets/level1_grid.json
// (personal use, NOT committed). This file holds own semantic overlays:
// zones, ladders (climb rects), hazards, entity spawns. Committed.
export interface Zone {
  name: string;
  x0: number; x1: number; y0: number; y1: number; // tile ranges
  notes: string;
}
export interface Ladder { tx: number; ty0: number; ty1: number }
export interface Hazard { tx: number; ty: number; w: number; h: number; kind: string }
export interface EntitySpawn {
  kind: 'hero' | 'enemy' | 'item' | 'lever' | 'key' | 'door' | 'crane' | 'boulder' | 'boss';
  tx: number; ty: number; detail?: string;
}

export const LEVEL1_W = 332;
export const LEVEL1_H = 64;
export const TILE = 16;

// Upper route (rows ~15-31) + lower route (~37-59), linked by ladders.
// X bands (tiles) from collision columns + walkthrough order:
export const level1Zones2D: Zone[] = [
  { name: 'forest-floor', x0: 0, x1: 90, y0: 45, y1: 63, notes: 'Dense trees, start going right, ground rows 57-63' },
  { name: 'mid-complex-lower', x0: 90, x1: 210, y0: 38, y1: 62, notes: 'Stone rooms/corridors, meat, spikes, hungry pal' },
  { name: 'mid-complex-upper', x0: 90, x1: 210, y0: 15, y1: 32, notes: 'Elevated platforms, bridge ~x200, levers/gold' },
  { name: 'crane-tower', x0: 220, x1: 245, y0: 22, y1: 40, notes: 'Crane wheels+chains, hanging platforms (tall col x227-234)' },
  { name: 'rock-wall', x0: 280, x1: 312, y0: 15, y1: 57, notes: 'Tall rock mass, boulder hill route' },
  { name: 'boss-arena', x0: 250, x1: 300, y0: 42, y1: 58, notes: 'Leader fight, exit right' },
];

// Ladders link upper<->lower (columns with tall solid flanks in grid).
export const level1Ladders2D: Ladder[] = [
  { tx: 163, ty0: 30, ty1: 45 },
  { tx: 203, ty0: 28, ty1: 44 },
  { tx: 110, ty0: 30, ty1: 46 },
  { tx: 120, ty0: 30, ty1: 46 },
];

export const level1Hazards: Hazard[] = [
  { tx: 140, ty: 48, w: 12, h: 2, kind: 'spikes-swing' },
  { tx: 190, ty: 50, w: 8, h: 2, kind: 'spikes-floor' },
];

export const level1Spawns2D: EntitySpawn[] = [
  { kind: 'hero', tx: 6, ty: 55, detail: 'forest start, faces right' },
  { kind: 'lever', tx: 95, ty: 47, detail: 'platform lever (lower)' },
  { kind: 'item', tx: 127, ty: 29, detail: 'grenade (upper)' },
  { kind: 'key', tx: 152, ty: 23, detail: 'door key (upper guns)' },
  { kind: 'door', tx: 170, ty: 45, detail: 'lower door' },
  { kind: 'item', tx: 180, ty: 47, detail: 'meat -> push right' },
  { kind: 'key', tx: 195, ty: 46, detail: 'hungry-pal key' },
  { kind: 'door', tx: 205, ty: 45, detail: 'hungry pal' },
  { kind: 'crane', tx: 224, ty: 28, detail: 'wheel, moves hanging platform' },
  { kind: 'item', tx: 285, ty: 34, detail: 'boulder top' },
  { kind: 'boss', tx: 270, ty: 54, detail: 'leader; spikes cleared first' },
  { kind: 'enemy', tx: 140, ty: 46, detail: 'patrol lower' },
  { kind: 'enemy', tx: 223, ty: 28, detail: 'crane guard' },
];
