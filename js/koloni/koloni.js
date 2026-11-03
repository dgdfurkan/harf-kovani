// Koloni: geçilen her bölüm kovanın takviminde 6 gün ilerletir (61 bölüm bir yıl).
// Mevsim, hava, arı sayısı, petek gözü, hikaye bölümü ve kovan haberi buradan çıkar.

import { save } from '../core/save.js';

export const DAYS_PER_LEVEL = 6;
const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const MEVSIM = { bahar: 'İlkbahar', yaz: 'Yaz', guz: 'Sonbahar', kis: 'Kış' };
const HAVA = { gunes: 'Güneşli', bulut: 'Bulutlu', yagmur: 'Yağmurlu', ruzgar: 'Rüzgârlı', kar: 'Karlı', sicak: 'Sıcak' };

// Gün sayısından her açılışta aynı çıkan hava
const hash = (n) => {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519) >>> 0;
  return (x >>> 0) / 4294967296;
};
const WEATHER = {
  bahar: [['gunes', 0.5], ['yagmur', 0.25], ['ruzgar', 0.15], ['bulut', 0.1]],
  yaz: [['gunes', 0.55], ['sicak', 0.3], ['bulut', 0.15]],
  guz: [['bulut', 0.35], ['yagmur', 0.3], ['ruzgar', 0.2], ['gunes', 0.15]],
  kis: [['kar', 0.5], ['bulut', 0.35], ['gunes', 0.15]],
};

export function koloni() {
  const s = save.data;
  const lv = save.levelsDone();
  const day = lv * DAYS_PER_LEVEL;
  const year = Math.floor(day / 365);
  const date = new Date(2025, 2, 1);
  date.setDate(date.getDate() + (day % 365));
  const month = date.getMonth();
  const season = month >= 2 && month <= 4 ? 'bahar' : month >= 5 && month <= 7 ? 'yaz' : month >= 8 && month <= 10 ? 'guz' : 'kis';
  let r = hash(day + 7);
  let weather = WEATHER[season][0][0];
  for (const [w, p] of WEATHER[season]) {
    if (r < p) { weather = w; break; }
    r -= p;
  }
  const factor = { bahar: 0.85, yaz: 1, guz: 0.7, kis: 0.42 }[season];
  const bees = Math.round(Math.min(60000, (2400 + lv * 380) * factor) / 50) * 50;
  const cells = Math.min(900, 60 + lv * 12);
  const hour = new Date().getHours();
  return {
    name: s.colony.name || 'Kovan',
    lv,
    day,
    year,
    date,
    dateText: `${date.getDate()} ${AY[month]}`,
    month,
    season,
    seasonName: MEVSIM[season],
    weather,
    weatherName: HAVA[weather],
    night: hour < 6 || hour >= 20,
    bees,
    cells,
    honeyKg: (s.stats.honey / 150).toFixed(1),
    boxes: 1 + Math.min(3, Math.floor(lv / 15)),
    bloom: { bahar: 1, yaz: 0.8, guz: 0.25, kis: 0 }[season],
    chapter: Math.floor(lv / 10),
  };
}

export const fmt = (n) => n.toLocaleString('tr-TR');

/* ---------- Hikaye bölümleri: her 10 bölümde bir ---------- */

const CHAPTERS = [
  null,
  { art: 'bahar', t: 'Bahar Patlaması', d: (k) => `Erikler, elmalar çiçek açtı. ${k.name} kolonisi büyüyor, kraliçe günde yüzlerce yumurta bırakıyor. Tarlacılar ilk polenleri taşıdı. Kovanına yeni bir kat eklendi.` },
  { art: 'yaz', t: 'Bal Akımı', d: (k) => `Ihlamur ve kekik çiçekte. ${k.name} tarlacıları sabahtan akşama nektar taşıyor, petekler balla doluyor. Sıcak günlerde girişteki arılar kanat çırpıp kovanı serinletiyor.` },
  { art: 'hasat', t: 'Hasat Günü', d: (k) => `Arıcı Hasan Amca geldi, dumanını tüttürdü. Kapakları kapanmış peteklerden bal aldı, kışlık balı kovanda bıraktı. "Bu koloni çok çalışkan" dedi, ${k.name} için bir kavanoz ayırdı.` },
  { art: 'guz', t: 'Kışa Hazırlık', d: (k) => `Yapraklar sararıp döküldü. Arılar girişi propolisle daralttı, kışlık stok tamam. ${k.name} kovanında herkes yerini aldı, uzun gecelere hazır.` },
  { art: 'kis', t: 'Kış Salkımı', d: (k) => `Dışarıda kar var. ${k.name} arıları kraliçenin çevresinde sıkı bir salkım oldu, kanat kaslarını titreterek ısınıyorlar. Bahara az kaldı, senin kelimelerin onları ayakta tutuyor.` },
  { art: 'yeniden', t: 'Yeniden Bahar', d: (k) => `Kardelenler açtı. ${k.name} bir kışı daha atlattı. Kraliçe yeniden yumurtlamaya başladı, kovanın önünde ilk uçuşlar var. Yeni bir yıl, daha büyük bir koloni.` },
];

