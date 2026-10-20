// Level 1 (forest) walkable geometry, authored by hand (own data, committed).
// The background-art mask that used to drive collision is unusable (it marks
// the parallax trees as solid), so collision is defined here as solid rects.
// Coordinates are tiles; y grows downward. Main floor top is row 61.
export interface SolidRect { x: number; y: number; w: number; h: number }

export const LEVEL1_SOLIDS: SolidRect[] = [
  { x: 0, y: 61, w: 332, h: 3 },   // main ground (walkable top row 60)
  { x: 60, y: 59, w: 12, h: 1 },   // forest hop (2 tiles up, jumpable)
  { x: 285, y: 59, w: 20, h: 1 },  // rock ledge before the arena (hop)
];

// No ladders required for the critical path (keys sit on the ground).
export const LEVEL1_LADDERS: { tx: number; ty0: number; ty1: number }[] = [];
