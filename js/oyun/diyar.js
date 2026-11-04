// Çengel Bulmaca'nın yolculuğu: her on bölüm Türkiye'den bir manzara. Arılar çiçek peşinde
// lavanta tarlalarından Ağrı'nın eteklerine gider. Manzaralar yumuşak katmanlı SVG resimlerdir.

const g = (id, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const cloud = (x, y, s, o = 0.9, d = 70) => `<g class="dy-cloud" style="animation-duration:${d}s;animation-delay:${-x / 4}s"><g transform="translate(${x} ${y}) scale(${s})" opacity="${o}" fill="#fff"><ellipse cx="0" cy="0" rx="34" ry="12"/><ellipse cx="-18" cy="4" rx="20" ry="10"/><ellipse cx="20" cy="3" rx="22" ry="10"/><ellipse cx="2" cy="-8" rx="18" ry="11"/></g></g>`;
const sun = (x, y, r, c = '#fff1b8') => `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="${c}" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const birds = (x, y) => `<g class="dy-birds" fill="none" stroke="#3d3550" stroke-width="1.6" stroke-linecap="round" opacity=".55"><path d="M${x} ${y} q5 -4 10 0 q5 -4 10 0"/><path d="M${x + 26} ${y + 10} q4 -3 8 0 q4 -3 8 0"/></g>`;
const pine = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><path d="M0 -40 L13 -14 H5 L16 6 H-16 L-5 -14 H-13z"/><rect x="-2" y="6" width="4" height="7" fill="#6b4a33"/></g>`;

export const DIYAR = [
  {
    id: 'lavanta', name: 'Lavanta Tarlası', place: 'Isparta',
    text: 'Temmuzda Kuyucak köyünün yamaçları mosmor olur. Arılar için en kokulu durak burası.',
    accent: '#8e6cd8', accent2: '#6f4fc0', ink: '#3b2c5c',
    svg: () => `<defs>${g('s1', '#d9cdf7', '#fff3e4')}${g('h1', '#b7a3e6', '#9c86d8')}${g('f1', '#9a7ee0', '#6f52c4')}</defs>
      <rect width="400" height="600" fill="url(#s1)"/>${sun(300, 120, 34)}${cloud(60, 90, 1)}${cloud(250, 60, 0.7, 0.8, 90)}${birds(150, 130)}
      <path d="M0 250 Q100 200 210 238 T400 222 V600 H0z" fill="url(#h1)" opacity=".7"/>
      <path d="M0 290 Q120 250 240 282 T400 270 V600 H0z" fill="#c6dca0"/>
      ${Array.from({ length: 11 }, (_, i) => `<path class="dy-sway" style="animation-delay:${-i * 0.3}s" d="M${200 + (i - 5) * 6} 292 L${-60 + i * 52} 600 L${-30 + i * 52} 600 L${203 + (i - 5) * 6} 292z" fill="url(#f1)" opacity="${0.75 + (i % 2) * 0.25}"/>`).join('')}
      <g transform="translate(320 286)"><rect x="-3" y="-30" width="6" height="30" fill="#7a5a44"/><circle cx="0" cy="-40" r="20" fill="#6f9a52"/><circle cx="-12" cy="-32" r="12" fill="#7eab5f"/></g>`,
  },
  {
    id: 'kapadokya', name: 'Peri Bacaları', place: 'Kapadokya',
    text: 'Şafakta yüzlerce balon havalanır. Vadilerdeki kayısı bahçeleri arıların sabah sofrası.',
    accent: '#e07a4f', accent2: '#c9603a', ink: '#4a2c22',
    svg: () => `<defs>${g('s2', '#ffc8a8', '#fff1df')}${g('r2', '#f0c79a', '#d9a16f')}${g('r3', '#e3b384', '#c98f5e')}</defs>
      <rect width="400" height="600" fill="url(#s2)"/>${sun(90, 170, 30, '#fff4d1')}
      ${[[70, 110, '#ff7a6b', '#ffd36b'], [200, 70, '#5fb6e8', '#ffe27a'], [310, 140, '#ffb347', '#e86a8a'], [140, 190, '#7ed6a8', '#fff']].map(([x, y, a, b], i) => `<g class="dy-balloon" style="animation-delay:${-i * 1.3}s"><g transform="translate(${x} ${y}) scale(${1 - i * 0.12})"><path d="M0 -26 C18 -26 22 -6 12 8 L5 18 H-5 L-12 8 C-22 -6 -18 -26 0 -26z" fill="${a}"/><path d="M0 -26 C7 -20 7 4 3 18 H-3 C-7 4 -7 -20 0 -26z" fill="${b}" opacity=".8"/><rect x="-5" y="22" width="10" height="7" rx="2" fill="#8a5a33"/><path d="M-5 18 L-4 22 M5 18 L4 22" stroke="#8a5a33"/></g></g>`).join('')}
      <path d="M0 300 Q100 270 200 296 T400 286 V600 H0z" fill="#ead2b0"/>
      ${[[40, 340, 30, 120], [100, 330, 24, 150], [165, 345, 34, 110], [250, 335, 26, 160], [320, 340, 32, 125], [372, 350, 22, 100]].map(([x, y, w, h], i) => `<g fill="url(#${i % 2 ? 'r2' : 'r3'})"><path d="M${x - w} ${y + 140} C${x - w} ${y + 40} ${x - w * 0.5} ${y - h + 70} ${x} ${y - h + 50} C${x + w * 0.5} ${y - h + 70} ${x + w} ${y + 40} ${x + w} ${y + 140}z"/><ellipse cx="${x}" cy="${y - h + 46}" rx="${w * 0.55}" ry="${w * 0.28}" fill="#8f6a52"/><ellipse cx="${x - w * 0.3}" cy="${y - 20}" rx="3" ry="5" fill="#7a5340" opacity=".6"/></g>`).join('')}
      <path d="M0 470 Q200 440 400 470 V600 H0z" fill="#d8b38a"/>`,
  },
  {
    id: 'pamukkale', name: 'Beyaz Basamaklar', place: 'Pamukkale',
    text: 'Bembeyaz travertenlerde turkuaz havuzlar. Çevresindeki narenciye çiçekleri bahar bayramı.',
    accent: '#22a9b8', accent2: '#13889a', ink: '#163c45',
    svg: () => `<defs>${g('s3', '#9fdcf5', '#effaff')}${g('w3', '#8fe1ea', '#46c2d3')}</defs>
      <rect width="400" height="600" fill="url(#s3)"/>${sun(320, 100, 28)}${cloud(90, 110, 1.1)}${cloud(280, 170, 0.8, 0.8, 85)}
      <path d="M0 230 Q120 200 240 222 T400 210 V600 H0z" fill="#b9d6a6"/>
      ${Array.from({ length: 7 }, (_, i) => { const y = 250 + i * 50; const w = 140 + i * 40; return `<path d="M${200 - w} ${y} Q${200 - w * 0.6} ${y - 18} 200 ${y - 12} Q${200 + w * 0.6} ${y - 18} ${200 + w} ${y} L${200 + w + 10} ${y + 34} H${190 - w}z" fill="#ffffff"/><path class="dy-shine" style="animation-delay:${-i * 0.5}s" d="M${210 - w * 0.9} ${y + 2} Q200 ${y - 8} ${190 + w * 0.9} ${y + 2} L${190 + w * 0.88} ${y + 18} Q200 ${y + 10} ${210 - w * 0.88} ${y + 18}z" fill="url(#w3)"/>`; }).join('')}`,
  },
  {
    id: 'yayla', name: 'Sisli Yayla', place: 'Karadeniz',
    text: 'Bulutların arasında yeşil yaylalar. Kestane ve ıhlamur balının memleketi.',
    accent: '#2f9e6a', accent2: '#1f7d52', ink: '#1d3a2c',
    svg: () => `<defs>${g('s4', '#cfe6e4', '#f5fbf7')}</defs>
      <rect width="400" height="600" fill="url(#s4)"/>
      <path d="M0 210 L80 130 L150 190 L230 110 L320 180 L400 140 V600 H0z" fill="#9cc7b4"/>
      <rect class="dy-fog" y="170" width="400" height="40" fill="#fff" opacity=".55"/>
      <path d="M0 270 Q90 220 180 256 T400 240 V600 H0z" fill="#6fb38a"/>
      ${[30, 60, 330, 360, 385].map((x, i) => pine(x, 262 + (i % 2) * 8, 1.1, '#3f8a62')).join('')}
      <rect class="dy-fog dy-fog2" y="250" width="400" height="34" fill="#fff" opacity=".45"/>
      <path d="M0 330 Q120 300 240 322 T400 310 V600 H0z" fill="#58a274"/>
      <g transform="translate(250 318)"><rect x="-26" y="-26" width="52" height="26" fill="#a26a42"/><path d="M-32 -26 L0 -48 L32 -26z" fill="#6b3f2a"/><rect x="-6" y="-16" width="12" height="16" fill="#5a3522"/><rect x="-20" y="-20" width="9" height="8" fill="#ffe7a8"/></g>
      ${pine(120, 330, 1.4, '#2f7a52')}${pine(150, 338, 1.1, '#3a8a5e')}`,
  },
  {
    id: 'ege', name: 'Zeytin Koyu', place: 'Ege',
    text: 'Gümüş yapraklı zeytinler, masmavi koy. Kekik kokan tepeler arıların yaz durağı.',
    accent: '#3d86d6', accent2: '#2a68b4', ink: '#1d3352',
    svg: () => `<defs>${g('s5', '#a9d8ff', '#f4fbff')}${g('e5', '#4aa3e6', '#2f7cc8')}</defs>
      <rect width="400" height="600" fill="url(#s5)"/>${sun(80, 90, 26)}${cloud(260, 80, 0.9)}${birds(210, 150)}
      <rect y="220" width="400" height="90" fill="url(#e5)"/>
      <path class="dy-shine" d="M40 250 h60 M150 270 h80 M280 240 h70 M60 290 h50" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>
      <path d="M300 230 Q340 200 400 214 V240 H300z" fill="#9ab88a"/>
      <g fill="#fff">${[[322, 226], [340, 222], [358, 224], [376, 220]].map(([x, y]) => `<rect x="${x}" y="${y - 10}" width="12" height="10"/><path d="M${x - 1} ${y - 10} h14 l-7 -5z" fill="#d9744a"/>`).join('')}</g>
      <path d="M0 300 Q120 280 230 300 T400 296 V600 H0z" fill="#c9cf93"/>
      ${[[70, 360], [180, 340], [300, 370], [120, 430], [260, 450], [360, 420]].map(([x, y], i) => `<g class="dy-sway" style="animation-delay:${-i * 0.6}s" transform="translate(${x} ${y})"><path d="M-3 0 Q-6 -20 -2 -34 L3 -34 Q6 -18 4 0z" fill="#7a6044"/><ellipse cx="0" cy="-44" rx="30" ry="16" fill="#8fa77a"/><ellipse cx="-14" cy="-38" rx="16" ry="10" fill="#a7bd92"/><ellipse cx="14" cy="-52" rx="15" ry="9" fill="#a7bd92"/></g>`).join('')}`,
  },
  {
    id: 'uludag', name: 'Karlı Doruk', place: 'Uludağ',
    text: 'Zirvede kar, eteklerde çam ormanı. Çam balı tam burada, ağaçların tatlı özünden gelir.',
    accent: '#4f86d8', accent2: '#3567b8', ink: '#1f2f4f',
    svg: () => `<defs>${g('s6', '#bcd6f5', '#f6f9ff')}</defs>
      <rect width="400" height="600" fill="url(#s6)"/>${cloud(320, 70, 0.9)}
      <path d="M0 260 L110 120 L170 180 L240 90 L330 190 L400 150 V600 H0z" fill="#9db4d6"/>
      <path d="M110 120 L135 152 L118 150 L100 166 L88 148z M240 90 L272 132 L252 128 L236 146 L222 124 L212 128z" fill="#fff"/>
      <path d="M0 300 Q100 260 200 290 T400 280 V600 H0z" fill="#e9f0fa"/>
      ${Array.from({ length: 12 }, (_, i) => pine(i * 36 + 10, 320 + (i % 3) * 14, 1 + (i % 2) * 0.3, i % 2 ? '#2f6a55' : '#3a7c62')).join('')}
      <path d="M0 380 Q200 350 400 380 V600 H0z" fill="#f2f6fc"/>
      ${Array.from({ length: 24 }, (_, i) => `<circle class="dy-snow" style="animation-delay:${-i * 0.37}s;animation-duration:${6 + (i % 5)}s" cx="${(i * 47) % 400}" cy="-10" r="${1.5 + (i % 3)}" fill="#fff"/>`).join('')}`,
  },
  {
    id: 'nemrut', name: 'Taş Başlar', place: 'Nemrut',
    text: 'Gün batımında dev taş başlar kızıla boyanır. Dağ kekiği ve geven arıların yoldaşı.',
    accent: '#d9762b', accent2: '#b85a1a', ink: '#4a2616',
    svg: () => `<defs>${g('s7', '#f7a37a', '#ffe2b8')}${g('m7', '#c97b5e', '#9a5a46')}</defs>
      <rect width="400" height="600" fill="url(#s7)"/>${sun(200, 200, 38, '#ffe0a0')}${birds(80, 120)}
      <path d="M0 300 L140 170 L200 150 L260 170 L400 300 V600 H0z" fill="url(#m7)"/>
      ${[[150, 300, 1], [200, 292, 1.15], [250, 300, 1]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#8a5240"><path d="M-16 0 V-30 Q-16 -46 0 -48 Q16 -46 16 -30 V0z"/><path d="M-14 -44 L0 -66 L14 -44z" fill="#7a4636"/><rect x="-18" y="0" width="36" height="12" fill="#7a4636"/></g>`).join('')}
      <path d="M0 340 Q200 310 400 340 V600 H0z" fill="#b8745a"/>`,
  },
  {
    id: 'bogaz', name: 'İki Yaka', place: 'İstanbul Boğazı',
    text: 'Kubbeler, minareler, köprünün altından geçen vapurlar. Erguvanlar açınca iki yaka morarır.',
    accent: '#3a74d0', accent2: '#2756a8', ink: '#1b2b4d',
    svg: () => `<defs>${g('s8', '#ffd3c2', '#e9f2ff')}${g('b8', '#5e9ee0', '#3471bf')}</defs>
      <rect width="400" height="600" fill="url(#s8)"/>${sun(330, 150, 26, '#fff0c8')}${cloud(80, 80, 0.9)}${birds(190, 110)}
      <g fill="#7e86b5">${[[30, 230, 40], [80, 220, 30], [120, 236, 22]].map(([x, y, r]) => `<path d="M${x - r} ${y} A${r} ${r} 0 0 1 ${x + r} ${y}z"/>`).join('')}<rect x="10" y="230" width="140" height="20"/>${[18, 142].map((x) => `<rect x="${x - 2}" y="170" width="4" height="62"/><path d="M${x - 3} 172 L${x} 160 L${x + 3} 172z"/>`).join('')}</g>
      <path d="M160 200 Q250 160 360 200" stroke="#c46b52" stroke-width="3" fill="none"/><path d="M150 205 H380" stroke="#c46b52" stroke-width="5"/><rect x="200" y="170" width="6" height="40" fill="#c46b52"/><rect x="330" y="170" width="6" height="40" fill="#c46b52"/>
      <rect y="248" width="400" height="80" fill="url(#b8)"/>
      <g class="dy-ferry"><path d="M60 270 h46 l-6 10 h-34z" fill="#fff"/><rect x="72" y="262" width="22" height="8" fill="#fff"/><rect x="80" y="256" width="4" height="7" fill="#e85a4a"/></g>
      <path d="M0 320 Q120 300 240 318 T400 310 V600 H0z" fill="#9fc48a"/>
      ${[[60, 360], [330, 350]].map(([x, y]) => `<g transform="translate(${x} ${y})"><rect x="-3" y="-30" width="6" height="30" fill="#7a5a44"/><circle cx="0" cy="-42" r="22" fill="#c27ad0"/><circle cx="-14" cy="-34" r="13" fill="#d697e0"/></g>`).join('')}`,
  },
  {
    id: 'cay', name: 'Çay Bahçeleri', place: 'Rize',
    text: 'Yamaçlarda sıra sıra çay. Yağmur hiç eksik olmaz, arılar kestane çiçeğinin peşinde.',
    accent: '#3a9e52', accent2: '#287d3d', ink: '#183a22',
    svg: () => `<defs>${g('s9', '#d2e6ee', '#f6fbf4')}</defs>
      <rect width="400" height="600" fill="url(#s9)"/>${cloud(100, 70, 1)}${cloud(300, 120, 0.8)}
      <path d="M0 220 Q120 140 240 190 T400 170 V600 H0z" fill="#7ebc78"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${230 + i * 30} Q${120 + (i % 2) * 30} ${200 + i * 30} 240 ${222 + i * 30} T400 ${214 + i * 30}" stroke="${i % 2 ? '#3f8d4a' : '#4e9d55'}" stroke-width="12" fill="none" stroke-linecap="round"/>`).join('')}
      <g class="dy-rain" stroke="#ffffff" stroke-width="1.4" opacity=".6">${Array.from({ length: 30 }, (_, i) => `<path d="M${(i * 37) % 400} ${(i * 53) % 300} l-4 12"/>`).join('')}</g>`,
  },
  {
    id: 'van', name: 'Göl ve Dağ', place: 'Van ve Ağrı',
    text: 'Masmavi gölün ardında karlı Ağrı Dağı. Yaz başında yaylalar rengârenk çiçeğe keser.',
    accent: '#2b8cc4', accent2: '#1b6b9c', ink: '#163246',
    svg: () => `<defs>${g('s10', '#a8d4f2', '#f2f9ff')}${g('l10', '#3fa2dc', '#2073b0')}</defs>
      <rect width="400" height="600" fill="url(#s10)"/>${cloud(70, 80, 0.8)}${birds(260, 90)}
      <path d="M40 230 L200 80 L250 120 L360 230z" fill="#8fa8c4"/><path d="M200 80 L238 116 L216 112 L200 128 L184 112 L166 114z" fill="#fff"/>
      <rect y="228" width="400" height="70" fill="url(#l10)"/>
      <path class="dy-shine" d="M60 250 h80 M200 262 h90 M110 280 h60" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".45"/>
      <path d="M0 296 Q140 276 260 294 T400 290 V600 H0z" fill="#a9cf86"/>
      ${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 41) % 400}" cy="${320 + ((i * 29) % 200)}" r="3" fill="${['#ff6b8b', '#ffd34d', '#b98bff', '#fff'][i % 4]}"/>`).join('')}`,
  },
];

export const diyarOf = (li) => DIYAR[Math.floor(li / 10) % DIYAR.length];
