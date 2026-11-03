// Ana ekran: kovanın canlı sahnesi, bahçe, büyüyen petek, kovan haberi ve oyun kartları

import { html, toHTML, raw } from '../core/dom.js';
import { save } from '../core/save.js';
import { sfx } from '../core/audio.js';
import { icon } from '../core/ui.js';
import { koloni, news, statLine, fmt } from '../koloni/koloni.js';
import { sceneData, combSVG } from '../koloni/sahne.js';
import { liveScene } from '../koloni/canli.js';
import { balance, bonus, bloomingCount } from '../koloni/bahce.js';
import { CICEK_LEVELS } from '../oyun/cicek.js';
import { PETEK_LEVELS } from '../oyun/petek.js';

const INK = '#2a1636';
export const nextLevel = (mode, total) => Math.min(total - 1, save.data[mode].stars.filter((s) => s > 0).length);

const flowerArt = () => `<svg viewBox="0 0 120 100" aria-hidden="true">${['A', 'R', 'I', 'B', 'A', 'L'].map((c, i) => {
  const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
  const x = 60 + Math.cos(a) * 32;
  const y = 50 + Math.sin(a) * 32;
  return `<g class="mc-cell" style="animation-delay:${-i * 0.3}s"><path d="M${x - 14} ${y} l7 -12 h14 l7 12 l-7 12 h-14z" fill="#fff6d8" stroke="${INK}" stroke-width="2.4"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="16" fill="${INK}">${c}</text></g>`;
}).join('')}<path d="M48 50 l6 -10 h12 l6 10 l-6 10 h-12z" fill="#ffcd3c" stroke="${INK}" stroke-width="2.4"/><ellipse cx="60" cy="50" rx="6" ry="4" fill="#ffcd3c" stroke="${INK}" stroke-width="1.6"/><path d="M58 46.5v7M61.5 46.8v6.4" stroke="${INK}" stroke-width="1.6"/></svg>`;

const combArt = (lit = [4, 5, 8]) => `<svg viewBox="0 0 120 100" aria-hidden="true">${[[39, 26], [60, 26], [81, 26], [28.5, 44], [49.5, 44], [70.5, 44], [91.5, 44], [39, 62], [60, 62], [81, 62], [49.5, 80], [70.5, 80]].map(([x, y], i) => `<path class="mc-cell" style="animation-delay:${-i * 0.2}s" d="M${x} ${y - 12} l10.4 6 v12 l-10.4 6 l-10.4 -6 v-12z" fill="${lit.includes(i) ? '#2ee6a0' : i % 3 ? '#fff6d8' : '#ffcd3c'}" stroke="${INK}" stroke-width="2.2"/>`).join('')}</svg>`;

const endlessArt = () => `<svg viewBox="0 0 120 100" aria-hidden="true"><path d="M30 50 c0 -22 26 -22 30 0 c4 22 30 22 30 0 c0 -22 -26 -22 -30 0 c-4 22 -30 22 -30 0z" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path class="mc-flow" d="M30 50 c0 -22 26 -22 30 0 c4 22 30 22 30 0 c0 -22 -26 -22 -30 0 c-4 22 -30 22 -30 0z" fill="none" stroke="#ffcd3c" stroke-width="4" stroke-dasharray="14 10" stroke-linecap="round"/><path d="M60 20 l9 5 v10 l-9 5 l-9 -5 v-10z" fill="#ffd65a" stroke="${INK}" stroke-width="2.2"/><circle cx="60" cy="30" r="3" fill="${INK}"/></svg>`;

