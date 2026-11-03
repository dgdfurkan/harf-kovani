// Kovanın sahnesi ve petek çerçevesi: SVG olarak çizilir, CSS ile canlanır; arılar, kuşlar ve hava
// canli.js içindeki tuval katmanında yaşar. Mevsim, hava, günün saati ve bahçe her şeyi değiştirir.

import { save } from '../core/save.js';
import { gardenSVG } from './bahce.js';

const INK = '#2a1636';
const rnd = (seed) => {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
};

const SKY = {
  bahar: ['#9fdcff', '#fff4d8'],
  yaz: ['#7ccaff', '#ffe6a6'],
  guz: ['#f5c290', '#ffe9cc'],
  kis: ['#c9d8ea', '#f2f6fb'],
  gece: ['#141a42', '#3b2c5e'],
  kapali: ['#a9b7c6', '#e6ebf0'],
  safak: ['#ffb38a', '#ffe8c4'],
  aksam: ['#7a5aa8', '#ffad7a'],
};
const GROUND = { bahar: ['#8fd06a', '#6fb44e'], yaz: ['#a8cf5c', '#86b343'], guz: ['#d9ab55', '#bf8a3c'], kis: ['#f4f7fb', '#dfe7f0'] };
const HILL = { bahar: ['#b9e59b', '#9fd47f'], yaz: ['#c5df86', '#a9c86b'], guz: ['#e8be7a', '#d39f5c'], kis: ['#e9eef5', '#d5dfea'] };
const CANOPY = { bahar: ['#ffc6db', '#ffdbe8', '#f7a8c6'], yaz: ['#5fb35a', '#76c46a', '#4f9e4b'], guz: ['#f29a3a', '#f6b452', '#de7a2c'], kis: [] };
const PETAL = { bahar: ['#ffffff', '#ffd1e3', '#ffe27a', '#c9b6ff'], yaz: ['#b98bff', '#9d6cf2', '#ffe27a', '#ff9ec4'], guz: ['#ffcd3c', '#f29a3a'], kis: [] };

export const beeGlyph = (s = 1) => `<g transform="scale(${s})"><ellipse class="sb-wing" cx="-1" cy="-5" rx="4.5" ry="2.6" fill="#fff" opacity=".85"/><ellipse class="sb-wing sb-wing2" cx="3" cy="-4.6" rx="3.6" ry="2.2" fill="#fff" opacity=".8"/><ellipse cx="0" cy="0" rx="5.4" ry="3.8" fill="#ffcd3c" stroke="${INK}" stroke-width="1.3"/><path d="M-1 -3.6v7.2M2.4 -3.2v6.4" stroke="${INK}" stroke-width="1.5"/><circle cx="-4.6" cy="-.6" r="1.6" fill="${INK}"/></g>`;

// Kovan kat sayısına göre ölçeklenir ki tepesi sahneden taşmasın; giriş deliği buna göre yer değiştirir
const HIVE_SCALE = [1.3, 1.24, 1.06, 0.92];
const hiveScale = (boxes) => HIVE_SCALE[Math.max(0, Math.min(3, boxes - 1))];
export const ENTRANCE = { x: 232, y: 186 };
const WILD = [[96, 200], [118, 222], [150, 204], [186, 222], [292, 204], [312, 222], [344, 202], [368, 222], [392, 206], [40, 230]];

