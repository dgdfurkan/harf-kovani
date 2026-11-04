// Ana ekran dışındaki sayfalar: bölüm listesi, kelime defteri, sıralama, ayarlar

import { html, toHTML, raw, trUpper, trLower } from '../core/dom.js';
import { save } from '../core/save.js';
import { sfx, buzz, syncVolumes } from '../core/audio.js';
import { icon, starsHTML, toast, askSheet, openSheet } from '../core/ui.js';
import { lbReady, fetchBoard, submitScore } from '../core/dreamlo.js';
import { PUZZLES } from '../data/kovan-levels.js';
import { CICEK_LEVELS } from '../oyun/cicek.js';
import { PETEK_LEVELS } from '../oyun/petek.js';
import { CENGEL_LEVELS } from '../oyun/cengel.js';
import { DIYAR } from '../oyun/diyar.js';
import { wordCard, meaningOf } from '../oyun/kart.js';
import { koloni, fmt, chapterFor } from '../koloni/koloni.js';
import { introStory, chapterSheet } from '../koloni/hikaye.js';

const page = (title, body, back = true) => html`
  <div class="pg">
    <header class="pg-top">
      ${back ? html`<button class="rbtn" data-go="" aria-label="Geri">${icon('back')}</button>` : ''}
      <h1>${title}</h1>
    </header>
    <div class="pg-body">${body}</div>
  </div>`;

const bindGo = (root, go) => root.addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (!b) return;
  sfx.tap();
  go(b.dataset.go);
});

/* ---------- Bölümler ---------- */

// Çengel Bulmaca: bölümler durak durak, her durağın kendi manzarası
function mountRoute(root, go) {
  const stars = save.data.cengel.stars;
  const open = Math.min(CENGEL_LEVELS - 1, stars.filter((s) => s > 0).length);
  const stops = Math.ceil(CENGEL_LEVELS / 10);
  root.innerHTML = toHTML(page('Çengel Bulmaca', html`
    <p class="pg-sub">Harf çarkından kelime çıkar, bulmacayı doldur. Arılar çiçek peşinde Türkiye'yi dolaşıyor; her on bölüm yeni bir durak.</p>
    ${Array.from({ length: stops }, (_, s) => {
      const d = DIYAR[s % DIYAR.length];
      const first = s * 10;
      const locked = first > open;
      const done = Array.from({ length: 10 }, (_, i) => stars[first + i] || 0).filter(Boolean).length;
      return html`<section class="stop ${locked ? 'locked' : ''}" style="--ac:${d.accent}">
        <div class="stop-art">${raw(`<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice"><g transform="translate(0 -170)">${d.svg()}</g></svg>`)}<span><b>${d.name}</b><small>${s + 1}. durak · ${d.place} · ${done}/10</small></span></div>
        <div class="stop-lv">${Array.from({ length: Math.min(10, CENGEL_LEVELS - first) }, (_, i) => {
          const li = first + i;
          const lk = li > open;
          return html`<button class="slv ${lk ? 'lk' : ''} ${li === open ? 'cur' : ''} ${stars[li] ? 'ok' : ''}" data-level="${li}">${lk ? icon('lock') : html`<b>${i + 1}</b>${starsHTML(stars[li] || 0)}`}</button>`;
        })}</div>
      </section>`;
    })}`));
  const pg = root.firstElementChild;
  bindGo(pg, go);
  pg.addEventListener('click', (e) => {
    const lv = e.target.closest('[data-level]');
    if (!lv) return;
    if (lv.classList.contains('lk')) { sfx.bad(); buzz(20); toast('Önce önceki bölümleri geç.'); return; }
    sfx.tap();
    go(`oyna/cengel/${lv.dataset.level}`);
  });
  const cur = pg.querySelector('.slv.cur');
  if (cur) requestAnimationFrame(() => cur.scrollIntoView({ block: 'center' }));
  return { dispose() {} };
}

