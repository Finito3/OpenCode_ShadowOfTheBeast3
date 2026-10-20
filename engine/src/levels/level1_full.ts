// Level 1 (forest) - 2D map rebuilt for playability.
// Collision is authored in level1_collision.ts (the background-art mask that
// used to drive collision marked parallax trees as solid, so it is unused).
// This file holds semantic overlays: zones, ladders, hazards, entity spawns.
// Committed; local assets (grid json, tileset, palette) are personal use only.
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

// Upper route + lower route, linked by ladders in the fuller design; here a
// continuous ground floor with a couple of hop platforms.
export const level1Zones2D: Zone[] = [
  { name: 'forest-floor', x0: 0, x1: 130, y0: 45, y1: 63, notes: 'Dense trees, start going right, ground rows 57-63' },
  { name: 'mid-complex', x0: 130, x1: 250, y0: 15, y1: 62, notes: 'Stone rooms/corridors, keys and doors' },
  { name: 'crane-tower', x0: 240, x1: 260, y0: 22, y1: 40, notes: 'Crane wheels+chains (decorative)' },
  { name: 'rock-wall', x0: 280, x1: 312, y0: 15, y1: 57, notes: 'Rock ledge before the arena' },
  { name: 'boss-arena', x0: 250, x1: 300, y0: 42, y1: 58, notes: 'Leader fight, exit right' },
];

// No ladders required for the critical path (keys sit on the ground).
export const level1Ladders2D: Ladder[] = [];

export const level1Hazards: Hazard[] = [
  { tx: 140, ty: 59, w: 8, h: 1, kind: 'spikes-swing' },
];

export const level1Spawns2D: EntitySpawn[] = [
  { kind: 'hero', tx: 6, ty: 59, detail: 'forest start, faces right' },
  { kind: 'lever', tx: 95, ty: 60, detail: 'platform lever (lower)' },
  { kind: 'item', tx: 127, ty: 60, detail: 'meat (restores energy)' },
  { kind: 'key', tx: 160, ty: 60, detail: 'door key (ground)' },
  { kind: 'door', tx: 170, ty: 58, detail: 'lower door' },
  { kind: 'item', tx: 180, ty: 60, detail: 'meat -> push right' },
  { kind: 'key', tx: 195, ty: 60, detail: 'hungry-pal key' },
  { kind: 'door', tx: 205, ty: 58, detail: 'hungry pal' },
  { kind: 'crane', tx: 245, ty: 49, detail: 'wheel, moves hanging platform' },
  { kind: 'item', tx: 285, ty: 58, detail: 'boulder top' },
  { kind: 'boss', tx: 270, ty: 59, detail: 'leader; defeat to open exit' },
  { kind: 'enemy', tx: 140, ty: 59, detail: 'patrol lower' },
  { kind: 'enemy', tx: 223, ty: 59, detail: 'crane guard' },
];
