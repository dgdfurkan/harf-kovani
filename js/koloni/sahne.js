// Kovanın sahnesi ve petek çerçevesi: SVG olarak çizilir, CSS ile canlanır.
// Mevsim, hava, gece-gündüz ve koloninin büyüklüğü her şeyi değiştirir.

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
};
const GROUND = { bahar: ['#8fd06a', '#6fb44e'], yaz: ['#a8cf5c', '#86b343'], guz: ['#d9ab55', '#bf8a3c'], kis: ['#f4f7fb', '#dfe7f0'] };
const HILL = { bahar: ['#b9e59b', '#9fd47f'], yaz: ['#c5df86', '#a9c86b'], guz: ['#e8be7a', '#d39f5c'], kis: ['#e9eef5', '#d5dfea'] };
const CANOPY = { bahar: ['#ffc6db', '#ffdbe8', '#f7a8c6'], yaz: ['#5fb35a', '#76c46a', '#4f9e4b'], guz: ['#f29a3a', '#f6b452', '#de7a2c'], kis: [] };
const PETAL = { bahar: ['#ffffff', '#ffd1e3', '#ffe27a', '#c9b6ff'], yaz: ['#b98bff', '#9d6cf2', '#ffe27a', '#ff9ec4'], guz: ['#ffcd3c', '#f29a3a'], kis: [] };

const beeGlyph = (s = 1) => `<g transform="scale(${s})"><ellipse class="sb-wing" cx="-1" cy="-5" rx="4.5" ry="2.6" fill="#fff" opacity=".85"/><ellipse class="sb-wing sb-wing2" cx="3" cy="-4.6" rx="3.6" ry="2.2" fill="#fff" opacity=".8"/><ellipse cx="0" cy="0" rx="5.4" ry="3.8" fill="#ffcd3c" stroke="${INK}" stroke-width="1.3"/><path d="M-1 -3.6v7.2M2.4 -3.2v6.4" stroke="${INK}" stroke-width="1.5"/><circle cx="-4.6" cy="-.6" r="1.6" fill="${INK}"/></g>`;

