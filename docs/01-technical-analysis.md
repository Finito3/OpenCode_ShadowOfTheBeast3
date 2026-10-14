# Shadow of the Beast III - Technical Reverse Engineering Notes

Subject: `ShadowOfTheBeast3_v1.6_0016.lha` (WHDLoad install, JOTD 2017).
Game: **Shadow of the Beast III**, (c) 1992 Psygnosis, developed by
Reflections Interactive. Platform: Commodore Amiga (OCS/ECS), 1992.

All statements below are marked:
- [OBS] observed directly (bytes, disassembly, GPL source)
- [INF] inferred from evidence
- [UNK] unknown / not verified

---

## 1. Package contents

Observed (`tools/extract_lha.py`):

| entry | size | note |
|---|---|---|
| `ShadowOfTheBeast3/ShadowOfTheBeast3.slave` | 2576 | WHDLoad 68k hunk executable |
| `ShadowOfTheBeast3/Disk.1` | 983040 | disk image |
| `ShadowOfTheBeast3/Disk.2` | 983040 | disk image |
| `ShadowOfTheBeast3/Disk.3` | 983040 | disk image |
| `ShadowOfTheBeast3/ReadMe`, `Solution` | text | credits + walkthrough |

[OBS] `Disk.1`/`Disk.2` start with a valid AmigaDOS boot block
(`DOS\0`, correct checksum); `Disk.3` starts with zeroes.
[OBS] The images are NOT standard AmigaDOS ADF (901120 bytes). They are
983040 = 160 x 6144 = 160 x 0x1800 bytes. The game uses a **custom Psygnosis
track format** (see `02-disk-format.md`).

---

## 2. Authoritative source: the GPL WHDLoad slave

[OBS] The WHDLoad install package (`Beast3.lha`, whdload.de) ships the patch
**source code under the GPL**:
`source/ShadowOfTheBeast3HD.s` and `source/Beast3HD.s`.
This is not the game; it is the loader/patch and it documents the memory map
and the exact load calls. It is the primary evidence for the flow below.

Key facts extracted from the slave source:

- The patch's `_LoadDisk` calls `resload_DiskLoad(dest, offset, size, disk)`.
  So `Disk.N` files are treated as **linear byte arrays** read by absolute
  offset. [OBS]
- Memory map (from patches + loader code):
  - `$4000`  boot block (loaded, patched, executed at `$40C2`)
  - `$78000` first-stage loader (boot block relocates itself here)
  - `$7C000` second-stage loader (patched region; PLBOOT)
  - `$70000` main loader stub area (`Loader`)
  - `$8000`  intro data (PAL intro loader)
  - custom chip base used directly (`$DFF000`), CIA-A/CIA-B for disk + input
- The slave replaces the game's own ByteKiller decruncher with an optimised,
  checksum-verified copy (`Decrunch`, GPL). [OBS]
- Configuration tooltypes: `C1` infinite lives / original cheat keys,
  `C2` second button = jump, `C4` skip intro. [OBS]

---

## 3. Boot / loader chain

[OBS] Ghidra analysis (`ghidra/bootloader_decomp.txt`) of the 68k blob that
the boot block copies to `$78000` recovered 12 functions.

Flow:

1. `Disk.1[0x00..0x0C]` = AmigaDOS boot block header (`DOS\0` + checksum +
   root block = 0). Code starts at `0x0C`.
2. `0x0C`: standard DOS hand-off (`lea dostype(pc),a0; move.l a0,$80; trap #0`).
   The following code is a fallback self-loader used when the disk is loaded as
   a game, not mounted by DOS. [OBS]
3. At `0x0CA`: `lea (0xC,pc),a0; lea $78000,a1; move.l (a0)+,(a1)+ ...`
   copies `disk[0x0C : 0x410]` (0x404 bytes) to `$78000`, then
   `jmp $780D8`. [OBS] So the first-stage loader lives at `$78000`,
   entry `$780D8` (== `disk[0xE4]`).
4. First-stage loader `$780D8`:
   - `move.w #$8650,$96(a6)` sets DMACON (blitter/disk DMA on). [OBS]
   - Reads a track, then:
     `lea $7C000,a0; move.l #$1F,d0; moveq #2,d1; bsr track-load`
     -> loads tracks starting at `$1F` into `$7C000`, then `jmp $7C000`. [OBS]
   - Disk read routine `FUN_00078120`: programs CIA-B (`$BFD000` region) and
     custom chips, waits on DSKBLK, computes a checksum. [OBS]
   - `FUN_00078340` and `FUN_0007834e`: MFM odd/even longword de-interleave
     (`(x & 0x55555555) << 1 | (y & 0x55555555)`), i.e. MFM data recovery.
   - `FUN_0007836a`: locates the `$4489` sync word, decodes the track header,
     verifies a header ID == `track*2+side`, verifies a checksum over `$3000`
     bytes, then de-interleaves `$1800` bytes into the destination. [OBS]
5. Second-stage loader at `$7C000` (on disk = `Disk.1` at offset `$A6800`,
   side 1 track 31). [OBS] Ghidra recovered 53 functions here, and their
   addresses match the slave's patch list exactly:
   - `$7C24A` = `Loader` (slave `PL_P $242,Loader`)
   - `$7C948` = game ByteKiller decruncher (slave `PL_P $948,Decrunch`)
   - `$7CA30` = `Load2` (slave `PL_P $a30,Load2`)
   - `$7CDAE` = `LoadDOS` (slave `PL_P $dae,LoadDOS`)
   This agreement is strong confirmation of the memory mapping
   `disk $A6800 <-> mem $7C000`. [OBS]