export function mountHome(root, go) {
  const k = koloni();
  const s = save.data;
  const seen = s.colony.seenBuilt || 0;
  const comb = combSVG(k, seen);
  const scene = sceneData(k);
  const nc = nextLevel('cicek', CICEK_LEVELS);
  const np = nextLevel('petek', PETEK_LEVELS);
  const doneC = s.cicek.stars.filter((x) => x > 0).length;
  const doneP = s.petek.stars.filter((x) => x > 0).length;
  const away = s.colony.lastVisit ? Date.now() - s.colony.lastVisit : 0;
  const greet = away > 20 * 60 * 1000 ? `Hoş geldin! ${k.name} kovanı seni bekliyordu. ` : '';
  const bloom = bloomingCount(k);
  const bon = Math.round(bonus(k) * 100);
  const gardenLine = !s.garden.length
    ? 'Bahçe boş. Kesendeki balla çiçek ek, arılar uçsun.'
    : bloom ? `${bloom} bitki çiçekte, bala %${bon} bereket katıyor.` : `${s.garden.length} bitki ve süs var. Açınca bala bereket katacak.`;

  root.innerHTML = toHTML(html`
    <div class="home">
      <header class="h-top">
        <div class="h-logo">${raw(`<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 35 11.5v17L20 37 5 28.5v-17z" fill="#ffcd3c" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><text x="20" y="27" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="19" fill="${INK}">H</text></svg>`)}<b>Harf Kovanı</b></div>
        <button class="kese" data-go="bahce" aria-label="Bal kesesi">${icon('hex')}<b>${fmt(balance())}</b></button>
        <button class="rbtn" data-go="siralama" aria-label="Sıralama">${icon('trophy')}</button>
        <button class="rbtn" data-go="ayarlar" aria-label="Ayarlar">${icon('gear')}</button>
      </header>
      <div class="h-grid">
        <section class="h-scene card">
          <div class="h-scene-view" data-view>
            <div class="h-scene-svg">${raw(scene.svg)}</div>
            <div class="h-ribbon">
              <b>${k.name} Kovanı</b>
              <span>${k.dateText} · ${k.seasonName} · ${k.night ? 'Gece' : k.weatherName}</span>
            </div>
            <span class="h-tap">Kovana ya da çiçeklere dokun</span>
          </div>
          <div class="h-news ${greet ? 'h-news-new' : ''}">
            <i class="h-news-bee">${icon('bee')}</i>
            <p>${greet}${news(k)}</p>
          </div>
          <button class="h-garden" data-go="bahce">
            <span class="hg-ic">${icon('palette')}</span>
            <span class="hg-body"><b>Bahçe</b><small>${gardenLine}</small></span>
            <span class="hg-go">${icon('arrow')}</span>
          </button>
        </section>
        <section class="h-comb card" data-comb>
          <div class="h-comb-head"><b>Petek</b><span>${fmt(k.cells)} göz · ${k.honeyKg.replace('.', ',')} kg bal</span></div>
          <div class="h-comb-3d" data-tilt>${raw(comb.svg)}</div>
          <div class="h-stats">
            <span><b>${fmt(k.bees)}</b>arı</span>
            <span><b>${k.lv}</b>bölüm</span>
            <span><b>${fmt(s.found.length)}</b>kelime</span>
            <span><b>${fmt(Math.round(s.stats.honey))}</b>bal</span>
          </div>
        </section>
        <section class="h-modes">
          <button class="mode-card" data-go="oyna/cicek/${nc}">
            <span class="mc-art">${raw(flowerArt())}</span>
            <span class="mc-body"><b>Harf Çiçeği</b><small>Bölümün bütün kelimelerini bul</small>
              <span class="mc-bar"><u style="width:${(doneC / CICEK_LEVELS) * 100}%"></u></span>
              <em>Bölüm ${nc + 1} / ${CICEK_LEVELS}</em></span>
            <span class="mc-play">${icon('play')}</span>
          </button>
          <div class="mode-pair">
            <button class="mode-card mode-petek" data-go="oyna/petek/${np}">
              <span class="mc-art">${raw(combArt())}</span>
              <span class="mc-body"><b>Petek Avı</b><small>Bölüm bölüm, hedefli</small>
                <span class="mc-bar"><u style="width:${(doneP / PETEK_LEVELS) * 100}%"></u></span>
                <em>Bölüm ${np + 1} / ${PETEK_LEVELS}</em></span>
              <span class="mc-play">${icon('play')}</span>
            </button>
            <button class="mode-card mode-endless" data-go="oyna/sonsuz">
              <span class="mc-art">${raw(endlessArt())}</span>
              <span class="mc-body"><b>Sonsuz Petek</b><small>Nektar bitene kadar kelime çıkar</small>
                <em>${s.sonsuz.best ? `Rekor: ${fmt(s.sonsuz.best)} puan · ${s.sonsuz.wave}. dalga` : 'Henüz rekor yok'}</em></span>
              <span class="mc-play">${icon('play')}</span>
            </button>
          </div>
          <div class="h-menu">
            <button class="h-mi" data-go="bolumler/cicek">${icon('list')}<span>Çiçek Bölümleri</span></button>
            <button class="h-mi" data-go="bolumler/petek">${icon('list')}<span>Petek Bölümleri</span></button>
            <button class="h-mi" data-go="defter">${icon('book')}<span>Kelime Defteri</span></button>
            <button class="h-mi" data-go="hikaye">${icon('hex')}<span>Kovanın Hikayesi</span></button>
          </div>
          <p class="h-foot">${statLine(k)}</p>
        </section>
      </div>
    </div>`);

  s.colony.lastVisit = Date.now();
  s.colony.seenBuilt = comb.built;
  save.touch();

  const home = root.firstElementChild;
  const live = liveScene(home.querySelector('[data-view]'), k, scene);
  home.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    sfx.tap();
    go(b.dataset.go);
  });
  // Petek fareyle hafifçe döner
  const tilt = home.querySelector('[data-tilt]');
  const card = home.querySelector('[data-comb]');
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tilt.style.setProperty('--ry', `${(x * 16).toFixed(1)}deg`);
    tilt.style.setProperty('--rx', `${(14 - y * 12).toFixed(1)}deg`);
  });
  card.addEventListener('pointerleave', () => {
    tilt.style.removeProperty('--ry');
    tilt.style.removeProperty('--rx');
  });
  return { dispose() { live.dispose(); } };
}