// Sahne: SVG katmanı ve canlı katmanın kullanacağı çiçek başları
export function sceneData(k) {
  const r = rnd(k.day + 3);
  const night = k.night;
  const hour = k.hour ?? 12;
  const grey = ['yagmur', 'bulut', 'kar'].includes(k.weather);
  let sky = SKY[k.season];
  if (night) sky = SKY.gece;
  else if (grey && k.season !== 'kis') sky = SKY.kapali;
  else if (hour < 8) sky = SKY.safak;
  else if (hour >= 18) sky = SKY.aksam;
  const [g1, g2] = GROUND[k.season];
  const [h1, h2] = HILL[k.season];
  const garden = gardenSVG(k);
  const heads = [...garden.heads];
  const out = [];
  out.push(`<defs>
    <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
    <linearGradient id="boxG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd65a"/><stop offset="1" stop-color="#eaa725"/></linearGradient>
    <linearGradient id="boxG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2c9"/><stop offset="1" stop-color="#f1d58e"/></linearGradient>
    <radialGradient id="sunG"><stop offset="0" stop-color="#fff7c2"/><stop offset=".6" stop-color="#ffd84a"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowG"><stop offset="0" stop-color="#ffe27a" stop-opacity=".7"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></radialGradient>
    <linearGradient id="hazeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".35"/></linearGradient>
  </defs>`);
  out.push('<rect width="400" height="240" fill="url(#skyG)"/>');
  // Gökyüzü: güneş ışınlarıyla döner, gece ay ve yıldızlar
  if (night) {
    for (let i = 0; i < 34; i++) out.push(`<circle class="sb-star" style="animation-delay:${(-r() * 3).toFixed(2)}s;animation-duration:${(1.8 + r() * 2.4).toFixed(1)}s" cx="${(r() * 400).toFixed(1)}" cy="${(r() * 120).toFixed(1)}" r="${(0.5 + r() * 1.3).toFixed(1)}" fill="#fff"/>`);
    out.push(`<g class="sb-moon"><circle cx="330" cy="46" r="26" fill="#fff6d6" opacity=".12"/><circle cx="330" cy="46" r="18" fill="#fff6d6"/><circle cx="338" cy="40" r="16" fill="${sky[0]}"/></g>`);
  } else if (!grey || k.weather === 'gunes') {
    const sy = hour < 8 ? 92 : hour >= 18 ? 96 : 48;
    const sr = k.weather === 'sicak' ? 22 : 17;
    out.push(`<g class="sb-rays" style="transform-origin:335px ${sy}px">${Array.from({ length: 12 }, (_, i) => `<path d="M335 ${sy - sr - 6} l3 -12 l3 12z" fill="#ffe066" opacity=".55" transform="rotate(${i * 30} 335 ${sy})"/>`).join('')}</g>`);
    out.push(`<circle class="sb-sun" cx="335" cy="${sy}" r="${sr * 2}" fill="url(#sunG)"/><circle cx="335" cy="${sy}" r="${sr}" fill="${hour >= 18 || hour < 8 ? '#ffb347' : '#ffe066'}" stroke="${INK}" stroke-width="2"/>`);
  }
  // Bulutlar sahnenin bir ucundan öbürüne geçer
  const clouds = grey ? 6 : k.weather === 'ruzgar' ? 4 : night ? 2 : 3;
  for (let i = 0; i < clouds; i++) {
    const y = 14 + r() * 64;
    const sc = 0.6 + r() * 0.8;
    const c = grey && !night ? '#eef1f5' : '#ffffff';
    const dur = (k.weather === 'ruzgar' ? 30 : 70) + r() * 50;
    out.push(`<g class="sb-cloud" style="animation-duration:${dur.toFixed(0)}s;animation-delay:${(-r() * dur).toFixed(1)}s"><g transform="translate(-70 ${y.toFixed(0)}) scale(${sc.toFixed(2)})" opacity="${night ? 0.22 : 0.95}"><ellipse cx="0" cy="0" rx="26" ry="11" fill="${c}"/><ellipse cx="-14" cy="3" rx="16" ry="9" fill="${c}"/><ellipse cx="15" cy="2" rx="18" ry="9.5" fill="${c}"/><ellipse cx="2" cy="-7" rx="15" ry="10" fill="${c}"/></g></g>`);
  }
  // Tepeler ve çayır
  out.push(`<path d="M0 150 Q70 110 150 140 T300 128 T400 140 V240 H0z" fill="${night ? '#2c3a55' : h1}"/>`);
  out.push(`<path d="M0 165 Q90 140 190 158 T400 150 V240 H0z" fill="${night ? '#24314a' : h2}"/>`);
  if (!night) out.push('<rect y="120" width="400" height="60" fill="url(#hazeG)"/>');
  out.push(`<path d="M0 182 Q120 168 240 178 T400 176 V240 H0z" fill="${night ? '#1d2a40' : g1}"/>`);
  out.push(`<rect y="205" width="400" height="35" fill="${night ? '#18233a' : g2}"/>`);
  // Yaşlı ağaç
  out.push('<g transform="translate(66 186)">');
  out.push(`<path d="M-5 0 L-3 -46 Q-2 -52 0 -56 Q2 -52 3 -46 L5 0z" fill="#8a5a33" stroke="${INK}" stroke-width="2"/>`);
  out.push(`<path d="M0 -40 L-16 -58 M1 -46 L14 -64 M0 -52 L-6 -70" stroke="#8a5a33" stroke-width="4" stroke-linecap="round"/>`);
  const can = CANOPY[k.season];
  if (can.length) {
    out.push('<g class="sb-crown">');
    [[-18, -64, 20], [14, -70, 22], [-4, -84, 22], [-26, -78, 15], [26, -86, 15]].forEach(([x, y, rr], i) => {
      out.push(`<circle class="sb-leafy" style="animation-delay:${-i * 0.6}s" cx="${x}" cy="${y}" r="${rr}" fill="${night ? '#2f4a3c' : can[i % can.length]}" stroke="${INK}" stroke-width="1.6"/>`);
    });
    if (k.season === 'bahar' && !night) for (let i = 0; i < 12; i++) out.push(`<circle cx="${(-30 + r() * 60).toFixed(0)}" cy="${(-96 + r() * 44).toFixed(0)}" r="2.6" fill="#fff"/>`);
    out.push('</g>');
    if (k.season === 'bahar' && !night) heads.push({ x: 60, y: 110, tree: true });
  } else {
    out.push(`<path d="M-16 -58 l-8 -10 M14 -64 l8 -12 M-6 -70 l-4 -12" stroke="#8a5a33" stroke-width="3" stroke-linecap="round"/>`);
    out.push('<path d="M-22 -60 h14 M8 -66 h14 M-10 -74 h10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>');
  }
  out.push('</g>');
  // Kır çiçekleri: bahçe doldukça azalır
  const petals = PETAL[k.season];
  const gardenFlowers = save.data.garden.filter((x) => x.id && !['erik', 'ihlamur', 'kestane', 'cam', 'yalak', 'otel', 'kusevi', 'fener', 'bank'].includes(x.id)).length;
  const wildN = Math.max(3, WILD.length - gardenFlowers);
  WILD.slice(0, wildN).forEach(([x, y], i) => {
    if (!petals.length || i / wildN >= k.bloom) return;
    const col = night ? '#5b5f86' : petals[i % petals.length];
    out.push(`<g class="sb-flower" style="animation-delay:${(-r() * 3).toFixed(2)}s" transform="translate(${x} ${y})"><path d="M0 0 q1 -8 0 -14" stroke="${night ? '#2f4a3c' : '#3f9b55'}" stroke-width="2" fill="none"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-19" rx="2.6" ry="4.6" fill="${col}" transform="rotate(${a} 0 -14)"/>`).join('')}<circle cx="0" cy="-14" r="2.4" fill="#ffcd3c"/></g>`);
    if (!night) heads.push({ x, y: y - 14 });
  });
  // Bahçe: kovanın arkasındakiler önce, öndekiler sonra çizilir
  const back = garden.items.filter((x) => x.y < 200).map((x) => x.svg);
  const front = garden.items.filter((x) => x.y >= 200).map((x) => x.svg);
  out.push(back.join(''));
  // Kovan: kat sayısı koloniyle büyür
  const bx = 232;
  const base = 196;
  const hs = hiveScale(k.boxes);
  out.push(`<g transform="translate(${bx} ${base + 8}) scale(${hs}) translate(${-bx} ${-base - 8})"><g class="sb-hive"><ellipse cx="${bx}" cy="${base + 22}" rx="58" ry="5" fill="#2a163625"/><rect x="${bx - 52}" y="${base}" width="104" height="8" rx="2" fill="#8a5a33" stroke="${INK}" stroke-width="2"/><path d="M${bx - 44} ${base + 8} v14 M${bx + 44} ${base + 8} v14" stroke="#8a5a33" stroke-width="5"/>`);
  for (let i = 0; i < k.boxes; i++) {
    const y = base - (i + 1) * 28;
    out.push(`<rect x="${bx - 46}" y="${y}" width="92" height="28" rx="3" fill="url(#${i % 2 ? 'boxG2' : 'boxG'})" stroke="${INK}" stroke-width="2.4"/><path d="M${bx - 40} ${y + 14} h80" stroke="${INK}" stroke-width="1.2" opacity=".25"/><circle cx="${bx + 34}" cy="${y + 8}" r="2" fill="${INK}" opacity=".35"/>`);
  }
  const top = base - k.boxes * 28;
  out.push(`<path d="M${bx - 54} ${top} h108 l-10 -14 h-88z" fill="#c98b52" stroke="${INK}" stroke-width="2.4"/>`);
  if (k.season === 'kis') out.push(`<path d="M${bx - 52} ${top - 2} q20 -8 54 -6 q30 -2 50 6 l-8 -10 h-88z" fill="#fff"/>`);
  out.push(`<rect x="${bx - 14}" y="${base - 9}" width="28" height="6" rx="3" fill="${INK}"/><path d="M${bx - 20} ${base - 3} h40 l6 6 h-52z" fill="#a8743f" stroke="${INK}" stroke-width="1.6"/></g></g>`);
  // Arıcı: sonbahar hasadında kovanın yanında
  if (k.season === 'guz' && !night && k.weather !== 'yagmur') {
    out.push(`<g class="sb-keeper" transform="translate(316 186)"><path d="M-12 18 l-3 -34 h30 l-3 34z" fill="#f1f5fb" stroke="${INK}" stroke-width="2"/><circle cx="0" cy="-26" r="12" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M-12 -26 h24" stroke="${INK}" stroke-width="1.5"/><path d="M-17 -36 q17 -12 34 0 l2 6 h-38z" fill="#c98b52" stroke="${INK}" stroke-width="2"/><g class="sb-arm"><path d="M-16 -6 q-14 4 -22 -4" stroke="${INK}" stroke-width="3" fill="none"/><rect x="-46" y="-16" width="10" height="16" rx="2" fill="#8c97a8" stroke="${INK}" stroke-width="1.6"/></g><g class="sb-smoke"><circle cx="-41" cy="-24" r="4" fill="#e5ebf2"/><circle cx="-38" cy="-33" r="5" fill="#e5ebf2" opacity=".7"/><circle cx="-35" cy="-43" r="6" fill="#e5ebf2" opacity=".45"/></g></g>`);
  }
  out.push(front.join(''));
  if (night) out.push('<rect width="400" height="240" fill="#0b0f2e" opacity=".18"/>');
  return {
    svg: `<svg class="scene" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${out.join('')}</svg>`,
    heads,
    entrance: { x: bx, y: base + 8 - 14 * hs },
    hive: { x0: bx - 54 * hs, x1: bx + 54 * hs, y0: base + 8 - (k.boxes * 28 + 26) * hs, y1: base + 22 },
  };
}
export const sceneSVG = (k) => sceneData(k).svg;

