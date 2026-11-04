#!/usr/bin/env python3
"""Çengel Bulmaca bölümlerini üretir.

Her bölüm bir harf havuzu (bir kelimenin harfleri) ve o harflerle yazılan kelimelerin
birbirini kestiği küçük bir bulmacadır. Yalnız anlamı yazılmış kelimeler (tools/anlamlar.txt)
kullanılır; böylece bulmacadaki her kelimenin kartı vardır.

    python3 tools/cengel-gen.py
"""
import json
import random
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOWELS = set('aeıioöuü')
FREQ = ROOT / 'tools' / '.cache' / 'tr_50k.txt'
TOTAL = 100

# Bölüm aralığı: (havuz uzunlukları, en az kelime, en çok kelime, en geniş ızgara)
PLAN = [
    (range(0, 5), (4, 5), 3, 4, 7),
    (range(5, 15), (5,), 4, 5, 8),
    (range(15, 35), (5, 6), 5, 7, 9),
    (range(35, 60), (6, 7), 6, 9, 9),
    (range(60, 100), (7,), 8, 11, 10),
]


def load_words():
    words = {}
    for line in (ROOT / 'tools' / 'anlamlar.txt').read_text(encoding='utf-8').splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        w = line.split('|')[0].strip()
        if 3 <= len(w) <= 7:
            words[w] = True
    rank = {}
    if FREQ.exists():
        for i, l in enumerate(FREQ.read_text(encoding='utf-8').splitlines()):
            rank.setdefault(l.split(' ')[0], i + 1)
    return sorted(words), rank


def spellable(pool, w):
    return all(pool[ch] >= n for ch, n in Counter(w).items())


def layout(words, target, max_side, rng, tries=90):
    """Kelimeleri kesişecek biçimde yerleştirir: yan yana değen hücre olmaz."""
    best = None
    for _ in range(tries):
        rest = words[1:]
        rng.shuffle(rest)
        rest.sort(key=lambda w: -len(w) + rng.random() * 2.2)
        order = [words[0]] + rest
        grid = {}
        dirs = {}
        placed = []

        def put(w, r, c, d):
            dr, dc = (0, 1) if d == 0 else (1, 0)
            for k, ch in enumerate(w):
                p = (r + dr * k, c + dc * k)
                grid[p] = ch
                dirs.setdefault(p, set()).add(d)
            placed.append((w, r, c, d))

        def fits(w, r, c, d):
            dr, dc = (0, 1) if d == 0 else (1, 0)
            if (r - dr, c - dc) in grid or (r + dr * len(w), c + dc * len(w)) in grid:
                return -1
            inter = 0
            for k, ch in enumerate(w):
                p = (r + dr * k, c + dc * k)
                if p in grid:
                    if grid[p] != ch or d in dirs[p]:
                        return -1
                    inter += 1
                elif (p[0] + dc, p[1] + dr) in grid or (p[0] - dc, p[1] - dr) in grid:
                    return -1
            return inter

        def bbox(extra=None):
            cells = list(grid)
            if extra:
                cells += extra
            rs = [p[0] for p in cells]
            cs = [p[1] for p in cells]
            return min(rs), max(rs), min(cs), max(cs)

        put(order[0], 0, 0, 0)
        for w in order[1:]:
            if len(placed) >= target:
                break
            cands = []
            for p, ch in list(grid.items()):
                for i, wc in enumerate(w):
                    if wc != ch:
                        continue
                    for d in (0, 1):
                        if d in dirs[p]:
                            continue
                        dr, dc = (0, 1) if d == 0 else (1, 0)
                        r, c = p[0] - dr * i, p[1] - dc * i
                        n = fits(w, r, c, d)
                        if n <= 0:
                            continue
                        cells = [(r + dr * k, c + dc * k) for k in range(len(w))]
                        r0, r1, c0, c1 = bbox(cells)
                        h, wd = r1 - r0 + 1, c1 - c0 + 1
                        if h > max_side or wd > max_side:
                            continue
                        cands.append((n * 6 - h * wd * 0.12 - abs(h - wd) * 0.8 + rng.random(), r, c, d))
            if cands:
                _, r, c, d = max(cands)
                put(w, r, c, d)
        r0, r1, c0, c1 = bbox()
        h, wd = r1 - r0 + 1, c1 - c0 + 1
        inter = sum(1 for p in dirs if len(dirs[p]) > 1)
        score = len(placed) * 100 + inter * 6 - h * wd * 0.6 - abs(h - wd) * 4
        if not best or score > best[0]:
            best = (score, [(w, r - r0, c - c0, d) for w, r, c, d in placed], wd, h)
    return best


