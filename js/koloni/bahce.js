// Bahçe: kesedeki balla kovanın çevresine çiçek, ağaç ve süs eklenir.
// Her bitkinin ekim ayları, açma ayları ve büyüme süresi var; koloninin takvimine göre
// tohum, filiz, çiçek ve kış uykusu evrelerinden geçer. Açan çiçekler bala bereket katar.

import { save } from '../core/save.js';

const INK = '#2a1636';
const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// plant: ekilebilen aylar, bloom: açtığı aylar (0 = Ocak), grow: olgunlaşma günü (bölüm başına 6 gün)
export const SHOP = [
  { id: 'papatya', kind: 'flower', name: 'Papatya', price: 120, plant: [2, 3, 4, 5, 6, 7], bloom: [3, 4, 5, 6, 7, 8], grow: 12, desc: 'Her yere uyan, arıların sevdiği küçük çiçek.' },
  { id: 'yonca', kind: 'flower', name: 'Yonca', price: 140, plant: [1, 2, 3, 7, 8], bloom: [4, 5, 6, 7, 8], grow: 12, desc: 'Yonca balı açık renkli ve hafiftir.' },
  { id: 'gelincik', kind: 'flower', name: 'Gelincik', price: 160, plant: [1, 2, 8, 9], bloom: [3, 4, 5], grow: 24, desc: 'Kırmızı yaprakları rüzgârda kâğıt gibi titrer.' },
  { id: 'lale', kind: 'flower', name: 'Lale', price: 220, plant: [8, 9, 10], bloom: [2, 3], grow: 30, desc: 'Soğanı sonbaharda toprağa girer, baharda açar.' },
  { id: 'kardelen', kind: 'flower', name: 'Kardelen', price: 180, plant: [8, 9, 10], bloom: [0, 1, 2], grow: 30, desc: 'Karın içinden ilk başını çıkaran çiçek.' },
  { id: 'kekik', kind: 'flower', name: 'Kekik', price: 240, plant: [2, 3, 4, 7, 8], bloom: [4, 5, 6], grow: 18, desc: 'Kekik balı kokusuyla en kıymetli ballardandır.' },
  { id: 'lavanta', kind: 'flower', name: 'Lavanta', price: 300, plant: [2, 3, 4, 8], bloom: [5, 6, 7], grow: 24, desc: 'Arılar lavantanın mor başaklarına bayılır.' },
  { id: 'aycicegi', kind: 'flower', name: 'Ayçiçeği', price: 260, plant: [2, 3, 4], bloom: [6, 7, 8], grow: 30, desc: 'Yüzünü gün boyu güneşe çeviren dev çiçek.' },
  { id: 'krizantem', kind: 'flower', name: 'Krizantem', price: 240, plant: [3, 4, 5], bloom: [8, 9, 10], grow: 30, desc: 'Sonbaharın son nektarını veren çiçeklerden.' },
  { id: 'erik', kind: 'tree', name: 'Erik Ağacı', price: 900, plant: [9, 10, 11, 0, 1], bloom: [2, 3], grow: 60, desc: 'Baharın ilk büyük nektar kaynağı, bembeyaz açar.' },
  { id: 'ihlamur', kind: 'tree', name: 'Ihlamur Ağacı', price: 1400, plant: [9, 10, 11, 0, 1], bloom: [5, 6], grow: 72, desc: 'Ihlamur balı kokusuyla meşhurdur.' },
  { id: 'kestane', kind: 'tree', name: 'Kestane Ağacı', price: 1200, plant: [9, 10, 11, 0, 1], bloom: [5, 6], grow: 72, desc: 'Koyu renkli, hafif acı kestane balı buradan gelir.' },
  { id: 'cam', kind: 'tree', name: 'Çam Ağacı', price: 1000, plant: [8, 9, 10, 11, 0, 1, 2], bloom: [6, 7, 8], grow: 60, desc: 'Çam balı ağacın tatlı özünden yapılır, hep yeşildir.' },
  { id: 'yalak', kind: 'item', name: 'Su Yalağı', price: 350, desc: 'Sıcak günlerde arılar buradan su taşır.' },
  { id: 'otel', kind: 'item', name: 'Böcek Oteli', price: 420, desc: 'Yaban arılarına ve uğur böceklerine yuva.' },
  { id: 'kusevi', kind: 'item', name: 'Kuş Evi', price: 380, desc: 'Bahçeye cıvıltı katar.' },
  { id: 'fener', kind: 'item', name: 'Bahçe Feneri', price: 450, desc: 'Gece olunca kovanın önünü aydınlatır.' },
  { id: 'bank', kind: 'item', name: 'Ahşap Bank', price: 500, desc: 'Arıları izlemek için oturacak bir yer.' },
];
export const byId = Object.fromEntries(SHOP.map((p) => [p.id, p]));

