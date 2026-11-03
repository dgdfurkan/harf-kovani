// Hikaye: ilk açılıştaki giriş, koloniye ad verme ve her 10 bölümde bir gelen hikaye kartı

import { html, el, toHTML, raw, pick } from '../core/dom.js';
import { save } from '../core/save.js';
import { sfx, buzz } from '../core/audio.js';
import { openSheet, icon } from '../core/ui.js';
import { koloni, chapterFor, markChapter, NAMES } from './koloni.js';
import { sceneData } from './sahne.js';
import { liveScene } from './canli.js';

const INK = '#2a1636';
const miniBee = (x, y, s, cls = '') => `<g class="${cls}" transform="translate(${x} ${y}) scale(${s})"><ellipse class="sb-wing" cx="-1" cy="-5" rx="4.5" ry="2.6" fill="#fff" opacity=".9"/><ellipse cx="0" cy="0" rx="5.4" ry="3.8" fill="#ffcd3c" stroke="${INK}" stroke-width="1.3"/><path d="M-1 -3.6v7.2M2.4 -3.2v6.4" stroke="${INK}" stroke-width="1.5"/><circle cx="-4.6" cy="-.6" r="1.6" fill="${INK}"/></g>`;

const ART = {
  ogul: () => {
    const bees = [];
    for (let i = 0; i < 46; i++) {
      const a = (i * 137.5 * Math.PI) / 180;
      const rr = Math.sqrt(i) * 5.2;
      bees.push(miniBee(200 + Math.cos(a) * rr * 0.9, 118 + Math.sin(a) * rr * 1.25, 0.75, 'st-jit'));
    }
    return `<svg viewBox="0 0 400 240"><defs><linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc9a8"/><stop offset="1" stop-color="#fff1d6"/></linearGradient></defs><rect width="400" height="240" fill="url(#dawn)"/><circle cx="70" cy="190" r="46" fill="#ffd27a" opacity=".8"/><path d="M0 200 Q100 180 200 196 T400 190 V240 H0z" fill="#a9d98a"/><path d="M-10 62 Q120 48 230 70 T420 56" stroke="#7a4d24" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M150 58 q8 -20 26 -24 M260 66 q10 -18 30 -20" stroke="#7a4d24" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="290" cy="44" rx="14" ry="7" fill="#7cc265" stroke="${INK}" stroke-width="1.5"/><ellipse cx="172" cy="36" rx="12" ry="6" fill="#7cc265" stroke="${INK}" stroke-width="1.5"/><path d="M200 70 v14" stroke="#7a4d24" stroke-width="4"/><g class="st-sway">${bees.join('')}</g>${miniBee(300, 120, 1.2, 'st-fly')}${miniBee(110, 140, 1, 'st-fly st-fly2')}</svg>`;
  },
  cicek: () => {
    const letters = 'ARIBAL';
    return `<svg viewBox="0 0 400 240"><rect width="400" height="240" fill="#e6f6ff"/><path d="M0 190 Q120 170 240 186 T400 182 V240 H0z" fill="#9fd47f"/>${[70, 150, 230, 310].map((x, i) => `<g class="sb-flower" style="animation-delay:${-i * 0.7}s" transform="translate(${x} 205)"><path d="M0 0 q2 -30 0 -52" stroke="#3f9b55" stroke-width="4" fill="none"/>${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="0" cy="-74" rx="8" ry="16" fill="${['#ffd1e3', '#fff', '#c9b6ff', '#ffe27a'][i]}" stroke="${INK}" stroke-width="1.5" transform="rotate(${a} 0 -56)"/>`).join('')}<circle cx="0" cy="-56" r="11" fill="#ffcd3c" stroke="${INK}" stroke-width="2"/><text x="0" y="-51" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="15" fill="${INK}">${letters[i]}</text></g>`).join('')}${[[110, 60], [270, 48], [200, 96]].map(([x, y], i) => `<g class="st-float" style="animation-delay:${-i * 0.9}s"><path d="M${x - 14} ${y} l7 -12 h14 l7 12 l-7 12 h-14z" fill="#fff6d8" stroke="${INK}" stroke-width="2"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="16" fill="${INK}">${'BAL'[i]}</text></g>`).join('')}${miniBee(150, 60, 1.6, 'st-fly')}</svg>`;
  },
  kovan: () => `<svg viewBox="0 0 400 240"><rect width="400" height="240" fill="#fff4d8"/><circle cx="330" cy="54" r="26" fill="#ffe066" stroke="${INK}" stroke-width="2"/><path d="M0 186 Q120 170 240 182 T400 178 V240 H0z" fill="#8fd06a"/><g transform="translate(200 0)"><rect x="-52" y="196" width="104" height="8" rx="2" fill="#8a5a33" stroke="${INK}" stroke-width="2"/><rect class="st-pop" x="-46" y="140" width="92" height="56" rx="4" fill="#ffd65a" stroke="${INK}" stroke-width="2.6"/><path d="M-54 140 h108 l-10 -16 h-88z" fill="#c98b52" stroke="${INK}" stroke-width="2.6"/><rect x="-14" y="187" width="28" height="6" rx="3" fill="${INK}"/><path d="M-36 168 h72" stroke="${INK}" stroke-width="1.4" opacity=".3"/></g>${[0, 1, 2, 3, 4, 5].map((i) => `<g transform="translate(200 186)"><g class="sb-fly sb-f${i % 5}" style="animation-delay:${-i * 1.1}s;animation-duration:${5 + i * 0.7}s">${miniBee(0, 0, 1.1)}</g></g>`).join('')}</svg>`,
};

const SLIDES = [
  { art: 'ogul', t: 'Yuvası Olmayan Koloni', d: 'Bir bahar sabahı, yaşlı bir ağacın dalında bir oğul asılı duruyor. Binlerce arı ve onların kraliçesi. Gidecek bir yuvaları yok.' },
  { art: 'cicek', t: 'Çiçekler Harf Açar', d: 'Bu dünyada çiçeklerin özü harflerdir, nektar da kelimeler. Arılar senin bulduğun her kelimeyi bala çevirir. Ne kadar çok kelime, o kadar güçlü bir koloni.' },
  { art: 'kovan', t: 'Onlara Bir Kovan Ver', d: 'Koloniye bir yuva verdin. Mevsimler geçecek, kış gelecek, arıcı hasada uğrayacak. Her bölümde kovan büyüyecek. Şimdi bu koloniye bir ad ver.' },
];

// İlk açılış: üç sahne, sonra ad verme
export function introStory(done) {
  const root = document.getElementById('overlays');
  const wrap = el(html`<div class="story" role="dialog" aria-modal="true"><div class="story-in"></div></div>`);
  root.append(wrap);
  const box = wrap.firstElementChild;
  let i = 0;
  const show = () => {
    if (i < SLIDES.length) {
      const s = SLIDES[i];
      box.innerHTML = toHTML(html`
        <div class="st-art">${raw(ART[s.art]())}</div>
        <div class="st-dots">${SLIDES.map((_, k) => html`<i class="${k === i ? 'on' : ''}"></i>`)}<i class="${i >= SLIDES.length ? 'on' : ''}"></i></div>
        <h2>${s.t}</h2>
        <p>${s.d}</p>
        <div class="st-row">
          ${i === 0 && save.get('story') ? html`<button class="btn btn-ghost" data-st="skip">Geç</button>` : ''}
          <button class="btn btn-main btn-big" data-st="next">${icon('arrow')}${i === SLIDES.length - 1 ? 'Adını Ver' : 'Devam'}</button>
        </div>`);
    } else {
      const sug = [...NAMES].sort(() => Math.random() - 0.5).slice(0, 5);
      const cur = save.data.colony.name || sug[0];
      box.innerHTML = toHTML(html`
        <div class="st-art st-art-sm">${raw(ART.kovan())}</div>
        <h2>Koloninin Adı</h2>
        <label class="field"><span>Kovanın adı</span><input data-name maxlength="20" value="${cur}" autocomplete="off" spellcheck="false"></label>
        <div class="chips">${sug.map((n) => html`<button class="chip" data-sug="${n}">${n}</button>`)}</div>
        <label class="field"><span>Senin takma adın (sıralama tablosunda görünür)</span><input data-player maxlength="16" value="${save.data.player}" placeholder="İsteğe bağlı" autocomplete="off" spellcheck="false"></label>
        <div class="st-row"><button class="btn btn-main btn-big" data-st="go">${icon('hex')}Kovanı Kur</button></div>`);
    }
    box.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.9,.3,1)' });
  };
  const finish = () => {
    const name = (box.querySelector('[data-name]')?.value || '').trim().slice(0, 20) || 'Ihlamur';
    const player = (box.querySelector('[data-player]')?.value || '').trim().slice(0, 16);
    save.data.colony.name = name;
    if (player) save.data.player = player;
    if (!save.data.colony.born) save.data.colony.born = Date.now();
    save.set('story', true);
    sfx.fanfare();
    buzz(20);
    const a = wrap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
    a.finished.then(() => wrap.remove(), () => wrap.remove());
    done();
  };
  wrap.addEventListener('click', (e) => {
    const sug = e.target.closest('[data-sug]');
    if (sug) {
      box.querySelector('[data-name]').value = sug.dataset.sug;
      sfx.tap();
      return;
    }
    const b = e.target.closest('[data-st]');
    if (!b) return;
    sfx.tap();
    if (b.dataset.st === 'next') { i++; show(); } else if (b.dataset.st === 'skip') { i = SLIDES.length; show(); } else finish();
  });
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Enter' && i >= SLIDES.length) finish(); });
  show();
}

// Her 10 bölümde bir: mevsimin sahnesiyle hikaye kartı
const ART_SEASON = { bahar: ['bahar', 'gunes'], yaz: ['yaz', 'sicak'], hasat: ['guz', 'gunes'], guz: ['guz', 'ruzgar'], kis: ['kis', 'kar'], yeniden: ['bahar', 'gunes'] };
export function chapterSheet(ch, after) {
  const k = koloni();
  const [season, weather] = ART_SEASON[ch.art];
  const view = { ...k, season, weather, night: false, bloom: { bahar: 1, yaz: 0.8, guz: 0.25, kis: 0 }[season] };
  markChapter(ch.index);
  const sd = sceneData(view);
  let live = null;
  const { el: sheet } = openSheet(html`
    <div class="chap">
      <div class="chap-art">${raw(sd.svg)}</div>
      <small>${k.name} Kovanı · ${ch.index * 10}. bölüm</small>
      <h2>${ch.t}</h2>
      <p>${ch.d(k)}</p>
    </div>
    <button class="btn btn-main btn-big" data-act="ok">${icon('arrow')}Devam</button>`, {
    cls: 'sheet-chap',
    actions: { ok: (close) => close() },
    onClose: () => { if (live) live.dispose(); if (after) after(); },
  });
  live = liveScene(sheet.querySelector('.chap-art'), view, sd);
  sfx.chime(84);
}

export function replayChapter(index, after) {
  const ch = chapterFor(index);
  if (ch) chapterSheet(ch, after);
}

export const randomName = () => pick(NAMES);
