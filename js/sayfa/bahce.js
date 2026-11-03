// Bahçe sayfası: kesedeki balla çiçek, ağaç ve süs ekle; takvime göre büyüyüşünü izle

import { html, toHTML, raw } from '../core/dom.js';
import { save } from '../core/save.js';
import { sfx, buzz, tone } from '../core/audio.js';
import { icon, toast } from '../core/ui.js';
import { koloni, fmt } from '../koloni/koloni.js';
import { sceneData } from '../koloni/sahne.js';
import { liveScene } from '../koloni/canli.js';
import { SHOP, byId, balance, bonus, bloomingCount, canPlantNow, freeSlot, plant, stageOf, monthsText, previewSVG } from '../koloni/bahce.js';

const TABS = [['flower', 'Çiçekler'], ['tree', 'Ağaçlar'], ['item', 'Süsler']];
const STAGE_TEXT = { tohum: 'Tohum toprakta', filiz: 'Filizleniyor', cicek: 'Çiçekte, bala bereket katıyor', yaprak: 'Yapraklı, açma ayını bekliyor', yesil: 'Yemyeşil', guz: 'Yaprakları sararıyor', ciplak: 'Kış uykusunda', uyku: 'Kış uykusunda', ok: 'Bahçede' };

export function mountGarden(root, go) {
  let tab = 'flower';
  let live = null;
  const render = () => {
    if (live) live.dispose();
    const k = koloni();
    const sd = sceneData(k);
    const bal = balance();
    const mine = save.data.garden;
    root.innerHTML = toHTML(html`
      <div class="pg pg-garden">
        <header class="pg-top">
          <button class="rbtn" data-go="" aria-label="Geri">${icon('back')}</button>
          <h1>Bahçe</h1>
          <span class="kese kese-big">${icon('hex')}<b>${fmt(bal)}</b></span>
        </header>
        <div class="pg-body">
          <div class="card gd-preview"><div class="h-scene-view" data-view><div class="h-scene-svg">${raw(sd.svg)}</div>
            <div class="h-ribbon"><b>${k.name} Bahçesi</b><span>${k.dateText} · ${k.seasonName}</span></div></div></div>
          <div class="gd-info">
            <span><b>%${Math.round(bonus(k) * 100)}</b>bal bereketi</span>
            <span><b>${bloomingCount(k)}</b>çiçekte</span>
            <span><b>${mine.length}</b>bitki ve süs</span>
          </div>
          <p class="pg-sub">Bitkiler kovanın takvimiyle büyür: her bölüm 6 gün. Her bitkinin kendi ekim ayları var; açan çiçekler bulduğun bala bereket katar ve arılar onlara uçar.</p>
          <div class="seg">${TABS.map(([id, name]) => html`<button class="${tab === id ? 'on' : ''}" data-tab="${id}">${name}</button>`)}</div>
          <div class="shop">${SHOP.filter((p) => p.kind === tab).map((p) => {
            const now = canPlantNow(p, k.month);
            const slot = freeSlot(p);
            const owned = mine.filter((x) => x.id === p.id).length;
            const can = now && slot !== null && bal >= p.price;
            const why = !now ? `Ekim zamanı: ${monthsText(p.plant)}` : slot === null ? (p.kind === 'item' ? 'Bahçede var' : 'Yer kalmadı') : bal < p.price ? `${fmt(p.price - bal)} bal eksik` : 'Şimdi ekilebilir';
            return html`<div class="sh-card ${now ? '' : 'off'}">
              <div class="sc-art">${raw(previewSVG(p.id, k))}</div>
              <div class="sc-body">
                <b>${p.name}${owned ? html`<i>${owned}</i>` : ''}</b>
                <small>${p.desc}</small>
                ${p.kind !== 'item' ? html`<span class="sc-tags"><em>Açar: ${monthsText(p.bloom)}</em><em>Ekim: ${monthsText(p.plant)}</em></span>` : ''}
                <span class="sc-why ${can ? 'ok' : ''}">${why}</span>
              </div>
              <button class="btn btn-small ${can ? 'btn-main' : ''}" data-buy="${p.id}" ${can ? '' : 'disabled'}>${icon('hex')}${fmt(p.price)}</button>
            </div>`;
          })}</div>
          ${mine.length ? html`<h3 class="pg-h">${icon('list')}Bahçende</h3>
          <div class="mine">${mine.slice().reverse().map((it) => {
            const p = byId[it.id];
            const st = stageOf(it, k);
            let extra = '';
            if (st === 'tohum' || st === 'filiz') extra = ` · yaklaşık ${Math.max(1, Math.ceil((p.grow - (k.day - it.day)) / 6))} bölüm sonra büyür`;
            else if (st !== 'cicek' && p.bloom && p.bloom.length) extra = ` · ${monthsText(p.bloom)} arası açar`;
            return html`<div class="mine-row"><span class="mr-art">${raw(previewSVG(p.id, k))}</span><span><b>${p.name}</b><small>${STAGE_TEXT[st] || ''}${extra}</small></span></div>`;
          })}</div>` : ''}
        </div>
      </div>`);
    live = liveScene(root.querySelector('[data-view]'), k, sd);
  };
  render();
  root.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]');
    if (g) { sfx.tap(); go(g.dataset.go); return; }
    const t = e.target.closest('[data-tab]');
    if (t) { sfx.tap(); tab = t.dataset.tab; render(); return; }
    const b = e.target.closest('[data-buy]');
    if (!b || b.disabled) return;
    const p = byId[b.dataset.buy];
    const res = plant(p, koloni());
    if (!res.ok) { sfx.bad(); toast(res.why); return; }
    sfx.good();
    tone({ type: 'sine', f: 520, f2: 1040, dur: 0.25, vol: 0.06 });
    buzz(16);
    toast(p.kind === 'item' ? `${p.name} bahçeye kondu.` : `${p.name} ekildi. Takvim ilerledikçe büyüyecek.`);
    render();
    root.querySelector('.pg').scrollTo({ top: 0, behavior: 'smooth' });
  });
  return { dispose() { if (live) live.dispose(); } };
}
