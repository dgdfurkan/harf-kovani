// Harf Kovanı'nın iki sürümünün ortak parçaları: harfler arası bağ (parmak takibi),
// kelime listeleri, tema renkleri ve kovana ait çizimler.

import { label } from '../core/fx.js';

export const INK = '#2a1636';

// Tuval renkleri seçili temadan gelir
export function themeColors() {
  const cs = getComputedStyle(document.body);
  const v = (k, d) => (cs.getPropertyValue(k) || '').trim() || d;
  return {
    bg1: v('--cv-bg1', '#ffe9a8'),
    bg2: v('--cv-bg2', '#ffb31a'),
    pattern: v('--cv-pattern', '#fff6d8'),
    cell: v('--cv-cell', '#fff6d8'),
    ink: v('--cv-ink', INK),
    slot: v('--cv-slot', 'rgba(255,255,255,.42)'),
    mark: v('--cv-mark', '#9a7a24'),
  };
}

/* ---------- Kelime listeleri ---------- */

let listsP = null;
const readSet = (name) => fetch(new URL(`../../data/${name}`, import.meta.url))
  .then((r) => r.text())
  .then((t) => new Set(t.split('\n').map((w) => w.trim()).filter(Boolean)));

// common: insanların gerçekten kullandığı kelimeler, big: nadirler dahil bütün liste
export function loadLists() {
  if (!listsP) {
    listsP = Promise.all([readSet('yaygin.txt'), readSet('words.txt')]).then(([common, big]) => ({ common, big }));
    listsP.catch(() => { listsP = null; });
  }
  return listsP;
}

/* ---------- Parmak takibi: bağ kolay kopmasın ---------- */

const ADD = 0.8; // yeni harf için gözün iç bölgesine girmek yeter, yanından geçmek yetmez
const START = 1.05; // ilk dokunuş cömert
const BACK = 0.42; // geri almak için önceki harfin tam ortasına dönmek gerekir
const BACK_MS = 130; // ve orada kısa süre durmak
const GRACE_MS = 140; // parmak bir anlık kalkarsa bu kadar beklenir
const RESUME = 1.7; // aynı yerin yakınına dönerse iz sürer

