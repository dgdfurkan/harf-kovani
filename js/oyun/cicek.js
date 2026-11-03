// Harf Çiçeği: çiçekteki harflerden kelime çıkar. Bölümün bütün kelimeleri üstte boş
// petek gözleri olarak durur, hepsi bulununca bölüm biter. Ortadaki arıya dokunmak harfleri karıştırır.

import { Life, html, toHTML, fitCanvas, clamp, lerp, rand, trUpper, shuffle, pick } from '../core/dom.js';
import { save } from '../core/save.js';
import { sfx, buzz, tone } from '../core/audio.js';
import { makeFx, rrect, label, shake } from '../core/fx.js';
import { pauseSheet } from '../core/ui.js';
import { PUZZLES } from '../data/kovan-levels.js';
import { INK, loadLists, letterLink, drawRope, drawBee, drawJar, drawPill, hexPath, combBackdrop, themeColors } from './bag.js';
import { helpBarHTML, helpBar, jarGain } from './yardim.js';
import { wordCard, meaningOf } from './kart.js';
import { levelDone } from './bitir.js';

export const CICEK_LEVELS = PUZZLES.length;
const VAL = { a: 1, e: 1, i: 1, ı: 1, n: 1, r: 1, l: 1, k: 1, d: 2, m: 2, t: 2, y: 2, u: 2, s: 2, b: 3, o: 2, ü: 3, z: 4, ş: 4, g: 3, ç: 4, c: 4, h: 4, p: 5, v: 5, ğ: 6, ö: 5, f: 6, j: 8 };
const scoreOf = (w) => w.split('').reduce((a, c) => a + (VAL[c] || 2), 0) * w.length;
const ease = (t) => t * t * (3 - 2 * t);
const NONE = 'rgba(0,0,0,0)';
const FONT = '"Baloo 2", sans-serif';
const IDLE = 25;

