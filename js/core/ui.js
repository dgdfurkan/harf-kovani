// Ortak arayüz: simgeler, alt pencere, tost, sonuç ve mola pencereleri

import { html, raw, el } from './dom.js';
import { sfx, buzz } from './audio.js';
import { confetti } from './fx.js';

const IC = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  home: '<path d="M4 11.2 12 4l8 7.2V20h-5.2v-5.6H9.2V20H4z"/>',
  sound: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  mute: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  play: '<path d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2z" fill="currentColor"/>',
  replay: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 3.8v4.6h4.6"/>',
  arrow: '<path d="M5 12h13.5M13 6l6 6-6 6"/>',
  lock: '<rect x="6" y="11" width="12" height="9" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" fill="currentColor"/>',
  check: '<path d="M5 12.5l4.6 4.5L19 7.2"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 1 1 3.9 2.2c-.9.6-1.4 1.1-1.4 2.3"/><circle cx="12" cy="17.2" r=".6" fill="currentColor"/>',
  hint: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M3.8 6.5l1 1 1.8-2M3.8 12l1 1 1.8-2M3.8 17.5l1 1 1.8-2"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7.5h8M8 11h6"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8.5 21h7M9.5 18h5"/>',
  bee: '<ellipse cx="13" cy="14" rx="6" ry="4.5"/><path d="M11 10v8M14.5 9.8v8.4"/><circle cx="6" cy="12" r="2.6"/><path d="M11 9.5c-1-3-4-4.5-6-3.5 1 2 3.5 3.5 6 3.5zM14 9.5c1-3 4-4.5 6-3.5-1 2-3.5 3.5-6 3.5z"/>',
  shuffle: '<path d="M3 7h3.5c2 0 3 1 4.2 3l2.6 4c1.2 2 2.2 3 4.2 3H21"/><path d="M3 17h3.5c1.2 0 2-.4 2.8-1.2M14.7 8.2c.8-.8 1.6-1.2 2.8-1.2H21"/><path d="M18 4l3 3-3 3M18 14l3 3-3 3"/>',
  quote: '<path d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 3.5V18H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M8 11h8M8 14h5"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.4-1.2-1.7-1.2-3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.2" fill="currentColor"/><circle cx="15" cy="7.8" r="1.2" fill="currentColor"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.4-6 8-6s6.8 2 8 6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  hex: '<path d="M12 2.8 20 7.4v9.2l-8 4.6-8-4.6V7.4z"/>',
  flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.4 1.2-3.8 2.4-5 .2 1.8 1 2.8 2.1 3.2C11 8.6 11 5.8 12 3z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
  music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
};

export const icon = (name, cls = '') => raw(`<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[name] || ''}</svg>`);

/* ---------- Alt pencere ve tost ---------- */

let sheets = 0;
const openCloses = new Set();
export const sheetOpen = () => sheets > 0;
// Sayfa değişince açık kalan pencereler kapansın
export function closeSheets() {
  for (const fn of [...openCloses]) fn();
  openCloses.clear();
  sheets = 0;
  const root = document.getElementById('overlays');
  if (root) root.querySelectorAll('.sheet-back, .toast').forEach((n) => n.remove());
}

export function openSheet(tpl, { actions = {}, dismiss = true, onClose = null, cls = '' } = {}) {
  const back = el(html`<div class="sheet-back"><div class="sheet ${cls}" role="dialog" aria-modal="true">${tpl}</div></div>`);
  const sheet = back.firstElementChild;
  document.getElementById('overlays').append(back);
  sheets++;
  back.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 });
  sheet.animate([{ transform: 'translateY(40px) scale(.94)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  let closed = false;
  const close = (value) => {
    if (closed) return;
    closed = true;
    openCloses.delete(close);
    sheets--;
    back.style.pointerEvents = 'none';
    const a = back.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' });
    a.finished.then(() => back.remove(), () => back.remove());
    document.removeEventListener('keydown', onKey);
    if (onClose) onClose(value);
  };
  const onKey = (e) => { if (e.key === 'Escape' && dismiss) close(); };
  document.addEventListener('keydown', onKey);
  openCloses.add(close);
  back.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (t && sheet.contains(t)) {
      if (t.disabled) return;
      sfx.tap();
      buzz(8);
      const fn = actions[t.dataset.act];
      if (fn) fn(close, t, e);
      return;
    }
    if (e.target === back && dismiss) close();
  });
  return { el: sheet, close };
}