// Yerler: çiçekler önde, ağaçlar arkada, süslerin kendi yeri var
const SLOTS = {
  flower: [[24, 224], [52, 212], [80, 228], [108, 214], [136, 230], [300, 228], [328, 214], [354, 230], [380, 216], [160, 232], [278, 236], [122, 238]],
  tree: [[142, 188], [326, 186], [378, 190]],
  item: { yalak: [302, 214], otel: [110, 198], kusevi: [14, 206], fener: [166, 210], bank: [356, 206] },
};

export const monthsText = (list) => {
  if (!list || !list.length) return '';
  const s = [...list];
  return s.length === 1 ? AY[s[0]] : `${AY[s[0]]}-${AY[s[s.length - 1]]}`;
};
export const balance = () => Math.max(0, Math.round(save.data.stats.honey - (save.data.spent || 0)));
export const canPlantNow = (p, month) => p.kind === 'item' || p.plant.includes(month);

// Bitkinin bugünkü evresi
export function stageOf(item, k) {
  const p = byId[item.id];
  if (p.kind === 'item') return 'ok';
  const age = k.day - item.day;
  if (age < p.grow * 0.35) return 'tohum';
  if (age < p.grow) return 'filiz';
  if (p.bloom.includes(k.month)) return 'cicek';
  if (p.kind === 'tree') return p.id === 'cam' ? 'yesil' : k.season === 'kis' ? 'ciplak' : k.season === 'guz' ? 'guz' : 'yesil';
  return k.season === 'kis' ? 'uyku' : 'yaprak';
}

export function freeSlot(p) {
  const g = save.data.garden;
  if (p.kind === 'item') return g.some((x) => x.id === p.id) ? null : 0;
  const used = new Set(g.filter((x) => byId[x.id].kind === p.kind).map((x) => x.slot));
  const n = SLOTS[p.kind].length;
  for (let i = 0; i < n; i++) if (!used.has(i)) return i;
  return null;
}

export function plant(p, k) {
  const slot = freeSlot(p);
  if (slot === null) return { ok: false, why: p.kind === 'item' ? 'Bu süs zaten bahçede.' : 'Bahçede yer kalmadı.' };
  if (balance() < p.price) return { ok: false, why: `Kesende ${p.price} bal olmalı.` };
  if (!canPlantNow(p, k.month)) return { ok: false, why: `${p.name} ${monthsText(p.plant)} arasında ekilir.` };
  save.data.spent = (save.data.spent || 0) + p.price;
  save.data.garden.push({ id: p.id, slot, day: k.day, at: Date.now() });
  save.touch('garden');
  return { ok: true };
}

export const posOf = (item) => {
  const p = byId[item.id];
  return p.kind === 'item' ? SLOTS.item[p.id] : SLOTS[p.kind][item.slot];
};

// Bahçe bereketi: açan her çiçek %2, ağaç %5, en çok %30
export function bonus(k) {
  let b = 0;
  for (const it of save.data.garden) {
    if (stageOf(it, k) !== 'cicek') continue;
    b += byId[it.id].kind === 'tree' ? 0.05 : 0.02;
  }
  return Math.min(0.3, b);
}
export const bloomingCount = (k) => save.data.garden.filter((it) => stageOf(it, k) === 'cicek').length;

/* ---------- Çizimler: (0,0) toprağa değdiği nokta ---------- */