export function mountLevels(root, go, mode) {
  if (mode === 'cengel') return mountRoute(root, go);
  const total = mode === 'cicek' ? CICEK_LEVELS : PETEK_LEVELS;
  const stars = save.data[mode].stars;
  const open = Math.min(total - 1, stars.filter((s) => s > 0).length);
  const isHard = (i) => (mode === 'cicek' ? !!PUZZLES[i].z : (i + 1) % 10 === 0);
  const title = mode === 'cicek' ? 'Harf Çiçeği' : 'Petek Avı';
  root.innerHTML = toHTML(page(title, html`
    <p class="pg-sub">${mode === 'cicek' ? 'Her bölümde harf çiçeğinden çıkan bütün kelimeleri bul. Her onuncu bölüm zor.' : 'Komşu harfleri birleştir, bölüm hedefini tamamla. Her onuncu bölüm zor.'}</p>
    <div class="lv-grid">${Array.from({ length: total }, (_, i) => {
      const locked = i > open;
      const s = stars[i] || 0;
      return html`<button class="lv ${locked ? 'locked' : ''} ${i === open ? 'current' : ''} ${isHard(i) ? 'hard' : ''}" data-level="${i}" aria-label="Bölüm ${i + 1}">
        ${locked ? icon('lock') : html`<b>${i + 1}</b>`}
        ${!locked && isHard(i) ? html`<i class="lv-hard">${icon('flame')}</i>` : ''}
        ${locked ? '' : starsHTML(s)}
      </button>`;
    })}</div>`));
  const pg = root.firstElementChild;
  bindGo(pg, go);
  pg.addEventListener('click', (e) => {
    const lv = e.target.closest('[data-level]');
    if (!lv) return;
    if (lv.classList.contains('locked')) { sfx.bad(); buzz(20); toast('Önce önceki bölümleri geç.'); return; }
    sfx.tap();
    go(`oyna/${mode}/${lv.dataset.level}`);
  });
  const cur = pg.querySelector('.lv.current');
  if (cur) requestAnimationFrame(() => cur.scrollIntoView({ block: 'center' }));
  return { dispose() {} };
}

/* ---------- Kelime Defteri ---------- */

export function mountBook(root, go) {
  const words = [...save.data.found].sort((a, b) => a.localeCompare(b, 'tr'));
  root.innerHTML = toHTML(page('Kelime Defteri', html`
    <p class="pg-sub">${words.length ? `${fmt(words.length)} kelime buldun. Dokun, anlamını ve günlük kullanımını gör.` : 'Henüz kelime yok. Oynadıkça bulduğun her kelime buraya yazılır.'}</p>
    ${words.length ? html`<label class="search">${icon('search')}<input data-q placeholder="Kelime ara" autocomplete="off" spellcheck="false"></label>` : ''}
    <div class="book" data-list></div>`));
  const pg = root.firstElementChild;
  bindGo(pg, go);
  const list = pg.querySelector('[data-list]');
  const render = (q = '') => {
    const f = q ? words.filter((w) => w.includes(q)) : words;
    list.innerHTML = toHTML(html`${f.slice(0, 600).map((w) => html`<button class="bk-row" data-w="${w}"><b>${trUpper(w)}</b><span>${meaningOf(w) || 'Anlamı yakında'}</span></button>`)}`);
  };
  render();
  const input = pg.querySelector('[data-q]');
  if (input) input.addEventListener('input', () => render(trLower(input.value.trim())));
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-w]');
    if (!b) return;
    sfx.tap();
    wordCard(b.dataset.w);
  });
  return { dispose() {} };
}

/* ---------- Sıralama ---------- */