export function playCicek(main, nav, li) {
  const my = new Life();
  const fx = makeFx();
  const puz = PUZZLES[li % CICEK_LEVELS];
  const hard = !!puz.z;
  const pool = puz.a.split('');
  const n = pool.length;
  let lists = null;
  loadLists().then((l) => { lists = l; }).catch(() => {});
  // Kelimeler uzunluğa göre dizilir, aynı uzunluktakiler her oyunda başka sırada gelir
  const slots = shuffle(puz.w.map((w) => ({ w, found: false, show: 0, rev: new Set(), sweep: 0, cells: [], wig: 0 })))
    .sort((a, b) => a.w.length - b.w.length);
  const byWord = new Map(slots.map((s) => [s.w, s]));
  const game = {
    order: shuffle(pool.map((_, i) => i)), sel: [],
    honey: 0, combo: 0, comboT: 0, helps: 0, extras: 0, last: '', found: 0,
    total: slots.length, done: false, paused: false,
    pops: [], flyers: [], bees: [], cellPop: new Array(n).fill(0),
    aT: 1, aFrom: [], aScale: false, beeTask: null, flash: 0, jarPulse: 0,
    bee: { x: 0, y: 0, ang: 0 }, spin: 0, idle: 0, nudged: false, hover: null, clue: null,
    pill: { text: '', kind: null, t: 0 },
  };

  nav.setTitle(hard ? `Zor Bölüm · ${li + 1}` : `Harf Çiçeği · ${li + 1}`);
  main.innerHTML = toHTML(html`
    <div class="kv ${hard ? 'kv-hard' : ''}">
      <div class="kv-top">
        <span class="kv-goal"><small>${hard ? 'Zor bölüm' : 'Hedef'}</small><b>${slots.length} kelimenin hepsini bul</b><i class="kv-pbar"><u data-pbar></u></i></span>
        <span class="kv-score"><b data-found>0/${slots.length}</b><small>kelime</small></span>
      </div>
      <div class="kv-stage">
        <canvas class="kv-cv"></canvas>
        <div class="kv-banner" data-banner></div>
        <div class="kv-combo" data-combo></div>
        <div class="hk-clue" data-clue></div>
      </div>
      ${helpBarHTML()}
    </div>`);
  const wrap = main.querySelector('.kv');
  const cv = wrap.querySelector('.kv-cv');
  const bannerEl = wrap.querySelector('[data-banner]');
  const comboEl = wrap.querySelector('[data-combo]');
  const clueEl = wrap.querySelector('[data-clue]');
  const foundEl = wrap.querySelector('[data-found]');
  const pbar = wrap.querySelector('[data-pbar]');
  const stage = fitCanvas(cv, my);
  let col = themeColors();

  /* ---------- Yerleşim ---------- */
  const lay = { ring: [], r: 24, R: 60, cx: 0, cy: 0, hs: 12, pillY: 0, pillS: 14, jar: { x: 0, y: 0, r: 24 } };

  // Kelime petekleri: sütun sayısını deneyerek en büyük göz boyunu bul
  function packSlots(ax, ay, aw, ah) {
    let best = null;
    for (let cols = 1; cols <= 4; cols++) {
      const rows = Math.ceil(slots.length / cols);
      const colMax = [];
      for (let c = 0; c < cols; c++) {
        let m = 0;
        for (let k = c * rows; k < Math.min(slots.length, (c + 1) * rows); k++) m = Math.max(m, slots[k].w.length);
        colMax.push(m);
      }
      const letters = colMax.reduce((a, b) => a + b, 0);
      if (!letters) continue;
      const hs = Math.min(aw / (letters * 1.78 + (cols - 1) * 0.9), ah / (rows * 2.1));
      if (!best || hs > best.hs) best = { hs, cols, rows, colMax };
    }
    const hs = Math.min(best.hs, 30);
    lay.hs = hs;
    const { cols, rows, colMax } = best;
    const totalW = colMax.reduce((a, b) => a + b, 0) * 1.78 * hs + (cols - 1) * 0.9 * hs;
    const totalH = rows * 2.1 * hs;
    let x = ax + (aw - totalW) / 2;
    const y0 = ay + (ah - totalH) / 2 + hs;
    for (let c = 0; c < cols; c++) {
      const colW = colMax[c] * 1.78 * hs;
      for (let k = c * rows; k < Math.min(slots.length, (c + 1) * rows); k++) {
        const s = slots[k];
        const wW = s.w.length * 1.78 * hs;
        const sx = x + (colW - wW) / 2;
        const sy = y0 + (k - c * rows) * 2.1 * hs;
        s.cells = s.w.split('').map((_, i) => ({ x: sx + hs * 0.89 + i * 1.78 * hs, y: sy }));
        s.cy = sy;
        s.x0 = sx;
        s.x1 = sx + wW;
      }
      x += colW + 0.9 * hs;
    }
  }

  function packRing(ax, ay, aw, ah) {
    // Kelime hapı halkanın hemen üstünde durur
    const ph = clamp(ah * 0.16, 40, 62);
    lay.pillY = ay + ph * 0.5;
    ay += ph;
    ah -= ph;
    if (ah > aw * 1.15) {
      const side = aw * 1.15;
      ay += (ah - side) / 2;
      ah = side;
    }
    const avail = Math.min(aw, ah) / 2 - 4;
    const need = 1.06 / Math.sin(Math.PI / n);
    const r = Math.min(avail / (1 + need), avail * 0.44, 76);
    const R = Math.min(avail - r, r * need * 1.12);
    lay.r = r;
    lay.R = R;
    lay.cx = ax + aw / 2;
    lay.cy = ay + ah / 2;
    lay.pillY = Math.max(lay.pillY, lay.cy - R - r * 1.15 - ph * 0.4);
    lay.pillS = clamp(r * 0.4, 11, 19);
    lay.ring = pool.map((_, i) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      return { x: lay.cx + Math.cos(a) * R, y: lay.cy + Math.sin(a) * R };
    });
    const jr = clamp(Math.min(aw, ah) * 0.1, 18, 36);
    lay.jar = { x: ax + aw - jr * 1.1, y: ay + ah - jr * 1.3, r: jr };
  }

  // Yerleşim yalnız ekran ölçüsü ya da tema değişince kurulur
  let lastW = 0;
  let lastH = 0;
  let backdrop = null;
  function relayout(force = false) {
    const { W, H } = stage;
    if (!force && W === lastW && H === lastH) return;
    lastW = W;
    lastH = H;
    col = themeColors();
    const side = W / H > 1.45;
    if (side) {
      const sw = W * 0.55;
      packSlots(10, 8, sw - 20, H - 16);
      packRing(sw, 0, W - sw, H);
    } else {
      const sh = H * 0.48;
      packSlots(10, 6, W - 20, sh - 10);
      packRing(0, sh, W, H - sh);
    }
    backdrop = combBackdrop(W, H, stage.dpr, Math.max(18, lay.r * 0.7), col);
  }
  relayout();
  my.on(document, 'hk-theme', () => relayout(true));

  const ringPos = (i) => {
    const p = lay.ring[i];
    if (game.aT >= 1) return p;
    const e = ease(clamp((game.aT - i * 0.05) / 0.6, 0, 1));
    const fr = game.aFrom[i] || p;
    const dx = p.x - fr.x;
    const dy = p.y - fr.y;
    const bulge = Math.sin(e * Math.PI) * 0.22;
    return { x: lerp(fr.x, p.x, e) - dy * bulge, y: lerp(fr.y, p.y, e) + dx * bulge, s: game.aScale ? 0.25 + 0.75 * e : 1 + Math.sin(e * Math.PI) * 0.12 };
  };
  const letterAt = (i) => pool[game.order[i]];
  const curWord = () => game.sel.map((i) => letterAt(i)).join('');

  // Giriş: harfler ortadaki arının yanından açılarak gelir
  game.aFrom = lay.ring.map(() => ({ x: lay.cx, y: lay.cy }));
  game.aScale = true;
  game.aT = 0;

  /* ---------- Kelime kontrolü ---------- */
  const isExtra = (w) => !!(lists && (lists.common.has(w) || lists.big.has(w)));
  function kindNow(w) {
    if (w.length < 3) return null;
    const slot = byWord.get(w);
    if (slot) return slot.found ? 'used' : 'ok';
    return isExtra(w) ? 'extra' : null;
  }
  const say = (text, kind, t = 0.9) => { game.pill = { text, kind, t }; };

  function setProg() {
    foundEl.textContent = `${game.found}/${game.total}`;
    pbar.style.width = `${(game.found / game.total) * 100}%`;
  }
  function banner(text, cls = '') {
    bannerEl.textContent = text;
    bannerEl.className = `kv-banner on ${cls}`;
    my.timeout(() => bannerEl.classList.remove('on'), 1100);
  }

  function submit() {
    const w = curWord();
    const path = game.sel.slice();
    game.sel = [];
    if (w.length < 3 || game.done) return;
    const slot = byWord.get(w);
    if (slot && slot.found) {
      say(`${trUpper(w)} zaten var`, 'used', 0.9);
      slot.wig = 1;
      sfx.soft();
      return;
    }
    if (!slot) {
      if (isExtra(w)) {
        const pts = Math.round(scoreOf(w) * 0.5);
        game.extras++;
        game.honey += pts;
        game.jarPulse = 1;
        save.addJar(3);
        save.data.stats.extras++;
        save.addFound(w);
        say(trUpper(w), 'extra', 0.7);
        banner(`Ekstra: ${trUpper(w)}  +${pts}`, 'extra');
        sfx.coin();
        path.forEach((i) => {
          const p = ringPos(i);
          game.pops.push({ x: p.x, y: p.y, c: letterAt(i), t: 0 });
          fx.burst(p.x, p.y, { n: 8, colors: ['#ffe27a', '#fff'], power: 150 });
        });
        return;
      }
      game.combo = 0;
      comboEl.classList.remove('on');
      sfx.bad();
      buzz(30);
      say(`${trUpper(w)} yok`, 'no', 0.8);
      return;
    }
    // Listedeki kelime bulundu
    slot.found = true;
    slot.show = 0;
    slot.sweep = 1;
    game.found++;
    game.combo++;
    game.comboT = 3.2;
    game.idle = 0;
    game.nudged = false;
    wrap.querySelector('[data-act="clue"]').classList.remove('nudge');
    if (game.clue === w) closeClue();
    const mult = (1 + Math.min(1.5, (game.combo - 1) * 0.25)) * (hard ? 1.5 : 1);
    const pts = Math.round(scoreOf(w) * mult);
    game.honey += pts;
    game.jarPulse = 1;
    game.flash = 0.45;
    save.addJar(jarGain(w, game.combo));
    if (w.length > game.last.length) game.last = w;
    save.data.stats.words++;
    save.addFound(w);
    save.touch();
    setProg();
    say(trUpper(w), 'ok', 0.6);
    banner(`${trUpper(w)}  +${pts}`, w.length >= 6 ? 'big' : '');
    if (game.combo >= 2) {
      comboEl.textContent = `${game.combo} üst üste  x${String(Math.round(mult * 100) / 100).replace('.', ',')}`;
      comboEl.classList.add('on');
    }
    if (w.length >= 6) shake(wrap, 7);
    sfx.good();
    tone({ type: 'triangle', f: 420 + w.length * 70, f2: 900, dur: 0.2, vol: 0.07 });
    buzz(16);
    // Harfler peteğin boş gözlerine uçar
    path.forEach((ci, k) => {
      const p = ringPos(ci);
      game.cellPop[ci] = 1;
      game.flyers.push({ slot, k, c: letterAt(ci), x: p.x, y: p.y, t: -k * 0.08 });
      fx.burst(p.x, p.y, { n: 9, colors: ['#ffcd3c', '#fff3cf', '#ffa41a'], power: 190 });
    });
    for (let k = 0; k < Math.min(5, w.length - 1); k++) game.bees.push({ x: rand(0, stage.W), y: stage.H + rand(10, 60), t: 0, w: rand(0, 6) });
    if (game.found >= game.total) my.timeout(finish, 900);
  }

  /* ---------- Dokunma ---------- */
  const link = letterLink(my, cv, {
    game,
    cells: () => lay.ring,
    radius: () => lay.r,
    canLink: () => true,
    valid: () => { const k = kindNow(curWord()); return k === 'ok' || k === 'extra'; },
    onStart: () => { sfx.tile(); game.idle = 0; },
    onAdd: () => {
      sfx.tile();
      buzz(5);
      tone({ type: 'sine', f: 300 + game.sel.length * 60, dur: 0.07, vol: 0.05 });
    },
    onPop: () => sfx.soft(),
    onChange: () => {},
    submit,
  });

  // Ortadaki arı karıştırır; bulunan kelimeye dokununca kartı açılır
  const local = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const slotAt = (p) => slots.find((s) => s.found && p.y > s.cy - lay.hs * 1.1 && p.y < s.cy + lay.hs * 1.1 && p.x > s.x0 - 4 && p.x < s.x1 + 4);
  const onCenter = (p) => Math.hypot(p.x - lay.cx, p.y - lay.cy) < Math.max(lay.r * 0.75, lay.R - lay.r * 1.1);
  my.on(cv, 'pointerdown', (e) => {
    if (game.done || game.paused || game.sel.length) return;
    const p = local(e);
    if (onCenter(p)) { doShuffle(); return; }
    const s = slotAt(p);
    if (s) {
      s.wig = 1;
      sfx.tap();
      game.paused = true;
      wordCard(s.w, { onClose: () => { game.paused = false; } });
    }
  });
  my.on(cv, 'pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    const p = local(e);
    const s = slotAt(p);
    if (s !== game.hover) {
      game.hover = s || null;
      if (s) s.wig = Math.max(s.wig, 0.6);
    }
    cv.style.cursor = s || onCenter(p) ? 'pointer' : 'default';
  });

  function doShuffle() {
    const prev = game.order.slice();
    game.order = shuffle(game.order.slice());
    game.aFrom = game.order.map((inst, i) => lay.ring[prev.indexOf(inst)] || lay.ring[i]);
    game.aScale = false;
    game.aT = 0;
    game.spin = 1;
    game.sel = [];
    sfx.whoosh();
    buzz(8);
  }

  /* ---------- Yardımlar ---------- */
  // Arı Yardımı: rastgele bir kelimenin rastgele bir boş gözüne harf taşır
  function doHint() {
    if (game.beeTask) return false;
    const open = slots.filter((s) => !s.found && s.rev.size < s.w.length - 1);
    if (!open.length) {
      say('Son harfler sende', 'used', 1.2);
      return false;
    }
    const t = pick(open);
    const hidden = t.w.split('').map((_, i) => i).filter((i) => !t.rev.has(i));
    const k = pick(hidden);
    game.beeTask = { slot: t, k, c: t.w[k] };
    sfx.whoosh();
    buzz(10);
    return true;
  }
  // İpucu: rastgele bir kelimenin anlamı, satırı parlar
  function closeClue() {
    game.clue = null;
    clueEl.classList.remove('on');
  }
  function doClue() {
    const open = slots.filter((s) => !s.found && meaningOf(s.w) && s.w !== game.clue);
    if (!open.length) { say('İpucu kalmadı', 'used', 1.2); return false; }
    const t = pick(open);
    game.clue = t.w;
    clueEl.innerHTML = '';
    clueEl.append(Object.assign(document.createElement('b'), { textContent: `${t.w.length} harfli` }), document.createTextNode(meaningOf(t.w)));
    clueEl.classList.add('on');
    sfx.chime(88);
    my.timeout(() => { if (game.clue === t.w) closeClue(); }, 14000);
    return true;
  }
  const bar = helpBar(my, wrap.querySelector('.hk-bar'), {
    game,
    onHint: () => { const ok = doHint(); if (ok) game.helps++; return ok; },
    onClue: () => { const ok = doClue(); if (ok) game.helps++; return ok; },
    onShuffle: doShuffle,
  });
  my.on(clueEl, 'click', closeClue);

  function finish() {
    if (game.done) return;
    game.done = true;
    const stars = game.helps === 0 ? 3 : game.helps <= 2 ? 2 : 1;
    levelDone({
      mode: 'cicek', li, total: CICEK_LEVELS, stars, honey: game.honey, hard, longest: game.last,
      stats: [['Kelime', `${game.found}/${game.total}`], ['Ekstra', game.extras], ['Yardım', game.helps]],
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

  /* ---------- Çizim ---------- */
  my.raf((dt, t) => {
    const { W, H, g } = stage;
    stage.begin();
    relayout();
    link.tick();
    if (game.paused) dt = 0;
    if (game.aT < 1) game.aT = Math.min(1, game.aT + dt * 1.9);
    g.drawImage(backdrop, 0, 0, W, H);
    if (!game.done) game.idle += dt;
    if (game.idle > IDLE && !game.nudged) {
      game.nudged = true;
      wrap.querySelector('[data-act="clue"]').classList.add('nudge');
    }

    /* Kelime petekleri */
    const hs = lay.hs;
    for (const s of slots) {
      const lit = (game.clue === s.w || (game.beeTask && game.beeTask.slot === s)) && !s.found;
      if (s.sweep > 0) s.sweep = Math.max(0, s.sweep - dt * 1.3);
      if (s.wig > 0) s.wig = Math.max(0, s.wig - dt * 1.6);
      const hov = game.hover === s;
      s.cells.forEach((p, k) => {
        const open = s.found ? k < s.show : s.rev.has(k);
        const pp = (s.found && k === s.show - 1 ? 1 + s.sweep * 0.22 : 1) * (hov ? 1.06 : 1);
        const wy = s.wig ? Math.sin(t / 60 + k * 0.9) * hs * 0.18 * s.wig : 0;
        const x = p.x;
        const y = p.y + wy;
        const r = hs * 0.92 * pp;
        hexPath(g, x, y + hs * 0.16, r);
        g.fillStyle = 'rgba(42,22,54,.16)';
        g.fill();
        hexPath(g, x, y, r);
        g.fillStyle = open ? (s.found ? '#ffcd3c' : '#ffffff') : col.slot;
        g.fill();
        g.lineWidth = Math.max(1.6, hs * 0.14);
        g.strokeStyle = open ? INK : 'rgba(42,22,54,.45)';
        g.stroke();
        if (open) label(g, x, y + hs * 0.06, trUpper(s.w[k]), { size: hs * 1.04 * pp, color: INK, stroke: NONE, sw: 0, font: FONT });
        else {
          g.beginPath();
          g.arc(x, y, hs * 0.14, 0, Math.PI * 2);
          g.fillStyle = 'rgba(42,22,54,.3)';
          g.fill();
        }
      });
      if (lit) {
        const pulse = 1 + Math.sin(t / 170) * 0.06;
        g.save();
        rrect(g, s.x0 - hs * 0.2, s.cy - hs * 1.18 * pulse, s.x1 - s.x0 + hs * 0.4, hs * 2.36 * pulse, hs * 0.7);
        g.strokeStyle = '#fff';
        g.lineWidth = 3;
        g.shadowColor = '#fff6d8';
        g.shadowBlur = 16 + Math.sin(t / 150) * 7;
        g.stroke();
        g.restore();
      }
      if (s.sweep > 0 && s.found) {
        const k = 1 - s.sweep;
        const gx = s.x0 + (s.x1 - s.x0 + hs * 3) * k - hs * 1.5;
        const gr = g.createLinearGradient(gx - hs, 0, gx + hs, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.5, `rgba(255,255,255,${s.sweep * 0.65})`);
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        g.fillRect(gx - hs, s.cy - hs * 1.1, hs * 2, hs * 2.2);
      }
    }

    /* Kavanoz: yardımların kaynağı */
    const jr = lay.jar.r;
    if (game.jarPulse > 0) game.jarPulse = Math.max(0, game.jarPulse - dt * 2.4);
    drawJar(g, lay.jar.x, lay.jar.y, jr, save.get('jar') / 100, game.jarPulse, t, rrect);
    label(g, lay.jar.x, lay.jar.y + jr * 0.2, `%${Math.round(save.get('jar'))}`, { size: jr * 0.44, color: '#fff', stroke: INK, sw: 0.3, font: FONT });

    /* Harf çiçeği: ortada karıştıran arı, çevresinde harfler */
    const sel = game.sel;
    if (game.spin > 0) game.spin = Math.max(0, game.spin - dt * 2.2);
    const cs = lay.r * 0.62 * (1 + Math.sin(game.spin * Math.PI) * 0.18);
    hexPath(g, lay.cx, lay.cy + 3, cs);
    g.fillStyle = 'rgba(42,22,54,.18)';
    g.fill();
    hexPath(g, lay.cx, lay.cy, cs);
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.fill();
    g.lineWidth = 2.5;
    g.strokeStyle = game.nudged ? '#ff5fa2' : 'rgba(42,22,54,.45)';
    g.stroke();
    // İki yay ok: dokununca harfler karışır
    const ar = cs * 1.22;
    const rot = t / 2600 + game.spin * Math.PI * 2;
    g.lineWidth = Math.max(2, cs * 0.09);
    g.strokeStyle = 'rgba(42,22,54,.5)';
    g.fillStyle = 'rgba(42,22,54,.5)';
    for (const off of [0, Math.PI]) {
      const a1 = rot + off + Math.PI - 0.35;
      g.beginPath();
      g.arc(lay.cx, lay.cy, ar, rot + off + 0.35, a1);
      g.stroke();
      const hx = lay.cx + Math.cos(a1) * ar;
      const hy = lay.cy + Math.sin(a1) * ar;
      const tx = -Math.sin(a1);
      const ty = Math.cos(a1);
      const hz = cs * 0.22;
      g.beginPath();
      g.moveTo(hx + tx * hz, hy + ty * hz);
      g.lineTo(hx - ty * hz * 0.8, hy + tx * hz * 0.8);
      g.lineTo(hx + ty * hz * 0.8, hy - tx * hz * 0.8);
      g.closePath();
      g.fill();
    }
    drawBee(g, lay.cx, lay.cy + Math.sin(t / 300) * 2, cs * 0.5, t, Math.sin(t / 420) * 0.3 + game.spin * Math.PI * 2);
    if (game.nudged && !game.done) label(g, lay.cx, lay.cy + cs * 1.45, 'Karıştır', { size: lay.r * 0.3, color: INK, stroke: '#fff6d8', sw: 0.3, font: FONT });
    for (let i = 0; i < n; i++) {
      const p = ringPos(i);
      const on = sel.includes(i);
      if (game.cellPop[i] > 0) game.cellPop[i] = Math.max(0, game.cellPop[i] - dt * 2.6);
      const s = lay.r * 0.94 * (p.s || 1) * (on ? 1.08 : 1) * (1 - game.cellPop[i] * 0.16);
      hexPath(g, p.x, p.y + lay.r * 0.1, s);
      g.fillStyle = 'rgba(42,22,54,.22)';
      g.fill();
      hexPath(g, p.x, p.y, s);
      g.fillStyle = on ? '#2ee6a0' : col.cell;
      g.fill();
      g.lineWidth = Math.max(2.5, lay.r * 0.1);
      g.strokeStyle = INK;
      g.stroke();
      if (game.cellPop[i] > 0) {
        hexPath(g, p.x, p.y, s * (1 + (1 - game.cellPop[i]) * 0.5));
        g.strokeStyle = `rgba(255,255,255,${game.cellPop[i] * 0.8})`;
        g.lineWidth = 3;
        g.stroke();
      }
    }
    const w = curWord();
    const kind = kindNow(w);
    if (sel.length) drawRope(g, sel.map(ringPos), link.finger, lay.r, kind === 'ok' || kind === 'extra' ? kind : null, t);
    for (let i = 0; i < n; i++) {
      const p = ringPos(i);
      const s = lay.r * 0.94 * (p.s || 1) * (sel.includes(i) ? 1.08 : 1) * (1 - game.cellPop[i] * 0.16);
      label(g, p.x, p.y + s * 0.06, trUpper(letterAt(i)), { size: s * 0.95, color: INK, stroke: NONE, sw: 0, font: FONT });
      label(g, p.x + s * 0.52, p.y - s * 0.42, String(VAL[letterAt(i)] || 2), { size: s * 0.3, color: col.mark, stroke: NONE, sw: 0, font: FONT });
    }

    /* Kelime hapı: harflerin hemen üstünde */
    if (w) drawPill(g, lay.cx, lay.pillY, trUpper(w), kind === 'used' ? 'used' : kind, lay.pillS, t, 0, col);
    else if (game.pill.t > 0) {
      game.pill.t -= dt;
      g.globalAlpha = clamp(game.pill.t * 3, 0, 1);
      drawPill(g, lay.cx, lay.pillY, game.pill.text, game.pill.kind, lay.pillS, t, game.pill.kind === 'no' ? clamp(game.pill.t * 2, 0, 1) : 0, col);
      g.globalAlpha = 1;
    }

    /* Peteğe uçan harfler */
    game.flyers = game.flyers.filter((fl) => {
      fl.t += dt * 1.7;
      if (fl.t <= 0) return true;
      const target = fl.slot.cells[fl.k] || { x: lay.jar.x, y: lay.jar.y };
      if (fl.t >= 1) {
        fl.slot.show = Math.max(fl.slot.show, fl.k + 1);
        fl.slot.sweep = Math.max(fl.slot.sweep, 0.9);
        fx.burst(target.x, target.y, { n: 6, colors: ['#ffcd3c', '#fff'], power: 110 });
        tone({ type: 'sine', f: 620 + fl.k * 90, dur: 0.08, vol: 0.05 });
        return false;
      }
      const e = ease(fl.t);
      const x = lerp(fl.x, target.x, e);
      const y = lerp(fl.y, target.y, e) - Math.sin(fl.t * Math.PI) * lay.r * 1.6;
      const sc = lerp(lay.r * 0.9, hs * 0.95, e);
      g.save();
      g.translate(x, y);
      g.rotate(Math.sin(fl.t * Math.PI * 2) * 0.3);
      hexPath(g, 0, 0, sc * 0.9);
      g.fillStyle = '#ffcd3c';
      g.fill();
      g.lineWidth = 2.4;
      g.strokeStyle = INK;
      g.stroke();
      label(g, 0, 0, trUpper(fl.c), { size: sc * 0.95, color: INK, stroke: NONE, sw: 0, font: FONT });
      g.restore();
      return true;
    });

    /* Ekstra kelimelerde kavanoza akan harfler */
    game.pops = game.pops.filter((p) => {
      p.t += dt * 1.5;
      if (p.t >= 1) return false;
      const k = ease(p.t);
      const x = lerp(p.x, lay.jar.x, k);
      const y = lerp(p.y, lay.jar.y, k) - Math.sin(p.t * Math.PI) * lay.r * 1.2;
      g.globalAlpha = 1 - p.t * 0.7;
      label(g, x, y, trUpper(p.c), { size: lay.r * (0.8 - p.t * 0.4), color: '#fff', stroke: INK, font: FONT });
      g.globalAlpha = 1;
      return true;
    });

    /* Yardım arısı: harfi kavanozdan alıp boş göze bırakır */
    const bee = game.bee;
    const task = game.beeTask;
    let tx = lay.jar.x;
    let ty = lay.jar.y - jr * 1.55;
    if (task) {
      const p = task.slot.cells[task.k];
      tx = p.x;
      ty = p.y - hs * 1.5;
    }
    if (!bee.x) { bee.x = tx; bee.y = ty; }
    const bdx = tx - bee.x;
    const bdy = ty - bee.y;
    const bk = Math.min(1, dt * (task ? 2.6 : 3.4));
    bee.x += bdx * bk;
    bee.y += bdy * bk;
    bee.ang = lerp(bee.ang, clamp(bdx * 0.004, -0.4, 0.4), Math.min(1, dt * 4));
    const bsz = Math.max(13, hs * 0.8);
    const bob = Math.sin(t / 150) * 3;
    if (task && Math.hypot(bdx, bdy) < hs * 0.5) {
      const p = task.slot.cells[task.k];
      task.slot.rev.add(task.k);
      task.slot.sweep = 0.8;
      game.beeTask = null;
      fx.ring(p.x, p.y, '#fff', hs * 2.4);
      fx.burst(p.x, p.y, { n: 12, colors: ['#fff', '#ffe27a', '#ffcd3c'], power: 150 });
      sfx.pop(0.7);
      tone({ type: 'sine', f: 820, f2: 1180, dur: 0.18, vol: 0.06 });
      buzz(12);
    }
    drawBee(g, bee.x, bee.y + bob, bsz, t, bee.ang);
    if (task) {
      g.save();
      g.translate(bee.x, bee.y + bob + bsz * 1.25);
      g.rotate(Math.sin(t / 180) * 0.16);
      hexPath(g, 0, 0, bsz * 0.78);
      g.fillStyle = '#ffcd3c';
      g.fill();
      g.lineWidth = 2.4;
      g.strokeStyle = INK;
      g.stroke();
      label(g, 0, 0, trUpper(task.c), { size: bsz * 0.85, color: INK, stroke: NONE, sw: 0, font: FONT });
      g.restore();
    }

    /* Bal taşıyan arılar */
    game.bees = game.bees.filter((b) => {
      b.t += dt * 0.5;
      if (b.t >= 1) return false;
      drawBee(g, lerp(b.x, lay.jar.x, b.t), lerp(b.y, lay.jar.y - jr, b.t) + Math.sin(t / 160 + b.w) * 12, lay.r * 0.3, t);
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
  game.posOf = (i) => lay.ring[i];
  game.center = () => ({ x: lay.cx, y: lay.cy });
  game.letterAt = letterAt;
  game.slots = slots;
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
  game.bar = bar;
  setProg();
  return { dispose: () => my.dispose(), get st() { return game; } };
}
