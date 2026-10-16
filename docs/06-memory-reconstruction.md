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

## 8. Emulator path (Maptapper-style memory dump)

Static tile guessing hit limits (copper changes colors per scanline; big
files use unknown packing). Per Maptapper docs, the reliable method is a
WinUAE save-state taken IN Level 1, then Tile Ripper on the memory dump
(ILBM 16x16 tiles are the most common Amiga format).
FS-UAE 3.2.35 portable runs headless-capable on Linux (verified binary
starts), but no Kickstart ROM is available in this environment, so the
dump must be produced where the game already runs (owner PC + WinUAE).
See docs/07-maptapper-guide.md.

## 9. Kickstart + WHDLoad setup (local)

- Kickstart 1.3 ROM: AmigaKickStart/ROMS/Kickstart 1.3.rom (MD5 82a21c1890cae844b3df741f2762d8d)
- WHDLoad USR package: downloaded from whdload.de, extracted to extracted/fsuae_hd/
  (WHDLoad, WHDLoad.VFS, WHDLoad.prefs, S/WHDLoad-Startup, DIC, RawDIC, Patcher, WArc)
- RTB relocation file: kick34005.A500.RTB (from skick346.lha)
- FS-UAE 3.2.35 portable runs on Linux (verified binary starts), but needs OpenGL
  (headless server has no GPU) -> use owner PC (WinUAE/FS-UAE) or GPU-equipped Linux.

## 10. Next steps (pixel-perfect map)

1. On owner PC: install WHDLoad, run Beast3 installer with original disks, play into
   Level 1, save state, load save state in Maptapper, rip ILBM tiles + map.
2. OR: use Unicorn Engine (M68K) to trace loader memory writes and reconstruct the
   memory image without GPU.
3. Parse entity/enemy/item positions from engine code + data files.
4. Extend engine scaffold with real palette, tile renderer, copper-based colors.

## 11. main.bin = MFM disk reader module (Disk.2, 3472 B, 8 Ghidra funcs)

