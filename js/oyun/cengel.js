// Çengel Bulmaca: alttaki harf çarkından kelime yaz, kelimeler üstteki bulmacaya yerleşsin.
// Kelimeler birbirini keser; bulmacada olmayan geçerli kelimeler ekstra sayılır.
// Her on bölüm Türkiye'den bir manzara (diyar.js). Görünüm ferah: ince gölge, kalın çizgi yok.

import { Life, html, toHTML, raw, fitCanvas, clamp, lerp, trUpper, shuffle, pick } from '../core/dom.js';
import { save } from '../core/save.js';
import { sfx, buzz, tone, syncVolumes } from '../core/audio.js';
import { makeFx, rrect, label } from '../core/fx.js';
import { pauseSheet, openSheet, icon } from '../core/ui.js';
import { CENGEL } from '../data/cengel-levels.js';
import { loadLists, letterLink, drawBee, hexPath } from './bag.js';
import { helpBar, jarGain, COST } from './yardim.js';
import { wordCard, meaningOf } from './kart.js';
import { levelDone } from './bitir.js';
import { diyarOf } from './diyar.js';

export const CENGEL_LEVELS = CENGEL.length;
const VAL = { a: 1, e: 1, i: 1, ı: 1, n: 1, r: 1, l: 1, k: 1, d: 2, m: 2, t: 2, y: 2, u: 2, s: 2, b: 3, o: 2, ü: 3, z: 4, ş: 4, g: 3, ç: 4, c: 4, h: 4, p: 5, v: 5, ğ: 6, ö: 5, f: 6, j: 8 };
const scoreOf = (w) => w.split('').reduce((a, c) => a + (VAL[c] || 2), 0) * w.length;
const ease = (t) => t * t * (3 - 2 * t);
const backOut = (t) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;
const FONT = '"Baloo 2", sans-serif';
const NONE = 'rgba(0,0,0,0)';

// Bölgeye ilk girişte kartpostal
export function postcard(d, li, after) {
  openSheet(html`
    <div class="pc">
      <div class="pc-art">${raw(`<svg viewBox="0 0 400 420" preserveAspectRatio="xMidYMid slice">${d.svg()}</svg>`)}</div>
      <small>${Math.floor(li / 10) + 1}. durak · ${d.place}</small>
      <h2>${d.name}</h2>
      <p>${d.text}</p>
    </div>
    <button class="btn btn-main btn-big" data-act="ok" style="--accent:${d.accent};--accent-ink:#fff">${icon('arrow')}Yola Çık</button>`, {
    cls: 'sheet-pc',
    actions: { ok: (close) => close() },
    onClose: () => after && after(),
  });
}