// o: { game, cells(), radius(), canLink(a, b), valid(), onStart(i), onAdd(i), onPop(), onChange(), submit(), tap }
export function letterLink(my, cv, o) {
  const { game } = o;
  const finger = { on: false, x: 0, y: 0 };
  let id = null;
  let box = null;
  let moved = false;
  let backAt = 0;
  let graceId = 0;
  let nearI = -1;
  let nearD = 0;

  const nearest = (x, y) => {
    const list = o.cells();
    nearI = -1;
    nearD = Infinity;
    for (let i = 0; i < list.length; i++) {
      const d = Math.hypot(list[i].x - x, list[i].y - y);
      if (d < nearD) { nearD = d; nearI = i; }
    }
  };

  function step(x, y, now) {
    const s = game.sel;
    const k = s.length;
    if (!k) return;
    const r = o.radius();
    nearest(x, y);
    if (nearI < 0 || nearI === s[k - 1]) { backAt = 0; return; }
    if (k > 1 && nearI === s[k - 2]) {
      if (nearD >= r * BACK) { backAt = 0; return; }
      if (!backAt) { backAt = now + BACK_MS; return; }
      if (now >= backAt) {
        s.pop();
        backAt = 0;
        moved = true;
        o.onPop();
        o.onChange();
      }
      return;
    }
    backAt = 0;
    if (nearD > r * ADD || s.includes(nearI) || !o.canLink(s[k - 1], nearI)) return;
    s.push(nearI);
    moved = true;
    game.tapped = false;
    o.onAdd(nearI);
    o.onChange();
  }

  // Hızlı sürüşlerde aradaki gözler kaçmasın diye yol parça parça yürünür
  function moveTo(x, y, now) {
    const dx = x - finger.x;
    const dy = y - finger.y;
    const n = Math.min(10, Math.max(1, Math.ceil(Math.hypot(dx, dy) / (o.radius() * 0.4))));
    for (let k = 1; k <= n; k++) step(finger.x + (dx * k) / n, finger.y + (dy * k) / n, now);
    finger.x = x;
    finger.y = y;
  }

  const hold = (e, x, y) => {
    id = e.pointerId;
    finger.on = true;
    finger.x = x;
    finger.y = y;
    backAt = 0;
    try { cv.setPointerCapture(e.pointerId); } catch { /* yapay olaylarda yakalama olmaz */ }
  };

  my.on(cv, 'pointerdown', (e) => {
    if (game.paused || game.done) return;
    // İkinci parmak ya da tableti tutan el seçimi bozmaz
    if (id !== null) return;
    box = cv.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    if (graceId) {
      clearTimeout(graceId);
      graceId = 0;
      if (Math.hypot(x - finger.x, y - finger.y) < o.radius() * RESUME) {
        hold(e, x, y);
        return;
      }
      o.submit();
    }
    nearest(x, y);
    if (nearI < 0 || nearD > o.radius() * START) return;
    const i = nearI;
    hold(e, x, y);
    moved = false;
    if (o.tap && game.tapped && game.sel.length) {
      const s = game.sel;
      const last = s[s.length - 1];
      if (i === last) s.pop();
      else if (o.canLink(last, i) && !s.includes(i)) s.push(i);
      else game.sel = [i];
      o.onStart(i);
      o.onChange();
      return;
    }
    game.sel = [i];
    o.onStart(i);
    o.onChange();
  });

  my.on(cv, 'pointermove', (e) => {
    if (id === null || e.pointerId !== id) return;
    const now = performance.now();
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (list && list.length) for (const p of list) moveTo(p.clientX - box.left, p.clientY - box.top, now);
    else moveTo(e.clientX - box.left, e.clientY - box.top, now);
  });

  const end = (e) => {
    if (id === null || e.pointerId !== id) return;
    id = null;
    finger.on = false;
    if (game.done) { game.sel = []; o.onChange(); return; }
    if (!moved && o.tap) {
      game.tapped = game.sel.length > 0;
      o.onChange();
      return;
    }
    // Geçerli kelime anında gider; eksik kelimede parmağın dönmesi için bir an beklenir
    if (!moved || game.sel.length < 2 || o.valid()) { o.submit(); return; }
    graceId = my.timeout(() => {
      graceId = 0;
      if (id === null) o.submit();
    }, GRACE_MS);
  };
  my.on(window, 'pointerup', end);
  my.on(window, 'pointercancel', end);
  my.on(cv, 'lostpointercapture', end);

  return {
    finger,
    // Geri alma süresi parmak dururken de işlesin
    tick() { if (finger.on && backAt) step(finger.x, finger.y, performance.now()); },
  };
}

/* ---------- Çizimler ---------- */

export const hexPath = (g, x, y, s) => {
  g.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 2 + (k / 6) * Math.PI * 2;
    const px = x + Math.cos(a) * s;
    const py = y + Math.sin(a) * s;
    if (k) g.lineTo(px, py); else g.moveTo(px, py);
  }
  g.closePath();
};

// Harfler arasındaki ip: seçili gözlerden parmağa uzanır
export function drawRope(g, pts, finger, w, kind, t) {
  if (!pts.length || (pts.length < 2 && !finger.on)) return;
  g.beginPath();
  pts.forEach((p, k) => { if (k) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); });
  if (finger.on) g.lineTo(finger.x, finger.y);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = 'rgba(42,22,54,.38)';
  g.lineWidth = w * 0.42;
  g.stroke();
  g.strokeStyle = kind === 'ok' ? 'rgba(46,230,160,.95)' : kind === 'extra' ? 'rgba(130,220,255,.9)' : 'rgba(255,255,255,.78)';
  g.lineWidth = w * 0.2;
  g.shadowColor = kind === 'ok' ? '#2ee6a0' : kind === 'extra' ? '#8ad8ff' : '#fff6d8';
  g.shadowBlur = 14 + Math.sin(t / 120) * 5;
  g.stroke();
  g.shadowBlur = 0;
}