export function chapterFor(index) {
  if (index <= 0) return null;
  const c = CHAPTERS[((index - 1) % 6) + 1];
  const year = Math.floor((index - 1) / 6);
  return { ...c, index, year, d: (k) => (year > 0 ? `${year + 1}. yılınız. ` : '') + c.d(k) };
}

// Henüz gösterilmemiş hikaye bölümü
export function pendingChapter() {
  const k = koloni();
  const seen = save.data.colony.chapter || 0;
  if (k.chapter > seen) return chapterFor(seen + 1);
  return null;
}
export function markChapter(index) {
  save.data.colony.chapter = Math.max(save.data.colony.chapter || 0, index);
  save.touch();
}

/* ---------- Kovan haberi: açılışta ve bölüm sonunda ---------- */

const LINES = {
  gece: (k) => `Gece oldu. ${k.name} kovanında tarlacılar dinleniyor, bakıcılar yavrulara bakıyor.`,
  bahar: {
    gunes: () => 'Hava güneşli, tarlacılar papatya ve erik çiçeklerinde.',
    yagmur: () => 'Yağmur yağıyor, arılar kovanda. Kelime toplamak için tam vakit.',
    ruzgar: () => 'Rüzgâr esiyor, arılar alçaktan uçup yakındaki çiçeklere gidiyor.',
    bulut: () => 'Bulutlu bir bahar günü. Kraliçe yeni gözlere yumurta bırakıyor.',
  },
  yaz: {
    gunes: () => 'Gökyüzü masmavi. Kovanın önünde nektar trafiği var.',
    sicak: () => 'Sıcak bir yaz günü. Girişteki arılar kanat çırpıp kovanı serinletiyor.',
    bulut: () => 'Hafif bulutlu. Arılar ıhlamur ağacının çevresinde vızıldıyor.',
  },
  guz: {
    bulut: () => 'Yapraklar sararıyor. Kovan kışlık balı biriktiriyor.',
    yagmur: () => 'Sonbahar yağmuru. Arılar kapakları kapanmış peteklerin üstünde.',
    ruzgar: () => 'Rüzgâr kuru yaprakları savuruyor, giriş propolisle daraltıldı.',
    gunes: () => 'Güzel bir güz günü. Son çiçeklerden polen taşınıyor.',
  },
  kis: {
    kar: () => 'Kovanın çatısında kar var. Arılar salkım halinde ısınıyor.',
    bulut: () => 'Soğuk ve bulutlu. Kovan sessiz, ama içerisi sıcacık.',
    gunes: () => 'Kışın güneşli bir günü. Birkaç arı temizlik uçuşuna çıktı.',
  },
};

export function news(k = koloni()) {
  if (k.night) return LINES.gece(k);
  const fn = (LINES[k.season] && LINES[k.season][k.weather]) || (() => 'Kovanda her şey yolunda.');
  return fn(k);
}

export const statLine = (k = koloni()) => `${fmt(k.bees)} arı, ${fmt(k.cells)} petek gözü, ${k.honeyKg.replace('.', ',')} kg bal`;

// Bölüm sonunda kolonideki değişim
export function growthLine(before, after) {
  const bees = after.bees - before.bees;
  const cells = after.cells - before.cells;
  const bits = [];
  if (cells > 0) bits.push(`${cells} yeni petek gözü`);
  if (bees > 0) bits.push(`${fmt(bees)} yeni arı`);
  if (bees < 0) bits.push('arılar mevsim gereği azaldı');
  return `${after.dateText}: ${bits.join(', ') || 'kovan sakin'}.`;
}

// Koloniye önerilen adlar
export const NAMES = ['Ihlamur', 'Kekik', 'Lavanta', 'Papatya', 'Gelincik', 'Akasya', 'Yonca', 'Kardelen', 'Menekşe', 'Ayçiçeği', 'Çiğdem', 'Defne'];
