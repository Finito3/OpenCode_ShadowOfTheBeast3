# Web runner (bring-your-own-media)

This folder contains a minimal page that embeds a WebAssembly Amiga emulator
and runs the real game. **No copyrighted data is stored here.**

## Why not a self-contained page

SOTB3 is copyrighted (Psygnosis, 1992) and the Amiga Kickstart ROM is
copyrighted too. A distributable page therefore cannot include them. The user
supplies:

- a Kickstart ROM (e.g. Kickstart 1.3, 512 KB), and
- the game media.

## Recommended setup

Use **vAmigaWeb** (GPLv3, cycle-exact vAmiga compiled to WebAssembly).

1. Get the vAmigaWeb build (self-host it):
   - Repo: https://github.com/vAmigaWeb/vAmigaWeb
   - Player docs: https://vamigaweb.github.io/doc/about.html
2. Put the build in `web/vamigaweb/` so that
   `web/vamigaweb/js/vAmigaWeb_player.js`, `vAmiga.js` and `vAmiga.wasm`
   exist. (This folder is gitignored; it is third-party GPL code.)
3. Serve `web/` over HTTP (not `file://`) and open `index.html`.
4. Select your Kickstart ROM and game media, then Run.

Machine settings: Amiga 500, 512 KB chip + 512 KB slow/fast, Kickstart 1.3,
PAL (or NTSC - it only changes the music speed; see the WHDLoad ReadMe).

## Which game media to use

- **Easiest**: a WHDLoad hard-disk install (HDF) of SOTB3. No disk swapping.
  The install used for the RE in this repo is the JOTD v1.6/v2.1 package.
- **Original 3 disks**: the game uses a custom Psygnosis disk format, so plain
  cracked ADFs may not match. Use preservation-grade images (IPF/CAPS) if the
  emulator supports them, and swap disks when prompted.

## API note

The exact `vAmigaWeb_player` API (config keys, multi-file mount) changes
between versions. `index.html` is written against the documented embed API
(`samesite_file`, `vAmigaWebPlayer.load`) and is intentionally small; adjust
the config keys to the build you pin. Fields such as `extra_files`, `chipram`,
`fastram`, `pal` in the script are placeholders to confirm against the pinned
version's docs.

## Legal

- Emulator: GPLv3, redistributable.
- AROS Kickstart replacement is freely redistributable; genuine Kickstart is
  not.
- Game data: copyright Psygnosis/Reflections. User-supplied only.
