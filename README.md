# Shadow of the Beast III - RE materials and a web plan

Reverse-engineering materials for **Shadow of the Beast III**
(c) 1992 Psygnosis / Reflections Interactive (Commodore Amiga), plus a
concrete, legal way to run the real game in a browser - and an assessment of
the from-scratch alternative.

## Quick answers

- **Most faithful web version**: run the real game on a WebAssembly Amiga
  emulator (vAmigaWeb, GPL) with the user supplying their own Kickstart ROM and
  game media. 100% identical gameplay, legally clean distribution.
  See `docs/03-web-solution.md` and `web/`.
- **If you must ship a playable game without the user owning it**: a clean-room
  re-implementation with new assets (Option B). Faithful in mechanics, never
  byte-identical, and a large project.
- **You cannot** ship a "copy" that bundles the original code/graphics/music or
  the ROM; that is copyright infringement even for "abandonware".

## What was reverse engineered (verified)

- Package is a **WHDLoad install** (v1.6, JOTD). The WHDLoad patch **source is
  GPL** and documents the memory map and load calls.
- The game uses a **custom Psygnosis disk format**, not standard AmigaDOS ADF.
  WHDLoad `Disk.N` images are linear **160 tracks x 0x1800 bytes**
  (12 x 512-byte sectors), side-major.
- **Three-stage loader**:
  1. boot block (`Disk.1[0x0C:0x410]`) relocates itself to `$78000`;
  2. first-stage loader at `$78000` reads tracks and loads the second stage to
     `$7C000`;
  3. second-stage loader at `$7C000` (on disk `Disk.1[0xA6800:]`) loads the
     files, then the main game around `$70000`.
- **Ghidra** recovered 12 functions in the first-stage loader and 53 in the
  second-stage loader; the second-stage addresses match the GPL patch list
  exactly (`$7C948` ByteKiller decruncher, `$7CA30` Load2, `$7CDAE` LoadDOS).
  See `docs/ghidra-function-map.md`.
- Game files use a **Psygnosis directory** (16-byte entries, file-number table
  at `+0xC00`) and **ByteKiller** packing.
- Engine: OCS with **dual playfield** (3+3 bitplanes), **hardware sprites** for
  hero/shuriken/parallax clouds, copper rasters, ~288x192, ~50 Hz.

Details: `docs/01-technical-analysis.md`, `docs/02-disk-format.md`.

## Layout

```
docs/   analysis, disk format, Ghidra function map, web solution
tools/  extract_lha.py, disk_report.py
ghidra/ DumpDecomp.java (+ generated outputs, raw extracts gitignored)
web/    vAmigaWeb wrapper scaffold (bring-your-own-media)
original/  local-only original data (gitignored, copyrighted)
```

## Reproduce the analysis

```
# extract the LHA (needs lhafile)
python3 tools/extract_lha.py "ShadowOfTheBeast3_v1.6_0016 (1).lha" original

# inspect a disk / find code tracks (needs capstone)
python3 tools/disk_report.py original/ShadowOfTheBeast3/Disk.1 --scan-code
python3 tools/disk_report.py original/ShadowOfTheBeast3/Disk.1 --track 111

# Ghidra (68000) on the first-stage loader
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
GH=/home/opencode/tools/ghidra_12.1.4_PUBLIC
$GH/support/analyzeHeadless ghidra/proj Beast3 \
  -import ghidra/bootloader_78000.bin -processor 68000:BE:32:default \
  -loader BinaryLoader -loader-baseAddr 0x78000 \
  -postScript DumpDecomp.java -scriptPath ghidra
```

## Run it in the browser

See `web/README.md`. Short version: self-host vAmigaWeb in `web/vamigaweb/`,
serve `web/`, pick your Kickstart ROM and game media, Run.

## Legal

This repository contains **analysis and tooling only**. It does **not** contain
the game, the WHDLoad game data, or Kickstart ROMs. Those are copyrighted and
must be supplied by the user. See `docs/03-web-solution.md`.