// Arı: yarı saydam çırpan kanatlar, kehribar karın, tüylü göğüs, iri parlak göz. Sola bakar.
const BEE_LINE = 'rgba(59,38,23,.6)';
export const drawBee = (g, x, y, s, t, ang = 0) => {
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  const flap = Math.sin(t / 22);
  const lw = Math.max(0.7, s * 0.07);
  g.lineCap = 'round';
  const wing = (bx, by, len, wid, a, alpha) => {
    g.save();
    g.translate(bx, by);
    g.rotate(a);
    g.globalAlpha = alpha;
    g.beginPath();
    g.ellipse(0, -len * 0.5, wid, len * 0.5, 0, 0, Math.PI * 2);
    g.fillStyle = '#eef8ff';
    g.fill();
    g.lineWidth = Math.max(0.6, s * 0.04);
    g.strokeStyle = '#7fa2cc';
    g.stroke();
    g.beginPath();
    g.moveTo(0, -len * 0.12);
    g.quadraticCurveTo(wid * 0.35, -len * 0.5, 0, -len * 0.86);
    g.stroke();
    g.restore();
  };
  wing(-0.1 * s, -0.34 * s, 0.9 * s, 0.28 * s, 0.75 + flap * 0.35, 0.5);
  // Bacaklar göğsün altından görünür
  g.strokeStyle = '#3b2617';
  g.lineWidth = lw;
  g.beginPath();
  for (const lx of [-0.5, -0.3, -0.1]) { g.moveTo(lx * s, 0.2 * s); g.lineTo((lx - 0.06) * s, 0.44 * s); }
  g.stroke();
  // Karın
  const abd = () => { g.beginPath(); g.ellipse(0.24 * s, 0.05 * s, 0.62 * s, 0.47 * s, 0.12, 0, Math.PI * 2); };
  abd();
  const ab = g.createLinearGradient(0, -0.45 * s, 0, 0.55 * s);
  ab.addColorStop(0, '#ffe486');
  ab.addColorStop(0.55, '#ffbe2e');
  ab.addColorStop(1, '#e48a1a');
  g.fillStyle = ab;
  g.fill();
  g.save();
  g.clip();
  g.fillStyle = '#3b2617';
  for (const sx of [0.14, 0.44]) { g.beginPath(); g.ellipse(sx * s, 0.06 * s, 0.1 * s, 0.6 * s, 0.12, 0, Math.PI * 2); g.fill(); }
  g.beginPath();
  g.ellipse(0.9 * s, 0.13 * s, 0.13 * s, 0.6 * s, 0.12, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 0.5;
  g.fillStyle = '#fff';
  g.beginPath();
  g.ellipse(0.12 * s, -0.24 * s, 0.32 * s, 0.09 * s, 0.1, 0, Math.PI * 2);
  g.fill();
  g.restore();
  abd();
  g.lineWidth = lw;
  g.strokeStyle = BEE_LINE;
  g.stroke();
  g.beginPath();
  g.moveTo(0.84 * s, 0.1 * s);
  g.lineTo(1.02 * s, 0.17 * s);
  g.lineTo(0.84 * s, 0.24 * s);
  g.fillStyle = '#3b2617';
  g.fill();
  // Göğüs
  const th = g.createRadialGradient(-0.42 * s, -0.12 * s, 0, -0.36 * s, -0.02 * s, 0.34 * s);
  th.addColorStop(0, '#ffd866');
  th.addColorStop(1, '#c47e1c');
  g.beginPath();
  g.arc(-0.36 * s, -0.02 * s, 0.32 * s, 0, Math.PI * 2);
  g.fillStyle = th;
  g.fill();
  g.strokeStyle = BEE_LINE;
  g.stroke();
  // Duyargalar
  g.strokeStyle = '#3b2617';
  g.lineWidth = Math.max(0.6, s * 0.05);
  g.beginPath();
  g.moveTo(-0.84 * s, -0.18 * s);
  g.quadraticCurveTo(-0.9 * s, -0.48 * s, -1.06 * s, -0.56 * s);
  g.moveTo(-0.7 * s, -0.22 * s);
  g.quadraticCurveTo(-0.72 * s, -0.56 * s, -0.86 * s, -0.68 * s);
  g.stroke();
  g.fillStyle = '#3b2617';
  for (const [ax, ay] of [[-1.06, -0.56], [-0.86, -0.68]]) { g.beginPath(); g.arc(ax * s, ay * s, 0.06 * s, 0, Math.PI * 2); g.fill(); }
  // Baş, göz, yanak
  g.beginPath();
  g.arc(-0.74 * s, 0.02 * s, 0.27 * s, 0, Math.PI * 2);
  g.fillStyle = '#5c3d27';
  g.fill();
  g.strokeStyle = BEE_LINE;
  g.lineWidth = lw;
  g.stroke();
  g.beginPath();
  g.ellipse(-0.82 * s, -0.04 * s, 0.1 * s, 0.13 * s, 0, 0, Math.PI * 2);
  g.fillStyle = '#120a06';
  g.fill();
  g.beginPath();
  g.arc(-0.85 * s, -0.09 * s, 0.04 * s, 0, Math.PI * 2);
  g.fillStyle = '#fff';
  g.fill();
  g.globalAlpha = 0.55;
  g.beginPath();
  g.ellipse(-0.66 * s, 0.14 * s, 0.08 * s, 0.05 * s, 0, 0, Math.PI * 2);
  g.fillStyle = '#ff8f7a';
  g.fill();
  g.globalAlpha = 1;
  wing(-0.24 * s, -0.32 * s, 1.02 * s, 0.32 * s, 0.32 + flap * 0.5, 0.7);
  g.restore();
};

// Aynı arının SVG hali: düğmelerde ve kartlarda
export const beeSVG = () => `<svg viewBox="-24 -22 48 40" aria-hidden="true"><g transform="scale(20)"><ellipse cx="-.1" cy="-.79" rx=".28" ry=".45" transform="rotate(43 -.1 -.34)" fill="#eef8ff" fill-opacity=".6" stroke="#7fa2cc" stroke-width=".04"/><path d="M-.5 .2l-.06.24M-.3 .2l-.06.24M-.1 .2l-.06.24" stroke="#3b2617" stroke-width=".07" stroke-linecap="round"/><defs><linearGradient id="hkbAb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe486"/><stop offset=".55" stop-color="#ffbe2e"/><stop offset="1" stop-color="#e48a1a"/></linearGradient><clipPath id="hkbCl"><ellipse cx=".24" cy=".05" rx=".62" ry=".47" transform="rotate(7 .24 .05)"/></clipPath></defs><ellipse cx=".24" cy=".05" rx=".62" ry=".47" transform="rotate(7 .24 .05)" fill="url(#hkbAb)"/><g clip-path="url(#hkbCl)" fill="#3b2617"><ellipse cx=".14" cy=".06" rx=".1" ry=".6"/><ellipse cx=".44" cy=".06" rx=".1" ry=".6"/><ellipse cx=".9" cy=".13" rx=".13" ry=".6"/><ellipse cx=".12" cy="-.24" rx=".32" ry=".09" fill="#fff" fill-opacity=".5"/></g><ellipse cx=".24" cy=".05" rx=".62" ry=".47" transform="rotate(7 .24 .05)" fill="none" stroke="rgba(59,38,23,.6)" stroke-width=".07"/><path d="M.84 .1L1.02 .17L.84 .24z" fill="#3b2617"/><circle cx="-.36" cy="-.02" r=".32" fill="#e3a234" stroke="rgba(59,38,23,.6)" stroke-width=".07"/><path d="M-.84 -.18Q-.9 -.48 -1.06 -.56M-.7 -.22Q-.72 -.56 -.86 -.68" fill="none" stroke="#3b2617" stroke-width=".05" stroke-linecap="round"/><circle cx="-1.06" cy="-.56" r=".06" fill="#3b2617"/><circle cx="-.86" cy="-.68" r=".06" fill="#3b2617"/><circle cx="-.74" cy=".02" r=".27" fill="#5c3d27" stroke="rgba(59,38,23,.6)" stroke-width=".07"/><ellipse cx="-.82" cy="-.04" rx=".1" ry=".13" fill="#120a06"/><circle cx="-.85" cy="-.09" r=".04" fill="#fff"/><ellipse cx="-.66" cy=".14" rx=".08" ry=".05" fill="#ff8f7a" fill-opacity=".55"/><ellipse cx="-.24" cy="-.83" rx=".32" ry=".51" transform="rotate(18 -.24 -.32)" fill="#eef8ff" fill-opacity=".75" stroke="#7fa2cc" stroke-width=".04"/></g></svg>`;

// Zemin bir kez çizilir, sonra her karede resim olarak basılır
export function combBackdrop(W, H, dpr, bs, col = themeColors()) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(W * dpr);
  c.height = Math.ceil(H * dpr);
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, col.bg1);
  bg.addColorStop(1, col.bg2);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.16;
  g.fillStyle = col.pattern;
  for (let r = -1; r < H / (bs * 1.5) + 1; r++) {
    for (let col = -1; col < W / (bs * 1.74) + 1; col++) {
      hexPath(g, col * bs * 1.74 + (r % 2 ? bs * 0.87 : 0), r * bs * 1.5, bs * 0.94);
      g.fill();
    }
  }
  return c;
}

