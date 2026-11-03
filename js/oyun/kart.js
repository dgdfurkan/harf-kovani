// Kelime kartı: bulunan kelimeye dokununca anlamı ve günlük kullanımı açılır

import { html, trUpper, esc, raw } from '../core/dom.js';
import { openSheet, icon } from '../core/ui.js';
import { ANLAM } from '../data/anlam.js';

export const hasMeaning = (w) => !!ANLAM[w];
export const meaningOf = (w) => (ANLAM[w] ? ANLAM[w][0] : '');

// Örnek cümlede kelime (ekli haliyle) vurgulanır
function mark(sentence, w) {
  const low = sentence.toLocaleLowerCase('tr');
  const stem = w.length > 4 ? w.slice(0, -1) : w;
  const at = low.indexOf(stem);
  if (at < 0) return esc(sentence);
  let end = at + stem.length;
  while (end < sentence.length && /\p{L}/u.test(sentence[end])) end++;
  return `${esc(sentence.slice(0, at))}<b>${esc(sentence.slice(at, end))}</b>${esc(sentence.slice(end))}`;
}

export function wordCard(w, { onClose } = {}) {
  const a = ANLAM[w];
  openSheet(html`
    <div class="wcard">
      <div class="wc-tiles">${[...trUpper(w)].map((c, i) => html`<span style="animation-delay:${i * 45}ms">${c}</span>`)}</div>
      ${a ? html`
        <p class="wc-mean">${a[0]}</p>
        <p class="wc-ex">${icon('quote')}<span>${raw(mark(a[1], w))}</span></p>` : html`
        <p class="wc-mean">Bu kelimenin kartı henüz yazılmadı. Yine de doğru bir kelime buldun.</p>`}
      <small class="wc-tag">${icon('book')}Kelime Defteri'nde</small>
    </div>
    <button class="btn btn-main" data-act="ok">Tamam</button>`, {
    cls: 'sheet-word',
    actions: { ok: (close) => close() },
    onClose,
  });
}