export function mountBoard(root, go) {
  const s = save.data;
  root.innerHTML = toHTML(page('Sıralama', html`
    <div class="me-card">
      <span class="me-name"><b>${s.player || 'Takma adın yok'}</b><small>${koloni().name} Kovanı</small></span>
      <span class="me-score"><b>${fmt(Math.round(s.stats.honey))}</b><small>bal</small></span>
      <button class="btn btn-small" data-act="name">${icon('user')}${s.player ? 'Değiştir' : 'Ad Seç'}</button>
    </div>
    <p class="pg-sub">Sıralama toplam bala göre. Her bölüm bitince skorun kendiliğinden gönderilir.</p>
    <div class="board" data-board>${lbReady() ? html`<p class="pg-sub">Yükleniyor...</p>` : html`<div class="soon">${icon('trophy')}<b>Sıralama tablosu yakında açılıyor</b><span>Skorların bu cihazda birikiyor, tablo açılınca otomatik gönderilecek.</span></div>`}</div>`));
  const pg = root.firstElementChild;
  bindGo(pg, go);
  const board = pg.querySelector('[data-board]');
  const load = async () => {
    if (!lbReady()) return;
    try {
      await submitScore();
      const list = await fetchBoard();
      board.innerHTML = toHTML(html`${list.length ? list.slice(0, 100).map((e, i) => html`<div class="lb-row ${e.me ? 'me' : ''}"><i>${i + 1}</i><span><b>${e.name}</b><small>${e.colony} · ${e.levels} bölüm</small></span><em>${fmt(e.score)}</em></div>`) : html`<p class="pg-sub">Tablo boş. İlk sıraya sen yerleş!</p>`}`);
    } catch {
      board.innerHTML = toHTML(html`<p class="pg-sub">Tabloya ulaşılamadı. İnternet bağlantısını kontrol et.</p>`);
    }
  };
  load();
  pg.addEventListener('click', (e) => {
    if (!e.target.closest('[data-act="name"]')) return;
    sfx.tap();
    nameSheet(() => go('siralama'));
  });
  return { dispose() {} };
}

export function nameSheet(after) {
  openSheet(html`
    <h2 class="sh-title">Takma Ad</h2>
    <p class="sh-text">Sıralama tablosunda bu ad ve kovanının adı görünür.</p>
    <label class="field"><span>Takma ad</span><input data-v maxlength="16" value="${save.data.player}" autocomplete="off" spellcheck="false"></label>
    <button class="btn btn-main" data-act="ok">Kaydet</button>`, {
    actions: {
      ok: (close, b) => {
        const v = b.closest('.sheet').querySelector('[data-v]').value.trim().slice(0, 16);
        save.data.player = v;
        save.data.lb.sent = 0;
        save.touch();
        close();
        after && after();
      },
    },
  });
}

/* ---------- Ayarlar ---------- */

const THEMES = [['bal', 'Bal'], ['gece', 'Gece Kovanı'], ['lavanta', 'Lavanta'], ['nane', 'Nane']];

export function applyTheme() {
  document.documentElement.dataset.theme = save.get('theme') || 'bal';
  document.dispatchEvent(new Event('hk-theme'));
}

