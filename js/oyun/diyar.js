// Çengel Bulmaca'nın yolculuğu: her on bölüm Türkiye'den bir manzara. Arılar çiçek peşinde
// lavanta tarlalarından Ağrı'nın eteklerine gider. Manzaralar durgun, katmanlı SVG resimlerdir:
// uzak katmanlar soluk, yakınlar doygun; hiçbir şey kıpırdamaz ki göz yorulmasın.
// Tuval 600x600: ekran yan da dursa dik de dursa ufuk çizgisi (y=330 civarı) görünür kalır.

const lg = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
const rg = (id, c, a = 0.6) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${a}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;

// Yumuşak sırt çizgisi: aynı tohumla hep aynı çıkar
function ridge(base, amp, seed, fill, { freq = 1, bottom = 640, op = 1 } = {}) {
  const pts = [];
  for (let x = -60; x <= 660; x += 30) {
    const y = base - amp * (0.55 * Math.sin((x / 95) * freq + seed) + 0.3 * Math.sin((x / 41) * freq + seed * 2.1) + 0.15 * Math.sin(x / 23 + seed * 3.7));
    pts.push([x, y]);
  }
  let d = `M-60 ${bottom} L${pts[0][0]} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    d += ` Q${x0} ${y0.toFixed(1)} ${(x0 + x1) / 2} ${((y0 + y1) / 2).toFixed(1)}`;
  }
  return `<path d="${d} L660 ${bottom}Z" fill="${fill}" opacity="${op}"/>`;
}
const glow = (x, y, r, id) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})"/>`;
const cloud = (x, y, s, o = 0.75) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity="${o}"><ellipse cx="0" cy="0" rx="46" ry="13"/><ellipse cx="-22" cy="-6" rx="24" ry="12"/><ellipse cx="18" cy="-10" rx="26" ry="15"/></g>`;
const haze = (id, y0, y1, c = '#ffffff', a = 0.55) => `<defs>${lg(id, [[0, c, 0], [0.62, c, a], [1, c, 0]])}</defs><rect x="-10" y="${y0}" width="620" height="${y1 - y0}" fill="url(#${id})"/>`;
const spruce = (x, y, s, c) => `<path d="M${x} ${y - 46 * s} L${x + 9 * s} ${y - 28 * s} L${x + 5 * s} ${y - 28 * s} L${x + 13 * s} ${y - 12 * s} L${x + 8 * s} ${y - 12 * s} L${x + 16 * s} ${y} L${x - 16 * s} ${y} L${x - 8 * s} ${y - 12 * s} L${x - 13 * s} ${y - 12 * s} L${x - 5 * s} ${y - 28 * s} L${x - 9 * s} ${y - 28 * s}Z" fill="${c}"/>`;
const roundTree = (x, y, s, c1, c2, trunk = '#7a5a44') => `<rect x="${x - 2.5 * s}" y="${y - 18 * s}" width="${5 * s}" height="${18 * s}" fill="${trunk}"/><ellipse cx="${x}" cy="${y - 28 * s}" rx="${20 * s}" ry="${17 * s}" fill="${c1}"/><ellipse cx="${x - 6 * s}" cy="${y - 33 * s}" rx="${11 * s}" ry="${9 * s}" fill="${c2}"/>`;

export const DIYAR = [
  {
    id: 'lavanta', name: 'Lavanta Tarlası', place: 'Isparta',
    text: 'Temmuzda Kuyucak köyünün yamaçları mosmor olur. Arılar için en kokulu durak burası.',
    accent: '#8466d0', accent2: '#6a4cb8', ink: '#352a54',
    svg: () => {
      // Lavanta öbekleri: sıra sıra çizgi yerine tepelere serpilmiş yuvarlak çalılar
      const bush = (x, y, s, c1, c2) => `<path d="M${x - 18 * s} ${y + 3 * s} Q${x - 17 * s} ${y - 11 * s} ${x} ${y - 12 * s} Q${x + 17 * s} ${y - 11 * s} ${x + 18 * s} ${y + 3 * s}Z" fill="${c1}"/><path d="M${x - 12 * s} ${y - 5 * s} Q${x - 8 * s} ${y - 10.5 * s} ${x + 2 * s} ${y - 10.5 * s}" stroke="${c2}" stroke-width="${2.4 * s}" stroke-linecap="round" fill="none"/>`;
      const rowOf = (y0, n, s, c1, c2, seed) => Array.from({ length: n }, (_, i) => bush(-30 + i * (680 / n) + ((i * 53 + seed * 29) % 23), y0 + ((i * 37 + seed * 17) % 22), s, c1, c2)).join('');
      return `<defs>${lg('lsk', [[0, '#cdbdf0'], [0.45, '#f1e0f0'], [0.58, '#ffeadb']])}${rg('lsn', '#fff3d6', 0.9)}${lg('lh1', [[0, '#c6b6e8'], [1, '#b7a6e0']])}${lg('lh2', [[0, '#b6a0e4'], [1, '#a28ad8']])}${lg('lh3', [[0, '#a68ddc'], [1, '#9378d0']])}</defs>
      <rect width="600" height="600" fill="url(#lsk)"/>${glow(400, 300, 170, 'lsn')}<circle cx="400" cy="300" r="34" fill="#fff6e2"/>
      ${cloud(150, 150, 1.2, 0.6)}${cloud(460, 110, 0.9, 0.5)}
      ${ridge(302, 20, 1.2, '#cdbfe6')}${ridge(320, 12, 2.6, '#b9c6a6')}
      ${roundTree(470, 336, 1.1, '#7f9f62', '#93b375')}${roundTree(500, 340, 0.7, '#7f9f62', '#93b375')}
      <path d="M118 336 h40 v-18 l-20 -12 l-20 12z" fill="#efe2d2"/><path d="M114 318 l24 -14 l24 14z" fill="#b8735a"/>
      ${ridge(352, 14, 0.7, 'url(#lh1)')}${rowOf(362, 18, 0.9, '#b29be0', '#c4b2ea', 1)}
      ${ridge(410, 18, 2.9, 'url(#lh2)')}${rowOf(424, 13, 1.5, '#9b82d8', '#b29de4', 2)}
      ${ridge(486, 20, 4.4, 'url(#lh3)')}${rowOf(506, 9, 2.4, '#8a6fcd', '#a48ade', 3)}
      ${haze('lhz', 320, 380, '#f6e8f4', 0.45)}`;
    },
  },
  {
    id: 'kapadokya', name: 'Peri Bacaları', place: 'Kapadokya',
    text: 'Şafakta yüzlerce balon havalanır. Vadilerdeki kayısı bahçeleri arıların sabah sofrası.',
    accent: '#d9734a', accent2: '#bd5a34', ink: '#4a2c22',
    svg: () => {
      const chim = (x, y, w, h, c1, c2) => `<path d="M${x - w} ${y} C${x - w} ${y - h * 0.55} ${x - w * 0.45} ${y - h} ${x} ${y - h} C${x + w * 0.45} ${y - h} ${x + w} ${y - h * 0.55} ${x + w} ${y}Z" fill="${c1}"/><path d="M${x} ${y - h} C${x + w * 0.45} ${y - h} ${x + w} ${y - h * 0.55} ${x + w} ${y} L${x + w * 0.2} ${y} C${x + w * 0.35} ${y - h * 0.5} ${x + w * 0.2} ${y - h * 0.85} ${x} ${y - h}Z" fill="${c2}"/><ellipse cx="${x}" cy="${y - h + 2}" rx="${w * 0.62}" ry="${w * 0.3}" fill="#9a7058"/>`;
      const balloon = (x, y, s, a, b) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -30 C22 -30 26 -6 13 10 L6 20 H-6 L-13 10 C-26 -6 -22 -30 0 -30Z" fill="${a}"/><path d="M0 -30 C9 -24 8 4 3 20 H-3 C-8 4 -9 -24 0 -30Z" fill="${b}"/><rect x="-5" y="24" width="10" height="7" rx="2" fill="#8a5a33"/><path d="M-6 20 L-4 24 M6 20 L4 24" stroke="#8a5a33" stroke-width="1.2"/></g>`;
      return `<defs>${lg('ksk', [[0, '#ffc6ad'], [0.5, '#ffe2cc'], [0.6, '#fff1e2']])}${rg('ksn', '#fff4d4', 0.9)}${lg('kfl', [[0, '#e8c19a'], [1, '#d3a27a']])}</defs>
        <rect width="600" height="600" fill="url(#ksk)"/>${glow(170, 310, 160, 'ksn')}<circle cx="170" cy="310" r="30" fill="#fff4dc"/>
        ${balloon(250, 150, 1.4, '#ef8a72', '#ffd38a')}${balloon(370, 210, 1.1, '#6fb7e0', '#ffe6a0')}${balloon(440, 120, 0.8, '#f2a65a', '#e98aa0')}${balloon(190, 230, 0.7, '#8bd0a8', '#fff4dc')}${balloon(510, 240, 0.6, '#c99ee6', '#fff')}
        ${ridge(320, 10, 0.8, '#efcfb1')}
        ${chim(140, 380, 26, 110, '#ecc6a0', '#d7a780')}${chim(200, 372, 20, 80, '#f0cca7', '#dcae87')}${chim(330, 388, 30, 130, '#ecc6a0', '#d7a780')}${chim(410, 376, 22, 92, '#f0cca7', '#dcae87')}${chim(470, 384, 26, 116, '#ecc6a0', '#d7a780')}
        ${ridge(380, 8, 2.2, 'url(#kfl)')}${haze('khz', 330, 400, '#fff1e2', 0.35)}`;
    },
  },
  {
    id: 'pamukkale', name: 'Beyaz Basamaklar', place: 'Pamukkale',
    text: 'Bembeyaz travertenlerde turkuaz havuzlar. Çevresindeki narenciye çiçekleri bahar bayramı.',
    accent: '#1fa3b4', accent2: '#118596', ink: '#163c45',
    svg: () => `<defs>${lg('psk', [[0, '#a6d8f4'], [0.55, '#e3f4fd']])}${lg('pw', [[0, '#c4f0f2'], [1, '#86d6de']])}${lg('pl', [[0, '#ffffff'], [1, '#e4eef2']])}</defs>
      <rect width="600" height="600" fill="url(#psk)"/>${cloud(170, 130, 1.3, 0.7)}${cloud(450, 180, 1, 0.55)}
      ${ridge(290, 18, 1.7, '#b6d3b0')}${ridge(306, 10, 3.1, '#a4c69d')}
      ${Array.from({ length: 4 }, (_, i) => {
        const y = 324 + i * 74;
        const w = 170 + i * 110;
        return `<path d="M${300 - w} ${y + 22} Q${300 - w * 0.55} ${y - 8} 300 ${y - 4} Q${300 + w * 0.55} ${y - 8} ${300 + w} ${y + 22} L${300 + w + 14} ${y + 80} L${286 - w} ${y + 80}Z" fill="url(#pl)"/><path d="M${318 - w * 0.88} ${y + 18} Q300 ${y + 4} ${282 + w * 0.88} ${y + 18} Q300 ${y + 30} ${318 - w * 0.88} ${y + 18}Z" fill="url(#pw)" opacity=".92"/>`;
      }).join('')}`,
  },
  {
    id: 'yayla', name: 'Sisli Yayla', place: 'Karadeniz',
    text: 'Bulutların arasında yeşil yaylalar. Kestane ve ıhlamur balının memleketi.',
    accent: '#2e9466', accent2: '#1f7550', ink: '#1d3a2c',
    svg: () => `<defs>${lg('ysk', [[0, '#d3e5e1'], [0.6, '#f3f8f4']])}</defs>
      <rect width="600" height="600" fill="url(#ysk)"/>
      ${ridge(250, 46, 0.6, '#b9d4c8', { freq: 0.7 })}${haze('yh1', 230, 300)}
      ${ridge(290, 34, 2.1, '#94bfa8', { freq: 0.8 })}${haze('yh2', 280, 340, '#ffffff', 0.6)}
      ${ridge(328, 22, 3.4, '#6fa886')}
      ${[60, 92, 128, 438, 470, 506, 540].map((x, i) => spruce(x, 338 + (i % 3) * 6, 1.2 + (i % 2) * 0.3, '#3f7d5c')).join('')}
      ${haze('yh3', 320, 372, '#ffffff', 0.45)}
      ${ridge(372, 14, 5.2, '#5a9a72')}
      <g transform="translate(330 382)"><rect x="-34" y="-30" width="68" height="30" fill="#a8704a"/><path d="M-40 -30 L0 -56 L40 -30Z" fill="#6e4430"/><rect x="-8" y="-18" width="16" height="18" fill="#5b3725"/><rect x="-26" y="-23" width="11" height="9" fill="#ffe7a8"/><rect x="15" y="-23" width="11" height="9" fill="#ffe7a8"/></g>
      ${spruce(220, 396, 1.8, '#2f6e4c')}${spruce(250, 400, 1.3, '#3a7e58')}${spruce(420, 404, 1.6, '#2f6e4c')}`,
  },
  {
    id: 'ege', name: 'Zeytin Koyu', place: 'Ege',
    text: 'Gümüş yapraklı zeytinler, masmavi koy. Kekik kokan tepeler arıların yaz durağı.',
    accent: '#3a83d2', accent2: '#2665b0', ink: '#1d3352',
    svg: () => `<defs>${lg('esk', [[0, '#9fd0f5'], [0.5, '#e9f6ff']])}${lg('esea', [[0, '#7fbdeb'], [1, '#2f7cc4']])}${lg('ehl', [[0, '#c9cf98'], [1, '#a9b27a']])}</defs>
      <rect width="600" height="600" fill="url(#esk)"/>${cloud(140, 120, 1.1, 0.6)}${cloud(420, 90, 0.8, 0.5)}
      <path d="M380 300 Q440 268 520 286 Q570 292 620 300Z" fill="#b8c4cf"/><path d="M-20 302 Q60 284 130 300Z" fill="#c4ccd6"/>
      <rect x="-10" y="300" width="620" height="90" fill="url(#esea)"/>
      <path d="M120 322 h70 M260 340 h90 M420 318 h60 M200 364 h60" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>
      ${ridge(392, 16, 1.4, 'url(#ehl)')}
      <g>${[[440, 372], [462, 366], [484, 372], [506, 364], [528, 370]].map(([x, y]) => `<rect x="${x - 9}" y="${y - 14}" width="18" height="14" fill="#fbf8f2"/><path d="M${x - 11} ${y - 14} L${x} ${y - 21} L${x + 11} ${y - 14}Z" fill="#cf7a52"/>`).join('')}</g>
      ${[[90, 420, 1.3], [200, 404, 1], [310, 426, 1.4], [150, 470, 1.6], [400, 456, 1.2], [520, 480, 1.5]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-3 0 Q-6 -16 -2 -26 L3 -26 Q6 -14 4 0Z" fill="#7d6448"/><ellipse cx="0" cy="-34" rx="24" ry="13" fill="#93a983"/><ellipse cx="-10" cy="-30" rx="13" ry="8" fill="#aabd9a"/><ellipse cx="10" cy="-40" rx="12" ry="7" fill="#aabd9a"/></g>`).join('')}`,
  },
  {
    id: 'uludag', name: 'Karlı Doruk', place: 'Uludağ',
    text: 'Zirvede kar, eteklerde çam ormanı. Çam balı tam burada, ağaçların tatlı özünden gelir.',
    accent: '#4a80d4', accent2: '#3462b4', ink: '#1f2f4f',
    svg: () => `<defs>${lg('usk', [[0, '#b4cff0'], [0.55, '#eef4ff']])}${lg('usn', [[0, '#ffffff'], [1, '#e2eaf6']])}</defs>
      <rect width="600" height="600" fill="url(#usk)"/>${cloud(470, 130, 1, 0.6)}
      <path d="M-20 320 L120 190 L180 240 L280 150 L380 250 L460 200 L620 320Z" fill="#a9bde0"/>
      <path d="M120 190 L146 216 L130 214 L112 230 L100 210Z M280 150 L318 192 L296 188 L280 206 L262 186 L248 190Z M460 200 L486 226 L468 222 L452 234 L440 220Z" fill="#fff"/>
      ${haze('uh1', 250, 330, '#ffffff', 0.6)}
      ${ridge(336, 12, 2.4, 'url(#usn)')}
      ${Array.from({ length: 16 }, (_, i) => spruce(i * 40 + 10, 350 + (i % 3) * 8, 1.1 + (i % 2) * 0.35, i % 2 ? '#2f6658' : '#3b7867')).join('')}
      ${ridge(392, 8, 4.4, '#f3f7fd')}
      ${[70, 520].map((x) => spruce(x, 440, 2.2, '#2a5c50')).join('')}`,
  },
  {
    id: 'nemrut', name: 'Taş Başlar', place: 'Nemrut',
    text: 'Gün batımında dev taş başlar kızıla boyanır. Dağ kekiği ve geven arıların yoldaşı.',
    accent: '#d6702a', accent2: '#b5561a', ink: '#4a2616',
    svg: () => {
      const head = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-22" y="-6" width="44" height="14" rx="3" fill="#9a644c"/><path d="M-17 -6 V-36 Q-17 -54 0 -56 Q17 -54 17 -36 V-6Z" fill="#b07a5e"/><path d="M0 -56 Q17 -54 17 -36 V-6 H6 Q10 -34 0 -56Z" fill="#9a644c"/><path d="M-15 -52 L0 -78 L15 -52Z" fill="#a36d54"/></g>`;
      return `<defs>${lg('nsk', [[0, '#f29d7d'], [0.4, '#ffc79a'], [0.6, '#ffe6c2']])}${rg('nsn', '#fff0c8', 0.95)}${lg('nmt', [[0, '#c98a6a'], [1, '#a86a4e']])}</defs>
        <rect width="600" height="600" fill="url(#nsk)"/>${glow(300, 300, 200, 'nsn')}<circle cx="300" cy="300" r="40" fill="#fff0cc"/>
        ${ridge(320, 16, 1.9, '#d6a183')}
        <path d="M110 360 L250 230 Q300 214 350 230 L490 360Z" fill="url(#nmt)"/>
        ${head(240, 372, 1.2)}${head(300, 366, 1.4)}${head(360, 372, 1.2)}
        ${ridge(386, 10, 3.3, '#b5775a')}`;
    },
  },
  {
    id: 'bogaz', name: 'İki Yaka', place: 'İstanbul Boğazı',
    text: 'Kubbeler, minareler, köprünün altından geçen vapurlar. Erguvanlar açınca iki yaka morarır.',
    accent: '#3870cc', accent2: '#2554a4', ink: '#1b2b4d',
    svg: () => `<defs>${lg('bsk', [[0, '#ffc4ae'], [0.45, '#ffe2d2'], [0.6, '#eaf0ff']])}${rg('bsn', '#fff2d8', 0.9)}${lg('bsea', [[0, '#7fb2e6'], [1, '#3b78c2']])}</defs>
      <rect width="600" height="600" fill="url(#bsk)"/>${glow(450, 270, 150, 'bsn')}<circle cx="450" cy="270" r="28" fill="#fff3dc"/>
      <g fill="#8d8bb6">
        <rect x="40" y="290" width="230" height="20"/>
        ${[[90, 290, 34], [150, 286, 44], [210, 292, 30]].map(([x, y, r]) => `<path d="M${x - r} ${y} A${r} ${r} 0 0 1 ${x + r} ${y}Z"/>`).join('')}
        ${[52, 118, 186, 254].map((x) => `<rect x="${x - 3}" y="220" width="6" height="72"/><path d="M${x - 4} 222 L${x} 206 L${x + 4} 222Z"/>`).join('')}
      </g>
      <path d="M300 268 Q410 222 540 268" stroke="#c96d55" stroke-width="3" fill="none"/><path d="M290 274 H560" stroke="#c96d55" stroke-width="6"/><rect x="342" y="236" width="7" height="58" fill="#c96d55"/><rect x="494" y="236" width="7" height="58" fill="#c96d55"/>
      <rect x="-10" y="308" width="620" height="82" fill="url(#bsea)"/>
      <path d="M90 330 h70 M300 344 h100 M200 366 h60 M450 330 h60" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>
      <g transform="translate(250 336)"><path d="M-30 0 h60 l-8 12 h-44z" fill="#fff"/><rect x="-16" y="-10" width="30" height="10" fill="#fff"/><rect x="-4" y="-18" width="6" height="8" fill="#e85a4a"/></g>
      ${ridge(398, 10, 2.8, '#a5c78f')}
      ${[[100, 410, 1.4], [500, 404, 1.6]].map(([x, y, s]) => roundTree(x, y, s, '#c487d4', '#d7a3e4')).join('')}`,
  },
  {
    id: 'cay', name: 'Çay Bahçeleri', place: 'Rize',
    text: 'Yamaçlarda sıra sıra çay. Yağmur hiç eksik olmaz, arılar kestane çiçeğinin peşinde.',
    accent: '#349a4e', accent2: '#257a3a', ink: '#183a22',
    svg: () => `<defs>${lg('csk', [[0, '#cfe3ea'], [0.55, '#f4f9f2']])}</defs>
      <rect width="600" height="600" fill="url(#csk)"/>${cloud(160, 140, 1.4, 0.65)}${cloud(440, 170, 1.1, 0.55)}
      ${ridge(270, 40, 0.9, '#a8cfa3', { freq: 0.6 })}${haze('ch1', 250, 320, '#ffffff', 0.55)}
      ${Array.from({ length: 8 }, (_, i) => ridge(318 + i * 30, 26 - i * 1.5, 1.3, i % 2 ? '#5aa364' : '#6db574', { freq: 0.6 })).join('')}
      <g>${[[470, 330], [500, 336]].map(([x, y]) => `<rect x="${x - 12}" y="${y - 14}" width="24" height="14" fill="#f6efe4"/><path d="M${x - 15} ${y - 14} L${x} ${y - 24} L${x + 15} ${y - 14}Z" fill="#c25b44"/>`).join('')}</g>
      ${haze('ch2', 300, 360, '#ffffff', 0.3)}`,
  },
  {
    id: 'van', name: 'Göl ve Dağ', place: 'Van ve Ağrı',
    text: 'Masmavi gölün ardında karlı Ağrı Dağı. Yaz başında yaylalar rengârenk çiçeğe keser.',
    accent: '#2a88c0', accent2: '#1b6898', ink: '#163246',
    svg: () => `<defs>${lg('vsk', [[0, '#a6d3f3'], [0.55, '#eef8ff']])}${lg('vlk', [[0, '#69b4e6'], [1, '#2b7abd']])}${lg('vmt', [[0, '#9fb0c8'], [1, '#8297b4']])}${lg('vmd', [[0, '#b4d690'], [1, '#93bf72']])}</defs>
      <rect width="600" height="600" fill="url(#vsk)"/>${cloud(120, 120, 1, 0.6)}
      <path d="M90 300 L300 120 L360 160 L520 300Z" fill="url(#vmt)"/><path d="M300 120 L346 166 L320 160 L300 182 L280 162 L250 168Z" fill="#fff"/>
      <path d="M380 300 L450 236 L520 300Z" fill="#94a7c1"/><path d="M450 236 L466 252 L452 250 L440 256Z" fill="#fff"/>
      ${haze('vh1', 240, 304, '#ffffff', 0.45)}
      <rect x="-10" y="300" width="620" height="76" fill="url(#vlk)"/>
      <path d="M100 322 h110 M290 336 h120 M160 356 h70" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>
      ${ridge(386, 12, 2.2, 'url(#vmd)')}
      ${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 67) % 600}" cy="${410 + ((i * 37) % 180)}" r="${3 + (i % 3)}" fill="${['#f27a92', '#ffd25a', '#b896f0', '#fff'][i % 4]}" opacity=".85"/>`).join('')}`,
  },
];

export const diyarOf = (li) => DIYAR[Math.floor(li / 10) % DIYAR.length];
export const diyarSVG = (d, viewBox = '0 0 600 600') => `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${d.svg()}</svg>`;
