// Asset loading: placeholders committed; real data (personal use) lives in
// ../../extracted/ and is COPIED here locally, never committed.
//   extracted/l1_palette.json -> engine/assets/l1_palette.json (local only)
//   extracted/tiles/l1_tileset.png -> engine/assets/l1_tileset.png (local only)
export interface Palette { rgb: [number, number, number][] }
export const PLACEHOLDER_PALETTE: Palette = {
  rgb: Array.from({ length: 32 }, (_, i) => [i * 8, i * 6, i * 4] as [number, number, number]),
};
export async function loadPalette(url: string): Promise<Palette> {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('missing');
    return (await r.json()) as Palette;
  } catch {
    return PLACEHOLDER_PALETTE;
  }
}