Disassembly at base 0 shows low-level trackdisk routines (A5 = state,
A6 = $DFF000):
- FUN_826: filename matcher (12-byte compare loop, like LoadPsyFile .loop2)
- FUN_924: track/sector calc (mulu #$804, compare #$400)
- FUN_964: checksum (sum $200 words)
- FUN_97A: interrupt wait ($1E) + ack ($9C)
- FUN_9A4: CIA-B poll ($BFDD00 bit 4)
- FUN_9BE: MFM sync setup (writes $4489, fills $AAAB, disk DMA, checks
  $552AAAAA marker) - track sync + decode init
- FUN_B36: WORD-level MFM odd/even decode ($5555/$AAAB masks)
- FUN_B76: raster wait (VHPOSR $06 change detect)
So the game retains its own MFM path alongside WHDLoad linear loads.
fa5/f24/fc1 start with audio init (CLR AUDx, LEA $DFF0A0) = replay+engine
code files; fc1 (190KB) needs entry-point mapping (4B header).

## 12. RAM dump Level 1 -> pixel-perfect framebuffer (1lvl.dat)

Owner PC WinUAE RAM dump (1 MB chip RAM) while game runs in Level 1.
Tool `tools/copper_fb.py` parses the copperlist (default @0xD62):
- BPL1/2/3 pointers $071BB6/$071BDE/$071C06 (40 B apart = interleaved rows)
- 27 COLORxx MOVEs (bark browns 1-7, reds 17-19, sky blue-grays 21-31)
- Multi-band WAITs ($20/$26/$2C) = raster splits for parallax
Rendered 320x192x3 interleaved with copper palette = pixel-perfect Level 1
tree (trunk, branches, foliage) on transparent black. Renders in
extracted/renders/fb_L1_realpal.png (local, personal use only).
Second band ($07961A+) is a different buffer/layout (noise with same params).

## 13. Sprites from RAM dump (1lvl.dat)

Copperlist @0xD62 SPRxPTH/PTL: SPR0-1 off ($00000000), SPR2-5 at
$06A3CE/$06A42A/$06A486/$06A4E2, SPR6-7 at $06A316/$06A372 (each entry
92 B = 4 control + 88 bitmap = 16x22 2-plane). Rendered with L1 palette
banks 16/24: background mountain/cloud blobs (coherent shapes, not noise).
Hero sprite not yet isolated (may use attached pairs or other slots;
SPR0-1 off in this frame). Renders: extracted/renders/spr_all_b16_b24.png.

## 14. Tile format hunt (negative results narrow the search)

Tried on fa1 (25728 B) and to_8000 regions, all with L1 palette:
16x16x3/4/5 seq+int, 32x32x3/2, bit-reversed bytes, grayscale (geometry
check), autocorrelation strides 32-512 (flat), XOR/ROL/NIBBLE (no change).
All noise. Frequency analysis: fa1 top bytes 00/FF/80/01/10/08 (single-bit
values) = bitplane-like, NOT encrypted (encryption would flatten or shift
distribution, ROL/XOR preserve entropy which stayed 7.53).
Conclusion: tiles use non-standard layout (custom stride/interleave, RLE,
or code-mixed storage). f44 has only 15 RTS/93KB = mostly DATA with
repeating `00 89` pattern (634x) - candidate RLE/packed stream.
Next: Ghidra tile-blit routine in f44/fc1, or Maptapper save-state rip.

## 15. Save states (1s.uss/2s.uss) + scrolling proof

Owner PC WinUAE 6.0.3 ASF save states (states/1s.uss compressed, 2s.uss,
3s.wav audio). ASF chunks: CRAM/BRAM (512KB chip/fast, zlib w/ 8B header),
BPLX/SPR0-7/AUD/CIA (chip state). 1s.uss CRAM == 1lvl.dat at 96% (same
Level 1 moment); 2s.uss differs (other scroll position).
tools/copper_fb.py renders ANY state: 2s.uss @0xD5A gives same tree
scrolled left + second tree entering right = horizontal scrolling proven.
Stitch multiple scroll positions -> full Level 1 map (next step).
3s.wav = gameplay audio capture (MP3 gamerip exists online for reference).

## 16. Multi-state Level 1 screens (states/*.uss)

Owner saved 7 states across Level 1. copper_fb.py renders each:
- 1s/1lvl/2s: big tree, different scroll X (scrolling proven)
- 2a: black (transition/loading frame)
- 3a: three warrior figures (enemy encounter or hero frames)
- 4: crane puzzle (2 wheels + chain + hanging chains + 2 platforms)
- 5: platform gap (left/right mossy edges)
- 6: floating platforms (1 top-right, 2 bottom)
All 320x192x3 interleaved with copper palette. Renders in
extracted/renders/states/fb_*.png (personal use only).
Next: stitch by scroll into full L1 map; SPR/entities per state; audio.

## 17. SPR0/SPR1 ze stavu 3a (diagonalni fragment)

Copper SPR0=$02A69C, SPR1=$02A700 (oba 16x24 2-plane, 100 B spacing).
Render jednotlive (banky 16/20/24/28) i attached (16 barev 16-31):
diagonalni hnedo-cerveny pas s detaily = fragment (zbran? ruka? efekt?),
ne cela postava. Tri bojovnici z fb_3a jsou v BITPLANE framebufferu
(bobove vykreslene do playfieldu), ne HW sprity. Hrdina je pravdepodobne
bob nebo jiny SPR slot/par; k overeni pomuze hrac (viz fb_3a).
Renders: extracted/renders/hero*.png (lokalne).

## 18. Dual-layer framebuffer solved (3a.uss)

Odd planes ($071BB6/$071BDE/$071C06, 40B/row) = layer 1 (tree/warriors).
Even planes ($07961A/$079646/$079672, 44B/row = 352px) = layer 2
(forest canopy, floating island, ground). Copper switches bands via WAITs.
Renders: fb_3a.png (L1), pf2_3a_rb44.png (L2). Palette per band comes from
copper COLORxx MOVEs (static render uses base palette; copper gradients
refine per scanline).
