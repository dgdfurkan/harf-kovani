// Petek Avı: 19 gözlü kovanda komşu harfleri birleştir, kelime çıkar. İki sürüm: bölüm bölüm
// hedefli oyun ve Sonsuz Petek (nektar bitene kadar puan topla, her 8 kelimede yeni dalga).
// Tahta rastgele harflerle değil tanıdık kelimelerle kurulur: sözlükten seçilen kelimeler komşu
// gözlere yerleşir, bulunan kelimenin yerine gelen harfler de yeni kelimeler çıkacak şekilde seçilir.

import { Life, html, toHTML, fitCanvas, clamp, lerp, rand, pick, trUpper, shuffle } from '../core/dom.js';
import { save } from '../core/save.js';
import { sfx, buzz, tone } from '../core/audio.js';
import { makeFx, rrect, label, shake } from '../core/fx.js';
import { pauseSheet, resultSheet, toast, icon } from '../core/ui.js';
import { submitScore } from '../core/dreamlo.js';
import { koloni, fmt } from '../koloni/koloni.js';
import { bonus } from '../koloni/bahce.js';
import { SOZLUK } from '../data/kovan-sozluk.js';
import { INK, loadLists, letterLink, drawRope, drawBee, drawJar, drawPill, hexPath, combBackdrop, themeColors } from './bag.js';
import { helpBarHTML, helpBar, jarGain } from './yardim.js';
import { wordCard, meaningOf } from './kart.js';
import { levelDone } from './bitir.js';

export const PETEK_LEVELS = 60;
const VAL = { a: 1, e: 1, i: 1, ı: 1, n: 1, r: 1, l: 1, k: 1, d: 2, m: 2, t: 2, y: 2, u: 2, s: 2, b: 3, o: 2, ü: 3, z: 4, ş: 4, g: 3, ç: 4, c: 4, h: 4, p: 5, v: 5, ğ: 6, ö: 5, f: 6, j: 8 };
const scoreOf = (w) => w.split('').reduce((a, c) => a + (VAL[c] || 2), 0) * w.length;
const VOWELS = 'aeıioöuü';
const FILL_V = 'aaaaeeeeıııiiioouu';
const FILL_C = 'kkkrrrlllnnnmmttssddyybz';
const ease = (t) => t * t * (3 - 2 * t);
const backOut = (t) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;
const NONE = 'rgba(0,0,0,0)';
const FONT = '"Baloo 2", sans-serif';

// Petek: 3-4-5-4-3 sıra, eksen koordinatlı altıgenler
const ROWS = [3, 4, 5, 4, 3];
const CELLS = [];
ROWS.forEach((n, r) => {
  for (let c = 0; c < n; c++) CELLS.push({ r, c, i: CELLS.length, off: (5 - n) / 2 });
});
const COUNT = CELLS.length;
const neighbors = (a, b) => {
  if (a.i === b.i) return false;
  const dr = Math.abs(a.r - b.r);
  if (dr > 1) return false;
  if (dr === 0) return Math.abs(a.c - b.c) === 1;
  return Math.abs(a.c + a.off - (b.c + b.off)) <= 0.51;
};
const NEI = CELLS.map((a) => CELLS.filter((b) => neighbors(a, b)).map((b) => b.i));
const ALL = CELLS.map((c) => c.i);

/* ---------- Sözlük ve tahta kurma ---------- */

const SOZ = new Set(SOZLUK);
const PREFIX = new Set();
const BY_LEN = { 3: [], 4: [], 5: [], 6: [], 7: [] };
for (const w of SOZLUK) {
  BY_LEN[w.length].push(w);
  for (let k = 1; k <= w.length; k++) PREFIX.add(w.slice(0, k));
}
// Sözlük sıklığa göre dizili: öndeki kelimeler daha sık seçilir
const biased = (list) => list[Math.floor(Math.random() ** 1.6 * list.length)];

// Tahtada şu an çıkan sözlük kelimeleri ve yolları
function scanBoard(letters, used) {
  const out = new Map();
  const seen = new Array(COUNT).fill(false);
  const path = [];
  const walk = (i, pre) => {
    const w = pre + letters[i];
    if (!PREFIX.has(w)) return;
    seen[i] = true;
    path.push(i);
    if (w.length >= 3 && SOZ.has(w) && !used.has(w) && !out.has(w)) out.set(w, path.slice());
    if (w.length < 7) for (const j of NEI[i]) if (!seen[j]) walk(j, w);
    seen[i] = false;
    path.pop();
  };
  for (let i = 0; i < COUNT; i++) if (letters[i]) walk(i, '');
  return out;
}

// Kelimeyi komşu gözlere yerleştirir: boş gözü en çok dolduran yolu seçer, aynı harfi paylaşabilir
function placeWord(letters, w, order, starts) {
  let best = null;
  let bestE = 0;
  let visits = 0;
  const seen = new Array(COUNT).fill(false);
  const path = [];
  const walk = (i, k, e) => {
    if (visits++ > 500) return;
    const c = letters[i];
    if (c !== null && c !== w[k]) return;
    const ne = e + (c === null ? 1 : 0);
    seen[i] = true;
    path.push(i);
    if (k === w.length - 1) {
      if (ne > bestE) { bestE = ne; best = path.slice(); }
    } else {
      for (const j of order[i]) if (!seen[j]) walk(j, k + 1, ne);
    }
    seen[i] = false;
    path.pop();
  };
  for (const i of starts) walk(i, 0, 0);
  return best;
}

