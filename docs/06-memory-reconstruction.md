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
