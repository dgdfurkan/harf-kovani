// Kayıt: her şey bu cihazda tutulur. Bozuk ya da eksik kayıt oyunu durdurmaz.
// Başka cihaza geçmek için kayıt kodu (dışa ve içe aktarma) var.

const KEY = 'harf-kovani/v1';
const listeners = new Set();

const blank = () => ({
  sound: true,
  music: true,
  haptic: true,
  eco: false,
  theme: 'bal',
  story: false,
  player: '',
  pid: Math.random().toString(36).slice(2, 6),
  colony: { name: '', born: Date.now(), lastVisit: 0, chapter: 0 },
  cicek: { stars: [] },
  petek: { stars: [] },
  cengel: { stars: [], seen: -1, extras: 0 },
  stats: { words: 0, honey: 0, hints: 0, clues: 0, longest: '', extras: 0 },
  found: [],
  garden: [],
  spent: 0,
  sonsuz: { best: 0, runs: 0, words: 0, wave: 0 },
  jar: 30,
  hintAt: 0,
  clueAt: 0,
  lb: { sent: 0 },
});

function merge(s) {
  const b = blank();
  return {
    ...b,
    ...s,
    colony: { ...b.colony, ...(s.colony || {}) },
    cicek: { ...b.cicek, ...(s.cicek || {}) },
    petek: { ...b.petek, ...(s.petek || {}) },
    cengel: { ...b.cengel, ...(s.cengel || {}) },
    stats: { ...b.stats, ...(s.stats || {}) },
    lb: { ...b.lb, ...(s.lb || {}) },
    sonsuz: { ...b.sonsuz, ...(s.sonsuz || {}) },
    garden: Array.isArray(s.garden) ? s.garden : [],
    found: Array.isArray(s.found) ? s.found : [],
  };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && typeof s === 'object') return merge(s);
  } catch {
    // Bozuk kayıt: temiz başla
  }
  return blank();
}

let state = load();
let timer = 0;

function flush() {
  clearTimeout(timer);
  timer = 0;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Depolama doluysa oyun yine çalışır
  }
}
const persist = () => {
  if (!timer) timer = setTimeout(flush, 200);
};
window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

const emit = (k) => listeners.forEach((fn) => fn(k, state[k]));

export const save = {
  get: (k) => state[k],
  set(k, v) {
    state[k] = v;
    persist();
    emit(k);
  },
  get data() { return state; },
  touch(k = null) {
    persist();
    if (k) emit(k);
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  // Bölüm sayısı: iki sürümde geçilen bölümler
  levelsDone() {
    const c = state.cicek.stars.filter((x) => x > 0).length;
    const p = state.petek.stars.filter((x) => x > 0).length;
    const g = state.cengel.stars.filter((x) => x > 0).length;
    return c + p + g;
  },
  addFound(w) {
    if (state.found.includes(w)) return false;
    state.found.push(w);
    if (state.found.length > 4000) state.found.splice(0, state.found.length - 4000);
    persist();
    return true;
  },
  // Kavanoz: yardımların kaynağı, 0-100
  addJar(n) {
    state.jar = Math.max(0, Math.min(100, state.jar + n));
    persist();
    emit('jar');
  },
  // Kayıt kodu: bütün ilerleme tek satır metin
  exportCode() {
    flush();
    const json = JSON.stringify(state);
    return btoa(unescape(encodeURIComponent(json)));
  },
  importCode(code) {
    const json = decodeURIComponent(escape(atob(String(code).trim())));
    const s = JSON.parse(json);
    if (!s || typeof s !== 'object' || !s.colony) throw new Error('kod');
    state = merge(s);
    flush();
  },
  reset() {
    state = blank();
    flush();
  },
};
