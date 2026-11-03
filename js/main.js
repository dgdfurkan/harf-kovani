// Uygulama kapısı: yönlendirme, oyun çerçevesi, tema, müzik, çevrimdışı kurulum ve güncelleme

import { html, toHTML, raw } from './core/dom.js';
import { save } from './core/save.js';
import { perf } from './core/perf.js';
import { bindUnlock, ensure, sfx, syncVolumes } from './core/audio.js';
import { music } from './core/music.js';
import { icon, toast, sheetOpen, closeSheets } from './core/ui.js';
import { koloni } from './koloni/koloni.js';
import { combBadge } from './koloni/sahne.js';
import { introStory } from './koloni/hikaye.js';
import { mountHome } from './sayfa/ana.js';
import { mountLevels, mountBook, mountBoard, mountSettings, mountStory, applyTheme } from './sayfa/sayfalar.js';
import { playCicek, CICEK_LEVELS } from './oyun/cicek.js';
import { playPetek, PETEK_LEVELS } from './oyun/petek.js';
import { PUZZLES } from './data/kovan-levels.js';

const app = document.getElementById('app');
let current = null;
let wiping = false;

perf.start();
bindUnlock();
applyTheme();
window.addEventListener('pointerdown', () => { ensure(); music.retry(); }, { capture: true, passive: true });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

const go = (path) => { location.hash = `#/${path}`; };

// Müzik: ana ekranda kovan teması, oyunda mevsimin ezgisi, zor bölümde gergin ezgi
const seasonSong = (li) => `${koloni().season}${li % 2 ? '2' : ''}`;
function setMusic(id) {
  if (save.get('music')) music.play(id);
  else music.stop();
  setMusic.last = id;
}
document.addEventListener('hk-music', () => { syncVolumes(); setMusic(setMusic.last || 'ev'); });

// Oyun çerçevesi: geri, başlık, petek rozeti, ses
function gameFrame(title) {
  app.innerHTML = toHTML(html`
    <section class="g">
      <header class="g-top">
        <button class="rbtn" data-top="back" aria-label="Geri">${icon('back')}</button>
        <h1 class="g-title" data-title>${title}</h1>
        <button class="comb-chip" data-top="home" aria-label="Kovan">${raw(combBadge())}<b>${koloni().lv}</b></button>
        <button class="rbtn" data-top="sound" aria-label="Ses">${icon(save.get('sound') ? 'sound' : 'mute')}</button>
      </header>
      <main class="g-main"></main>
    </section>`);
  const sec = app.firstElementChild;
  const f = { main: sec.querySelector('.g-main'), back: () => go('') };
  sec.querySelector('.g-top').addEventListener('click', (e) => {
    const b = e.target.closest('[data-top]');
    if (!b) return;
    sfx.tap();
    if (b.dataset.top === 'back') f.back();
    else if (b.dataset.top === 'home') go('');
    else {
      const on = !save.get('sound');
      save.set('sound', on);
      save.set('music', on);
      syncVolumes();
      b.innerHTML = toHTML(icon(on ? 'sound' : 'mute'));
      setMusic(setMusic.last || 'ev');
    }
  });
  f.setTitle = (t) => { sec.querySelector('[data-title]').textContent = t; };
  return f;
}

function wipe(swap) {
  return new Promise((resolve) => {
    const c = document.createElement('div');
    c.className = 'wipe';
    document.body.append(c);
    const inA = c.animate([{ clipPath: 'circle(0% at 50% 60%)' }, { clipPath: 'circle(120% at 50% 60%)' }], { duration: 260, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    const after = async () => {
      try { await swap(); } catch (err) { console.error(err); }
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const out = c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease-out', fill: 'forwards' });
        out.finished.then(() => { c.remove(); resolve(); }, () => { c.remove(); resolve(); });
      }));
    };
    inA.finished.then(after, after);
    // Sekme arka plandayken animasyon durursa perde yine kalksın
    setTimeout(() => { if (c.isConnected) { c.remove(); resolve(); } }, 1600);
  });
}

function teardown() {
  if (current && current.dispose) {
    try { current.dispose(); } catch (err) { console.error(err); }
  }
  current = null;
  app.innerHTML = '';
}

async function route() {
  if (wiping) return;
  wiping = true;
  const hash = location.hash.replace(/^#\/?/, '');
  const [a, b, c] = hash.split('/');
  await wipe(async () => {
    closeSheets();
    teardown();
    perf.reset();
    document.body.dataset.page = a || 'ana';
    if (a === 'oyna' && (b === 'cicek' || b === 'petek')) {
      const total = b === 'cicek' ? CICEK_LEVELS : PETEK_LEVELS;
      const li = Math.max(0, Math.min(total - 1, Number(c) || 0));
      const f = gameFrame('');
      const nav = {
        setTitle: f.setTitle,
        setBack: (fn) => { f.back = fn; },
        toList: () => go(`bolumler/${b}`),
        toLevel: (i) => {
          // Aynı bölüm yeniden başlarken adres değişmez, sayfa elle kurulur
          if (location.hash === `#/oyna/${b}/${i}`) route();
          else go(`oyna/${b}/${i}`);
        },
        toHome: () => go(''),
      };
      const hard = b === 'cicek' ? !!PUZZLES[li].z : (li + 1) % 10 === 0;
      setMusic(hard ? 'zor' : seasonSong(li));
      current = b === 'cicek' ? playCicek(f.main, nav, li) : playPetek(f.main, nav, li);
    } else if (a === 'bolumler') {
      current = mountLevels(app, go, b === 'petek' ? 'petek' : 'cicek');
      setMusic('ev');
    } else if (a === 'defter') {
      current = mountBook(app, go);
      setMusic('ev');
    } else if (a === 'siralama') {
      current = mountBoard(app, go);
      setMusic('ev');
    } else if (a === 'ayarlar') {
      current = mountSettings(app, go);
      setMusic('ev');
    } else if (a === 'hikaye') {
      current = mountStory(app, go);
      setMusic('ev');
    } else {
      current = mountHome(app, go);
      setMusic('ev');
    }
    if (window.__hkHook) window.__hkHook(a || 'ana', current);
  });
  wiping = false;
  if (location.hash.replace(/^#\/?/, '') !== hash) route();
  if (updateWaiting && !location.hash.startsWith('#/oyna')) updateWaiting();
}

/* ---------- Çevrimdışı ve otomatik güncelleme ---------- */
let updateWaiting = null;
function setupSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    let applying = false;
    const apply = () => {
      if (applying || !reg.waiting) return;
      applying = true;
      navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
      reg.waiting.postMessage('skip-waiting');
    };
    // Yeni sürüm: oyunun ortasında kesmez, ana ekrandayken ya da sonraki açılışta uygulanır
    const check = () => {
      if (!reg.waiting || !navigator.serviceWorker.controller) return;
      if (!location.hash.startsWith('#/oyna') && !sheetOpen()) {
        toast('Kovana yeni bölümler geldi, yükleniyor.');
        setTimeout(apply, 900);
      }
    };
    updateWaiting = check;
    check();
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (w) w.addEventListener('statechange', check);
    });
    const look = () => { if (navigator.onLine !== false) reg.update().catch(() => {}); };
    look();
    window.addEventListener('online', look);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) look(); });
    setInterval(look, 30 * 60 * 1000);
  }).catch(() => {});
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}

window.addEventListener('hashchange', route);
setupSW();
if (!save.get('story')) {
  // İlk açılış: önce hikaye, sonra kovan
  document.body.dataset.page = 'ana';
  introStory(() => route());
} else route();

window.__hk = { save };
