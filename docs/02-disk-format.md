# Disk format - Shadow of the Beast III (WHDLoad images)

Applies to `original/ShadowOfTheBeast3/Disk.1|2|3` and the equivalent
WHDLoad `Disk.N` files.

## Geometry

- Size: **983040 bytes** = 160 tracks x **0x1800** (6144) bytes.
- One track = **12 sectors x 512** bytes of decoded payload.
- Layout is **side-major**:
  - side 0 = bytes `0x00000 .. 0x78000` (80 tracks x 0x1800)
  - side 1 = bytes `0x78000 .. 0xF0000` (80 tracks x 0x1800)
- Track/side -> image offset (as used by the WHDLoad intro loader patch):
  `offset = (track >> 1) * 0x1800 + side * (80 * 0x1800)`
  This matches the observed "tracks 31.." load resolving to side1 track 31 at
  `0xA6800`. [OBS/INF]

## Why it is not a normal ADF

- A standard Amiga DD ADF is 901120 bytes (11 sectors x 80 x 2 x 512).
- These images have 12 sectors/track and no valid AmigaDOS root block / block
  checksums beyond the boot block. [OBS]
- The game boots a real DOS boot block and then uses its own **track loader**
  (raw hardware read + blitter sync search + 68k MFM decode). [OBS]

## Track payload structure (as decoded by the loader)

From Ghidra disassembly of the loader (see `01-technical-analysis.md`),
each track payload, after the hardware/blitter step, is processed by
`FUN_0007836a`:

1. Search for the MFM sync word `0x4489`.
2. Decode a header; verify its ID equals `track*2 + side`.
3. Verify a checksum over the next `0x3000` bytes.
4. De-interleave `0x1800` bytes into the destination buffer
   (`FUN_0007834e`: combine two longword streams masked with `0x55555555`).

[UNK] The precise on-disk scrambling for every track (and whether the WHDLoad
image stores the pre- or post-blitter byte stream) is described behaviourally
but not re-implemented here.

## Payload contents found so far

- `Disk.1[0x00..]` boot block and first-stage loader bytes (plain 68k).
- `Disk.1[0xA6800..]` (side 1, track 31 onward): second-stage loader, plain
  68k, mapped to memory `$7C000` (verified against the GPL WHDLoad patch
  offsets: `$7C948` decruncher, `$7CA30` Load2, `$7CDAE` LoadDOS).
- Most other tracks hold compressed (ByteKiller) data, graphics and audio,
  so they do not disassemble as code. [OBS]

## Scanning tool

```
python3 tools/disk_report.py original/ShadowOfTheBeast3/Disk.1
python3 tools/disk_report.py original/ShadowOfTheBeast3/Disk.1 --scan-code
python3 tools/disk_report.py original/ShadowOfTheBeast3/Disk.1 --track 31
python3 tools/disk_report.py original/ShadowOfTheBeast3/Disk.1 --bootloader out.bin
```

`--scan-code` needs `capstone`. It reports tracks whose bytes disassemble as
68k (used to find the code tracks above).
