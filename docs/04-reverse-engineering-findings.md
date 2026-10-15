# Shadow of the Beast III - Reverse Engineering Findings

## 1. Shrnutí (Summary)

Byla provedena reverzní inženýrská analýza WHDLoad balíčku hry Shadow of the Beast III (c) 1992 Psygnosis / Reflections. Všechny tři diskové obrazy (Disk.1/2/3, 983040 B každý) obsahují již dekódovaná tracková data – není potřeba MFM dekódování na úrovni bytů. Hra používá vlastní trackový formát (160 tracků × 0x1800 B, side-major), kompresi ByteKiller a vlastní souborový systém "Psygnosis file".

Na Disk.2 byla nalezena tabulka symbolů z původního vývoje s názvy funkcí a soubory `beast3p1.obj`, `beast3p2.obj`, `beast3p3.obj`.

## 2. Struktura disků

### 2.1 Diskový layout
- Velikost: 983040 bajtů = 160 tracků × 0x1800 (6144) B
- 12 sektorů × 512 B naトラック
- Side-major uspořádání:
  - Side 0: tracky 0-79, offsety 0x00000-0x77FFF
  - Side 1: tracky 0-79, offsety 0x78000-0xEFFFF
- Výpočet offsetu: `side * 0x78000 + track * 0x1800`

### 2.2 Obsah disků
- **Disk.1**: Boot blok, druhý stupeň loaderu, hlavní herní kód, grafika, data levelů
- **Disk.2**: Symboly z vývoje, další herní data, grafika
- **Disk.3**: Další herní data, grafika, zvuky

## 3. Loader řetězec (3 stupně)

### Stupeň 1: Boot blok (Disk.1, offset 0x00000)
- AmigaDOS boot blok s "DOS\0" hlavičkou
- Relokuje sám sebe na paměť $78000 a skáče na $780D8
- Načte stupeň 2 (tracky starting at $1F) do paměti $7C000

### Stupeň 2: Resident loader (Disk.1, offset 0xA6800 → paměť $7C000)
- 53 funkcí identifikováno Ghidrou
- Klíčové funkce:
  - `$7C24A`: Loader vstup
  - `$7C948`: ByteKiller decruncher
  - `$7CA30`: Load2 (načítá soubory z disku do paměti)
  - `$7CDAE`: LoadDOS (načítá DOS sektory)
  - `$7C452`: Inicializace (1058 B)
  - `$7C880`: Další inicializace (200 B)
- Načte hlavní hru do paměti kolem $70000+
- Používá `resload_DiskLoad` pro čtení tracků

### Stupeň 3: Hlavní hra
- Nahrává se z různých offsetů disků na různé adresy v paměti
- Používá `LoadPsyFile` pro čtení souborů podle adresáře
- Používá `Load2` pro přímé načítání tracků
- Používá `LoadDOS` pro čtení DOS sektorů

## 4. WHDLoad slave (GPL zdroják)

Zdrojový kód slave je k dispozici pod GPL v balíčku Beast3.lha. Obsahuje:
- Paměťová mapa: $4000 (boot), $70000 (hlavní loadér), $78000 (stupeň 1), $7C000 (stupeň 2)
- Konfigurační volby: C1 (infinite lives/cheat keys), C2 (second button jump), C4 (skip intro)
- Patch seznam (PLBOOT, PLINTRO_PAL/NTSC, pl_main, pl_post_intro)
- ByteKiller decruncher (optimalizovaná verze)
- Joypad/joystick obsluha

## 5. Symboly z původního vývoje (Disk.2, offset ~0xA50)

Nalezena tabulka symbolů s následujícímientry:

| Symbol | Přibližná hodnota | Popis |
|--------|------------------|-------|
| main | ~0x03F0 | Hlavní vstupní bod hry |
| chksum | ~0x0004 | Kontrolní součet |
| prog | ~0x0470 | Program |
| clear | ~0x04A6 | Vymazání obrazovky |
| dmavars | ~0x0A3A | DMA proměnné |
| DMADOS | ~0x04E0 | DMA DOS |
| Retry | ~0x04C4 | Opakování |
| filename | ~0x0A5A | Název souboru |

Soubory objektů: `beast3p1.obj`, `beast3p2.obj`, `beast3p3.obj` (hra je rozdělena do 3 částí, odpovídajících 3 diskům)

## 6. Souborový systém (Psygnosis file)

Zdrojový kód slave popisuje vlastní formát souborů:
- Adresářové položky: 16 bajtů každá (název na +0, délka souboru na +12)
- Pole čísel souborů na `Dir + $C00`
- Data se čtou v jednotkách $400 (1024) B
- `LoadPsyFile` načítá adresář a pak jednotlivé soubory podle čísla souboru

## 7. Komprese: ByteKiller

Hra používá kompresi ByteKiller (bitstream LZ s zpětnými referencemi). Zdrojový kód decruncheru je v WHDLoad slave (GPL). Algoritmus:
- Bitový vstupní proud
- Příkazy: %00/%01 = unpacked data, %10 = unpacked s délkou, %11 = packed
- Packed data používají délku a offset (back-reference)
- Kontrolní součet (EOR longwordů)

## 8. Extrahovaná data

Všechny stopy disků byly oskenovány pro kódovou hustotu. Nalezeno:
- **Disk.1**: 164 oblastí kódu (většina disku od offsetu 0x4800)
- **Disk.2**: 160 oblastí kódu
- **Disk.3**: 160 oblastí kódu

Stopa 31 side 1 (offset 0xA6800) obsahuje druhý stupeň loaderu načtený přímo na adresu $7C000 – data na disku jsou již dekódovaná, není potřeba MFM dekódování.

## 9. Doporučené další kroky pro remake

1. **Extrakce souborů**: Najít a parsovat Psygnosis adresář na discích, extrahovat jednotlivé soubory
2. **ByteKiller dekomprese**: Implementovat decruncher podle GPL zdrojáku a dekomprimovat herní data
3. **Ghidra analýza**: Spustit Ghidru na hlavním herním kódu (stopy 52-63 side 1) na správné adrese v paměti
4. **Analýza levelových dat**: Najít formát levelů, entit, grafiky a zvuků
5. **Remake v TS + PixiJS**: Postavit engine podle reverzovaných mechanik s vlastními assety

## 10. Právní upozornění

Všechny extrahované údaje jsou chráněny autorským právem (Psygnosis/Reflections, 1992). Pro vlastní použití je reverzní inženýrství povoleno, ale redistribuce původního kódu, grafiky, hudby ani dat není povolena. Pro distribuovatelnou hru je nutné vytvořit vlastní assety a reimplementovat mechaniky (clean-room).

## Soubory v tomto repozitáři

- `tools/mfm_decode.py` - Analýza tracků a hledání sync slov
- `tools/scan_code.py` / `tools/scan_code2.py` - Hledání kódových oblastí
- `tools/extract_lha.py` - Extrakce LHA archivu
- `ghidra/DumpDecomp.java` - Ghidra skript pro dump funkcí
- `ghidra/bootloader_decomp.txt` - Funkce prvního stupně loaderu
- `ghidra/stage2_funcs.txt` - Funkce druhého stupně loaderu ($7C000)
- `ghidra/stage2_listing.txt` - Celé assemblerové listování druhého stupně
- `extracted/tracks/` - Extraktované stopy disků
- `extracted/code_regions/` - Rozdělené oblasti kódu pro Ghidru
- `docs/01-technical-analysis.md` - Technická analýza
- `docs/02-disk-format.md` - Formát disků
- `docs/03-web-solution.md` - Návrh webového řešení
