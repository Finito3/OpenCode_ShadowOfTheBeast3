# Running Shadow of the Beast III in the browser - options and recommendation

Question: prepare materials for the most faithful web-playable copy of the
game, or propose a better solution.

## TL;DR recommendation

**Use a WebAssembly Amiga emulator in the browser and run the real game
(WHDLoad install or original disks). The user supplies the Kickstart ROM and
the game media; we ship only open-source wrapper code.**

- Highest possible fidelity: it literally *is* the game (Moira 68000 core,
  custom Agnus/Denise/Copper/Paula).
- Legally clean distribution: the emulator is open source (GPL); the
  copyrighted ROM and game data are user-supplied and never redistributed.
- Concrete implementation: **vAmigaWeb** (GPLv3, WASM port of vAmiga,
  cycle-exact), embedded via its player, with a small page that loads the
  user's Kickstart and the game. See `web/`.

A from-scratch re-implementation is the only way to ship a *distributable*
game without the user owning it, but it will never be byte-identical and is a
large project (see "Option B").

---

## Option A - Browser Amiga emulator (RECOMMENDED)

### What it is
Embed a WASM Amiga emulator and feed it the game. Because SOTB3's disks use a
custom format, the practical path is the **WHDLoad install** (already done in
this package): WHDLoad + the `Disk.N` images, run from a hard-file / startup
script, or the original ADF/IPF disks with disk swapping.

### Why it is faithful
- The original 68000 code, graphics, copper lists, sprites, blitter and Paula
  audio all execute on emulated hardware. Nothing is re-authored.
- The RE notes in `docs/01-technical-analysis.md` explain exactly why this is
  the only way to reproduce the dual-playfield + sprite-parallax + copper
  effects exactly.

### Legally
- Any emulator we would ship (vAmigaWeb) is **GPL** - fine to redistribute.
- The **Kickstart ROM** and the **game data** are copyrighted (Commodore /
  Psygnosis). Do not bundle them. Provide an upload/picker so the user loads
  their own files, or use the AROS open replacement ROM where compatible.
- "Abandonware" ADFs on the internet do not grant a licence; keep them out of
  the repo. This matches the project rule: no original media committed.

### Implementation sketch (see `web/`)
1. Host `vAmigaWeb` (its `js/vAmigaWeb_player.js`, `vAmiga.js`, `vAmiga.wasm`)
   from the same origin.
2. Provide a page with:
   - a Kickstart ROM picker (user file),
   - a game media picker (`.adf` x3, or the prebuilt HDF/`.lha` WHDLoad set),
   - config: 512KB chip + 512KB fast, Kickstart 1.3, PAL.
3. Call `vAmigaWeb_player.load(...)` with the chosen files.
4. Optionally add on-screen controls/overlay for touch devices.

No game bytes are in the repo; only the wrapper.

### Limitations
- Needs the user to own/obtain the ROM and disks.
- Slight emulator framing latency vs. a native port (imperceptible for a
  50 Hz game).
- Distributing an all-in-one "just works" page is not possible without the
  user's media.

---

## Option B - Clean-room re-implementation (distributable, not identical)

### What it is
Re-create the game in TypeScript/WebGL (or with an existing 2D engine),
re-implementing *mechanics and level layouts* from the walkthrough and RE, and
authoring NEW graphics, music and code.

### Legally
- Game *mechanics* (rules, physics feel, level topology) are not copyrightable
  in the way code/art/audio are; a clean-room re-implementation that copies no
  original code, art, sound or data is the legal way to distribute.
- Must not extract and reuse the original tile/sprite/sound data or the
  original 68k code.

### Cost and fidelity
- Fidelity is limited: the exact 68k engine timing, per-frame collision, the
  dual-playfield art packing, the software-sprite behaviour and the music are
  re-authored by hand. This is a multi-week to multi-month effort and will
  diverge from the original.
- What IS achievable: a level-by-level playable homage with the same
  progression (artifacts + gold gate, weapons, bosses), using the mechanics
  documented in `Solution` and `docs/01-technical-analysis.md`.

### Recommended only if
The goal is a *publishable* game not requiring the user to own SOTB3.

---

## Option C - Hybrid

Ship the emulator wrapper (Option A) as the "play the real thing" path, and
add an original "remake mode" (Option B) with new assets for users who do not
own the game. This is the best product outcome but the most work.

---

## For deeper RE (function-level engine map)

If a precise engine map is wanted (for a high-fidelity remake or for research),
the loaded memory image must be reconstructed. Options, in order of effort:

1. **Emulator + memory dump (best)**: boot the WHDLoad install in an emulator
   that exposes memory (vAmiga has a debugger/RPC; FS-UAE has a remote
   debugger). Run until the level is loaded, then dump `$0..$7FFFF` and load
   that dump into Ghidra at its true base. This yields the real gameplay code.
2. **CPU emulation harness**: emulate just the 68k loader chain
   (e.g. Unicorn Engine supports M68K) with stubbed custom-chip registers and
   `resload_DiskLoad`, letting the game's own decoder and ByteKiller routines
   build the image. Harder because the loader uses the blitter for MFM sync.
3. **Static decode**: implement the track MFM de-interleave
   (`FUN_00078340` / `FUN_0007834e`) and ByteKiller, then extract files via the
   Psygnosis directory. Feasible but needs the exact sector ordering.

The recommended web solution (Option A) does not need any of this.

---

## Copyright summary

- Emulator wrapper code (ours) + emulator (GPL): distributable.
- Kickstart ROM: copyright Commodore/Cloanto; user-supplied (or AROS).
- Game code/graphics/music/data: copyright Psygnosis/Reflections; user-supplied.
- Documented rules/mechanics: fine to publish as text (this repo).
