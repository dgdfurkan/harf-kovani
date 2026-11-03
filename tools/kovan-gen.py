#!/usr/bin/env python3
"""Harf Kovanı kelime verilerini üretir.

Girdi: tools/kovan-sozluk.txt (elle seçilmiş, günlük Türkçede tanıdık kelimeler),
data/words.txt (büyük liste) ve Türkçe sıklık listesi (FrequencyWords, tools/.cache altına iner).

Çıktı:
    js/data/kovan-levels.js  Harf Çiçeği bölümleri: harf havuzu, o havuzdan çıkan bütün kelimeler, zor bölüm işareti
    js/data/kovan-sozluk.js  Petek Avı'nın tahtaya koyduğu, arının gösterdiği kelimeler (anlamı olanlar, sık olan önde)
    js/data/anlam.js         Kelime kartları: anlam ve günlük kullanım örneği (tools/anlamlar.txt)
    data/yaygin.txt          Tam puan alan kelimeler: büyük liste ile sıklık listesinin kesişimi ve sözlük

    python3 tools/kovan-gen.py
"""
import json
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALPHA = set('abcçdefgğhıijklmnoöprsştuüvyz')
VOWELS = set('aeıioöuü')
FREQ_URL = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/tr/tr_50k.txt'
FREQ_FILE = ROOT / 'tools' / '.cache' / 'tr_50k.txt'
# Havuz olarak tercih edilen temalar: arıcılık ve doğa önce gelsin
THEME = set('kovan petek nektar polen bahçe çiçek arıcı larva kraliçe yonca orman tarla meyve bahar tohum yaprak'.split())
# Sıklık listesinde olsa da tam puanla kutlanmayacak kelimeler
DENY = set('sik göt piç bok ibne orospu kaltak fahişe sürtük gerzek seks porno penis meme taciz tecavüz kıç lan ulan sapık'.split())
# Sıklık listesinde bulunmayan elle seçilmişler orta sıraya girer
RANK_MISSING = 15000


def load(path):
    out = []
    for line in Path(path).read_text(encoding='utf-8').splitlines():
        w = line.strip()
        if w and not w.startswith('#'):
            out.append(w)
    return out


def load_rank():
    if not FREQ_FILE.exists():
        FREQ_FILE.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(FREQ_URL, FREQ_FILE)
    rank = {}
    for i, line in enumerate(FREQ_FILE.read_text(encoding='utf-8').splitlines()):
        rank.setdefault(line.split(' ')[0], i + 1)
    return rank


def spellable(pool, w):
    return all(pool[ch] >= n for ch, n in Counter(w).items())


def make_puzzles(words, total=100):
    cands = {}
    for anchor in words:
        if not 5 <= len(anchor) <= 7:
            continue
        letters = Counter(anchor)
        if len(letters) < 4 or sum(n for ch, n in letters.items() if ch in VOWELS) < 2:
            continue
        found = [w for w in words if len(w) <= len(anchor) and spellable(letters, w)]
        lens = Counter(len(w) for w in found)
        lo, hi = {5: (5, 12), 6: (7, 15), 7: (8, 18)}[len(anchor)]
        if not lo <= len(found) <= hi:
            continue
        if sum(n for L, n in lens.items() if L >= 4) < 3 or lens[3] > len(found) * 0.6:
            continue
        sig = ''.join(sorted(anchor))
        score = len(found) + len(lens) * 2 + (6 if anchor in THEME else 0)
        if sig not in cands or score > cands[sig][0]:
            cands[sig] = (score, anchor, sorted(found, key=lambda w: (len(w), w)))

    # Benzer harf kümeleri tekrar etmesin
    taken, rows = [], []
    for row in sorted(cands.values(), key=lambda t: -t[0]):
        letters = set(row[1])
        if any(len(letters & p) / len(letters | p) > 0.72 for p in taken):
            continue
        taken.append(letters)
        rows.append(row)
    # Zorluk: harf sayısı ve kelime sayısı
    diff = lambda r: len(r[1]) * 1.6 + len(r[2]) * 0.35
    rows.sort(key=diff)
    n = len(rows)
    blocks = total // 10
    cut = int(n * 0.8)
    normal, hard = rows[:cut], rows[cut:]
    pick = lambda pool, k: [pool[round(i * (len(pool) - 1) / max(1, k - 1))] for i in range(k)]
    normal = pick(normal, blocks * 9)
    hard = pick(hard, blocks)
    print(f'aday {n}, normal havuz {cut}, zor havuz {n - cut}')
    out = []
    # Blok içinde dalga: yüksel, bir nefes al, yine yüksel, sonunda zor bölüm
    wave = [0, 2, 4, 1, 5, 6, 3, 7, 8]
    for b in range(blocks):
        part = normal[b * 9:(b + 1) * 9]
        out += [(r[1], r[2], 0) for r in (part[i] for i in wave)]
        out.append((hard[b][1], hard[b][2], 1))
    return out