function fillHoles(letters) {
  for (let i = 0; i < COUNT; i++) {
    if (letters[i] !== null) continue;
    let v = 0;
    let c = 0;
    for (const j of NEI[i]) {
      if (!letters[j]) continue;
      if (VOWELS.includes(letters[j])) v++; else c++;
    }
    const vowel = v === 0 ? true : c === 0 ? false : Math.random() < 0.4;
    letters[i] = pick(vowel ? FILL_V : FILL_C);
  }
}

// Bölüm tasarımı: önce kısa hedefler, sonra uzun kelime ve harf hedefleri; her onuncu bölüm zor
const SEQ = ['kelime', 'bal', 'kelime', 'uzun', 'bal', 'harf'];
function goalOf(li) {
  const hard = (li + 1) % 10 === 0;
  const k = hard ? 1.5 : 1;
  const kind = li < 2 ? 'kelime' : hard ? 'uzun' : SEQ[li % SEQ.length];
  if (kind === 'kelime') {
    const n = Math.round((5 + Math.floor(li / 3)) * k);
    return { kind, n, hard, text: `${n} kelime bul` };
  }
  if (kind === 'uzun') {
    const n = Math.round((2 + Math.floor(li / 10)) * k);
    const len = li < 14 ? 5 : 6;
    return { kind, n, len, hard, text: `${n} tane ${len} harfli ya da daha uzun kelime` };
  }
  if (kind === 'harf') {
    const n = 7 + Math.floor(li / 4);
    const letter = pick('aeiknrlstmd'.split(''));
    return { kind, n, letter, hard, text: `Kelimelerinde ${n} tane ${trUpper(letter)} harfi kullan` };
  }
  const n = 180 + li * 25;
  return { kind, n, hard, text: `${n} bal topla` };
}
const lengthsOf = (li, hard) => {
  if (hard) return [4, 5, 5, 6, 6, 7];
  if (li < 5) return [3, 3, 4, 4, 4, 5];
  if (li < 15) return [3, 4, 4, 4, 5, 5, 6];
  if (li < 30) return [3, 4, 4, 5, 5, 5, 6, 6];
  return [4, 4, 5, 5, 5, 6, 6, 7];
};

// Sonsuz Petek: nektar her saniye azalır, kelimeler doldurur; dalga ilerledikçe hızlanır
const DRAIN = 0.9;
const WAVE_WORDS = 8;