/* ---------- Petek çerçevesi: koloniyle büyüyen 3B petek ---------- */

const COLS = 9;
const ROWS = 7;
const R = 13;
const cellsOrder = (() => {
  const list = [];
  for (let row = 0; row < ROWS; row++) {
    for (let c = 0; c < COLS; c++) {
      const x = 22 + c * R * 1.74 + (row % 2 ? R * 0.87 : 0) + R;
      const y = 24 + row * R * 1.5 + R;
      list.push({ x, y, d: Math.hypot((x - 130) / 1.1, y - 88) });
    }
  }
  // Arılar peteği ortadan dışa doğru örer
  return list.sort((a, b) => a.d - b.d);
})();
const hexD = (x, y, s) => {
  const p = [];
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 3;
    p.push(`${(x + Math.cos(a) * s).toFixed(1)},${(y + Math.sin(a) * s).toFixed(1)}`);
  }
  return `M${p.join('L')}Z`;
};

export function combSVG(k, seenBuilt = 0) {
  const total = cellsOrder.length;
  const built = Math.max(12, Math.min(total, 12 + Math.round(k.lv * 0.95)));
  const out = [`<defs>
    <linearGradient id="waxG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe2a0"/><stop offset="1" stop-color="#d9a33a"/></linearGradient>
    <radialGradient id="honeyG" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffdd66"/><stop offset=".55" stop-color="#f0a800"/><stop offset="1" stop-color="#c47a00"/></radialGradient>
    <linearGradient id="capG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="#efd59a"/></linearGradient>
    <radialGradient id="broodG" cx=".45" cy=".4" r=".8"><stop offset="0" stop-color="#f6dcae"/><stop offset="1" stop-color="#cf9f5c"/></radialGradient>
    <linearGradient id="frameG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7a26a"/><stop offset="1" stop-color="#9b6534"/></linearGradient>
  </defs>`];
  out.push(`<rect x="6" y="8" width="248" height="166" rx="10" fill="url(#frameG)" stroke="${INK}" stroke-width="3"/>`);
  out.push(`<rect x="16" y="18" width="228" height="146" rx="6" fill="#7a4d24" opacity=".55"/>`);
  cellsOrder.forEach((c, i) => {
    if (i >= built) {
      out.push(`<path d="${hexD(c.x, c.y, R * 0.92)}" fill="none" stroke="#f6d58f" stroke-opacity=".22" stroke-width="1"/>`);
      return;
    }
    const t = i / built;
    // Ortada yavru, çevresinde polen, dışta bal; yenileri açık bal, eskileri kapaklı
    let kind = t < 0.3 ? 'brood' : t < 0.42 ? 'pollen' : (i % 3 === 0 && t > 0.8 ? 'open' : 'cap');
    if (k.season === 'kis' && kind === 'brood') kind = i % 4 ? 'cap' : 'brood';
    const fresh = i >= seenBuilt && seenBuilt > 0 ? ' cb-fresh' : '';
    const delay = fresh ? ` style="animation-delay:${((i - seenBuilt) * 0.08).toFixed(2)}s"` : '';
    out.push(`<g class="cb-cell${fresh}"${delay}>`);
    out.push(`<path d="${hexD(c.x, c.y, R * 0.96)}" fill="url(#waxG)" stroke="${INK}" stroke-width="1.4"/>`);
    out.push(`<path d="${hexD(c.x + 0.8, c.y + 1.2, R * 0.72)}" fill="#a86f1c" opacity=".55"/>`);
    if (kind === 'cap') out.push(`<path d="${hexD(c.x, c.y, R * 0.7)}" fill="url(#capG)"/><ellipse cx="${(c.x - 2).toFixed(1)}" cy="${(c.y - 3).toFixed(1)}" rx="3.4" ry="1.8" fill="#fff" opacity=".55"/>`);
    else if (kind === 'open') out.push(`<path d="${hexD(c.x, c.y + 0.6, R * 0.66)}" fill="url(#honeyG)"/><ellipse cx="${(c.x - 2.4).toFixed(1)}" cy="${(c.y - 2.6).toFixed(1)}" rx="3" ry="1.6" fill="#fff" opacity=".7"/>`);
    else if (kind === 'brood') out.push(`<path d="${hexD(c.x, c.y, R * 0.68)}" fill="url(#broodG)"/><ellipse cx="${(c.x - 1.6).toFixed(1)}" cy="${(c.y - 2).toFixed(1)}" rx="2.6" ry="1.5" fill="#fff" opacity=".4"/>`);
    else out.push(`<circle cx="${c.x.toFixed(1)}" cy="${(c.y + 1).toFixed(1)}" r="${(R * 0.42).toFixed(1)}" fill="${['#f5a623', '#e8d24b', '#d5782c', '#f0c430'][i % 4]}"/>`);
    out.push('</g>');
  });
  // Peteğin üstünde gezinen arılar
  const n = Math.min(6, 1 + Math.floor(k.lv / 8));
  for (let i = 0; i < n; i++) {
    const c = cellsOrder[(i * 7) % Math.max(1, built)];
    out.push(`<g transform="translate(${c.x.toFixed(0)} ${c.y.toFixed(0)})"><g class="cb-crawl cb-c${i % 3}" style="animation-delay:${(-i * 1.9).toFixed(1)}s">${beeGlyph(1.05)}</g></g>`);
  }
  return { svg: `<svg class="comb" viewBox="0 0 260 182" aria-hidden="true">${out.join('')}</svg>`, built };
}

// Üst çubuktaki küçük petek rozeti
export const combBadge = () => `<svg class="comb-badge" viewBox="0 0 40 36" aria-hidden="true">${[[13, 10], [27, 10], [6, 22], [20, 22], [34, 22], [13, 34], [27, 34]].slice(0, 5).map(([x, y], i) => `<path d="${hexD(x, y - 4, 7)}" fill="${i === 3 ? '#f0a800' : '#ffd65a'}" stroke="${INK}" stroke-width="1.8"/>`).join('')}</svg>`;
