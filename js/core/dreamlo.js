// dreamlo ile sıralama: skor yazma ve tabloyu okuma. Hata olursa sessizce geçer.

import { SIRALAMA } from '../config.js';
import { save } from './save.js';

const BASE = 'https://www.dreamlo.com/lb/';
export const lbReady = () => !!(SIRALAMA.ozel && SIRALAMA.genel);
const clean = (s, n) => String(s || '').replace(/[^\p{L}\p{N} ]/gu, '').trim().slice(0, n).replace(/ +/g, '_');
export const myName = () => `${clean(save.data.player, 16) || 'Arıcı'}~${save.data.pid}`;
export const shown = (name) => String(name).split('~')[0].replace(/_/g, ' ');

// Skor: toplam bal. Seconds alanında geçilen bölüm, metin alanında koloni adı tutulur
export async function submitScore() {
  if (!lbReady() || !save.data.player) return false;
  const s = save.data;
  const score = Math.round(s.stats.honey);
  if (score <= (s.lb.sent || 0)) return false;
  const url = `${BASE}${SIRALAMA.ozel}/add/${encodeURIComponent(myName())}/${score}/${save.levelsDone()}/${encodeURIComponent(clean(s.colony.name, 20) || 'Kovan')}`;
  try {
    const r = await fetch(url, { mode: 'cors', cache: 'no-store' });
    if (!r.ok) return false;
    s.lb.sent = score;
    save.touch();
    return true;
  } catch {
    return false;
  }
}

export async function fetchBoard() {
  const r = await fetch(`${BASE}${SIRALAMA.genel}/json`, { mode: 'cors', cache: 'no-store' });
  const j = await r.json();
  let list = j && j.dreamlo && j.dreamlo.leaderboard ? j.dreamlo.leaderboard.entry : [];
  if (!list) list = [];
  if (!Array.isArray(list)) list = [list];
  const me = myName();
  return list.map((e) => ({
    name: shown(e.name),
    score: Number(e.score) || 0,
    levels: Number(e.seconds) || 0,
    colony: String(e.text || '').replace(/_/g, ' '),
    me: e.name === me,
  })).sort((a, b) => b.score - a.score);
}
