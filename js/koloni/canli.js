// Sahnenin canlı katmanı: kovandan çıkıp açık çiçeklere giden, nektar emip geri dönen arılar;
// kelebekler, kuşlar, ateş böcekleri, kayan yıldız; yağmur, kar, yaprak, taç yaprağı ve çimen.
// SVG sahnenin üstünde bir tuvaldir, sahneyle aynı 400x240 koordinatları kullanır. Dokununca tepki verir.

import { Life, fitCanvas, rand, pick, clamp } from '../core/dom.js';
import { tone, buzz } from '../core/audio.js';

const INK = '#2a1636';
const TAU = Math.PI * 2;

export function liveScene(box, k, data) {
  const life = new Life();
  const cv = document.createElement('canvas');
  cv.className = 'h-live';
  box.append(cv);
  const stage = fitCanvas(cv, life);
  const E = data.entrance;
  const HIVE = data.hive;
  const heads = data.heads.length ? data.heads : [{ x: 118, y: 208 }, { x: 330, y: 206 }];
  const day = !k.night;
  const wet = k.weather === 'yagmur';
  const snowy = k.weather === 'kar';
  const windK = k.weather === 'ruzgar' ? 1 : 0.35;
  const groundY = (x) => 196 + Math.sin(x * 0.05) * 4 + (x % 37) * 0.6;

  /* ---------- Arılar ---------- */
  const beeCount = !day ? 0 : wet ? 1 : k.season === 'kis' ? (k.weather === 'gunes' ? 2 : 0) : clamp(Math.round(k.bees / 2200), 3, 16);
  const bees = [];
  const newBee = (st = 'in') => ({ x: E.x, y: E.y, vx: 0, vy: 0, st, t: rand(0, 3), tx: 0, ty: 0, ph: rand(0, TAU), sp: rand(42, 62), dir: 1 });
  for (let i = 0; i < beeCount; i++) bees.push(newBee());
  const sendOut = (b, target = null) => {
    if (b.st === 'in') { b.x = E.x + rand(-7, 7); b.y = E.y; }
    // Bazıları kovanın çevresinde tanıma uçuşu yapar
    const h = target || (Math.random() < 0.18 ? { x: E.x + rand(-60, 60), y: E.y - rand(20, 70), loop: true } : pick(heads));
    b.tx = h.x + rand(-2, 2);
    b.ty = h.y - 1.5;
    b.loop = !!h.loop;
    b.st = 'go';
  };

  /* ---------- Diğer canlılar ---------- */
  const flyers = [];
  if (day && !wet && (k.season === 'bahar' || k.season === 'yaz')) {
    const cols = ['#ff9ec4', '#8ad8ff', '#ffe27a', '#ffffff', '#b98bff'];
    for (let i = 0; i < (k.season === 'yaz' ? 3 : 2); i++) flyers.push({ x: rand(20, 380), y: rand(140, 210), tx: rand(20, 380), ty: rand(130, 215), c: cols[i % cols.length], ph: rand(0, TAU) });
  }
  const fireflies = [];
  if (!day && (k.season === 'yaz' || k.month === 4)) for (let i = 0; i < 16; i++) fireflies.push({ x: rand(10, 390), y: rand(150, 232), ph: rand(0, TAU), sp: rand(0.6, 1.4) });
  let birds = [];
  let birdT = rand(3, 9);
  let meteor = null;
  let meteorT = rand(6, 14);

  /* ---------- Hava ve doğa parçacıkları ---------- */
  const drops = wet ? Array.from({ length: 90 }, () => ({ x: rand(-20, 420), y: rand(-240, 240), v: rand(170, 230), g: rand(198, 238) })) : [];
  const splashes = [];
  const flakes = snowy || (k.season === 'kis' && k.weather === 'bulut') ? Array.from({ length: snowy ? 80 : 26 }, () => ({ x: rand(0, 400), y: rand(-240, 240), v: rand(10, 26), r: rand(0.8, 2.2), ph: rand(0, TAU) })) : [];
  const leaves = [];
  if (k.season === 'guz') for (let i = 0; i < (k.weather === 'ruzgar' ? 18 : 9); i++) leaves.push({ x: rand(0, 400), y: rand(-240, 230), v: rand(14, 30), r: rand(0, TAU), w: rand(-3, 3), c: pick(['#e08a2c', '#d9622b', '#f2b33d', '#b85a25']) });
  if (k.season === 'bahar' && day) for (let i = 0; i < 12; i++) leaves.push({ x: rand(30, 110), y: rand(60, 200), v: rand(8, 16), r: rand(0, TAU), w: rand(-2, 2), c: pick(['#ffd1e3', '#ffffff', '#ffc6db']), petal: true });
  const motes = day && k.season === 'yaz' && !wet ? Array.from({ length: 22 }, () => ({ x: rand(0, 400), y: rand(130, 225), ph: rand(0, TAU) })) : [];
  const pollen = [];
  const sparks = [];
  const grassCol = { bahar: '#5fb048', yaz: '#7aa83a', guz: '#b8923f', kis: '#cfd8e2' }[k.season];
  const blades = Array.from({ length: 96 }, (_, i) => ({ x: (i / 96) * 404 - 2 + rand(-2, 2), h: rand(5, k.season === 'kis' ? 6 : 13), ph: rand(0, TAU) }));

  /* ---------- Dokunma ---------- */
  my(cv, 'pointerdown', (e) => {
    const r = cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 400;
    const y = ((e.clientY - r.top) / r.height) * 240;
    for (let i = 0; i < 10; i++) sparks.push({ x, y, vx: rand(-40, 40), vy: rand(-50, 10), t: 0.6 });
    if (x > HIVE.x0 && x < HIVE.x1 && y > HIVE.y0 && y < HIVE.y1) {
      // Kovana dokununca arılar telaşla dışarı çıkar
      const n = day ? 6 : 2;
      for (let i = 0; i < n; i++) {
        const b = newBee();
        b.burst = true;
        sendOut(b, day ? null : { x: E.x + rand(-20, 20), y: E.y - rand(6, 20), loop: true });
        b.vx = rand(-60, 60);
        b.vy = rand(-70, -20);
        bees.push(b);
      }
      tone({ type: 'sawtooth', f: 180, f2: 220, dur: 0.35, vol: 0.03 });
      buzz(14);
      return;
    }
    let best = null;
    let bd = 26;
    for (const h of heads) {
      const d = Math.hypot(h.x - x, h.y - y);
      if (d < bd) { bd = d; best = h; }
    }
    if (best && day) {
      const b = bees.find((q) => q.st === 'in') || (bees.length < 24 ? (bees.push(newBee()), bees[bees.length - 1]) : bees[0]);
      sendOut(b, best);
      tone({ type: 'sine', f: 660, f2: 880, dur: 0.12, vol: 0.04 });
      return;
    }
    if (y < 110) {
      if (day) birds.push(...flock(x < 200 ? -1 : 1));
      else meteor = { x: x - 30, y, t: 0 };
      tone({ type: 'triangle', f: 880, f2: 1320, dur: 0.12, vol: 0.035 });
    }
  });
  function my(t, ev, fn) { life.on(t, ev, fn); }
  function flock(side = -1) {
    const y = rand(26, 84);
    const n = Math.random() < 0.5 ? 1 : 3;
    return Array.from({ length: n }, (_, i) => ({ x: side < 0 ? -20 - i * 12 : 420 + i * 12, y: y + i * 6, v: (side < 0 ? 1 : -1) * rand(48, 64), ph: rand(0, TAU) }));
  }

  /* ---------- Çizim yardımcıları ---------- */
  const drawBee = (g, b, time) => {
    const a = Math.atan2(b.vy, b.vx);
    const flip = Math.cos(a) < 0 ? -1 : 1;
    g.save();
    g.translate(b.x, b.y);
    g.scale(flip, 1);
    g.rotate(flip < 0 ? Math.PI - a : a);
    const f = Math.abs(Math.sin(time * 0.06 + b.ph));
    g.fillStyle = 'rgba(255,255,255,.85)';
    g.beginPath();
    g.ellipse(-0.6, -2.4, 2.4, 1.2 + f * 0.9, -0.5, 0, TAU);
    g.ellipse(1, -2.2, 2, 1 + f * 0.7, 0.3, 0, TAU);
    g.fill();
    g.fillStyle = '#ffcd3c';
    g.beginPath();
    g.ellipse(0, 0, 3.1, 2.1, 0, 0, TAU);
    g.fill();
    g.lineWidth = 0.8;
    g.strokeStyle = INK;
    g.stroke();
    g.fillStyle = INK;
    g.fillRect(-0.9, -1.9, 0.9, 3.8);
    g.fillRect(0.8, -1.7, 0.8, 3.4);
    g.beginPath();
    g.arc(2.9, -0.2, 1.1, 0, TAU);
    g.fill();
    g.restore();
  };

  life.raf((dt, time) => {
    const { W, g } = stage;
    stage.begin();
    const sc = W / 400;
    g.save();
    g.scale(sc, sc);
    const t = time / 1000;

    // Kayan yıldız
    if (!day) {
      meteorT -= dt;
      if (meteorT <= 0 && !meteor) { meteor = { x: rand(40, 300), y: rand(10, 60), t: 0 }; meteorT = rand(10, 24); }
    }
    if (meteor) {
      meteor.t += dt;
      const p = meteor.t / 0.9;
      if (p >= 1) meteor = null;
      else {
        const x = meteor.x + p * 90;
        const y = meteor.y + p * 36;
        const gr = g.createLinearGradient(x - 26, y - 10, x, y);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(1, `rgba(255,255,255,${1 - p})`);
        g.strokeStyle = gr;
        g.lineWidth = 1.4;
        g.beginPath();
        g.moveTo(x - 26, y - 10.4);
        g.lineTo(x, y);
        g.stroke();
      }
    }

    // Kuşlar
    if (day && !wet && k.season !== 'kis') {
      birdT -= dt;
      if (birdT <= 0) { birds.push(...flock(Math.random() < 0.5 ? -1 : 1)); birdT = rand(9, 22); }
    }
    birds = birds.filter((b) => {
      b.x += b.v * dt;
      b.y += Math.sin(t * 2 + b.ph) * 4 * dt;
      const w = Math.sin(t * 12 + b.ph) * 2.6;
      g.strokeStyle = 'rgba(42,22,54,.7)';
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(b.x - 5, b.y - w);
      g.quadraticCurveTo(b.x - 2, b.y - 1, b.x, b.y);
      g.quadraticCurveTo(b.x + 2, b.y - 1, b.x + 5, b.y - w);
      g.stroke();
      return b.x > -40 && b.x < 440;
    });

    // Yaz havası: uçuşan polen tozları
    for (const m of motes) {
      m.x += Math.sin(t * 0.7 + m.ph) * 6 * dt + windK * 4 * dt;
      m.y += Math.cos(t * 0.9 + m.ph) * 4 * dt;
      if (m.x > 404) m.x = -4;
      g.fillStyle = `rgba(255,230,120,${0.35 + Math.sin(t * 3 + m.ph) * 0.3})`;
      g.fillRect(m.x, m.y, 1.4, 1.4);
    }

    // Kelebekler
    for (const f of flyers) {
      const dx = f.tx - f.x;
      const dy = f.ty - f.y;
      const d = Math.hypot(dx, dy);
      if (d < 4) { f.tx = rand(20, 380); f.ty = rand(120, 215); }
      f.x += (dx / (d || 1)) * 22 * dt + Math.sin(t * 5 + f.ph) * 10 * dt;
      f.y += (dy / (d || 1)) * 22 * dt + Math.cos(t * 7 + f.ph) * 12 * dt;
      const w = Math.abs(Math.sin(t * 16 + f.ph));
      g.fillStyle = f.c;
      g.strokeStyle = INK;
      g.lineWidth = 0.6;
      for (const s of [-1, 1]) {
        g.beginPath();
        g.ellipse(f.x + s * 2.4 * w, f.y - 1, 2.6 * w + 0.4, 3.2, s * 0.4, 0, TAU);
        g.fill();
        g.stroke();
      }
      g.fillStyle = INK;
      g.fillRect(f.x - 0.4, f.y - 2.6, 0.8, 4.6);
    }

    // Arılar
    for (let i = bees.length - 1; i >= 0; i--) {
      const b = bees[i];
      if (b.st === 'in') {
        b.t -= dt;
        if (b.t <= 0) {
          if (b.burst || bees.length > beeCount + 8) { bees.splice(i, 1); continue; }
          sendOut(b);
        }
        continue;
      }
      if (b.st === 'sip') {
        // Çiçekte nektar emer, polen saçar
        b.t -= dt;
        b.x = b.tx + Math.sin(time / 110 + b.ph) * 1.1;
        b.y = b.ty + Math.cos(time / 140 + b.ph) * 0.7;
        b.vx = Math.cos(time / 300 + b.ph);
        b.vy = 0;
        if (Math.random() < dt * 4) pollen.push({ x: b.x + rand(-2, 2), y: b.y + 2, vy: rand(4, 10), t: 0.8 });
        if (b.t <= 0) { b.st = 'home'; b.tx = E.x + rand(-4, 4); b.ty = E.y; }
      } else {
        const dx = b.tx - b.x;
        const dy = b.ty - b.y;
        const d = Math.hypot(dx, dy) || 1;
        const sp = b.sp * (d < 18 ? 0.45 + (0.55 * d) / 18 : 1);
        const wob = Math.sin(time / 170 + b.ph) * 0.55;
        const nx = dx / d;
        const ny = dy / d;
        const k2 = Math.min(1, dt * 3.2);
        b.vx += ((nx - ny * wob) * sp - b.vx) * k2;
        b.vy += ((ny + nx * wob) * sp - b.vy) * k2;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (d < 3) {
          if (b.st === 'go') {
            if (b.loop) { b.st = 'home'; b.tx = E.x; b.ty = E.y; } else { b.st = 'sip'; b.t = rand(1.2, 3.2); }
          } else { b.st = 'in'; b.t = rand(0.8, 3.6); continue; }
        }
      }
      drawBee(g, b, time);
    }
    // Gece kapıda nöbetçi arı
    if (!day || beeCount === 0) {
      drawBee(g, { x: E.x + Math.sin(t * 0.8) * 5, y: E.y + 2.2, vx: Math.cos(t * 0.8), vy: 0, ph: 0 }, time);
    }

    // Polen ve kıvılcımlar
    for (let i = pollen.length - 1; i >= 0; i--) {
      const p = pollen[i];
      p.t -= dt;
      p.y += p.vy * dt;
      if (p.t <= 0) { pollen.splice(i, 1); continue; }
      g.fillStyle = `rgba(255,205,60,${p.t})`;
      g.fillRect(p.x, p.y, 1.3, 1.3);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
      if (p.t <= 0) { sparks.splice(i, 1); continue; }
      g.fillStyle = `rgba(255,236,150,${p.t / 0.6})`;
      g.beginPath();
      g.arc(p.x, p.y, 1.4, 0, TAU);
      g.fill();
    }

    // Ateş böcekleri
    for (const f of fireflies) {
      f.x += Math.sin(t * f.sp + f.ph) * 8 * dt;
      f.y += Math.cos(t * f.sp * 1.3 + f.ph) * 6 * dt;
      const a = Math.max(0, Math.sin(t * 2.2 * f.sp + f.ph));
      g.fillStyle = `rgba(214,255,120,${a * 0.22})`;
      g.beginPath();
      g.arc(f.x, f.y, 4, 0, TAU);
      g.fill();
      g.fillStyle = `rgba(240,255,170,${a})`;
      g.beginPath();
      g.arc(f.x, f.y, 1.1, 0, TAU);
      g.fill();
    }

    // Yaprak ve taç yaprakları
    for (const l of leaves) {
      l.y += l.v * dt;
      l.x += (Math.sin(t * 1.4 + l.r) * 10 + windK * 14 + l.w) * dt;
      l.r += dt * 2.2;
      if (l.y > groundY(l.x) + 8 || l.x > 410) {
        l.y = l.petal ? rand(60, 110) : rand(-30, -4);
        l.x = l.petal ? rand(30, 110) : rand(-20, 380);
      }
      g.save();
      g.translate(l.x, l.y);
      g.rotate(l.r);
      g.scale(1, Math.abs(Math.sin(l.r * 1.3)) * 0.7 + 0.3);
      g.fillStyle = l.c;
      g.beginPath();
      g.ellipse(0, 0, l.petal ? 1.8 : 3, l.petal ? 1.2 : 1.8, 0, 0, TAU);
      g.fill();
      g.restore();
    }

    // Yağmur ve sıçrayan damlalar
    if (drops.length) {
      g.strokeStyle = 'rgba(235,245,255,.75)';
      g.lineWidth = 1;
      g.beginPath();
      for (const d of drops) {
        d.y += d.v * dt;
        d.x -= d.v * 0.25 * dt;
        if (d.y > d.g) {
          if (splashes.length < 40) splashes.push({ x: d.x, y: d.g, t: 0 });
          d.y = rand(-40, -4);
          d.x = rand(-10, 430);
          d.g = rand(196, 238);
        }
        g.moveTo(d.x, d.y);
        g.lineTo(d.x - 2, d.y + 7);
      }
      g.stroke();
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.t += dt;
        if (s.t > 0.3) { splashes.splice(i, 1); continue; }
        g.strokeStyle = `rgba(235,245,255,${0.7 - s.t * 2.2})`;
        g.beginPath();
        g.ellipse(s.x, s.y, 1 + s.t * 14, 0.5 + s.t * 3, 0, 0, TAU);
        g.stroke();
      }
    }

    // Kar
    if (flakes.length) {
      g.fillStyle = 'rgba(255,255,255,.92)';
      g.beginPath();
      for (const f of flakes) {
        f.y += f.v * dt;
        f.x += (Math.sin(t + f.ph) * 8 + windK * 6) * dt;
        if (f.y > groundY(f.x) + 10) { f.y = rand(-20, -2); f.x = rand(-10, 410); }
        g.moveTo(f.x + f.r, f.y);
        g.arc(f.x, f.y, f.r, 0, TAU);
      }
      g.fill();
    }

    // Rüzgârda sallanan çimen
    g.strokeStyle = grassCol;
    g.lineWidth = 1.3;
    g.beginPath();
    for (const bl of blades) {
      const sway = Math.sin(t * 1.7 + bl.x * 0.045 + bl.ph * 0.3) * (1.2 + windK * 3);
      g.moveTo(bl.x, 241);
      g.quadraticCurveTo(bl.x + sway * 0.4, 241 - bl.h * 0.6, bl.x + sway, 241 - bl.h);
    }
    g.stroke();
    g.restore();
    return undefined;
  });

  return { dispose: () => { life.dispose(); cv.remove(); } };
}
