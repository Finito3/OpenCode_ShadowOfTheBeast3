# Maptapper guide: rip Level 1 tiles/map from Beast 3 (owner PC)

Maptapper (Codetapper, Windows) rips graphics and maps from a RUNNING game
via WinUAE save-states. This bypasses all file-format puzzles: the emulator
has already loaded, decrunched and placed everything in Amiga memory in
standard formats.

## 1. Install

- Maptapper v0.8.4: https://codetapper.com/amiga/maptapper
  (MaptapperSetup.exe or .zip, tested on Win 7/10).
- Open the built-in examples first to learn the UI.

## 2. Save state in Level 1

1. Start Beast 3 in WinUAE, play (or warp) into Level 1 forest.
2. Ideally stand somewhere with platforms + ladders visible.
3. Press F12 -> Miscellaneous tab -> Save State. Save as e.g. `beast3_l1.uss`.
4. Optional but recommended for clean matching: disable hardware sprites
   first: Shift-F12 (debugger), type `Ms 0`, Enter, then `x`, Enter.
   This removes sprite layers from the picture.

## 3. Tiles (Tile Ripper tab)

1. Load the save-state into Maptapper (File -> Open; compressed and
   decompressed states both supported, Tools can decompress).
2. What to expect for Beast 3 (from our RE + Codetapper sprite-tricks):
   - Dual playfield, 3 + 3 bitplanes per layer.
   - Tiles most commonly 16x16, ILBM interleaved mode first.
   - Background layer: platforms, ladders, floor. Foreground layer:
     discs/decor. Sprites: hero, shuriken, clouds, mountains.
3. Try gfx mode Amiga ILBM, 16x16, 3 planes. Scroll through memory until
   forest tiles appear. Our static RE found dense tile candidates around
   the decrunched $8000 blob +0x15680 area (mem ~$1D680) - the same data
   will sit somewhere in chip RAM in the save-state.
4. Export the tileset when it looks right.

## 4. Map (Search + Map Ripper tabs)

1. Take a screenshot of the exact Level 1 position (WinUAE screenshot).
2. Search tab: load the screenshot, let Maptapper match screen pixels to
   the tiles found in step 3.
3. Map Ripper tab: try common Amiga map formats until the Level 1 layout
   assembles (platforms left-to-right, ladders, crane area, guns, spikes,
   boulder hill, boss arena - see walkthrough in original/Solution).
4. Export map + tileset (PNG + map data) for the remake build.

## 5. Sprites

Gfx mode Amiga Sprites, 16 px wide. Hero/shuriken are sprites; background
mountains/clouds too. Sprite palettes are banks 16-31 - try all 4 banks
(keys 1-8) until colors look right. Our static renders already proved
16px 2-plane + 8-byte header works for small decor sprites (fa2/f22/f30).

## 6. What to send back to the build

For personal use only (no redistribution):
- Tileset PNG(s) + tile size/plane order used.
- Map export (dimensions, tile indices) for Level 1.
- Palette(s) per area (copper changes colors per scanline - note which
  palette belongs to forest/platforms/HUD).
- Sprite sheets for hero/weapons/enemies as found.

## 7. References

- Maptapper docs: https://codetapper.com/amiga/maptapper/documentation/
- Tutorials (Creatures, Ruff'n'Tumble, Toki map ripping).
- Our static findings: docs/05-extraction-summary.md, docs/06 (palette at
  to_8000+0x398, L1 forest colors; f20 placement stream; 39 Disk.2 files).