export function drawJar(g, x, y, jr, fillK, pulse, t, rrect) {
  g.save();
  g.translate(x, y);
  const kp = 1 + pulse * 0.14;
  g.scale(kp, 2 - kp);
  rrect(g, -jr * 0.72, -jr * 0.9, jr * 1.44, jr * 1.8, jr * 0.3);
  g.fillStyle = 'rgba(255,255,255,.55)';
  g.fill();
  g.lineWidth = 3.5;
  g.strokeStyle = INK;
  g.stroke();
  g.save();
  rrect(g, -jr * 0.72, -jr * 0.9, jr * 1.44, jr * 1.8, jr * 0.3);
  g.clip();
  const hy = jr * 0.9 - fillK * jr * 1.8;
  g.fillStyle = '#f0a000';
  g.beginPath();
  g.moveTo(-jr * 0.8, hy);
  for (let px = -jr * 0.8; px <= jr * 0.8; px += 6) g.lineTo(px, hy + Math.sin(px / 9 + t / 260) * 2.6);
  g.lineTo(jr * 0.8, jr);
  g.lineTo(-jr * 0.8, jr);
  g.closePath();
  g.fill();
  g.restore();
  rrect(g, -jr * 0.5, -jr * 1.15, jr, jr * 0.34, jr * 0.14);
  g.fillStyle = '#c98b52';
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = INK;
  g.stroke();
  g.restore();
}