export function toast(text, { ms = 2400 } = {}) {
  const t = el(html`<div class="toast">${text}</div>`);
  document.getElementById('overlays').append(t);
  t.animate([{ transform: 'translate(-50%, 20px)', opacity: 0 }, { transform: 'translate(-50%, 0)', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  setTimeout(() => {
    const a = t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    a.finished.then(() => t.remove(), () => t.remove());
  }, ms);
}

export function askSheet({ title, text, yes = 'Evet', no = 'Vazgeç', danger = false }) {
  return new Promise((resolve) => {
    openSheet(html`
      <h2 class="sh-title">${title}</h2>
      ${text ? html`<p class="sh-text">${text}</p>` : ''}
      <div class="sh-row">
        <button class="btn" data-act="no">${no}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-main'}" data-act="yes">${yes}</button>
      </div>`, {
      actions: {
        yes: (close) => { resolve(true); close(true); },
        no: (close) => { resolve(false); close(false); },
      },
      onClose: () => resolve(false),
    });
  });
}

export const starsHTML = (n, total = 3, cls = '') => html`<span class="stars ${cls}">${Array.from({ length: total }, (_, i) => html`<i class="${i < n ? 'on' : ''}">${icon('star')}</i>`)}</span>`;

export function howSheet(lines, title = 'Nasıl Oynanır?') {
  openSheet(html`
    <h2 class="sh-title">${title}</h2>
    <ol class="how">${lines.map((t, i) => html`<li><b>${i + 1}</b><span>${t}</span></li>`)}</ol>
    <button class="btn btn-main" data-act="ok">Anladım</button>`, {
    actions: { ok: (close) => close() },
  });
}

/* ---------- Sonuç ---------- */

// Yıldızlar birer birer çakar, bal sayılır. extra: kovan haberi gibi ek blok
export function resultSheet({ title, sub = '', stars = 0, honey = 0, stats = [], extra = '', buttons = [] }) {
  const { el: sheet, close } = openSheet(html`
    ${stars === null ? '' : html`<div class="res-stars">${[0, 1, 2].map((i) => html`<i data-s="${i}">${icon('star')}</i>`)}</div>`}
    <h2 class="sh-title res-title">${title}</h2>
    ${sub ? html`<p class="sh-text">${sub}</p>` : ''}
    ${stats.length ? html`<div class="res-stats">${stats.map(([k, v]) => html`<div class="res-stat"><span>${k}</span><b>${v}</b></div>`)}</div>` : ''}
    ${honey ? html`<div class="res-honey">${icon('hex')}<b data-rc>+0</b><small>bal</small></div>` : ''}
    ${extra}
    <div class="sh-col">${buttons.map((b, i) => html`<button class="btn ${b.main ? 'btn-main btn-big' : ''}" data-act="b${i}">${b.icon ? icon(b.icon) : ''}${b.label}</button>`)}</div>`, {
    dismiss: false,
    cls: 'res',
    actions: Object.fromEntries(buttons.map((b, i) => [`b${i}`, (c) => { c(); b.act(); }])),
  });
  sfx.fanfare();
  confetti();
  buzz(30);
  for (let i = 0; i < 3; i++) {
    const n = sheet.querySelector(`[data-s="${i}"]`);
    if (stars !== null && i < stars) {
      setTimeout(() => {
        n.classList.add('on');
        n.animate([{ transform: 'scale(2.4) rotate(-30deg)', opacity: 0 }, { transform: 'scale(1) rotate(0)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.34,1.56,.64,1)' });
        sfx.star(i);
        buzz(12);
      }, 320 + i * 260);
    }
  }
  if (honey) {
    const n = sheet.querySelector('[data-rc]');
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0 - 500) / 700);
      if (k > 0) n.textContent = `+${Math.round(honey * k)}`;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  return { el: sheet, close };
}

export function pauseSheet({ onResume, onRestart, onQuit }) {
  return openSheet(html`
    <h2 class="sh-title">Mola</h2>
    <div class="sh-col">
      <button class="btn btn-main btn-big" data-act="go">${icon('play')}Devam Et</button>
      <button class="btn" data-act="re">${icon('replay')}Baştan Başla</button>
      <button class="btn" data-act="quit">${icon('home')}Kovana Dön</button>
    </div>`, {
    actions: {
      go: (c) => { c(); },
      re: (c) => { c('re'); onRestart(); },
      quit: (c) => { c('quit'); onQuit(); },
    },
    onClose: (v) => { if (!v && onResume) onResume(); },
  });
}