export function playPetek(main, nav, li, { endless = false } = {}) {
  const my = new Life();
  const goal = endless ? { kind: 'sonsuz', n: Infinity, hard: false, text: 'Nektar bitmeden kelime çıkar' } : goalOf(li);
  const hard = goal.hard;
  const fx = makeFx();
  let mix = endless ? lengthsOf(3, false) : lengthsOf(li, hard);
  const best0 = save.data.sonsuz.best || 0;
  const focus = goal.kind === 'uzun' ? SOZLUK.filter((w) => w.length >= goal.len)
    : goal.kind === 'harf' ? SOZLUK.filter((w) => w.includes(goal.letter)) : null;
  const focusSet = focus ? new Set(focus) : null;
  let lists = null;
  loadLists().then((l) => { lists = l; }).catch(() => {});
  const game = {
    letters: new Array(COUNT).fill(''), sel: [], tapped: false, used: new Set(), avail: new Map(),
    honey: 0, words: 0, extras: 0, prog: 0, helps: 0, last: '', done: false, paused: false, found: [],
    pops: [], bees: [], born: new Array(COUNT).fill(null), shakeCell: -1, goal,
    combo: 0, comboT: 0, jarPulse: 0, flash: 0,
    aT: 1, aFrom: [], hint: null, fly: null, bee: { x: 0, y: 0, ang: 0 },
    pill: { text: '', kind: null, t: 0 },
    nectar: 100, wave: 1, waveWords: 0, gold: -1, goldT: 0,
  };

  nav.setTitle(endless ? 'Sonsuz Petek' : hard ? `Zor Bölüm · ${li + 1}` : `Petek Avı · ${li + 1}`);
  main.innerHTML = toHTML(html`
    <div class="kv ${hard ? 'kv-hard' : ''} ${endless ? 'kv-endless' : ''}">
      <div class="kv-top">
        ${endless ? html`
        <span class="kv-goal"><small data-wave>Nektar · 1. dalga</small><b>${best0 ? `Rekor: ${fmt(best0)} puan` : 'İlk rekorunu kır'}</b><i class="kv-pbar kv-nbar"><u data-pbar style="width:100%"></u></i></span>
        <span class="kv-score"><b data-score>0</b><small>puan</small></span>` : html`
        <span class="kv-goal"><small>${hard ? 'Zor bölüm' : 'Hedef'}</small><b>${goal.text}</b><i class="kv-pbar"><u data-pbar></u></i></span>
        <span class="kv-score"><b data-avail>0</b><small>kelime var</small></span>`}
      </div>
      <div class="pk-found" data-found><span class="pk-empty">Bulduğun kelimeler burada birikir, dokununca anlamı açılır.</span></div>
      <div class="kv-stage">
        <canvas class="kv-cv"></canvas>
        <div class="pk-tap" data-tap>
          <button class="kv-x" data-tap-act="del" aria-label="Sil">${icon('back')}</button>
          <button class="kv-x kv-ok" data-tap-act="ok" aria-label="Onayla">${icon('check')}</button>
        </div>
        <div class="kv-banner" data-banner></div>
        <div class="kv-combo" data-combo></div>
        <div class="hk-clue" data-clue></div>
      </div>
      ${helpBarHTML({ shuffle: true })}
    </div>`);
  const wrap = main.querySelector('.kv');
  const cv = wrap.querySelector('.kv-cv');
  const bannerEl = wrap.querySelector('[data-banner]');
  const comboEl = wrap.querySelector('[data-combo]');
  const clueEl = wrap.querySelector('[data-clue]');
  const tapEl = wrap.querySelector('[data-tap]');
  const foundEl = wrap.querySelector('[data-found]');
  const availEl = wrap.querySelector('[data-avail]');
  const scoreEl = wrap.querySelector('[data-score]');
  const waveEl = wrap.querySelector('[data-wave]');
  const pbar = wrap.querySelector('[data-pbar]');
  const stage = fitCanvas(cv, my);
  let col = themeColors();

  /* ---------- Tahta ---------- */

  function candidates(n) {
    const out = [];
    const seen = new Set();
    for (let guard = 0; out.length < n && guard < n * 6; guard++) {
      const list = focus && Math.random() < 0.55 ? focus : BY_LEN[pick(mix)];
      const w = biased(list);
      if (seen.has(w) || game.used.has(w)) continue;
      seen.add(w);
      out.push(w);
    }
    return out;
  }

  function plant(letters, words, maxWords) {
    const order = NEI.map((a) => shuffle(a.slice()));
    const starts = shuffle(ALL.slice());
    let holes = letters.reduce((a, c) => a + (c === null ? 1 : 0), 0);
    let count = 0;
    for (const w of words) {
      if (!holes || count >= maxWords) break;
      const p = placeWord(letters, w, order, starts);
      if (!p) continue;
      p.forEach((c, k) => {
        if (letters[c] === null) holes--;
        letters[c] = w[k];
      });
      count++;
    }
  }

  function evaluate(letters) {
    const m = scanBoard(letters, game.used);
    let s = m.size;
    let good = 0;
    for (const w of m.keys()) {
      if (w.length >= 5) { s += 2; good++; }
      if (focusSet && focusSet.has(w)) s += 3;
    }
    return { letters, m, s, good };
  }

  // Süre sınırı var: kelime bulununca oyun bir kare bile takılmasın
  function search(make, budget, enough) {
    const t0 = performance.now();
    let best = null;
    do {
      const e = evaluate(make());
      if (!best || e.s > best.s) best = e;
    } while (performance.now() - t0 < budget && !enough(best));
    return best;
  }

  function setBoard(e) {
    game.letters = e.letters;
    game.avail = e.m;
    if (availEl) availEl.textContent = e.m.size;
  }

  const freshBoard = () => search(() => {
    const trial = new Array(COUNT).fill(null);
    plant(trial, candidates(30), hard ? 6 : 8);
    fillHoles(trial);
    return trial;
  }, 30, (b) => b.m.size >= (hard ? 10 : 14) && b.good >= 2);

  // Aynı harflerle yeni diziliş: yine sözlük kelimeleri çıksın diye önce kelime yerleştirilir
  function arrange(multiset) {
    const counts = {};
    for (const c of multiset) counts[c] = (counts[c] || 0) + 1;
    const fits = SOZLUK.filter((w) => {
      if (game.used.has(w)) return false;
      const need = {};
      for (const c of w) {
        need[c] = (need[c] || 0) + 1;
        if (need[c] > (counts[c] || 0)) return false;
      }
      return true;
    });
    return search(() => {
      const trial = new Array(COUNT).fill(null);
      const rem = { ...counts };
      const order = NEI.map((a) => shuffle(a.slice()));
      const starts = shuffle(ALL.slice());
      for (let k = 0; k < 24 && fits.length; k++) {
        const w = biased(fits);
        const p = placeWord(trial, w, order, starts);
        if (!p) continue;
        const need = {};
        p.forEach((c, x) => { if (trial[c] === null) need[w[x]] = (need[w[x]] || 0) + 1; });
        if (Object.keys(need).some((c) => (rem[c] || 0) < need[c])) continue;
        p.forEach((c, x) => {
          if (trial[c] === null) rem[w[x]]--;
          trial[c] = w[x];
        });
      }
      const left = shuffle(Object.keys(rem).flatMap((c) => new Array(rem[c]).fill(c)));
      for (let i = 0; i < COUNT; i++) if (trial[i] === null) trial[i] = left.pop();
      return trial;
    }, 12, (b) => b.m.size >= 10 && b.good >= 1);
  }

  // Bulunan kelimenin yerine gelecek harfler: önce yeni kelime yerleştir, kalan gözü dengeli doldur
  function refill(path) {
    const base = game.letters.slice();
    path.forEach((i) => { base[i] = null; });
    setBoard(search(() => {
      const trial = base.slice();
      plant(trial, candidates(24), 3);
      fillHoles(trial);
      return trial;
    }, 5, (b) => b.m.size >= 9 && b.good >= 1));
  }

  setBoard(freshBoard());

  /* ---------- Yerleşim ---------- */
  const lay = { s: 40, x: 0, y: 0, pos: [], pillY: 30, pillS: 14, jar: { x: 0, y: 0, r: 26 } };
  let lastW = 0;
  let lastH = 0;
  let backdrop = null;
  const relayout = (force = false) => {
    const { W, H } = stage;
    if (!force && W === lastW && H === lastH) return;
    lastW = W;
    lastH = H;
    col = themeColors();
    // Üstte kelime hapına yer kalır
    const ph = clamp(H * 0.11, 40, 58);
    const s = Math.min((W - 14) / (5 * 1.74), (H - ph - 14) / (ROWS.length * 1.5 + 0.5));
    lay.s = s;
    lay.x = (W - 5 * 1.74 * s) / 2;
    lay.y = ph + (H - ph - (ROWS.length * 1.5 + 0.5) * s) / 2;
    lay.pillY = Math.max(ph * 0.55, lay.y - s * 0.55);
    lay.pillS = clamp(s * 0.36, 11, 18);
    lay.pos = CELLS.map((c) => ({ x: lay.x + (c.c + c.off) * s * 1.74 + s * 0.87, y: lay.y + c.r * s * 1.5 + s }));
    // Kavanoz alt köşedeki boşluğa oturur, harfleri örtmez
    const jr = clamp(s * 0.6, 18, 40);
    lay.jar = { x: Math.min(W - jr * 0.95, lay.x + 7.85 * s), y: Math.min(H - jr * 1.1, lay.y + 7.25 * s), r: jr };
    tapEl.style.top = `${lay.pillY}px`;
    backdrop = combBackdrop(W, H, stage.dpr, s * 0.8, col);
  };
  relayout();
  my.on(document, 'hk-theme', () => relayout(true));
  // Petek ortadan dışa doğru dolar
  const midP = lay.pos[9];
  ALL.forEach((i) => { game.born[i] = -(Math.hypot(lay.pos[i].x - midP.x, lay.pos[i].y - midP.y) / lay.s) * 0.045 - rand(0, 0.05); });

  const curWord = () => game.sel.map((i) => game.letters[i]).join('');
  const kindOf = (w) => {
    if (w.length < 3) return null;
    if (game.used.has(w)) return 'used';
    if (SOZ.has(w) || (lists && lists.common.has(w))) return 'ok';
    if (lists && lists.big.has(w)) return 'extra';
    return null;
  };
  const say = (text, kind, t = 0.9) => { game.pill = { text, kind, t }; };

  /* ---------- Kelime kontrolü ---------- */

  function syncWord() {
    tapEl.classList.toggle('on', game.tapped && game.sel.length > 0);
  }

  function banner(text, cls = '') {
    bannerEl.textContent = text;
    bannerEl.className = `kv-banner on ${cls}`;
    my.timeout(() => bannerEl.classList.remove('on'), 1100);
  }

  function setProg(add) {
    game.prog += add;
    pbar.style.width = `${clamp((game.prog / goal.n) * 100, 0, 100)}%`;
    if (game.prog >= goal.n && !game.done) my.timeout(finish, 650);
  }

  // Bulunanlar şeridi: en yeni başta, dokununca kelime kartı
  function addChip(w) {
    game.found.unshift(w);
    const empty = foundEl.querySelector('.pk-empty');
    if (empty) empty.remove();
    const b = document.createElement('button');
    b.className = `pk-chip ${meaningOf(w) ? '' : 'pk-chip-plain'}`;
    b.dataset.w = w;
    b.textContent = trUpper(w);
    foundEl.prepend(b);
    b.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  }
  my.on(foundEl, 'click', (e) => {
    const b = e.target.closest('[data-w]');
    if (!b) return;
    sfx.tap();
    game.paused = true;
    wordCard(b.dataset.w, { onClose: () => { game.paused = false; } });
  });

  // Harfler kavanoza uçar, yerlerine yenileri dolar
  function popCells(path, power) {
    path.forEach((i, k) => {
      const p = lay.pos[i];
      game.pops.push({ x: p.x, y: p.y, c: game.letters[i], t: -k * 0.05 });
      fx.burst(p.x, p.y, { n: 10 + k, colors: ['#ffcd3c', '#fff3cf', '#ffa41a'], power });
      fx.ring(p.x, p.y, '#fff6d8', lay.s * 1.3);
    });
    if (game.hint && game.hint.path.some((i) => path.includes(i))) {
      game.hint = null;
      game.fly = null;
    }
    refill(path);
    path.forEach((i, k) => { game.born[i] = -(0.16 + k * 0.06); });
    // Sonsuzda ara ara altın göz çıkar: o gözden geçen kelime iki kat puan
    if (endless) {
      if (path.includes(game.gold)) game.gold = -1;
      if (game.gold < 0 && Math.random() < 0.32) {
        game.gold = pick(ALL.filter((i) => !path.includes(i)));
        game.goldT = 0;
      }
    }
    if (game.avail.size === 0 && !game.done) {
      my.timeout(() => {
        if (game.done) return;
        toast('Kelime kalmadı, petek karıştı.');
        doShuffle();
      }, 700);
    }
  }

  function submit() {
    const w = curWord();
    const path = game.sel.slice();
    game.sel = [];
    game.tapped = false;
    syncWord();
    if (w.length < 3 || game.done) return;
    const kind = kindOf(w);
    if (kind === 'used') {
      say(`${trUpper(w)} zaten bulundu`, 'used');
      sfx.soft();
      return;
    }
    if (kind === 'extra') {
      // Nadir kelime kabul edilir ama hedefe sayılmaz
      const pts = Math.round(scoreOf(w) * 0.3);
      game.extras++;
      game.used.add(w);
      game.honey += pts;
      game.jarPulse = 1;
      save.addJar(3);
      save.data.stats.extras++;
      save.addFound(w);
      addChip(w);
      say(trUpper(w), 'extra', 0.6);
      banner(`Ekstra: ${trUpper(w)}  +${pts}`, 'extra');
      sfx.coin();
      if (endless) { game.nectar = Math.min(100, game.nectar + 5); scoreEl.textContent = fmt(game.honey); }
      popCells(path, 150);
      if (goal.kind === 'bal') setProg(pts);
      return;
    }
    if (kind !== 'ok') {
      game.combo = 0;
      comboEl.classList.remove('on');
      sfx.bad();
      buzz(30);
      game.shakeCell = path[path.length - 1];
      my.timeout(() => { game.shakeCell = -1; }, 300);
      say(`${trUpper(w)} yok`, 'no', 0.8);
      if (endless) game.nectar = Math.max(0, game.nectar - 4);
      return;
    }
    game.used.add(w);
    game.combo++;
    game.comboT = 3.2;
    const gold = endless && path.includes(game.gold);
    const mult = (1 + Math.min(1.5, (game.combo - 1) * 0.25)) * (hard ? 1.5 : 1) * (endless ? 1 + (game.wave - 1) * 0.25 : 1) * (gold ? 2 : 1);
    const pts = Math.round(scoreOf(w) * mult);
    game.honey += pts;
    if (endless) {
      game.nectar = Math.min(100, game.nectar + w.length * 5 + Math.min(10, game.combo * 2) + (gold ? 12 : 0));
      scoreEl.textContent = fmt(game.honey);
      scoreEl.parentElement.animate([{ transform: 'scale(1.15)' }, { transform: 'none' }], { duration: 260 });
      if (gold) {
        const gp = lay.pos[game.gold];
        fx.burst(gp.x, gp.y, { n: 30, colors: ['#ffd34d', '#fff', '#ffb31a'], power: 320 });
        fx.ring(gp.x, gp.y, '#ffd34d', lay.s * 2.4);
      }
      game.waveWords++;
      if (game.waveWords >= WAVE_WORDS) nextWave();
    }
    game.jarPulse = 1;
    game.flash = 0.5;
    game.words++;
    save.addJar(jarGain(w, game.combo));
    save.data.stats.words++;
    save.addFound(w);
    save.touch();
    addChip(w);
    if (w.length > game.last.length) game.last = w;
    say(trUpper(w), 'ok', 0.6);
    banner(gold ? `Altın göz! ${trUpper(w)}  +${pts}` : `${trUpper(w)}  +${pts}`, gold || w.length >= 6 ? 'big' : '');
    if (game.combo >= 2) {
      comboEl.textContent = `${game.combo} üst üste  x${String(Math.round(mult * 100) / 100).replace('.', ',')}`;
      comboEl.classList.add('on');
    }
    if (w.length >= 6) shake(wrap, 8);
    sfx.good();
    tone({ type: 'triangle', f: 420 + w.length * 70, f2: 900, dur: 0.2, vol: 0.07 });
    buzz(16);
    popCells(path, game.combo >= 3 ? 340 : 220);
    for (let k = 0; k < Math.min(3, Math.ceil(w.length / 2)); k++) {
      game.bees.push({ x: rand(-40, stage.W * 0.3), y: rand(stage.H * 0.2, stage.H * 0.8), t: 0, w: rand(0, 6) });
    }
    if (endless) return;
    if (goal.kind === 'bal') setProg(pts);
    else if (goal.kind === 'kelime') setProg(1);
    else if (goal.kind === 'uzun') setProg(w.length >= goal.len ? 1 : 0);
    else setProg(w.split('').filter((c) => c === goal.letter).length);
  }

  function nextWave() {
    game.wave++;
    game.waveWords = 0;
    mix = lengthsOf(game.wave >= 4 ? 30 : game.wave === 3 ? 18 : 10, false);
    waveEl.textContent = `Nektar · ${game.wave}. dalga`;
    banner(`${game.wave}. Dalga  puan x${String(1 + (game.wave - 1) * 0.25).replace('.', ',')}`, 'big');
    sfx.fanfare();
    buzz(30);
    for (const p of lay.pos) fx.burst(p.x, p.y, { n: 3, colors: ['#ffcd3c', '#fff'], power: 120 });
  }

  function endRun() {
    if (game.done) return;
    game.done = true;
    game.sel = [];
    syncWord();
    const k = koloni();
    const bon = bonus(k);
    const honey = Math.round(game.honey * (1 + bon));
    const S = save.data.sonsuz;
    const record = game.honey > (S.best || 0);
    S.runs++;
    S.words += game.words;
    if (record) { S.best = game.honey; S.wave = game.wave; }
    save.data.stats.honey += honey;
    if (game.last.length > (save.data.stats.longest || '').length) save.data.stats.longest = game.last;
    save.touch('stats');
    submitScore();
    sfx.whoosh();
    my.timeout(() => resultSheet({
      title: record ? 'Yeni Rekor!' : 'Nektar Bitti',
      sub: `${game.wave}. dalgaya kadar dayandın.`,
      stars: null,
      honey,
      stats: [['Puan', fmt(game.honey)], ['Kelime', game.words], ['Dalga', game.wave], ['En uzun', game.last ? trUpper(game.last) : '-'], ['Rekor', fmt(S.best)], ...(bon ? [['Bahçe bereketi', `%${Math.round(bon * 100)}`]] : [])],
      buttons: [
        { label: 'Yeniden Dene', main: true, icon: 'replay', act: () => nav.toLevel(0) },
        { label: 'Kovana Dön', icon: 'home', act: () => nav.toHome() },
      ],
    }), 500);
  }

  /* ---------- Dokunma: parmağını gezdir ya da tek tek dokun ---------- */
  const link = letterLink(my, cv, {
    game,
    tap: true,
    cells: () => lay.pos,
    radius: () => lay.s,
    canLink: (a, b) => NEI[a].includes(b),
    valid: () => { const k = kindOf(curWord()); return k === 'ok' || k === 'extra'; },
    onStart: () => { sfx.tile(); buzz(5); },
    onAdd: () => {
      sfx.tile();
      buzz(5);
      tone({ type: 'sine', f: 300 + game.sel.length * 60, dur: 0.07, vol: 0.05 });
    },
    onPop: () => sfx.soft(),
    onChange: syncWord,
    submit,
  });

  my.on(tapEl, 'click', (e) => {
    const b = e.target.closest('[data-tap-act]');
    if (!b || game.done) return;
    sfx.tap();
    if (b.dataset.tapAct === 'ok') submit();
    else {
      game.sel.pop();
      if (!game.sel.length) game.tapped = false;
      syncWord();
    }
  });

  // Karıştır: aynı harfler, gözler birbirinin üstünden geçerek yer değiştirir
  function doShuffle() {
    const old = game.letters.slice();
    setBoard(arrange(old));
    const buckets = {};
    for (const j of shuffle(ALL.slice())) (buckets[old[j]] = buckets[old[j]] || []).push(j);
    const from = new Array(COUNT);
    for (const i of shuffle(ALL.slice())) {
      const b = buckets[game.letters[i]];
      let at = b.findIndex((j) => j !== i);
      if (at < 0) at = 0;
      from[i] = lay.pos[b.splice(at, 1)[0]];
    }
    game.aFrom = from;
    game.aT = 0;
    game.born.fill(null);
    game.sel = [];
    game.tapped = false;
    game.hint = null;
    game.fly = null;
    syncWord();
    sfx.whoosh();
    buzz(10);
  }

  /* ---------- Yardımlar ---------- */
  // Arı Yardımı: arı kavanozdan kalkar, rastgele bir kelimenin harflerinin üstünden sırayla geçer
  function doHint() {
    if (game.fly) return false;
    const m = scanBoard(game.letters, game.used);
    if (!m.size) {
      doShuffle();
      return false;
    }
    const words = [...m.keys()];
    const pool = focusSet && words.some((w) => focusSet.has(w)) ? words.filter((w) => focusSet.has(w)) : words;
    const word = pick(pool.filter((w) => w.length >= 4).length ? pool.filter((w) => w.length >= 4) : pool);
    game.hint = { word, path: m.get(word), lit: 0 };
    game.fly = { k: 0 };
    sfx.whoosh();
    buzz(10);
    return true;
  }
  // İpucu: petekteki bir kelimenin anlamı
  function closeClue() { clueEl.classList.remove('on'); }
  function doClue() {
    const words = [...scanBoard(game.letters, game.used).keys()].filter((w) => meaningOf(w) && w.length >= 4);
    if (!words.length) { say('İpucu bulunamadı', 'used', 1.2); return false; }
    const w = pick(words);
    clueEl.innerHTML = '';
    clueEl.append(Object.assign(document.createElement('b'), { textContent: `${w.length} harfli, petekte` }), document.createTextNode(meaningOf(w)));
    clueEl.classList.add('on');
    sfx.chime(88);
    my.timeout(closeClue, 14000);
    return true;
  }
  my.on(clueEl, 'click', closeClue);
  helpBar(my, wrap.querySelector('.hk-bar'), {
    game,
    onHint: () => { const ok = doHint(); if (ok) game.helps++; return ok; },
    onClue: () => { const ok = doClue(); if (ok) game.helps++; return ok; },
    onShuffle: doShuffle,
  });

  function finish() {
    if (game.done) return;
    game.done = true;
    game.sel = [];
    syncWord();
    const stars = game.helps === 0 ? 3 : game.helps <= 2 ? 2 : 1;
    levelDone({
      mode: 'petek', li, total: PETEK_LEVELS, stars, honey: game.honey, hard, longest: game.last,
      stats: [['Kelime', game.words], ['Ekstra', game.extras], ['Yardım', game.helps]],
      onNext: () => nav.toLevel(li + 1),
      onList: () => nav.toList(),
      onHome: () => nav.toHome(),
    });
  }

  nav.setBack(() => {
    if (game.done) { nav.toList(); return; }
    game.paused = true;
    pauseSheet({
      onResume: () => { game.paused = false; },
      onRestart: () => nav.toLevel(li),
      onQuit: () => nav.toHome(),
    });
  });

  // Nektar çubuğu
  const pbarEl = endless ? wrap.querySelector('[data-pbar]') : null;
  let lastN = -1;
  const tickNectar = (dt) => {
    if (!endless || game.done) return;
    game.nectar -= dt * DRAIN * 1.1 ** (game.wave - 1);
    const n = Math.max(0, game.nectar);
    if (Math.abs(n - lastN) > 0.3) {
      lastN = n;
      pbarEl.style.width = `${n}%`;
      pbarEl.parentElement.classList.toggle('low', n < 25);
    }
    if (n <= 0) endRun();
  };

  /* ---------- Çizim ---------- */

  // Göz yeri: karışırken yay çizerek yeni yerine gider
  const drawPos = (i) => {
    const p = lay.pos[i];
    if (game.aT >= 1) return p;
    const e = ease(clamp((game.aT - i * 0.018) / 0.62, 0, 1));
    const fr = game.aFrom[i] || p;
    const bulge = Math.sin(e * Math.PI);
    return {
      x: lerp(fr.x, p.x, e) - (p.y - fr.y) * bulge * 0.18,
      y: lerp(fr.y, p.y, e) + (p.x - fr.x) * bulge * 0.18,
      lift: bulge,
    };
  };
  const hollow = (g, x, y, s) => {
    hexPath(g, x, y, s);
    g.fillStyle = 'rgba(158,96,8,.5)';
    g.fill();
    g.lineWidth = Math.max(2, s * 0.05);
    g.strokeStyle = 'rgba(42,22,54,.35)';
    g.stroke();
  };

  const shown = [];
  my.raf((dt, t) => {
    const { W, H, g } = stage;
    stage.begin();
    relayout();
    link.tick();
    if (game.paused) dt = 0;
    tickNectar(dt);
    if (game.aT < 1) game.aT = Math.min(1, game.aT + dt * 1.5);
    g.drawImage(backdrop, 0, 0, W, H);

    const sel = game.sel;
    const base = lay.s * 0.92;
    const hint = game.hint;
    // Karışırken boş kalan gözler görünsün
    if (game.aT < 1) for (let i = 0; i < COUNT; i++) hollow(g, lay.pos[i].x, lay.pos[i].y, base);

    /* Gözler */
    for (let i = 0; i < COUNT; i++) {
      const p = drawPos(i);
      const on = sel.includes(i);
      const x = p.x + (game.shakeCell === i ? Math.sin(t / 22) * 4 : 0);
      const y = p.y;
      let b = game.born[i];
      let sc = 1;
      let letterK = 1;
      if (b !== null) {
        b += dt;
        game.born[i] = b >= 0.5 ? null : b;
      }
      if (b !== null) {
        // Boş göz, içine bal dolar, üstüne mum kapak büyür, harf çıkar
        hollow(g, x, y, base);
        if (b > 0) {
          const rise = clamp(b / 0.22, 0, 1);
          g.save();
          hexPath(g, x, y, base);
          g.clip();
          g.fillStyle = '#f0a000';
          const top = y + base - rise * base * 2;
          g.beginPath();
          g.moveTo(x - base, top);
          for (let px = -base; px <= base; px += base / 4) g.lineTo(x + px, top + Math.sin(px / (base * 0.28) + t / 90) * base * 0.06);
          g.lineTo(x + base, y + base);
          g.lineTo(x - base, y + base);
          g.closePath();
          g.fill();
          g.restore();
        }
        letterK = b > 0.22 ? backOut(clamp((b - 0.22) / 0.28, 0, 1)) : 0;
        sc = letterK;
      } else if (p.lift) sc = 1 + p.lift * 0.14;
      const s = base * (on ? 1.08 : 1) * sc;
      shown[i] = { x, y, s, letterK };
      // Çok küçük kapak çizilmez: dolma anında kara nokta görünmesin
      if (sc < 0.18) continue;
      const order = hint ? hint.path.indexOf(i) : -1;
      const litNow = order >= 0 && order < hint.lit;
      hexPath(g, x, y + 4, s);
      g.fillStyle = 'rgba(42,22,54,.22)';
      g.fill();
      hexPath(g, x, y, s);
      const goldNow = endless && i === game.gold;
      if (goldNow && !on) {
        const gg = g.createLinearGradient(x - s, y - s, x + s, y + s);
        const sh = (Math.sin(t / 260) + 1) / 2;
        gg.addColorStop(0, '#fff3b0');
        gg.addColorStop(Math.min(0.95, 0.2 + sh * 0.6), '#ffd34d');
        gg.addColorStop(1, '#f0a000');
        g.fillStyle = gg;
      } else g.fillStyle = on ? '#2ee6a0' : litNow ? '#ffffff' : col.cell;
      g.fill();
      g.lineWidth = Math.max(2.5, lay.s * 0.09);
      g.strokeStyle = INK;
      g.stroke();
      if (litNow) {
        hexPath(g, x, y, s * (1.04 + Math.sin(t / 170) * 0.03));
        g.strokeStyle = '#ff5fa2';
        g.lineWidth = Math.max(3, lay.s * 0.1);
        g.stroke();
      }
    }

    /* Arının yolu */
    if (hint && hint.lit > 0) {
      g.beginPath();
      for (let k = 0; k < hint.lit; k++) {
        const p = lay.pos[hint.path[k]];
        if (k) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y);
      }
      if (game.fly) g.lineTo(game.bee.x, game.bee.y);
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.strokeStyle = 'rgba(255,95,162,.55)';
      g.lineWidth = lay.s * 0.2;
      g.stroke();
    }

    /* Seçim ipi */
    const w = curWord();
    const kind = kindOf(w);
    if (sel.length) drawRope(g, sel.map((i) => shown[i]), link.finger, lay.s, kind === 'ok' || kind === 'extra' ? kind : null, t);

    /* Harfler */
    for (let i = 0; i < COUNT; i++) {
      const c = shown[i];
      if (c.letterK < 0.3) continue;
      const ls = c.s;
      label(g, c.x, c.y + ls * 0.06, trUpper(game.letters[i]), { size: ls * 0.92, color: INK, stroke: NONE, sw: 0, font: FONT });
      label(g, c.x + ls * 0.5, c.y - ls * 0.42, String(VAL[game.letters[i]] || 2), { size: ls * 0.32, color: col.mark, stroke: NONE, sw: 0, font: FONT });
      const order = hint ? hint.path.indexOf(i) : -1;
      if (order >= 0 && order < hint.lit) {
        // Arının geçiş sırası
        const nx = c.x - ls * 0.5;
        const ny = c.y - ls * 0.42;
        g.beginPath();
        g.arc(nx, ny, ls * 0.2, 0, Math.PI * 2);
        g.fillStyle = '#ff5fa2';
        g.fill();
        label(g, nx, ny + ls * 0.01, String(order + 1), { size: ls * 0.28, color: '#fff', stroke: NONE, sw: 0, font: FONT });
      }
    }

    /* Kelime hapı: tahtanın hemen üstünde */
    if (w) drawPill(g, W / 2, lay.pillY, trUpper(w), kind, lay.pillS, t, 0, col);
    else if (game.pill.t > 0) {
      game.pill.t -= dt;
      g.globalAlpha = clamp(game.pill.t * 3, 0, 1);
      drawPill(g, W / 2, lay.pillY, game.pill.text, game.pill.kind, lay.pillS, t, game.pill.kind === 'no' ? clamp(game.pill.t * 2, 0, 1) : 0, col);
      g.globalAlpha = 1;
    }

    /* Kavanoz: yardımların kaynağı */
    const jr = lay.jar.r;
    if (game.jarPulse > 0) game.jarPulse = Math.max(0, game.jarPulse - dt * 2.4);
    drawJar(g, lay.jar.x, lay.jar.y, jr, save.get('jar') / 100, game.jarPulse, t, rrect);
    label(g, lay.jar.x, lay.jar.y + jr * 0.2, `%${Math.round(save.get('jar'))}`, { size: jr * 0.44, color: '#fff', stroke: INK, sw: 0.3, font: FONT });

    /* Kavanoza uçan harfler */
    game.pops = game.pops.filter((p) => {
      p.t += dt * 1.6;
      if (p.t <= 0) return true;
      if (p.t >= 1) return false;
      const k = ease(p.t);
      const x = lerp(p.x, lay.jar.x, k);
      const y = lerp(p.y, lay.jar.y, k) - Math.sin(p.t * Math.PI) * lay.s * 1.3;
      const s = lay.s * (0.8 - p.t * 0.5);
      hexPath(g, x, y, s);
      g.fillStyle = '#ffcd3c';
      g.fill();
      g.lineWidth = 2.4;
      g.strokeStyle = INK;
      g.stroke();
      label(g, x, y, trUpper(p.c), { size: s * 0.95, color: INK, stroke: NONE, sw: 0, font: FONT });
      return true;
    });

    /* Yardım arısı: kavanozdan kalkar, kelimenin üstünden geçer, geri döner */
    const bee = game.bee;
    const bsz = Math.max(13, lay.s * 0.42);
    if (!bee.x) { bee.x = lay.jar.x; bee.y = lay.jar.y - jr * 1.6; }
    let bdx = 0;
    if (game.fly && hint) {
      const p = lay.pos[hint.path[game.fly.k]];
      const dx = p.x - bee.x;
      const dy = p.y - bee.y;
      const d = Math.hypot(dx, dy);
      const v = lay.s * (game.fly.k === 0 ? 11 : 4.8) * dt;
      bdx = dx;
      if (d <= v + 0.5) {
        bee.x = p.x;
        bee.y = p.y;
        hint.lit = Math.max(hint.lit, game.fly.k + 1);
        fx.ring(p.x, p.y, '#ff5fa2', lay.s * 1.2);
        tone({ type: 'sine', f: 520 + game.fly.k * 90, dur: 0.1, vol: 0.06 });
        buzz(6);
        game.fly.k++;
        if (game.fly.k >= hint.path.length) game.fly = null;
      } else {
        bee.x += (dx / d) * v;
        bee.y += (dy / d) * v;
      }
    } else {
      const hx = lay.jar.x;
      const hy = lay.jar.y - jr * 1.6;
      bdx = hx - bee.x;
      const k = Math.min(1, dt * 3);
      bee.x += (hx - bee.x) * k;
      bee.y += (hy - bee.y) * k;
    }
    bee.ang = lerp(bee.ang, clamp(bdx * 0.012, -0.5, 0.5), Math.min(1, dt * 6));
    drawBee(g, bee.x, bee.y + Math.sin(t / 150) * 3 - (game.fly ? bsz * 0.9 : 0), bsz, t, bee.ang);

    /* Bal taşıyan arılar */
    game.bees = game.bees.filter((b) => {
      b.t += dt * 0.55;
      if (b.t >= 1) return false;
      drawBee(g, lerp(b.x, lay.jar.x, b.t), lerp(b.y, lay.jar.y - jr, b.t) + Math.sin(t / 160 + b.w) * 12, lay.s * 0.3, t);
      return true;
    });

    if (game.comboT > 0) {
      game.comboT -= dt;
      if (game.comboT <= 0) {
        game.combo = 0;
        comboEl.classList.remove('on');
      }
    }
    if (game.flash > 0) {
      game.flash -= dt;
      g.fillStyle = `rgba(255,255,255,${Math.max(0, game.flash) * 0.2})`;
      g.fillRect(0, 0, W, H);
    }
    fx.draw(g, dt);
    return undefined;
  });

  /* Bot ve hata ayıklama için */
  game.posOf = (i) => lay.pos[i];
  game.scan = () => scanBoard(game.letters, game.used);
  game.freshBoard = () => freshBoard();
  game.shuffleNow = doShuffle;
  return { dispose: () => my.dispose(), get st() { return game; } };
}