// Harflerin üstündeki kelime hapı: seçilen harfler küçük peteklerde, sonuç rengiyle
const PILL = { ok: ['#2ee6a0', '#0f7a4a'], extra: ['#8ad8ff', '#0b6e93'], no: ['#ff8a9a', '#c42a3f'], used: ['#ffe27a', '#8a6a10'] };
export function drawPill(g, x, y, text, kind, s, t, shakeK = 0, col = themeColors()) {
  if (!text) return;
  const letters = !text.includes(' ');
  const n = letters ? text.length : 0;
  const tile = s * 0.9;
  const w = letters ? n * tile * 1.78 + s * 0.9 : Math.max(s * 4, text.length * s * 0.62 + s * 1.4);
  const h = s * 2.3;
  const ox = x + (shakeK ? Math.sin(t / 24) * s * 0.25 * shakeK : 0);
  const [glow, edge] = PILL[kind] || ['#ffffff', col.ink];
  g.save();
  g.beginPath();
  const r = h / 2;
  g.moveTo(ox - w / 2 + r, y - h / 2);
  g.arcTo(ox + w / 2, y - h / 2, ox + w / 2, y + h / 2, r);
  g.arcTo(ox + w / 2, y + h / 2, ox - w / 2, y + h / 2, r);
  g.arcTo(ox - w / 2, y + h / 2, ox - w / 2, y - h / 2, r);
  g.arcTo(ox - w / 2, y - h / 2, ox + w / 2, y - h / 2, r);
  g.closePath();
  g.fillStyle = 'rgba(42,22,54,.82)';
  if (kind) { g.shadowColor = glow; g.shadowBlur = 16; }
  g.fill();
  g.shadowBlur = 0;
  g.lineWidth = 3;
  g.strokeStyle = kind ? glow : 'rgba(255,255,255,.35)';
  g.stroke();
  if (letters) {
    for (let i = 0; i < n; i++) {
      const cx = ox - (n - 1) * tile * 0.89 + i * tile * 1.78;
      hexPath(g, cx, y, tile);
      g.fillStyle = kind ? glow : col.cell;
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = edge;
      g.stroke();
      label(g, cx, y + tile * 0.05, text[i], { size: tile * 1.05, color: INK, stroke: 'rgba(0,0,0,0)', sw: 0, font: '"Baloo 2", sans-serif' });
    }
  } else {
    label(g, ox, y + s * 0.05, text, { size: s * 0.82, color: kind ? glow : '#fff', stroke: 'rgba(0,0,0,0)', sw: 0, font: '"Baloo 2", sans-serif' });
  }
  g.restore();
}