6. Main game code is loaded around `$70000`, and the resident game code that
   the slave patches (`pl_main`) lives in the `$0 .. $7C000` range
   (absolute patch sites such as `$5632`, `$7778`, `$7BEE`, `$7D2C`,
   `$6A848`, `$6B39E`, `$6B4A8`, `$857E`). [OBS]

---

## 4. File system and compression

[OBS] `LoadPsyFile` in the slave documents the game's own file system:

- Directory entries are 16 bytes: filename at `+0`, file length at `+12`.
- A parallel byte array at `dir + $0xC00` gives each file's disk number.
- File data is read in units of `$400` (1024) bytes ("track length").
- `Load2` loads the main program in two chunks from `Disk.1`
  (offset `$1800`, size `$33000`; then offset `$78000`, size `$1634C`).

[OBS] ByteKiller compression: the game's decruncher at `$7C948` is the classic
ByteKiller bit-stream LZ (`d5` = running checksum, back-references, packed and
unpacked runs). The slave ships an optimised GPL re-implementation.

---

## 5. Engine / hardware usage

[OBS] `DMACON`/`BPLCON0` writes and the slave's commented fixes confirm the
expected OCS usage (`Bplcon0` color-bit fixes, `volume` register fixes on the
replayers, copper colour lists).

[OBS-EXTERNAL] A public technical breakdown of the game
(English Amiga Board thread "Shadow of the beast 2/3 technical breakdown?")
reports, based on WinUAE bitplane/sprite isolation:
- Option screen and level 1 use **dual playfield** (3 + 3 bitplanes), with the
  background playfield holding platforms/ladders and parallax floor, and the
  foreground playfield holding rotating discs (blitter-moved).
- Clouds/far mountains are done with **sprites**, as are the hero and the
  shuriken; multiple sprite layers fake extra parallax.
- Level 2 (castle) is dual-playfield / half-bright style with dense scroll.
- Screen is roughly 288x192, ~50 Hz on PAL, NTSC option affects music speed.
- Raster/copper colour effects; HAM picture ("old man") and title screens.

[INF] Consequences for any faithful re-implementation:
- Planar bitmaps, dual playfield split, per-line colour changes (copper),
  8 hardware sprites reused as background/parallax, blitter for tiling.
- 50 Hz fixed-step logic; horizontal parallax on background layer.
- Sprite-based hero and projectile; software-sprite/entity list for the rest.

---

## 6. Game structure and mechanics

[OBS] Walkthrough (`Solution`) + slave comments:

- Four levels ("worlds"): Forest, Castle, (bird/temple), (ice/final).
- Progressive platform/adventure: platforms, ladders, levers, keys, doors,
  pushable objects (boulders, barrels, tables), cranes, water levels,
  conveyor belts, fire/thorns hazards, bosses.
- Player state: energy, lives, inventory; **weapons**: shuriken ("star") and
  hammer; weapon change with SPACE.
- Completion rule: to finish a level you must collect **all artifacts and the
  gold**; missing gold/artifact blocks progression.
- Bosses: level "leader" encounters and the final boss **Maletoth**.
- In-game keys: `ESC` lose life/restart, `HELP` restart, `F10` menu,
  `SPACE` weapon, cursor-right invincibility, cursor-left normal.
- Level 1 has a "hungry pal" (beast ally) sequence; level 4 ends with a
  furnace/ice/crystal sequence; level 2 has a crane operator; level 3 has a
  caged bird mount.

[INF] Entity model (typical for this engine, from the mechanics above, not yet
disassembled function-by-function): a per-level entity/object table with type,
position, state and behaviour pointers, plus a scrolling playfield descriptor
and a tile/map structure. Confirming this requires reconstructing the loaded
memory image (see section 7).

---

## 7. What is NOT yet extracted (honest limitations)

- The **main game binary in memory**: it is produced at runtime by the
  second-stage loader reading tracks and ByteKiller-decrunching data.
  Disk images are linear track dumps; most game data is compressed, so the
  playable code is not contiguous in the images. [OBS]
- No function-level map of the actual gameplay engine yet. To get it, the
  loaded memory image must be reconstructed by running the loader chain
  (see `03-web-solution.md`, "For deeper RE").
- Exact per-level data formats (maps, tiles, entity tables) are not mapped.
- The custom track format's sector ordering/checksum is described
  behaviourally here, not fully re-implemented in a tool.

These gaps do NOT block the recommended web solution (which runs the real
game); they only limit a from-scratch re-implementation.

---

## 8. Evidence artifacts in this repo

- `ghidra/bootloader_78000.bin` - 0x404-byte blob copied to `$78000`
- `ghidra/bootloader_decomp.txt` - Ghidra 68k function list + assembly
- `ghidra/stage2_7C000.bin`   - 0x8000-byte region for `$7C000`
- `ghidra/stage2_funcs.txt`   - Ghidra 68k function list + assembly (53 funcs)
- `ghidra/DumpDecomp.java`    - Ghidra headless script used
- `tools/disk_report.py`      - track/entropy/code-density analysis
- `tools/extract_lha.py`      - LHA extraction
