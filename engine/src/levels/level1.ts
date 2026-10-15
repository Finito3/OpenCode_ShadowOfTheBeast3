// Re-authored Level 1 structure (from walkthrough prose, NOT copied data).
// Sequence: platforms -> crane wheel -> grenade/platforms guns -> key/door ->
// meat/spikes -> boulder/hill -> boss. Coordinates are placeholders.
export interface LevelRect { x: number; y: number; w: number; h: number; kind: string }

export const level1: { groundY: number; solids: LevelRect[]; width: number } = {
  groundY: 176,
  width: 1600,
  solids: [
    { x: 0, y: 176, w: 400, h: 16, kind: 'ground' },
    { x: 120, y: 140, w: 64, h: 8, kind: 'platform' },   // lever platform
    { x: 220, y: 110, w: 64, h: 8, kind: 'platform' },   // crane platform
    { x: 420, y: 176, w: 300, h: 16, kind: 'ground' },   // guns stretch
    { x: 760, y: 176, w: 240, h: 16, kind: 'ground' },   // spikes stretch
    { x: 1040, y: 150, w: 120, h: 10, kind: 'hill' },    // boulder hill
    { x: 1040, y: 176, w: 360, h: 16, kind: 'ground' },  // run to boss
  ],
};