const stem = (h, c = '#3f9b55') => `<path d="M0 0 q1.5 ${-h / 2} 0 ${-h}" stroke="${c}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
const leaf = (x, y, r, flip = 1) => `<path d="M0 ${y} q${8 * flip * r} ${-3 * r} ${10 * flip * r} ${-9 * r} q${-7 * flip * r} ${0} ${-10 * flip * r} ${9 * r}z" fill="#5fb35a" stroke="${INK}" stroke-width="1"/>`;
const mound = (night) => `<ellipse cx="0" cy="1" rx="7" ry="2.6" fill="${night ? '#3b2f2a' : '#8a5a33'}"/>`;
const sprout = () => `${stem(6)}<path d="M0 -6 q-5 -3 -6 -7 q5 1 6 7zM0 -6 q5 -3 6 -7 q-5 1 -6 7z" fill="#7cc265" stroke="${INK}" stroke-width=".8"/>`;

const FLOWER = {
  papatya: (s) => `${stem(16)}${leaf(0, -5, 0.7)}<g class="gd-head">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cx="0" cy="-21" rx="1.8" ry="4.2" fill="#fff" stroke="${INK}" stroke-width=".7" transform="rotate(${a} 0 -17)"/>`).join('')}<circle cx="0" cy="-17" r="2.6" fill="#ffcd3c" stroke="${INK}" stroke-width=".8"/></g>`,
  yonca: () => `${[-5, 0, 5].map((x, i) => `<path d="M${x} 0 q0 -5 ${x / 3} -${9 + i * 2}" stroke="#3f9b55" stroke-width="1.6" fill="none"/>`).join('')}${[[-6, -6], [6, -5], [0, -9]].map(([x, y]) => `<g transform="translate(${x} ${y})">${[0, 120, 240].map((a) => `<circle cx="0" cy="-2" r="1.9" fill="#6fbf5a" transform="rotate(${a})"/>`).join('')}</g>`).join('')}<g class="gd-head"><circle cx="-1" cy="-15" r="3.4" fill="#ffd1e3" stroke="${INK}" stroke-width=".8"/><circle cx="4" cy="-12" r="2.8" fill="#fff" stroke="${INK}" stroke-width=".8"/></g>`,
  gelincik: () => `${stem(20)}<g class="gd-head">${[0, 90, 180, 270].map((a) => `<circle cx="0" cy="-24" r="3.6" fill="#e8343f" stroke="${INK}" stroke-width=".8" transform="rotate(${a} 0 -21)"/>`).join('')}<circle cx="0" cy="-21" r="1.8" fill="${INK}"/></g>`,
  lale: () => `${stem(18)}${leaf(0, -4, 0.9)}${leaf(0, -6, 0.8, -1)}<g class="gd-head"><path d="M-5 -26 q0 8 5 9 q5 -1 5 -9 l-2.5 3 l-2.5 -4 l-2.5 4z" fill="#e8343f" stroke="${INK}" stroke-width="1"/></g>`,
  kardelen: () => `<path d="M0 0 q1 -8 0 -12 q-1 -3 -4 -3" stroke="#3f9b55" stroke-width="1.8" fill="none"/>${leaf(0, -2, 0.7)}<g class="gd-head"><path d="M-4 -15 q-3 2 -2.5 6 q1.5 1 2.5 -1 q1 2 2.5 1 q.5 -4 -2.5 -6z" fill="#fff" stroke="${INK}" stroke-width=".8"/></g>`,
  kekik: () => `<path d="M-8 0 q8 -14 16 0z" fill="#5d9c55" stroke="${INK}" stroke-width=".8"/><g class="gd-head">${[[-5, -5], [-1, -8], [3, -6], [6, -3], [-3, -2], [1, -3]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#e6a0d8"/>`).join('')}</g>`,
  lavanta: () => `${[-5, -2, 1, 4].map((x, i) => `<path d="M${x / 2} 0 q${x / 4} -10 ${x} -${16 + (i % 2) * 4}" stroke="#7a9f6a" stroke-width="1.4" fill="none"/>`).join('')}<g class="gd-head">${[-5, -2, 1, 4].map((x, i) => `<ellipse cx="${x}" cy="-${18 + (i % 2) * 4}" rx="1.8" ry="5.2" fill="#9d6cf2" stroke="${INK}" stroke-width=".7"/>`).join('')}</g>`,
  aycicegi: () => `${stem(34, '#4c8f3f')}${leaf(0, -12, 1.1)}${leaf(0, -18, 1, -1)}<g class="gd-head gd-sun">${Array.from({ length: 12 }, (_, i) => `<ellipse cx="0" cy="-45" rx="2.2" ry="5" fill="#ffcd3c" stroke="${INK}" stroke-width=".6" transform="rotate(${i * 30} 0 -38)"/>`).join('')}<circle cx="0" cy="-38" r="5" fill="#7a4d24" stroke="${INK}" stroke-width="1"/></g>`,
  krizantem: () => `${stem(14)}${leaf(0, -4, 0.7, -1)}<g class="gd-head"><circle cx="0" cy="-17" r="5.4" fill="#f29a3a" stroke="${INK}" stroke-width=".9"/>${[0, 60, 120, 180, 240, 300].map((a) => `<circle cx="0" cy="-20.5" r="1.8" fill="#ffb867" transform="rotate(${a} 0 -17)"/>`).join('')}</g>`,
};

const TREE = {
  canopy: (fill, extra = '') => `<path d="M-3 0 L-2 -24 Q0 -28 2 -24 L3 0z" fill="#8a5a33" stroke="${INK}" stroke-width="1.4"/><g class="gd-tree">${[[-10, -30, 11], [8, -32, 12], [-1, -42, 12], [-14, -40, 8], [14, -42, 8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="1.2"/>`).join('')}${extra}</g>`,
  bare: (snow) => `<path d="M-3 0 L-2 -24 Q0 -28 2 -24 L3 0z" fill="#8a5a33" stroke="${INK}" stroke-width="1.4"/><path d="M0 -20 l-10 -14 M0 -24 l9 -16 M0 -28 l-2 -18 M-6 -28 l-6 -6 M5 -32 l7 -4" stroke="#8a5a33" stroke-width="2.4" stroke-linecap="round"/>${snow ? '<path d="M-12 -35 h6 M6 -41 h7 M-4 -47 h5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>' : ''}`,
  pine: (snow) => `<rect x="-2" y="-8" width="4" height="8" fill="#8a5a33" stroke="${INK}" stroke-width="1"/><g class="gd-tree">${[[0, -8, 16], [0, -20, 13], [0, -31, 10]].map(([x, y, w]) => `<path d="M${x - w} ${y} L${x} ${y - 16} L${x + w} ${y}z" fill="#2f7a4a" stroke="${INK}" stroke-width="1.2"/>${snow ? `<path d="M${x - w * 0.6} ${y - 6} L${x} ${y - 16} L${x + w * 0.6} ${y - 6} q${-w * 0.6} 3 ${-w * 1.2} 0z" fill="#fff"/>` : ''}`).join('')}</g>`,
};
const blossom = (col, n = 12, seed = 1) => Array.from({ length: n }, (_, i) => {
  const a = (i * 137.5 + seed * 40) * (Math.PI / 180);
  const r = 4 + ((i * 7) % 10);
  return `<circle cx="${(Math.cos(a) * r * 1.3).toFixed(1)}" cy="${(-36 + Math.sin(a) * r).toFixed(1)}" r="1.7" fill="${col}"/>`;
}).join('');

const ITEM = {
  yalak: (k) => `<path d="M-14 -8 h28 l-3 8 h-22z" fill="#a8743f" stroke="${INK}" stroke-width="1.4"/><path d="M-12 -7 h24 v2 h-24z" fill="${k.season === 'kis' ? '#e8f1fb' : '#6cc3f0'}"/><circle class="gd-ripple" cx="3" cy="-6" r="2" fill="none" stroke="#fff" stroke-width=".8"/>`,
  otel: () => `<rect x="-8" y="-22" width="16" height="22" fill="#c98b52" stroke="${INK}" stroke-width="1.4"/><path d="M-10 -22 l10 -8 l10 8z" fill="#8a5a33" stroke="${INK}" stroke-width="1.4"/>${[[-4, -16], [0, -16], [4, -16], [-4, -10], [0, -10], [4, -10], [-4, -4], [0, -4], [4, -4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#5a3a1f"/>`).join('')}`,
  kusevi: () => `<rect x="-1.4" y="-30" width="2.8" height="30" fill="#8a5a33"/><rect x="-7" y="-42" width="14" height="13" fill="#ffb867" stroke="${INK}" stroke-width="1.2"/><path d="M-9 -42 l9 -8 l9 8z" fill="#e8343f" stroke="${INK}" stroke-width="1.2"/><circle cx="0" cy="-36" r="2.4" fill="${INK}"/>`,
  fener: (k) => `${k.night ? '<circle class="gd-glow" cx="0" cy="-30" r="18" fill="url(#glowG)"/>' : ''}<rect x="-1.3" y="-26" width="2.6" height="26" fill="#3a2d40"/><rect x="-4.5" y="-35" width="9" height="10" rx="2" fill="${k.night ? '#ffe27a' : '#fff6d8'}" stroke="${INK}" stroke-width="1.2"/><path d="M-5.5 -35 h11 l-5.5 -4z" fill="#3a2d40"/>`,
  bank: () => `<rect x="-16" y="-10" width="32" height="3" rx="1" fill="#c98b52" stroke="${INK}" stroke-width="1"/><rect x="-16" y="-17" width="32" height="3" rx="1" fill="#c98b52" stroke="${INK}" stroke-width="1"/><path d="M-13 -7 v7 M13 -7 v7 M-13 -14 v4 M13 -14 v4" stroke="#8a5a33" stroke-width="2"/>`,
};

// Bitkinin evresine göre çizimi; preview: dükkânda olgun hali
export function drawItem(item, k, { preview = false } = {}) {
  const p = byId[item.id];
  if (p.kind === 'item') return ITEM[p.id](k);
  const st = preview ? (p.kind === 'tree' && !p.bloom.length ? 'yesil' : 'cicek') : stageOf(item, k);
  const night = k.night && !preview;
  if (p.kind === 'flower') {
    if (st === 'tohum') return `${mound(night)}${sprout()}`;
    if (st === 'uyku') return `${mound(night)}${k.season === 'kis' ? '<ellipse cx="0" cy="-1" rx="6" ry="2" fill="#fff"/>' : ''}`;
    if (st === 'filiz' || st === 'yaprak') return `${stem(st === 'filiz' ? 9 : 13)}${leaf(0, -3, 0.8)}${leaf(0, -5, 0.7, -1)}`;
    return FLOWER[p.id](k);
  }
  // Ağaçlar
  if (st === 'tohum') return `${mound(night)}${sprout()}`;
  if (st === 'filiz') return `<g transform="scale(.55)">${p.id === 'cam' ? TREE.pine(false) : TREE.canopy('#7cc265')}</g>`;
  if (p.id === 'cam') return TREE.pine(k.season === 'kis');
  if (st === 'ciplak') return TREE.bare(k.season === 'kis');
  const fill = st === 'guz' ? '#f29a3a' : p.id === 'ihlamur' ? '#6fb35e' : '#5fb35a';
  const flowers = st === 'cicek' ? blossom(p.id === 'erik' ? '#fff' : p.id === 'ihlamur' ? '#f7ef9a' : '#fff6d8', 14, p.id.length) : '';
  return TREE.canopy(st === 'cicek' && p.id === 'erik' ? '#f3f7f0' : fill, flowers);
}

// Sahneye eklenecek bahçe katmanı ve arıların gideceği çiçek başları
export function gardenSVG(k) {
  const list = save.data.garden.map((it) => ({ it, pos: posOf(it) })).filter((x) => x.pos).sort((a, b) => a.pos[1] - b.pos[1]);
  const heads = [];
  const items = list.map(({ it, pos }) => {
    const p = byId[it.id];
    const st = stageOf(it, k);
    const sc = p.kind === 'tree' ? 1.15 : 1.3;
    if (st === 'cicek') {
      const h = p.kind === 'tree' ? 38 : p.id === 'aycicegi' ? 38 : p.id === 'kekik' ? 6 : p.id === 'lavanta' ? 20 : 17;
      heads.push({ x: pos[0], y: pos[1] - h * sc, tree: p.kind === 'tree' });
    }
    const fresh = Date.now() - (it.at || 0) < 20000 ? ' gd-new' : '';
    return { y: pos[1], svg: `<g class="gd gd-${p.kind}${fresh}" style="animation-delay:${((pos[0] * 37) % 300) / -100}s" transform="translate(${pos[0]} ${pos[1]}) scale(${sc})">${drawItem(it, k)}</g>` };
  });
  return { items, heads };
}

// Dükkân kartı için küçük önizleme
export const previewSVG = (id, k) => {
  const p = byId[id];
  const vb = p.kind === 'tree' ? '-26 -62 52 66' : p.kind === 'item' ? '-20 -46 40 50' : '-16 -50 32 54';
  return `<svg viewBox="${vb}" aria-hidden="true"><defs><radialGradient id="glowG"><stop offset="0" stop-color="#ffe27a" stop-opacity=".7"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></radialGradient></defs><ellipse cx="0" cy="1" rx="${p.kind === 'tree' ? 18 : 12}" ry="3" fill="#2a163622"/>${drawItem({ id, slot: 0, day: -999 }, { ...k, night: false, season: 'yaz', month: (p.bloom && p.bloom[0]) || 6 }, { preview: true })}</svg>`;
};
