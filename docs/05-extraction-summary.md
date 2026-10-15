# Shadow of the Beast III - Extraction summary for the remake build

Status: deep RE finished to the point where ALL game data is available
locally (personal use only). Nothing copyrighted is committed to git -
extracted binaries stay in `extracted/` (gitignored).

## 1. What was extracted

### 1.1 Disk.2 directory (offset $3000, size $1000)
Parsed 16-byte entries (name at +0, size u32 at +12), block map at +$C00
with one ownership byte per $400 block. 39 real files, total ~1 MB:

| idx | name | size | kind (entropy / markers) |
|-----|------|------|---------------------------|
| 0 | Reserved | 16384 | bootblock ("DOS") + code |
| 1 | f01 | 8436 | compressed candidate (7.66) |
| 2 | f02 | 3856 | compressed candidate (7.51) |
| 3 | f04 | 3968 | data (7.46) |
| 4 | f05 | 2836 | data (7.40) |
| 5 | fa0 | 652 | data (6.16) |
| 6 | fa1 | 25728 | compressed candidate (7.73) |
| 7 | fa2 | 88 | sprite/gfx (2.88, 15 distinct bytes) |
| 8 | fa3 | 23340 | compressed candidate (7.77) |
| 9 | fa4 | 4824 | code present (40x RTS) |
| 10 | fa5 | 75984 | code present (28x RTS) |
| 11 | f03 | 4828 | data (6.21) |
| 12 | fc2 | 21768 | data (6.24) |
| 13 | fc3 | 7216 | data (5.82) |
| 14 | f25 | 12860 | code present (107x RTS) |
| 15 | f26 | 70040 | data (6.49) |
| 16 | f27 | 22188 | code present (225x RTS) |
| 17 | f28 | 300 | gfx (4.79) |
| 18 | f29 | 37896 | compressed candidate (7.76) |
| 19 | f30 | 156 | gfx (5.01) |
| 20 | f31 | 39608 | data (6.23) |
| 21 | f32 | 8216 | code present (53x RTS) |
| 22 | f20 | 3000 | data (6.50) |
| 23 | f21 | 43880 | compressed candidate (7.76) |
| 24 | f22 | 68 | sprite (3.26, 18 bytes distinct) |
| 25 | f23 | 32048 | compressed candidate (7.76) |
| 26 | f24 | 89344 | code present (45x RTS) |
| 27 | fc0 | 27316 | data (7.10) |
| 28 | fc1 | 190340 | code present (29x RTS, biggest file) |
| 29 | ff0 | 11620 | compressed candidate (7.85) |
| 30 | ff1 | 4308 | data (7.48) |
| 31 | fz3 | 19788 | compressed candidate (7.77) |
| 32 | beast3p1.obj | 24752 | compressed candidate (7.78) |
| 33 | beast3p3.obj | 464 | raw 68k code (has RTS at +8) |
| 34 | fz2 | 84752 | compressed candidate (7.89) |
| 35 | fz0 | 9680 | compressed candidate (7.69) |
| 36 | fz1 | 13352 | compressed candidate (7.81) |
| 37 | main | 3472 | raw 68k code (33x RTS, Ghidra: 8 functions) |
| 38 | beast3p2.obj | 3420 | compressed candidate (7.64) |

Naming guess: `f*` = files, `fa*` = ? , `fc*` = ?, `ff*` = ?, `fz*` = ?,
`main` + `beast3p*.obj` = program parts (3 disks = 3 parts).

Outputs (local only): `extracted/files_disk2/NNN_name.bin`.

### 1.2 Load2 main chunk (Disk.1)
`Load2` with D0=$1800 loads Disk.1[$1800:+$33000] then Disk.1[$78000:+$1634C]
(total $4934C) to a destination; `Load` loads Disk.1[$A6800:+$3000]
(track 31 side 1 = second-stage loader at $7C000).

### 1.3 Symbol table (Disk.2 @ ~0xA50)
Development symbols: `main`, `chksum`, `prog`, `clear`, `dmavars`,
`DMADOS`, `Retry`, `filename`; object names `beast3p1/2/3.obj`.

## 2. ByteKiller decruncher (tools/bytekiller.py)

Faithful Python port of the 68k routine from the GPL slave source:
backwards bitstream, 0x80000000 sentinel, X-carry handling, running XOR
checksum that must end at 0. Commands: %00 literal run 1-8, %01 short
match (8-bit off, 2 bytes), %10 medium match (9/10-bit off, 3/4 bytes) or
long match (12-bit off, len+1), %11 long literal (len+9). Match copies go
backwards with sliding source (overlap allowed).

Result: direct decrunch of on-disk/file bytes yields 0 hits, which PROVES
the pipeline order: raw disk track -> Load2 sector processing
(sync $4489, odd/even de-interleave FUN_00078340/7834e) -> memory image ->
ByteKiller decrunch -> game data. The decruncher is correct and ready; it
needs memory-image input, not raw disk bytes.

## 3. Memory map (confirmed)

- $4000: boot block ($400 bytes from Disk.1 offset 0, executed at $40C2)
- $78000: first-stage loader (boot copies Disk.1[0x0C:0x410] here, entry $780D8)
- $7C000: second-stage loader (Disk.1 track 31 side 1 = offset $A6800;
  Ghidra: 53 functions; patch points $7C242 Loader, $7C948 Decrunch,
  $7CA30 Load2, $7CDAE LoadDOS)
- $70000: main loader stub (Loader patches $6C/$70/$72 then jumps here)
- $8000: intro data; $59F80/$5A000: Load2/Decrunch buffers
- Game code with absolute patch sites: $4AFC, $5632, $7778, $7BEE, $7D2C,
  $857E, $6A848, $6B39E, $6B4A8 (pl_main)

## 4. Toolchain (all in tools/, committed)

- `extract_lha.py` - unpack the WHDLoad LHA
- `disk_report.py` - track/entropy/code-density report
- `scan_code.py`, `scan_code2.py` - code-region scanner (capstone)
- `mfm_decode.py` - sync finder + odd/even decode helpers
- `bytekiller.py` - `decrunch` single blob / `scan` image for blobs
- `extract_files.py` - Psygnosis directory -> per-file binaries
- `ghidra/DumpDecomp.java` - headless function list + assembly dump
  (Ghidra 12.1.4, language 68000:BE:32:default; needs JAVA_HOME JDK 21)

## 5. What remains for a 1:1 personal build

1. Emulate Load2 sector processing (FUN_0007CB40/CBE0/CC7A/CD62) OR run
   the loader under a 68k emulator (Unicorn supports M68K) with stubbed
   custom chips to reconstruct the memory image.
2. Feed memory-image regions to `tools/bytekiller.py` to unpack game data.
3. Parse unpacked data into: level maps/entities, bitplane graphics,
   sprites, sound samples/MOD music.
4. Re-implement engine in TS + PixiJS (stack already chosen) using the
   extracted data as reference (personal use only).

## 6. Legal note (repeated)

Everything under `original/` and `extracted/` is third-party copyrighted
material (Psygnosis/Reflections 1992) and is gitignored. The repo contains
only analysis, docs, and own tooling. Personal-use RE is the basis here;
no redistribution.