def main():
    raw = load(ROOT / 'tools' / 'kovan-sozluk.txt')
    rank = load_rank()
    big = set(load(ROOT / 'data' / 'words.txt'))
    seen, words, bad = set(), [], []
    for w in raw:
        if w in seen:
            continue
        seen.add(w)
        if not set(w) <= ALPHA or not 3 <= len(w) <= 7:
            bad.append(w)
            continue
        words.append(w)
    print(f'sözlük: {len(words)} kelime, {len(bad)} eleme: {" ".join(bad)}')

    # Anlamlar: kelime|anlam|örnek
    anlam = {}
    path = ROOT / 'tools' / 'anlamlar.txt'
    if path.exists():
        for line in path.read_text(encoding='utf-8').splitlines():
            if not line.strip() or line.startswith('#'):
                continue
            parts = [x.strip() for x in line.split('|')]
            if len(parts) == 3 and parts[0]:
                anlam[parts[0]] = parts[1:]
    (ROOT / 'js' / 'data' / 'anlam.js').write_text(
        '// Kelime kartları: tools/kovan-gen.py üretir, kaynak tools/anlamlar.txt. [anlam, örnek]\n'
        'export const ANLAM = ' + json.dumps(anlam, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')

    # Petek Avı sözlüğü: anlamı yazılmış kelimeler, sık kullanılan önde
    by_rank = sorted((w for w in words if w in anlam), key=lambda w: (rank.get(w, RANK_MISSING), w))
    (ROOT / 'js' / 'data' / 'kovan-sozluk.js').write_text(
        '// Harf Kovanı sözlüğü: tools/kovan-gen.py üretir, elle düzenlenmez. Sık kullanılan kelimeler önde.\n'
        f"export const SOZLUK = '{' '.join(by_rank)}'.split(' ');\n", encoding='utf-8')
    print(f'anlamı olan: {len(anlam)}, Petek sözlüğü: {len(by_rank)}')

    # Yaygın kelimeler: nadir ve uydurma duran kelimeler bu listeye giremez
    common = sorted({w for w in big if w in rank and 3 <= len(w) <= 10 and w not in DENY} | set(words))
    (ROOT / 'data' / 'yaygin.txt').write_text('\n'.join(common) + '\n', encoding='utf-8')
    print(f'yaygın: {len(common)} kelime')

    puzzles = make_puzzles(words)
    body = ',\n'.join("  { a: '%s', w: [%s]%s }" % (a, ', '.join(f"'{w}'" for w in ws), ', z: 1' if z else '') for a, ws, z in puzzles)
    used = sorted({w for _, ws, _ in puzzles for w in ws})
    missing = [w for w in used if w not in anlam]
    (ROOT / 'tools' / '.cache' / 'anlamsiz.txt').write_text('\n'.join(missing) + '\n', encoding='utf-8')
    print(f'çiçek kelimeleri: {len(used)}, anlamı eksik: {len(missing)}')
    (ROOT / 'js' / 'data' / 'kovan-levels.js').write_text(
        '// Harf Çiçeği bölümleri: tools/kovan-gen.py üretir, elle düzenlenmez.\n'
        '// a = havuzu kuran kelime (harfler bundan gelir), w = o harflerden çıkan bütün kelimeler.\n'
        f'export const PUZZLES = [\n{body},\n];\n', encoding='utf-8')
    tot = sum(len(w) for _, w, _ in puzzles)
    print(f'yazıldı: {len(puzzles)} bölüm, {tot} kelime, ortalama {tot / len(puzzles):.1f}')


if __name__ == '__main__':
    main()