export function sceneSVG(k) {
  const r = rnd(k.day + 3);
  const night = k.night;
  const grey = ['yagmur', 'bulut', 'kar'].includes(k.weather);
  const sky = night ? SKY.gece : grey && k.season !== 'kis' ? SKY.kapali : SKY[k.season];
  const [g1, g2] = GROUND[k.season];
  const [h1, h2] = HILL[k.season];
  const out = [];
  out.push(`<defs>
    <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
    <linearGradient id="boxG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd65a"/><stop offset="1" stop-color="#eaa725"/></linearGradient>
    <linearGradient id="boxG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2c9"/><stop offset="1" stop-color="#f1d58e"/></linearGradient>
    <radialGradient id="sunG"><stop offset="0" stop-color="#fff7c2"/><stop offset=".6" stop-color="#ffd84a"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/></radialGradient>
  </defs>`);
  out.push('<rect width="400" height="240" fill="url(#skyG)"/>');
  // Gökyüzü: güneş, ay, yıldızlar
  if (night) {
    for (let i = 0; i < 26; i++) out.push(`<circle class="sb-star" style="animation-delay:${(-r() * 3).toFixed(2)}s" cx="${(r() * 400).toFixed(1)}" cy="${(r() * 110).toFixed(1)}" r="${(0.6 + r() * 1.2).toFixed(1)}" fill="#fff"/>`);
    out.push(`<circle cx="330" cy="46" r="18" fill="#fff6d6"/><circle cx="338" cy="40" r="16" fill="${sky[0]}"/>`);
  } else if (!grey || k.weather === 'gunes') {
    out.push(`<circle class="sb-sun" cx="335" cy="48" r="${k.weather === 'sicak' ? 44 : 34}" fill="url(#sunG)"/><circle cx="335" cy="48" r="${k.weather === 'sicak' ? 22 : 17}" fill="#ffe066" stroke="${INK}" stroke-width="2"/>`);
  }
  // Bulutlar
  const clouds = grey ? 5 : k.weather === 'ruzgar' ? 3 : night ? 1 : 2;
  for (let i = 0; i < clouds; i++) {
    const y = 18 + r() * 60;
    const s = 0.7 + r() * 0.7;
    const c = grey && !night ? '#eef1f5' : '#ffffff';
    out.push(`<g class="sb-cloud" style="animation-duration:${(40 + r() * 40).toFixed(0)}s;animation-delay:${(-r() * 60).toFixed(1)}s"><g transform="translate(${(r() * 380).toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})" opacity="${night ? 0.25 : 0.95}"><ellipse cx="0" cy="0" rx="26" ry="11" fill="${c}"/><ellipse cx="-14" cy="3" rx="16" ry="9" fill="${c}"/><ellipse cx="15" cy="2" rx="18" ry="9.5" fill="${c}"/><ellipse cx="2" cy="-7" rx="15" ry="10" fill="${c}"/></g></g>`);
  }
  // Tepeler ve çayır
  out.push(`<path d="M0 150 Q70 110 150 140 T300 128 T400 140 V240 H0z" fill="${night ? '#2c3a55' : h1}"/>`);
  out.push(`<path d="M0 165 Q90 140 190 158 T400 150 V240 H0z" fill="${night ? '#24314a' : h2}"/>`);
  out.push(`<path d="M0 182 Q120 168 240 178 T400 176 V240 H0z" fill="${night ? '#1d2a40' : g1}"/>`);
  out.push(`<rect y="205" width="400" height="35" fill="${night ? '#18233a' : g2}"/>`);
  // Ağaç
  out.push('<g transform="translate(66 186)">');
  out.push(`<path d="M-5 0 L-3 -46 Q-2 -52 0 -56 Q2 -52 3 -46 L5 0z" fill="#8a5a33" stroke="${INK}" stroke-width="2"/>`);
  out.push(`<path d="M0 -40 L-16 -58 M1 -46 L14 -64 M0 -52 L-6 -70" stroke="#8a5a33" stroke-width="4" stroke-linecap="round"/>`);
  const can = CANOPY[k.season];
  if (can.length) {
    [[-18, -64, 20], [14, -70, 22], [-4, -84, 22], [-26, -78, 15], [26, -86, 15]].forEach(([x, y, rr], i) => {
      out.push(`<circle class="sb-leafy" style="animation-delay:${-i * 0.6}s" cx="${x}" cy="${y}" r="${rr}" fill="${night ? '#2f4a3c' : can[i % can.length]}" stroke="${INK}" stroke-width="1.6"/>`);
    });
    if (k.season === 'bahar' && !night) for (let i = 0; i < 9; i++) out.push(`<circle cx="${(-30 + r() * 60).toFixed(0)}" cy="${(-96 + r() * 44).toFixed(0)}" r="2.6" fill="#fff"/>`);
  } else {
    out.push(`<path d="M-16 -58 l-8 -10 M14 -64 l8 -12 M-6 -70 l-4 -12" stroke="#8a5a33" stroke-width="3" stroke-linecap="round"/>`);
    out.push('<path d="M-22 -60 h14 M8 -66 h14 M-10 -74 h10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>');
  }
  out.push('</g>');
  // Çiçekler
  const petals = PETAL[k.season];
  const spots = [[112, 198], [130, 214], [150, 196], [172, 216], [296, 200], [318, 214], [340, 198], [360, 216], [380, 202], [96, 218], [196, 222], [276, 222], [24, 214], [46, 226], [386, 228]];
  spots.forEach(([x, y], i) => {
    if (!petals.length || i / spots.length >= k.bloom) return;
    const col = night ? '#5b5f86' : petals[i % petals.length];
    out.push(`<g class="sb-flower" style="animation-delay:${(-r() * 3).toFixed(2)}s" transform="translate(${x} ${y})"><path d="M0 0 q1 -8 0 -14" stroke="${night ? '#2f4a3c' : '#3f9b55'}" stroke-width="2" fill="none"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-19" rx="2.6" ry="4.6" fill="${col}" transform="rotate(${a} 0 -14)"/>`).join('')}<circle cx="0" cy="-14" r="2.4" fill="#ffcd3c"/></g>`);
  });
  // Kovan: kat sayısı koloniyle büyür
  const bx = 232;
  const base = 196;
  out.push(`<g transform="translate(${bx} ${base + 8}) scale(1.3) translate(${-bx} ${-base - 8})"><g class="sb-hive"><rect x="${bx - 52}" y="${base}" width="104" height="8" rx="2" fill="#8a5a33" stroke="${INK}" stroke-width="2"/><path d="M${bx - 44} ${base + 8} v14 M${bx + 44} ${base + 8} v14" stroke="#8a5a33" stroke-width="5"/>`);
  for (let i = 0; i < k.boxes; i++) {
    const y = base - (i + 1) * 28;
    out.push(`<rect x="${bx - 46}" y="${y}" width="92" height="28" rx="3" fill="url(#${i % 2 ? 'boxG2' : 'boxG'})" stroke="${INK}" stroke-width="2.4"/><path d="M${bx - 40} ${y + 14} h80" stroke="${INK}" stroke-width="1.2" opacity=".25"/>`);
  }
  const top = base - k.boxes * 28;
  out.push(`<path d="M${bx - 54} ${top} h108 l-10 -14 h-88z" fill="#c98b52" stroke="${INK}" stroke-width="2.4"/>`);
  if (k.season === 'kis') out.push(`<path d="M${bx - 52} ${top - 2} q20 -8 54 -6 q30 -2 50 6 l-8 -10 h-88z" fill="#fff"/>`);
  out.push(`<rect x="${bx - 14}" y="${base - 9}" width="28" height="6" rx="3" fill="${INK}"/><path d="M${bx - 20} ${base - 3} h40 l6 6 h-52z" fill="#a8743f" stroke="${INK}" stroke-width="1.6"/></g></g>`);
  // Arıcı: sonbahar hasadında kovanın yanında
  if (k.season === 'guz' && !night && k.weather !== 'yagmur') {
    out.push(`<g class="sb-keeper" transform="translate(316 186)"><path d="M-12 18 l-3 -34 h30 l-3 34z" fill="#f1f5fb" stroke="${INK}" stroke-width="2"/><circle cx="0" cy="-26" r="12" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M-12 -26 h24" stroke="${INK}" stroke-width="1.5"/><path d="M-17 -36 q17 -12 34 0 l2 6 h-38z" fill="#c98b52" stroke="${INK}" stroke-width="2"/><path d="M-16 -6 q-14 4 -22 -4" stroke="${INK}" stroke-width="3" fill="none"/><rect x="-46" y="-16" width="10" height="16" rx="2" fill="#8c97a8" stroke="${INK}" stroke-width="1.6"/><g class="sb-smoke"><circle cx="-41" cy="-24" r="4" fill="#e5ebf2"/><circle cx="-38" cy="-33" r="5" fill="#e5ebf2" opacity=".7"/></g></g>`);
  }
  // Arılar: koloni büyüdükçe çoğalır, gece ve kışın kovanda kalır
  const n = night ? 1 : k.season === 'kis' ? (k.weather === 'gunes' ? 2 : 0) : Math.max(2, Math.min(14, Math.round(k.bees / 2600)));
  for (let i = 0; i < n; i++) {
    out.push(`<g transform="translate(${bx} ${base - 6})"><g class="sb-fly sb-f${i % 5}" style="animation-delay:${(-i * 1.37).toFixed(2)}s;animation-duration:${(5 + (i % 4) * 1.3).toFixed(1)}s">${beeGlyph(0.9)}</g></g>`);
  }
  // Hava
  if (k.weather === 'yagmur') for (let i = 0; i < 46; i++) out.push(`<path class="sb-rain" style="animation-delay:${(-r()).toFixed(2)}s;animation-duration:${(0.6 + r() * 0.4).toFixed(2)}s" d="M${(r() * 420).toFixed(0)} ${(-20 - r() * 60).toFixed(0)} l-5 14" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`);
  if (k.weather === 'kar') for (let i = 0; i < 40; i++) out.push(`<circle class="sb-snow" style="animation-delay:${(-r() * 6).toFixed(2)}s;animation-duration:${(4 + r() * 4).toFixed(1)}s" cx="${(r() * 400).toFixed(0)}" cy="-10" r="${(1.2 + r() * 1.8).toFixed(1)}" fill="#fff"/>`);
  if (k.weather === 'ruzgar' && k.season !== 'kis') for (let i = 0; i < 7; i++) out.push(`<ellipse class="sb-leaf" style="animation-delay:${(-r() * 5).toFixed(2)}s;animation-duration:${(3.5 + r() * 2.5).toFixed(1)}s" cx="-20" cy="${(60 + r() * 120).toFixed(0)}" rx="4" ry="2" fill="${k.season === 'guz' ? '#e08a2c' : '#7cc265'}"/>`);
  if (k.weather === 'sicak' && !night) out.push('<rect class="sb-heat" y="150" width="400" height="60" fill="#fff" opacity=".08"/>');
  return `<svg class="scene" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${out.join('')}</svg>`;
}

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