export function playCengel(root, nav, li) {
  const my = new Life();
  const fx = makeFx();
  const lv = CENGEL[li % CENGEL_LEVELS];
  const d = diyarOf(li);
  const pool = lv.l.split('');
  const n = pool.length;
  let lists = null;
  loadLists().then((l) => { lists = l; }).catch(() => {});

  // Izgara: her hücre hangi kelimelerde, kelime hangi hücrelerde
  const cells = new Map();
  const words = lv.w.map(([w, r, c, dir], wi) => {
    const keys = [];
    for (let k = 0; k < w.length; k++) {
      const rr = dir ? r + k : r;
      const cc = dir ? c : c + k;
      const key = `${rr},${cc}`;
      if (!cells.has(key)) cells.set(key, { r: rr, c: cc, ch: w[k], words: [], shown: false, hint: false, pop: 0, wig: 0, x: 0, y: 0 });
      cells.get(key).words.push(wi);
      keys.push(key);
    }
    return { w, keys, dir, found: false };
  });
  const byWord = new Map(words.map((x) => [x.w, x]));
  const game = {
    order: shuffle(pool.map((_, i) => i)), sel: [], honey: 0, combo: 0, comboT: 0, helps: 0,
    found: 0, total: words.length, extras: new Set(), last: '', done: false, paused: false,
    flyers: [], aT: 0, aFrom: [], beeTask: null, bee: { x: 0, y: 0, ang: 0 }, clue: null,
    pill: { text: '', kind: null, t: 0 }, hover: null,
  };

  root.innerHTML = toHTML(html`
    <div class="cg" style="--ac:${d.accent};--ac2:${d.accent2};--cg-ink:${d.ink}">
      <div class="cg-bg">${raw(`<svg viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">${d.svg()}</svg>`)}</div>
      <div class="cg-veil"></div>
      <header class="cg-top">
        <button class="cg-glass" data-act="back" aria-label="Geri">${icon('back')}</button>
        <div class="cg-title"><small>${d.place}</small><b>${d.name} · ${(li % 10) + 1}</b></div>
        <button class="cg-glass" data-act="sound" aria-label="Ses">${icon(save.get('sound') ? 'sound' : 'mute')}</button>
      </header>
      <div class="cg-stage">
        <canvas class="cg-cv"></canvas>
        <div class="cg-side cg-left">
          <button class="cg-round hk-jar" data-act="jar" aria-label="Kavanoz"><span data-jar-ic></span><b data-jar>%0</b></button>
          <button class="cg-round" data-act="extras" aria-label="Ekstra kelimeler">${icon('star')}<b data-extra>0</b></button>
        </div>
        <div class="cg-side cg-right">
          <button class="cg-round" data-act="clue" aria-label="İpucu">${icon('quote')}<small>%${COST.clue}</small><i class="hk-cd" data-cd="clue"></i></button>
          <button class="cg-round cg-main" data-act="hint" aria-label="Arı Yardımı">${icon('bee')}<small>%${COST.hint}</small><i class="hk-cd" data-cd="hint"></i></button>
        </div>
        <button class="cg-shuffle" data-act="shuffle" aria-label="Karıştır">${icon('shuffle')}</button>
        <div class="cg-clue" data-clue></div>
        <div class="cg-banner" data-banner></div>
      </div>
    </div>`);
  const wrap = root.querySelector('.cg');
  const cv = wrap.querySelector('.cg-cv');
  const stageEl = wrap.querySelector('.cg-stage');
  const clueEl = wrap.querySelector('[data-clue]');
  const bannerEl = wrap.querySelector('[data-banner]');
  const extraEl = wrap.querySelector('[data-extra]');
  const stage = fitCanvas(cv, my);

  /* ---------- Yerleşim ---------- */
  const lay = { cs: 30, gx: 0, gy: 0, cx: 0, cy: 0, R: 120, lr: 26, ring: [], pillY: 0, side: false };
  let lastW = 0;
  let lastH = 0;
  function relayout() {
    const { W, H } = stage;
    if (W === lastW && H === lastH) return;
    lastW = W;
    lastH = H;
    // Yan ekranda bulmaca solda, çark sağda; diğer her durumda alt alta
    const side = W / H > 1.35 && H < 620;
    lay.side = side;
    const colW = side ? W : Math.min(W, 620);
    const x0 = (W - colW) / 2;
    let gx0;
    let gy0;
    let gw;
    let gh;
    if (side) {
      // Çarkın iki yanındaki düğmelere yer kalsın
      lay.R = clamp(Math.min(H * 0.34, (W * 0.5 - 160) / 2), 78, 150);
      lay.cx = W * 0.73;
      lay.cy = H * 0.57;
      lay.pillY = lay.cy - lay.R - 24;
      gx0 = 14;
      gy0 = 12;
      gw = W * 0.47 - 24;
      gh = H - 24;
    } else {
      lay.R = clamp(Math.min(colW / 2 - 72, H * 0.19), 88, 150);
      lay.cx = W / 2;
      lay.cy = H - lay.R - 22;
      lay.pillY = lay.cy - lay.R - 30;
      gx0 = x0 + 16;
      gy0 = 8;
      gw = colW - 32;
      gh = lay.pillY - 30 - gy0;
    }
    const gap = 0.12;
    lay.cs = Math.min(gw / (lv.W + (lv.W - 1) * gap), gh / (lv.H + (lv.H - 1) * gap), 64);
    lay.gap = lay.cs * gap;
    const tw = lv.W * lay.cs + (lv.W - 1) * lay.gap;
    const th = lv.H * lay.cs + (lv.H - 1) * lay.gap;
    lay.gx = gx0 + (gw - tw) / 2;
    lay.gy = gy0 + (gh - th) / 2;
    for (const cell of cells.values()) {
      cell.x = lay.gx + cell.c * (lay.cs + lay.gap) + lay.cs / 2;
      cell.y = lay.gy + cell.r * (lay.cs + lay.gap) + lay.cs / 2;
    }
    lay.lr = lay.R * 0.2;
    const rr = lay.R * (n > 6 ? 0.66 : 0.62);
    lay.ring = pool.map((_, i) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      return { x: lay.cx + Math.cos(a) * rr, y: lay.cy + Math.sin(a) * rr };
    });
    // Yan düğmeler çarkın iki yanına oturur
    stageEl.style.setProperty('--wy', `${lay.cy}px`);
    stageEl.style.setProperty('--wx', `${lay.cx}px`);
    stageEl.style.setProperty('--wr', `${lay.R}px`);
  }
  relayout();
  game.aFrom = lay.ring.map(() => ({ x: lay.cx, y: lay.cy }));

  const letterAt = (i) => pool[game.order[i]];
  const curWord = () => game.sel.map((i) => letterAt(i)).join('');
  const ringPos = (i) => {
    const p = lay.ring[i];
    if (game.aT >= 1) return p;
    const e = ease(clamp((game.aT - i * 0.05) / 0.6, 0, 1));
    const fr = game.aFrom[i] || p;
    return { x: lerp(fr.x, p.x, e), y: lerp(fr.y, p.y, e) };
  };

  /* ---------- Kelime kontrolü ---------- */
  const isExtra = (w) => {
    if (byWord.has(w)) return false;
    return !!(lists && (lists.common.has(w) || lists.big.has(w)));
  };
  const kindNow = (w) => {
    if (w.length < 3) return null;
    const x = byWord.get(w);
    if (x) return x.found ? 'used' : 'ok';
    return isExtra(w) ? (game.extras.has(w) ? 'used' : 'extra') : null;
  };
  const say = (text, kind, t = 0.9) => { game.pill = { text, kind, t }; };
  function banner(text) {
    bannerEl.textContent = text;
    bannerEl.classList.remove('on');
    void bannerEl.offsetWidth;
    bannerEl.classList.add('on');
  }

  // Harfleri başka kelimelerle ya da arıyla açılmış kelimeler de tamamlanmış sayılır
  function completeOthers(extraKeys = []) {
    for (const o of words) {
      if (o.found || !o.keys.every((key) => cells.get(key).shown || cells.get(key).hint || extraKeys.includes(key))) continue;
      o.found = true;
      game.found++;
      save.addFound(o.w);
      o.keys.forEach((key) => {
        const q = cells.get(key);
        if (q.hint && !q.shown && !extraKeys.includes(key)) { q.shown = true; q.pop = 1; }
      });
    }
    if (game.found >= game.total && !game.done) my.timeout(finish, 1100);
  }

  function reveal(x, from) {
    x.found = true;
    game.found++;
    x.keys.forEach((key, k) => {
      const cell = cells.get(key);
      if (cell.shown) return;
      game.flyers.push({ cell, c: cell.ch, x: from[k] ? from[k].x : lay.cx, y: from[k] ? from[k].y : lay.cy, t: -k * 0.07 });
    });
    completeOthers(x.keys);
  }

  function submit() {
    const w = curWord();
    const path = game.sel.slice();
    game.sel = [];
    if (w.length < 3 || game.done) return;
    const x = byWord.get(w);
    if (x && x.found) {
      say(`${trUpper(w)} zaten var`, 'used');
      x.keys.forEach((key) => { cells.get(key).wig = 1; });
      sfx.soft();
      return;
    }
    if (!x) {
      if (isExtra(w) && !game.extras.has(w)) {
        game.extras.add(w);
        save.data.cengel.extras = (save.data.cengel.extras || 0) + 1;
        save.addFound(w);
        save.addJar(3);
        game.honey += Math.round(scoreOf(w) * 0.4);
        extraEl.textContent = game.extras.size;
        extraEl.parentElement.animate([{ transform: 'scale(1.3)' }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.34,1.56,.64,1)' });
        say(trUpper(w), 'extra', 0.7);
        sfx.coin();
        return;
      }
      if (game.extras.has(w)) { say(`${trUpper(w)} zaten var`, 'used'); sfx.soft(); return; }
      game.combo = 0;
      say(trUpper(w), 'no', 0.7);
      sfx.bad();
      buzz(30);
      return;
    }
    game.combo++;
    game.comboT = 3.4;
    const pts = Math.round(scoreOf(w) * (1 + Math.min(1, (game.combo - 1) * 0.2)));
    game.honey += pts;
    if (w.length > game.last.length) game.last = w;
    save.addJar(jarGain(w, game.combo));
    save.data.stats.words++;
    save.addFound(w);
    save.touch();
    if (game.clue === w) closeClue();
    say(trUpper(w), 'ok', 0.6);
    if (game.combo >= 3) banner(`${game.combo} üst üste!`);
    sfx.good();
    tone({ type: 'triangle', f: 440 + w.length * 60, f2: 880, dur: 0.2, vol: 0.06 });
    buzz(14);
    reveal(x, path.map((i) => ringPos(i)));
  }

  /* ---------- Dokunma ---------- */
  const link = letterLink(my, cv, {
    game,
    cells: () => lay.ring,
    radius: () => lay.lr,
    canLink: () => true,
    valid: () => { const k = kindNow(curWord()); return k === 'ok' || k === 'extra'; },
    onStart: () => sfx.tile(),
    onAdd: () => {
      sfx.tile();
      buzz(5);
      tone({ type: 'sine', f: 320 + game.sel.length * 60, dur: 0.07, vol: 0.05 });
    },
    onPop: () => sfx.soft(),
    onChange: () => {},
    submit,
  });
  // Bulmacadaki bulunmuş kelimeye dokununca kartı açılır, fareyle üstüne gelince kıpırdar
  const local = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const cellAt = (p) => {
    const h = lay.cs / 2 + lay.gap / 2;
    for (const cell of cells.values()) if (Math.abs(cell.x - p.x) < h && Math.abs(cell.y - p.y) < h) return cell;
    return null;
  };
  let flip = 0;
  my.on(cv, 'pointerdown', (e) => {
    if (game.done || game.paused || game.sel.length) return;
    const cell = cellAt(local(e));
    if (!cell) return;
    const found = cell.words.map((i) => words[i]).filter((x) => x.found);
    if (!found.length) return;
    const x = found[flip++ % found.length];
    x.keys.forEach((key) => { cells.get(key).wig = 1; });
    sfx.tap();
    game.paused = true;
    wordCard(x.w, { onClose: () => { game.paused = false; } });
  });
  my.on(cv, 'pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    const cell = cellAt(local(e));
    const x = cell ? cell.words.map((i) => words[i]).find((w) => w.found) : null;
    if (x !== game.hover) {
      game.hover = x || null;
      if (x) x.keys.forEach((key) => { cells.get(key).wig = Math.max(cells.get(key).wig, 0.7); });
    }
    cv.style.cursor = x ? 'pointer' : 'default';
  });

  function doShuffle() {
    const prev = game.order.slice();
    game.order = shuffle(game.order.slice());
    game.aFrom = game.order.map((inst, i) => lay.ring[prev.indexOf(inst)] || lay.ring[i]);
    game.aT = 0;
    game.sel = [];
    sfx.whoosh();
    buzz(8);
    wrap.querySelector('.cg-shuffle').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 500, easing: 'cubic-bezier(.3,1.2,.4,1)' });
  }

  /* ---------- Yardımlar ---------- */
  // Arı Yardımı: rastgele bir boş göze harf taşır
  function doHint() {
    if (game.beeTask) return false;
    const empty = [...cells.values()].filter((c) => !c.shown && !c.hint);
    if (!empty.length) return false;
    const cell = pick(empty);
    game.beeTask = { cell };
    sfx.whoosh();
    buzz(10);
    return true;
  }
  function closeClue() {
    game.clue = null;
    clueEl.classList.remove('on');
  }
  // İpucu: henüz bulunmamış bir kelimenin anlamı, kelimenin gözleri parlar
  function doClue() {
    const open = words.filter((x) => !x.found && meaningOf(x.w) && x.w !== game.clue);
    if (!open.length) return false;
    const x = pick(open);
    game.clue = x.w;
    clueEl.innerHTML = '';
    clueEl.append(Object.assign(document.createElement('b'), { textContent: `${x.w.length} harfli · ${x.dir ? 'dikey' : 'yatay'}` }), document.createTextNode(meaningOf(x.w)));
    clueEl.classList.add('on');
    sfx.chime(88);
    my.timeout(() => { if (game.clue === x.w) closeClue(); }, 15000);
    return true;
  }
  helpBar(my, stageEl, {
    game,
    onHint: () => { const ok = doHint(); if (ok) game.helps++; return ok; },
    onClue: () => { const ok = doClue(); if (ok) game.helps++; return ok; },
    onShuffle: doShuffle,
  });
  my.on(clueEl, 'click', closeClue);
  my.on(wrap, 'click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'back') { sfx.tap(); back(); }
    else if (b.dataset.act === 'sound') {
      const on = !save.get('sound');
      save.set('sound', on);
      save.set('music', on);
      syncVolumes();
      b.innerHTML = toHTML(icon(on ? 'sound' : 'mute'));
      document.dispatchEvent(new Event('hk-music'));
    } else if (b.dataset.act === 'extras') {
      const list = [...game.extras];
      game.paused = true;
      openSheet(html`
        <h2 class="sh-title">Ekstra Kelimeler</h2>
        <p class="sh-text">${list.length ? 'Bulmacada olmayan ama doğru bulduğun kelimeler. Her biri kavanoza bal katar.' : 'Bulmacada olmayan doğru bir kelime bulursan buraya düşer ve kavanoza bal katar.'}</p>
        ${list.length ? html`<div class="chips">${list.map((w) => html`<button class="chip" data-w="${w}">${trUpper(w)}</button>`)}</div>` : ''}
        <button class="btn btn-main" data-act="ok">Tamam</button>`, {
        actions: { ok: (c) => c() },
        onClose: () => { game.paused = false; },
      }).el.addEventListener('click', (ev) => {
        const c = ev.target.closest('[data-w]');
        if (c) wordCard(c.dataset.w);
      });
    }
  });

  function finish() {
    if (game.done) return;
    game.done = true;
    const stars = game.helps === 0 ? 3 : game.helps <= 2 ? 2 : 1;
    levelDone({
      mode: 'cengel', li, total: CENGEL_LEVELS, stars, honey: game.honey, longest: game.last,
      stats: [['Kelime', `${game.found}/${game.total}`], ['Ekstra', game.extras.size], ['Yardım', game.helps]],
      onNext: () => nav.toLevel(li + 1),
      onList: () => nav.toList(),
      onHome: () => nav.toHome(),
    });
  }
  function back() {
    if (game.done) { nav.toList(); return; }
    game.paused = true;
    pauseSheet({
      onResume: () => { game.paused = false; },
      onRestart: () => nav.toLevel(li),
      onQuit: () => nav.toHome(),
    });
  }
  nav.setBack(back);
  const region = Math.floor(li / 10);
  if (li % 10 === 0 && (save.data.cengel.seen ?? -1) < region) {
    game.paused = true;
    my.timeout(() => postcard(d, li, () => {
      save.data.cengel.seen = region;
      save.touch();
      game.paused = false;
    }), 450);
  }

  /* ---------- Çizim ---------- */
  const tile = (g, x, y, s, fill, shadow = 'rgba(40,30,70,.16)') => {
    const r = s * 0.24;
    rrect(g, x - s / 2, y - s / 2 + s * 0.07, s, s, r);
    g.fillStyle = shadow;
    g.fill();
    rrect(g, x - s / 2, y - s / 2, s, s, r);
    g.fillStyle = fill;
    g.fill();
  };

  my.raf((dt, t) => {
    const { W, H, g } = stage;
    stage.begin();
    relayout();
    link.tick();
    if (game.paused) dt = 0;
    if (game.aT < 1) game.aT = Math.min(1, game.aT + dt * 1.8);
    const cs = lay.cs;
    const grad = g.createLinearGradient(0, lay.gy, 0, lay.gy + lv.H * (cs + lay.gap));
    grad.addColorStop(0, d.accent);
    grad.addColorStop(1, d.accent2);

    /* Bulmaca */
    const clueKeys = game.clue ? byWord.get(game.clue).keys : null;
    for (const [key, cell] of cells) {
      if (cell.pop > 0) cell.pop = Math.max(0, cell.pop - dt * 2.4);
      if (cell.wig > 0) cell.wig = Math.max(0, cell.wig - dt * 1.6);
      const wy = cell.wig ? Math.sin(t / 55 + cell.c * 0.8 + cell.r) * cs * 0.08 * cell.wig : 0;
      const sc = cell.pop ? backOut(1 - cell.pop) : 1;
      const s = cs * (cell.pop ? clamp(sc, 0, 1.15) : 1);
      const lit = clueKeys && clueKeys.includes(key) && !cell.shown;
      if (cell.shown) {
        tile(g, cell.x, cell.y + wy, s, grad);
        label(g, cell.x, cell.y + wy + s * 0.04, trUpper(cell.ch), { size: s * 0.62, color: '#fff', stroke: NONE, sw: 0, font: FONT });
      } else if (cell.hint) {
        tile(g, cell.x, cell.y, s, '#ffffff');
        label(g, cell.x, cell.y + s * 0.04, trUpper(cell.ch), { size: s * 0.62, color: d.accent2, stroke: NONE, sw: 0, font: FONT });
      } else {
        tile(g, cell.x, cell.y, s, lit ? `rgba(255,255,255,${0.86 + Math.sin(t / 180) * 0.1})` : 'rgba(255,255,255,.72)', 'rgba(40,30,70,.10)');
        if (lit) {
          rrect(g, cell.x - s / 2 - 2, cell.y - s / 2 - 2, s + 4, s + 4, s * 0.28);
          g.strokeStyle = d.accent;
          g.lineWidth = 2.5;
          g.stroke();
        }
      }
    }

    /* Harf çarkı */
    const R = lay.R;
    g.beginPath();
    g.arc(lay.cx, lay.cy + 6, R, 0, Math.PI * 2);
    g.fillStyle = 'rgba(40,30,70,.12)';
    g.fill();
    g.beginPath();
    g.arc(lay.cx, lay.cy, R, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,.9)';
    g.fill();
    // Ortada silik petek izi
    hexPath(g, lay.cx, lay.cy, R * 0.16);
    g.strokeStyle = 'rgba(40,30,70,.1)';
    g.lineWidth = 2;
    g.stroke();
    const sel = game.sel;
    const w = curWord();
    const kind = kindNow(w);
    // Seçilen harfler arasındaki çizgi parmağa kadar uzanır
    if (sel.length) {
      g.beginPath();
      sel.forEach((i, k) => { const p = ringPos(i); if (k) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); });
      if (link.finger.on) g.lineTo(link.finger.x, link.finger.y);
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.strokeStyle = d.accent;
      g.globalAlpha = 0.85;
      g.lineWidth = R * 0.075;
      g.stroke();
      g.globalAlpha = 1;
    }
    for (let i = 0; i < n; i++) {
      const p = ringPos(i);
      const on = sel.includes(i);
      if (on) {
        g.beginPath();
        g.arc(p.x, p.y, lay.lr * 1.05, 0, Math.PI * 2);
        g.fillStyle = d.accent;
        g.fill();
      }
      label(g, p.x, p.y + lay.lr * 0.08, trUpper(letterAt(i)), { size: lay.lr * 1.55, color: on ? '#fff' : d.ink, stroke: NONE, sw: 0, font: FONT });
    }

    /* Kelime hapı */
    let text = w ? trUpper(w) : '';
    let pk = kind;
    let alpha = 1;
    if (!w && game.pill.t > 0) {
      game.pill.t -= dt;
      text = game.pill.text;
      pk = game.pill.kind;
      alpha = clamp(game.pill.t * 3, 0, 1);
    }
    if (text) {
      g.globalAlpha = alpha;
      g.font = `800 ${Math.round(R * 0.2)}px ${FONT}`;
      const tw = g.measureText(text).width + R * 0.36;
      const ph = R * 0.32;
      const shk = pk === 'no' ? Math.sin(t / 24) * 4 * alpha : 0;
      const col = pk === 'ok' ? '#2fbf86' : pk === 'extra' ? '#3a9be0' : pk === 'no' ? '#e5566d' : pk === 'used' ? '#c9a227' : d.accent;
      rrect(g, lay.cx - tw / 2 + shk, lay.pillY - ph / 2, tw, ph, ph / 2);
      g.fillStyle = col;
      g.fill();
      label(g, lay.cx + shk, lay.pillY + ph * 0.04, text, { size: R * 0.2, color: '#fff', stroke: NONE, sw: 0, font: FONT });
      g.globalAlpha = 1;
    }

    /* Bulmacaya uçan harfler */
    game.flyers = game.flyers.filter((f) => {
      f.t += dt * 1.8;
      if (f.t <= 0) return true;
      if (f.t >= 1) {
        f.cell.shown = true;
        f.cell.pop = 1;
        fx.burst(f.cell.x, f.cell.y, { n: 6, colors: [d.accent, '#fff', '#ffe27a'], power: 120 });
        tone({ type: 'sine', f: 600 + Math.random() * 300, dur: 0.07, vol: 0.04 });
        return false;
      }
      const e = ease(f.t);
      const x = lerp(f.x, f.cell.x, e);
      const y = lerp(f.y, f.cell.y, e) - Math.sin(f.t * Math.PI) * cs * 1.2;
      const s = lerp(lay.lr * 1.6, cs, e);
      tile(g, x, y, s, grad);
      label(g, x, y + s * 0.04, trUpper(f.c), { size: s * 0.62, color: '#fff', stroke: NONE, sw: 0, font: FONT });
      return true;
    });

    /* Yardım arısı */
    const bee = game.bee;
    const task = game.beeTask;
    const home = { x: lay.cx + R * 0.9, y: lay.cy - R * 1.05 };
    const tx = task ? task.cell.x : home.x;
    const ty = task ? task.cell.y - cs * 0.9 : home.y;
    if (!bee.x) { bee.x = home.x; bee.y = home.y; }
    const bdx = tx - bee.x;
    const bdy = ty - bee.y;
    const k = Math.min(1, dt * (task ? 2.6 : 3));
    bee.x += bdx * k;
    bee.y += bdy * k;
    bee.ang = lerp(bee.ang, clamp(bdx * 0.004, -0.4, 0.4), Math.min(1, dt * 4));
    if (task && Math.hypot(bdx, bdy) < cs * 0.4) {
      const c = task.cell;
      c.hint = true;
      c.pop = 1;
      game.beeTask = null;
      fx.burst(c.x, c.y, { n: 12, colors: ['#fff', '#ffe27a', d.accent], power: 150 });
      sfx.pop(0.7);
      // Arının bıraktığı harf bir kelimeyi tamamladıysa kelime sayılır
      completeOthers();
    }
    if (task || game.found < game.total) {
      const bs = Math.max(11, cs * 0.42);
      drawBee(g, bee.x, bee.y + Math.sin(t / 160) * 3, bs, t, bee.ang);
      if (task) {
        g.save();
        g.translate(bee.x, bee.y + bs * 1.3);
        tile(g, 0, 0, bs * 1.4, '#ffffff');
        label(g, 0, bs * 0.06, trUpper(task.cell.ch), { size: bs * 0.9, color: d.accent2, stroke: NONE, sw: 0, font: FONT });
        g.restore();
      }
    }

    if (game.comboT > 0) { game.comboT -= dt; if (game.comboT <= 0) game.combo = 0; }
    fx.draw(g, dt);
    return undefined;
  });

  /* Bot ve hata ayıklama için */
  game.posOf = (i) => lay.ring[i];
  game.letterAt = letterAt;
  game.words = words;
  game.cells = cells;
  game.pathFor = (w) => {
    const used = new Array(n).fill(false);
    const out = [];
    for (const c of w) {
      let at = -1;
      for (let i = 0; i < n; i++) if (!used[i] && letterAt(i) === c) { at = i; break; }
      if (at < 0) return null;
      used[at] = true;
      out.push(at);
    }
    return out;
  };
  return { dispose: () => my.dispose(), get st() { return game; } };
}
