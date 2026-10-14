# Global rules
- All `*.md` files are written WITHOUT diacritics (ASCII only).
- This project lives in `/home/opencode/projects/ShadowOfTheBeast3`.
- Original third-party media must NOT be committed. See `.gitignore`.

# Project: ShadowOfTheBeast3 - reverse engineering + web plan

Goal: prepare materials for the most faithful web-runnable copy of
"Shadow of the Beast III" (c) 1992 Psygnosis / Reflections Interactive,
and/or propose a better (legal, feasible) solution.

## What is here
- `docs/`     analysis, disk format, engine notes, recommendation
- `tools/`    Python tooling (extract LHA, split tracks, scan for code)
- `ghidra/`   Ghidra headless inputs/outputs for the 68k bootloader
- `web/`      browser wrapper scaffold around vAmigaWeb (user supplies ROM/media)
- `original/` local-only original data (gitignored, copyrighted)
- `reference/` notes about the GPL WHDLoad patch source

## Tooling (system, no MCP needed in remote sessions)
- LHA extraction: `tools/extract_lha.py` (Python, uses `lhafile`)
- Ghidra: `/home/opencode/tools/ghidra_12.1.4_PUBLIC/support/analyzeHeadless`
  - Needs `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64`
  - `.java` GhidraScript (Ghidra 12 has no Jython; use Java scripts)
  - 68000 language id: `68000:BE:32:default`

## Legal boundary (IMPORTANT)
- Reimplementing game MECHANICS is allowed; copying original code, graphics,
  music or data is NOT (even if commonly called "abandonware").
- Do not redistribute the game data, the WHDLoad install, or Kickstart ROMs.
- The emulator wrapper references emulator code only; media is user-supplied.

## Key facts (verified - see docs/)
- Package is a WHDLoad install. Game downloadable as original 3 disks.
- Disks use a CUSTOM Psygnosis format (not standard AmigaDOS ADF).
- WHDLoad `Disk.N` images = 160 tracks x 0x1800 (12 x 512) linear bytes.
- Boot block relocates itself to $78000; first-stage loader reads tracks and
  loads the second-stage loader to $7C000; main game loads around $70000.
- Game data files use a Psygnosis directory ("LoadPsyFile") and ByteKiller packing.
