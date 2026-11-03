// Bölüm sonu: yıldız ve bal kaydı, arıcılık notu, sonuç, koloni haberi, hikaye kartı, sıralama

import { html, raw, trUpper } from '../core/dom.js';
import { save } from '../core/save.js';
import { resultSheet } from '../core/ui.js';
import { submitScore } from '../core/dreamlo.js';
import { koloni, growthLine, pendingChapter } from '../koloni/koloni.js';
import { combBadge } from '../koloni/sahne.js';
import { chapterSheet } from '../koloni/hikaye.js';
import { bonus } from '../koloni/bahce.js';
import { noteSheet } from './notlar.js';

export function levelDone({ mode, li, total, stars, honey, stats, longest, hard, onNext, onList, onHome }) {
  const before = koloni();
  // Bahçede açan çiçekler bala bereket katar
  const bon = bonus(before);
  if (bon > 0) {
    honey = Math.round(honey * (1 + bon));
    stats = [...stats, ['Bahçe bereketi', `%${Math.round(bon * 100)}`]];
  }
  const list = save.data[mode].stars;
  if (stars > (list[li] || 0)) list[li] = stars;
  const st = save.data.stats;
  st.honey += honey;
  if (longest && longest.length > (st.longest || '').length) st.longest = longest;
  save.touch('stats');
  const after = koloni();
  submitScore();
  // Bir sonraki adıma geçmeden araya hikaye kartı girer
  const thenStory = (fn) => () => {
    const ch = pendingChapter();
    if (ch) chapterSheet(ch, fn);
    else fn();
  };
  const grew = after.lv > before.lv;
  noteSheet(li + (mode === 'petek' ? 7 : 0), () => resultSheet({
    title: hard ? 'Zor Bölüm Geçildi!' : 'Kovan Doldu!',
    sub: longest ? `En uzun kelimen: ${trUpper(longest)}` : '',
    stars,
    honey,
    stats,
    extra: grew ? html`<div class="res-colony">${raw(combBadge())}<p><b>${after.name} Kovanı</b><span>${growthLine(before, after)}</span></p></div>` : '',
    buttons: [
      ...(li + 1 < total ? [{ label: 'Sonraki Bölüm', main: true, icon: 'arrow', act: thenStory(onNext) }] : []),
      { label: 'Bölümler', icon: 'list', act: thenStory(onList) },
      { label: 'Kovana Dön', icon: 'home', act: thenStory(onHome) },
    ],
  }));
}
