# Memory reconstruction + decrunch results

All work local-only (personal RE use). Extracted binaries stay in
`extracted/` (gitignored); repo holds docs + own tooling.

## 1. Reconstruction recipe (tools/reconstruct_mem.py)

WHDLoad-equivalent linear loads from Disk.N images into a 1 MB image:

| # | source | dest | size | note |
|---|--------|------|------|------|
| 1 | Disk1[$A6800] | mem[$7C000] | $3000 | 2nd-stage loader (track 31 side 1) |
| 2 | Disk1[$8E338] (= game $4AB38 + $43800) | mem[$59F80] | $16F80 | then decrunch -> $5A000 |
| 3 | Disk1[$1800] + Disk1[$78000] | mem[$7F80] | $33000 + $1634C | then decrunch -> $8000 |
| 4 | mem[$7DE28] (embedded in loader) | decrunch -> mem[$40000] | - | 10 KB output |
| 5 | Disk2[0] | mem[$68000] | 512 | LoadDOS D1=0 D2=1 |
| 6 | Disk2[1024] | mem[$6FF90] | 4608 | LoadDOS D1=2 D2=9 |

The $43800 adjustment comes from the slave Load2: game offsets other than
$1800 are physicalized as `offset + $43800` on Disk.1.

## 2. Decrunch results (all checksums OK)

| output | size | content |
|--------|------|---------|
| mem[$5A000] | 136128 | tables (countdown patterns), then zeros; data tables |
| mem[$8000] | 375772 | main blob, 52x RTS markers; Ghidra base $8000: 17 functions ($81D2-$91F4), rest is data/gfx |
| mem[$40000] | 10244 | sparse (entropy 0.45), mostly zeros with small header |

LoadDOS magic verified: mem[$68004] = 0xB2FCA1FE matches the loader check.

## 3. Why direct decrunch of disk bytes fails

Proven by experiment: Disk.1[$4AB38] header is nonsense, Disk.1[$8E338]
decrunches fine. Pipeline order is disk -> Load2 sector processing ->
memory image -> ByteKiller -> data. `tools/bytekiller.py` is validated and
waits for memory-image input.

## 4. Engine scaffold (engine/, own code only)

TS + PixiJS, 50 Hz fixed step, dual-layer parallax placeholders, hero body
with jump/gravity, re-authored Level 1 structure from walkthrough prose
(platforms, crane, guns, spikes, hill, boss run). No original bytes.
Run: `cd engine && npm install && npm run dev`.

## 5. Level 1 findings (visual RE)

- Palette at to_8000+0x398 (32 colors): yellows 0FCC/0CA9/0A87/0975,
  test colors 000F/00F0/00FF/0F00/0F0F/0FF0/0FFF, forest greens/browns
  0120/0111/0960/0C00/0A52/0941/0730/0620, dark ramp, grays. Matches a
  forest level. Grayscale ramp at to_5A000+0 (fade table).
- Direct bitmap renders of data regions yield noise: graphics are stored
  as TILES + tilemap/placement streams, not linear bitmaps.
- Disk.2 file f20 (3000 B) shows sequential tile-placement records
  (incrementing IDs 153-155, 161-163, ... with separators 152/255/0).
- Small files fa2 (88 B), f22 (68 B), f30 (156 B) are sprite-sized with
  copper-ish headers; f28 (300 B) similar.
- Tool: tools/render_bp.py (bitplane -> PNG). Renders stay in
  extracted/renders/ (gitignored, personal use only).

## 6. Sprite rendering (visual RE proof)

Small files are Amiga sprites: 8-byte header + 16px-wide 2-plane bitmap
(4 bytes/row). Rendered with L1 palette (sprite colors 16+):
- fa2 (88B): striped red/brown pattern (platform edge / bar)
- f22 (68B): similar striped sprite
- f30 (156B): ornate door/panel shapes (pink/beige on black)
- f28 (300B): ornate vertical column (red/gold decor)
Tool: inline sprite() in analysis scripts; renders in extracted/renders/
(personal use only). Tile graphics (fa1 etc.) are likely compressed or
use different plane counts - next RE step.

## 7. Code vs data classification (Disk.2 files)

Raw code files (start with 68k `41 fa` LEA, contain RTS): `main` (3,4KB,
8 Ghidra funcs), `beast3p3.obj` (464B), `fa5` (76KB), `f24` (89KB),
`fc1` (190KB - biggest, likely main engine), plus fa4/f25/f27/f32
(RTS markers). These are loaded via LoadPsyFile and executed.
Sprite files (rendered OK as 16px 2-plane + 8B header): fa2, f22, f30,
f28 - ornamental decor, doors, columns.
Level stream: f20 (3000B sequential tile placements).
High-entropy unknowns (ByteKiller scan negative, no HUNK magic):
fa1, f01, f02, f29, f21, f23, ff0, fz0-3, beast3p1/2.obj - either
different compression/encryption or dense mixed code+data.