def main():
    words, rank = load_words()
    rng = random.Random(7)
    by_len = {}
    for w in words:
        by_len.setdefault(len(w), []).append(w)

    used_sigs = set()
    used_anchor_letters = []
    levels = []
    for rng_levels, lens, lo, hi, side in PLAN:
        anchors = [w for L in lens for w in by_len.get(L, [])]
        cands = []
        for a in anchors:
            pool = Counter(a)
            if sum(n for ch, n in pool.items() if ch in VOWELS) < 2 or len(pool) < 3:
                continue
            sub = [w for w in words if len(w) <= len(a) and spellable(pool, w)]
            if len(sub) < lo + 1:
                continue
            # Tanıdık kelimeler önde, uzunlar önde
            sub.sort(key=lambda w: (-len(w), rank.get(w, 20000)))
            if sub[0] != a:
                sub.remove(a)
                sub.insert(0, a)
            cands.append((a, sub))
        rng.shuffle(cands)
        cands.sort(key=lambda t: -min(len(t[1]), hi + 3))
        need = len(rng_levels)
        got = []
        for a, sub in cands:
            if len(got) >= need:
                break
            sig = ''.join(sorted(a))
            if sig in used_sigs:
                continue
            letters = set(a)
            if any(len(letters & p) / len(letters | p) > 0.8 for p in used_anchor_letters[-30:]):
                continue
            target = rng.randint(lo, hi)
            res = layout(sub[:24], target, side, rng)
            if not res or len(res[1]) < lo:
                continue
            used_sigs.add(sig)
            used_anchor_letters.append(letters)
            got.append((a, res))
        # Bölge içinde kolaydan zora
        got.sort(key=lambda t: (len(t[1][1]), t[1][2] * t[1][3]))
        for a, (_, placed, wd, h) in got:
            letters = list(a)
            rng.shuffle(letters)
            levels.append({'l': ''.join(letters), 'w': [[w, r, c, d] for w, r, c, d in placed], 'W': wd, 'H': h})
        print(f'{rng_levels.start + 1}-{rng_levels.stop}: {len(got)} bölüm, kelime {sum(len(g[1][1]) for g in got) / max(1, len(got)):.1f}, havuz {lens}')

    body = ',\n'.join('  ' + json.dumps(lv, ensure_ascii=False, separators=(',', ':')) for lv in levels)
    (ROOT / 'js' / 'data' / 'cengel-levels.js').write_text(
        '// Çengel Bulmaca bölümleri: tools/cengel-gen.py üretir, elle düzenlenmez.\n'
        '// l = çarktaki harfler, w = [kelime, satır, sütun, yön (0 yatay, 1 dikey)], W x H = ızgara.\n'
        f'export const CENGEL = [\n{body},\n];\n', encoding='utf-8')
    print(f'yazıldı: {len(levels)} bölüm')
    # Örnek ızgaralar
    for lv in (levels[0], levels[20], levels[-1]):
        g = [['·'] * lv['W'] for _ in range(lv['H'])]
        for w, r, c, d in lv['w']:
            for k, ch in enumerate(w):
                rr, cc = (r, c + k) if d == 0 else (r + k, c)
                g[rr][cc] = ch.upper()
        print(lv['l'], [x[0] for x in lv['w']])
        print('\n'.join(' '.join(row) for row in g))


if __name__ == '__main__':
    main()
