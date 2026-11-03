// Yardım çubuğu: kavanoz, ipucu, arı yardımı ve karıştır.
// Yardımlar kavanozdaki baldan yer; kavanoz boşsa yardım yok, iki yardım arası 30 saniye beklenir.

import { html, toHTML } from '../core/dom.js';
import { save } from '../core/save.js';
import { sfx, buzz } from '../core/audio.js';
import { icon, toast } from '../core/ui.js';

export const COST = { hint: 35, clue: 20 };
export const WAIT = 30000;
// Bulunan kelime kavanoza bal katar
export const jarGain = (w, combo = 1) => Math.round(w.length * 3 * Math.min(1.6, 1 + (combo - 1) * 0.15));

const jarIcon = (k) => `<svg class="jar-ic" viewBox="0 0 24 30" aria-hidden="true"><defs><clipPath id="jarClip"><rect x="4" y="9" width="16" height="18" rx="4"/></clipPath></defs><rect x="4" y="9" width="16" height="18" rx="4" fill="rgba(255,255,255,.6)"/><rect clip-path="url(#jarClip)" x="3" y="${(27 - 18 * k).toFixed(1)}" width="18" height="20" fill="#f0a000"/><rect x="4" y="9" width="16" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="6" y="4.5" width="12" height="5" rx="2" fill="#c98b52" stroke="currentColor" stroke-width="2"/></svg>`;

export const helpBarHTML = ({ shuffle = false } = {}) => html`
  <div class="hk-bar">
    <button class="hk-jar" data-act="jar" aria-label="Kavanoz"><span data-jar-ic></span><b data-jar>0</b></button>
    ${shuffle ? html`<button class="hk-b hk-b-sm" data-act="shuffle" aria-label="Karıştır">${icon('shuffle')}<span>Karıştır</span></button>` : ''}
    <button class="hk-b" data-act="clue">${icon('quote')}<span>İpucu</span><small data-cost="clue">${COST.clue}</small><i class="hk-cd" data-cd="clue"></i></button>
    <button class="hk-b hk-b-main" data-act="hint">${icon('bee')}<span>Arı Yardımı</span><small data-cost="hint">${COST.hint}</small><i class="hk-cd" data-cd="hint"></i></button>
  </div>`;

export function helpBar(my, root, { onHint, onClue, onShuffle, game }) {
  const jarEl = root.querySelector('[data-jar]');
  const jarIc = root.querySelector('[data-jar-ic]');
  const btn = { hint: root.querySelector('[data-act="hint"]'), clue: root.querySelector('[data-act="clue"]') };
  const cd = { hint: root.querySelector('[data-cd="hint"]'), clue: root.querySelector('[data-cd="clue"]') };
  const key = { hint: 'hintAt', clue: 'clueAt' };
  let lastJar = -1;

  const left = (kind) => Math.max(0, WAIT - (Date.now() - (save.get(key[kind]) || 0)));
  function render() {
    const jar = save.get('jar');
    if (jar !== lastJar) {
      jarEl.textContent = `%${Math.round(jar)}`;
      jarIc.innerHTML = jarIcon(jar / 100);
      if (lastJar >= 0 && jar > lastJar) jarEl.parentElement.animate([{ transform: 'scale(1.18)' }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)' });
      lastJar = jar;
    }
    for (const kind of ['hint', 'clue']) {
      const l = left(kind);
      const poor = jar < COST[kind];
      btn[kind].classList.toggle('poor', poor);
      btn[kind].classList.toggle('wait', l > 0);
      cd[kind].style.setProperty('--cd', (l / WAIT).toFixed(3));
      cd[kind].textContent = l > 0 ? `${Math.ceil(l / 1000)}` : '';
    }
  }
  render();
  my.interval(render, 250);
  my.add(save.subscribe((k) => { if (k === 'jar') render(); }));

  function use(kind, fn) {
    if (game.done || game.paused) return;
    const l = left(kind);
    if (l > 0) {
      sfx.soft();
      toast(`Arılar dinleniyor, ${Math.ceil(l / 1000)} saniye sonra.`);
      return;
    }
    if (save.get('jar') < COST[kind]) {
      sfx.bad();
      buzz(20);
      toast(`Kavanozda yeterli bal yok. Kelime buldukça dolar (gereken %${COST[kind]}).`);
      root.querySelector('.hk-jar').animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 260 });
      return;
    }
    if (fn() === false) return;
    save.addJar(-COST[kind]);
    save.set(key[kind], Date.now());
    const st = save.data.stats;
    if (kind === 'hint') st.hints++; else st.clues++;
    render();
  }

  my.on(root, 'click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    sfx.tap();
    const act = b.dataset.act;
    if (act === 'hint') use('hint', onHint);
    else if (act === 'clue') use('clue', onClue);
    else if (act === 'shuffle' && onShuffle && !game.done) onShuffle();
    else if (act === 'jar') toast(`Kavanoz %${Math.round(save.get('jar'))}. İpucu %${COST.clue}, Arı Yardımı %${COST.hint} bal ister.`);
  });
  // Klavye: boşluk karıştırır
  my.on(window, 'keydown', (e) => {
    if (e.key === ' ' && onShuffle && !game.done && !game.paused) { e.preventDefault(); onShuffle(); }
  });
  return { render, root };
}

export const barRoot = (wrap) => wrap.querySelector('.hk-bar');
export const barHTMLString = (o) => toHTML(helpBarHTML(o));