export function mountSettings(root, go) {
  const s = save.data;
  const sw = (key, label) => html`<button class="tg ${s[key] ? 'on' : ''}" data-tg="${key}"><span>${label}</span><i></i></button>`;
  root.innerHTML = toHTML(page('Ayarlar', html`
    <h3 class="pg-h">${icon('palette')}Tema</h3>
    <div class="themes">${THEMES.map(([id, name]) => html`<button class="th th-${id} ${s.theme === id ? 'on' : ''}" data-theme-id="${id}"><i></i><span>${name}</span></button>`)}</div>
    <h3 class="pg-h">${icon('music')}Ses</h3>
    <div class="tgs">${sw('music', 'Müzik')}${sw('sound', 'Efekt sesleri')}${sw('haptic', 'Titreşim')}${sw('eco', 'Pil tasarrufu')}</div>
    <h3 class="pg-h">${icon('hex')}Kovan</h3>
    <label class="field"><span>Koloninin adı</span><input data-colony maxlength="20" value="${s.colony.name}" autocomplete="off" spellcheck="false"></label>
    <label class="field"><span>Takma adın (sıralamada görünür)</span><input data-player maxlength="16" value="${s.player}" autocomplete="off" spellcheck="false"></label>
    <h3 class="pg-h">${icon('copy')}Kayıt Kodu</h3>
    <p class="pg-sub">İlerlemen bu cihazda saklanıyor. Başka cihaza geçerken kodu kopyala, orada yapıştır.</p>
    <div class="sh-row"><button class="btn" data-act="export">${icon('copy')}Kodu Kopyala</button><button class="btn" data-act="import">${icon('arrow')}Kod Yapıştır</button></div>
    <h3 class="pg-h">${icon('book')}Diğer</h3>
    <div class="sh-col">
      <button class="btn" data-act="story">${icon('replay')}Açılış Hikayesini İzle</button>
      <button class="btn btn-danger-ghost" data-act="reset">${icon('x')}İlerlemeyi Sıfırla</button>
    </div>`));
  const pg = root.firstElementChild;
  bindGo(pg, go);
  const saveText = () => {
    const c = pg.querySelector('[data-colony]').value.trim().slice(0, 20);
    if (c) s.colony.name = c;
    const p = pg.querySelector('[data-player]').value.trim().slice(0, 16);
    if (p !== s.player) { s.player = p; s.lb.sent = 0; }
    save.touch();
  };
  pg.querySelectorAll('input').forEach((i) => i.addEventListener('change', saveText));
  pg.addEventListener('click', async (e) => {
    const th = e.target.closest('[data-theme-id]');
    if (th) {
      sfx.tap();
      save.set('theme', th.dataset.themeId);
      applyTheme();
      pg.querySelectorAll('.th').forEach((n) => n.classList.toggle('on', n === th));
      return;
    }
    const tg = e.target.closest('[data-tg]');
    if (tg) {
      const k = tg.dataset.tg;
      save.set(k, !s[k]);
      tg.classList.toggle('on', s[k]);
      syncVolumes();
      sfx.tap();
      if (k === 'music') document.dispatchEvent(new Event('hk-music'));
      return;
    }
    const a = e.target.closest('[data-act]');
    if (!a || a.closest('.sheet')) return;
    sfx.tap();
    if (a.dataset.act === 'export') {
      const code = save.exportCode();
      try {
        await navigator.clipboard.writeText(code);
        toast('Kayıt kodu kopyalandı.');
      } catch {
        openSheet(html`<h2 class="sh-title">Kayıt Kodu</h2><textarea class="code" readonly>${code}</textarea><button class="btn btn-main" data-act="ok">Tamam</button>`, { actions: { ok: (c) => c() } });
      }
    } else if (a.dataset.act === 'import') {
      openSheet(html`<h2 class="sh-title">Kodu Yapıştır</h2><p class="sh-text">Bu cihazdaki ilerlemenin yerine geçer.</p><textarea class="code" data-code placeholder="Kayıt kodu"></textarea><button class="btn btn-main" data-act="ok">Yükle</button>`, {
        actions: {
          ok: (c, b) => {
            try {
              save.importCode(b.closest('.sheet').querySelector('[data-code]').value);
              c();
              toast('İlerleme yüklendi.');
              applyTheme();
              go('');
            } catch {
              toast('Kod okunamadı.');
            }
          },
        },
      });
    } else if (a.dataset.act === 'story') {
      introStory(() => go(''));
    } else if (a.dataset.act === 'reset') {
      if (await askSheet({ title: 'Sıfırlansın mı?', text: 'Koloni, bölümler ve kelime defteri silinir. Geri alınamaz.', yes: 'Sıfırla', danger: true })) {
        save.reset();
        applyTheme();
        location.hash = '#/';
        location.reload();
      }
    }
  });
  return { dispose() {} };
}

/* ---------- Hikaye: görülen bölümler ---------- */

export function mountStory(root, go) {
  const k = koloni();
  const seen = Math.max(save.data.colony.chapter || 0, 0);
  const list = [];
  for (let i = 1; i <= seen; i++) list.push(chapterFor(i));
  root.innerHTML = toHTML(page('Kovanın Hikayesi', html`
    <p class="pg-sub">${k.name} kolonisinin yolculuğu. Her on bölümde yeni bir sayfa açılır.</p>
    <button class="st-item" data-intro><b>Başlangıç</b><span>Yuvası olmayan koloni</span></button>
    ${list.map((c) => html`<button class="st-item" data-ch="${c.index}"><b>${c.t}</b><span>${c.index * 10}. bölüm</span></button>`)}
    ${Array.from({ length: 2 }, (_, i) => html`<div class="st-item st-locked">${icon('lock')}<span>${(seen + 1 + i) * 10}. bölümde açılır</span></div>`)}`));
  const pg = root.firstElementChild;
  bindGo(pg, go);
  pg.addEventListener('click', (e) => {
    if (e.target.closest('[data-intro]')) { sfx.tap(); introStory(() => go('hikaye')); return; }
    const b = e.target.closest('[data-ch]');
    if (!b) return;
    sfx.tap();
    chapterSheet(chapterFor(Number(b.dataset.ch)));
  });
  return { dispose() {} };
}
