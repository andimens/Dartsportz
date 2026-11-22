'use strict';
/* ================= STORE ================= */
const LS_KEY = 'dartsportz_v1';
let mem = null;
const DEFAULT_SETTINGS = { anim: 'normal', sound: true, volume: 0.8, caller: 'de', callEach: false, voiceEngine: 'pro', botVoice: true, zoom: true, voiceDe: '', voiceEn: '', vibrate: true, boardSounds: {}, input: 'pad' };
function loadStore() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) {}
  d = d || {};
  d.players = d.players || [];
  d.teams = d.teams || [];
  d.matches = d.matches || [];
  d.training = d.training || [];
  d.career = d.career || { best: 0, results: {} };
  d.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings || {});
  if (d.settings.voiceEngine === 'ai') d.settings.voiceEngine = 'pro';
  d.me = d.me || null;
  d.boardRot = d.boardRot || {};
  return d;
}
const S = loadStore();
let saveT = null;
function save(now) {
  clearTimeout(saveT);
  const w = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { toast('Speicher voll – bitte Fotos reduzieren'); } };
  if (now) w(); else saveT = setTimeout(w, 150);
}

/* ================= UTILS ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (v, d = 2) => (isFinite(v) ? v : 0).toFixed(d);
function toast(msg, ms = 1800) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), ms);
}
function vibrate(ms = 12) { if (S.settings.vibrate && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }
function modal(html, onMount) {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal"><div class="grab"></div>${html}</div>`;
  const close = () => bg.remove();
  bg.addEventListener('click', e => { if (e.target === bg) close(); });
  document.body.appendChild(bg);
  onMount && onMount(bg.firstElementChild, close);
  return close;
}
function confirmBox(text, yes = 'Ja', no = 'Abbrechen') {
  return new Promise(res => {
    modal(`<h2 class="bb">${esc(text)}</h2><div class="grid2"><button class="btn sec" data-n>${no}</button><button class="btn" data-y>${yes}</button></div>`, (m, close) => {
      m.querySelector('[data-n]').onclick = () => { close(); res(false); };
      m.querySelector('[data-y]').onclick = () => { close(); res(true); };
    });
  });
}
function resizeImage(file, max = 640, q = 0.72) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', q));
      };
      img.onerror = rej; img.src = r.result;
    };
    r.onerror = rej; r.readAsDataURL(file);
  });
}
function pickFile(accept = 'image/*') {
  return new Promise(res => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = accept;
    i.onchange = () => res(i.files[0] || null); i.click();
  });
}

/* ================= COUNTRIES ================= */
const COUNTRIES = [['DE','Deutschland'],['AT','Österreich'],['CH','Schweiz'],['NL','Niederlande'],['BE','Belgien'],['GB','Großbritannien'],['IE','Irland'],['FR','Frankreich'],['ES','Spanien'],['IT','Italien'],['PT','Portugal'],['PL','Polen'],['CZ','Tschechien'],['DK','Dänemark'],['SE','Schweden'],['NO','Norwegen'],['FI','Finnland'],['LU','Luxemburg'],['HU','Ungarn'],['HR','Kroatien'],['RS','Serbien'],['GR','Griechenland'],['TR','Türkei'],['RO','Rumänien'],['BG','Bulgarien'],['LT','Litauen'],['LV','Lettland'],['EE','Estland'],['UA','Ukraine'],['RU','Russland'],['KZ','Kasachstan'],['US','USA'],['CA','Kanada'],['AU','Australien'],['NZ','Neuseeland'],['ZA','Südafrika'],['JP','Japan'],['PH','Philippinen'],['BR','Brasilien']];
const flag = cc => cc ? cc.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0))) : '';

/* ================= BOARDS ================= */
const SEG_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const R = { db: 6.35, sb: 15.9, ti: 99, to: 107, di: 162, do: 170 };
// Optische Nachbildungen (eigene Darstellung, keine Original-Logos)
const BOARDS = [
  { id: 'winmau-blade-x', name: 'Winmau Blade X', brand: 'Winmau', c: { blk: '#141414', wht: '#efe3c4', red: '#e3262b', grn: '#1f9a4a', ring: '#0b0b0b', num: '#f5f5f5', wire: '#9aa0a6' }, wireW: .35, numFont: 'Bebas Neue', sound: 'satt' },
  { id: 'winmau-blade-6', name: 'Winmau Blade 6', brand: 'Winmau', c: { blk: '#161616', wht: '#f0e2c0', red: '#e1272c', grn: '#1e9d4b', ring: '#0d0d0d', num: '#f2f2f2', wire: '#b8bcc0' }, wireW: .45, numFont: 'Bebas Neue', sound: 'satt' },
  { id: 'winmau-blade-6-tc', name: 'Winmau Blade 6 Triple Core', brand: 'Winmau', c: { blk: '#121212', wht: '#eadcbb', red: '#d92429', grn: '#1b9447', ring: '#0a0a0a', num: '#ffffff', wire: '#c0c4c8' }, wireW: .45, numFont: 'Bebas Neue', sound: 'dumpf' },
  { id: 'winmau-blade-5', name: 'Winmau Blade 5 Dual Core', brand: 'Winmau', c: { blk: '#1a1a1a', wht: '#f1e4c6', red: '#d8262a', grn: '#20994b', ring: '#111', num: '#ececec', wire: '#c9ccd0' }, wireW: .6, numFont: 'Arial', sound: 'dumpf' },
  { id: 'winmau-blade-4', name: 'Winmau Blade 4', brand: 'Winmau', c: { blk: '#1b1b1b', wht: '#f2e6c9', red: '#d12a2c', grn: '#239a4f', ring: '#121212', num: '#e8e8e8', wire: '#cfd2d5' }, wireW: .7, numFont: 'Arial', sound: 'weich' },
  { id: 'winmau-diamond-plus', name: 'Winmau Diamond Plus', brand: 'Winmau', c: { blk: '#1c1c1c', wht: '#f3e8cc', red: '#cc2a2a', grn: '#258f4c', ring: '#151515', num: '#e5e5e5', wire: '#d6d8da' }, wireW: .9, numFont: 'Arial', sound: 'weich' },
  { id: 'target-tor', name: 'Target Tor', brand: 'Target', c: { blk: '#171717', wht: '#f1e5c9', red: '#dc2026', grn: '#2fb24c', ring: '#1d1d1f', num: '#d9d9d9', wire: '#a7abaf' }, wireW: .4, numFont: 'Bebas Neue', sound: 'hell', segRing: true },
  { id: 'unicorn-eclipse-pro', name: 'Unicorn Eclipse Pro', brand: 'Unicorn', c: { blk: '#151515', wht: '#efe2c2', red: '#e02a2f', grn: '#18924a', ring: '#0c0c0c', num: '#ffffff', wire: '#b3b7bb' }, wireW: .5, numFont: 'Arial Black', sound: 'hell' },
  { id: 'unicorn-eclipse-ultra', name: 'Unicorn Eclipse Ultra', brand: 'Unicorn', c: { blk: '#131313', wht: '#ecdfbe', red: '#e52a30', grn: '#159047', ring: '#090909', num: '#ffffff', wire: '#aeb2b6' }, wireW: .45, numFont: 'Arial Black', sound: 'metallisch' },
  { id: 'klassik', name: 'Klassik Standard', brand: 'Standard', c: { blk: '#1f1f1f', wht: '#f4e9cf', red: '#c62828', grn: '#2e7d32', ring: '#181818', num: '#e0e0e0', wire: '#d9d9d9' }, wireW: 1.1, numFont: 'Arial', sound: 'weich' },
];
const boardById = id => BOARDS.find(b => b.id === id) || BOARDS[0];

function polar(r, deg) { const a = (deg - 90) * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; }
function arcPath(r1, r2, a1, a2) {
  const [x1, y1] = polar(r2, a1), [x2, y2] = polar(r2, a2), [x3, y3] = polar(r1, a2), [x4, y4] = polar(r1, a1);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${r2} ${r2} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}L${x3.toFixed(2)} ${y3.toFixed(2)}A${r1} ${r1} 0 0 0 ${x4.toFixed(2)} ${y4.toFixed(2)}Z`;
}
// opts: {heat:{key:count}, max, highlight:'double'|'treble'|'bull'|null, numbers:true}
function boardSVG(board, opts = {}) {
  const c = board.c; const w = board.wireW;
  let s = `<svg class="board${opts.heat ? ' hm' : ''}" viewBox="-230 -230 460 460" xmlns="http://www.w3.org/2000/svg">`;
  s += `<circle r="228" fill="${c.ring}"/>`;
  if (board.segRing) for (let i = 0; i < 20; i++) s += `<path d="${arcPath(196, 226, i * 18 - 8, i * 18 + 8)}" fill="#2a2a2d"/>`;
  s += `<circle r="${R.do + 1}" fill="${c.blk}"/>`;
  const heat = opts.heat, hmax = opts.max || 1;
  const hc = (k, base) => { if (!heat) return base; const v = (heat[k] || 0) / hmax; return v <= 0 ? '#2a2a2e' : `rgb(${Math.round(60 + 195 * v)},${Math.round(60 + 47 * v)},${Math.round(60 - 60 * v)})`; };
  for (let i = 0; i < 20; i++) {
    const n = SEG_ORDER[i], a1 = i * 18 - 9, a2 = i * 18 + 9, even = i % 2 === 0;
    const base = even ? c.blk : c.wht, ring = even ? c.red : c.grn;
    s += `<path d="${arcPath(R.to, R.di, a1, a2)}" fill="${hc('S' + n, base)}"/>`;
    s += `<path d="${arcPath(R.sb, R.ti, a1, a2)}" fill="${hc('S' + n, base)}"/>`;
    s += `<path class="rt" d="${arcPath(R.ti, R.to, a1, a2)}" fill="${hc('T' + n, ring)}"/>`;
    s += `<path class="rd" d="${arcPath(R.di, R.do, a1, a2)}" fill="${hc('D' + n, ring)}"/>`;
    if (opts.numbers !== false) {
      const [x, y] = polar(204, i * 18);
      s += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${c.num}" font-size="${board.numFont === 'Bebas Neue' ? 30 : 24}" font-family="${board.numFont},Arial,sans-serif" font-weight="${board.numFont === 'Arial Black' ? 900 : 700}" text-anchor="middle" dominant-baseline="central" transform="rotate(${i * 18 > 90 && i * 18 < 270 ? i * 18 - 180 : i * 18} ${x.toFixed(1)} ${y.toFixed(1)})">${n}</text>`;
    }
  }
  s += `<circle class="rb" r="${R.sb}" fill="${hc('B25', c.grn)}"/><circle class="rbb" r="${R.db}" fill="${hc('B50', c.red)}"/>`;
  // wires
  const wc = c.wire;
  s += `<g fill="none" stroke="${wc}" stroke-width="${w}" opacity=".9">`;
  for (const r of [R.db, R.sb, R.ti, R.to, R.di, R.do]) s += `<circle r="${r}"/>`;
  for (let i = 0; i < 20; i++) { const [x1, y1] = polar(R.sb, i * 18 + 9), [x2, y2] = polar(R.do, i * 18 + 9); s += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`; }
  s += `</g>`;
  if (opts.highlight) {
    const hl = { double: [R.di, R.do], treble: [R.ti, R.to], bull: [0, R.sb], single: [R.sb, R.di] }[opts.highlight];
    if (hl) s += `<path class="pulse" d="M0 ${-hl[1]}A${hl[1]} ${hl[1]} 0 1 1 0 ${hl[1]}A${hl[1]} ${hl[1]} 0 1 1 0 ${-hl[1]}${hl[0] ? `M0 ${-hl[0]}A${hl[0]} ${hl[0]} 0 1 0 0 ${hl[0]}A${hl[0]} ${hl[0]} 0 1 0 0 ${-hl[0]}` : ''}Z" fill="#ff6b00" fill-rule="evenodd" opacity=".85"/>`;
  }
  if (heat) s += `<circle r="200" fill="none"/>`;
  s += `<g class="stuck"></g></svg>`;
  return s;
}
// Treffer aus Koordinaten (mm, y nach unten)
function hitAt(x, y) {
  const r = Math.hypot(x, y);
  if (r <= R.db) return { n: 25, m: 2 };
  if (r <= R.sb) return { n: 25, m: 1 };
  if (r > R.do) return { n: 0, m: 0 };
  const d = (Math.atan2(x, -y) * 180 / Math.PI + 369) % 360;
  const n = SEG_ORDER[Math.floor(d / 18)];
  if (r >= R.ti && r <= R.to) return { n, m: 3 };
  if (r >= R.di) return { n, m: 2 };
  return { n, m: 1 };
}
// Zielpunkt für ein Segment (zufällig im Feld)
function pointFor(n, m, exact) {
  if (n === 25) { const rr = m === 2 ? Math.random() * 5 : 8 + Math.random() * 6; const a = Math.random() * 360; return polar(exact ? 0 : rr, a); }
  if (n === 0) { return polar(176 + Math.random() * 18, Math.random() * 360); }
  const i = SEG_ORDER.indexOf(n);
  const a = i * 18 + (exact ? 0 : (Math.random() - .5) * 12);
  let r;
  if (m === 3) r = exact ? 103 : 100.5 + Math.random() * 5;
  else if (m === 2) r = exact ? 166 : 163.5 + Math.random() * 5;
  else r = exact ? 134 : (Math.random() < .7 ? 112 + Math.random() * 46 : 22 + Math.random() * 72);
  return polar(r, a);
}

/* ================= SOUND ================= */
const SOUND_PRESETS = {
  satt: { label: 'Satt (kräftig, kurz)', thud: 150, noise: 2600, q: 1.2, dec: .09, click: .55 },
  dumpf: { label: 'Dumpf (tief, weich)', thud: 105, noise: 1500, q: .8, dec: .12, click: .3 },
  hell: { label: 'Hell (knackig)', thud: 220, noise: 4200, q: 1.6, dec: .06, click: .8 },
  metallisch: { label: 'Metallisch (Draht-Kling)', thud: 180, noise: 5200, q: 6, dec: .14, click: .9, ring: 2400 },
  weich: { label: 'Weich (Kork-artig)', thud: 120, noise: 1100, q: .7, dec: .1, click: .2 },
};
let AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
const customSounds = {};
// Aufprall-Sound: einmal sauber vorberechnet (weich, ohne Übersteuern)
const IMPACT_BUFS = {};
function impactBuffer(a, key, p, miss) {
  const k = key + (miss ? ':m' : ''); if (IMPACT_BUFS[k]) return IMPACT_BUFS[k];
  const sr = a.sampleRate, len = Math.floor(sr * 0.22), buf = a.createBuffer(1, len, sr), d = buf.getChannelData(0);
  const f0 = miss ? p.thud * .7 : p.thud, tauB = p.dec * .55, tauN = miss ? .02 : .009;
  const lp = Math.exp(-2 * Math.PI * Math.min(p.noise, 4500) * (miss ? .3 : .55) / sr);
  let ph = 0, n1 = 0, n2 = 0, seed = 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x3fffffff - 1; };
  for (let i = 0; i < len; i++) {
    const t = i / sr, att = Math.min(1, t / .0018);
    const f = f0 * (1 + .9 * Math.exp(-t / .012)); ph += 2 * Math.PI * f / sr;
    const body = Math.sin(ph) * Math.exp(-t / tauB) * .75;
    n1 = n1 * lp + rnd() * (1 - lp); n2 = n2 * lp + n1 * (1 - lp); // 2-pol Tiefpass gegen Kratzen
    const thock = n2 * 6 * Math.exp(-t / tauN) * p.click;
    const ring = p.ring && !miss ? Math.sin(2 * Math.PI * p.ring * t) * Math.exp(-t / .06) * .06 : 0;
    d[i] = att * (body + thock + ring) * (miss ? .55 : 1);
  }
  let peak = 0; for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
  const norm = .8 / (peak || 1); for (let i = 0; i < len; i++) d[i] *= norm;
  for (let i = len - 400; i < len; i++) d[i] *= (len - i) / 400; // sauberes Ausklingen
  return (IMPACT_BUFS[k] = buf);
}
function impact(boardId, miss) {
  if (!S.settings.sound) return;
  const a = ac(); if (!a) return;
  const vol = S.settings.volume;
  const bs = S.settings.boardSounds[boardId];
  if (bs && bs.startsWith('data:')) { playData(bs, vol); return; }
  const key = bs || boardById(boardId).sound; const p = SOUND_PRESETS[key] || SOUND_PRESETS.satt;
  const src = a.createBufferSource(); src.buffer = impactBuffer(a, key, p, miss);
  src.playbackRate.value = 0.97 + Math.random() * .06;
  const g = a.createGain(); g.gain.value = vol * .9; src.connect(g); g.connect(a.destination); src.start();
}
function playData(url, vol) {
  const a = ac(); if (!a) return;
  const go = buf => { const s = a.createBufferSource(); s.buffer = buf; const g = a.createGain(); g.gain.value = vol; s.connect(g); g.connect(a.destination); s.start(); };
  if (customSounds[url]) return go(customSounds[url]);
  fetch(url).then(r => r.arrayBuffer()).then(b => a.decodeAudioData(b)).then(buf => { customSounds[url] = buf; go(buf); }).catch(() => {});
}
function chime(up = true) {
  if (!S.settings.sound) return; const a = ac(); if (!a) return; const t = a.currentTime;
  [0, .09, .18].forEach((dt, i) => { const o = a.createOscillator(); o.type = 'triangle'; o.frequency.value = (up ? [523, 659, 784] : [392, 330, 262])[i]; const g = a.createGain(); g.gain.setValueAtTime(.0001, t + dt); g.gain.exponentialRampToValueAtTime(.15 * S.settings.volume, t + dt + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dt + .3); o.connect(g); g.connect(a.destination); o.start(t + dt); o.stop(t + dt + .32); });
}

/* ================= ANSAGER ================= */
let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch (e) {} }
try { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {}
function voicesFor(lang) { return voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(lang)); }
function voiceScore(v) { const n = (v.name + ' ' + (v.voiceURI || '')).toLowerCase(); let s = 0; if (/premium/.test(n)) s += 50; if (/enhanced|erweitert|verbessert/.test(n)) s += 40; if (/siri/.test(n)) s += 35; if (/neural|natural|online/.test(n)) s += 30; if (/google/.test(n)) s += 20; if (/compact|kompakt|espeak/.test(n)) s -= 30; if (/(grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|bad news)/.test(n)) s -= 100; return s; }
function bestVoice(lang) { const key = lang === 'en' ? 'voiceEn' : 'voiceDe'; const list = voicesFor(lang); const chosen = S.settings[key] && list.find(v => v.voiceURI === S.settings[key]); if (chosen) return chosen; return list.sort((a, b) => voiceScore(b) - voiceScore(a))[0]; }
function playBuf(buf, rate) { return new Promise(res => { const a = ac(); const s = a.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate || 1; const g = a.createGain(); g.gain.value = Math.min(1, S.settings.volume * 1.3); s.connect(g); g.connect(a.destination); s.onended = res; s.start(); setTimeout(res, buf.duration * 1000 / (rate || 1) + 300); }); }
/* ---------- Profi-Ansager: vorab aufgenommene Clips (ElevenLabs) ---------- */
const PRO = { man: {}, bufs: new Map(), q: Promise.resolve(), tok: 0 };
async function proManifest(lang) {
  if (PRO.man[lang] !== undefined) return PRO.man[lang];
  try { const r = await fetch(`audio/${lang}/manifest.json`, { cache: 'no-cache' }); PRO.man[lang] = r.ok ? await r.json() : null; } catch (e) { PRO.man[lang] = null; }
  return PRO.man[lang];
}
async function proBuf(lang, key) {
  const k = lang + '/' + key; if (PRO.bufs.has(k)) return PRO.bufs.get(k);
  const r = await fetch(`audio/${lang}/${key}.mp3`); if (!r.ok) throw new Error('fehlt'); const b = await ac().decodeAudioData(await r.arrayBuffer());
  PRO.bufs.set(k, b); return b;
}
function proPlay(lang, keys, opts = {}) {
  if (opts.flush) PRO.tok++; const tok = PRO.tok;
  const ps = keys.map(k => proBuf(lang, k)); ps.forEach(p => p.catch(() => {}));
  PRO.q = PRO.q.then(async () => { for (const p of ps) { if (tok !== PRO.tok) return; try { await playBuf(await p, 1); } catch (e) {} } });
}
const CALL_NAMES = ["Harm", "Daniel", "Andreas", "Andi", "Vero", "Benny", "Tan", "Peter", "Anna", "Mary", "Levi", "Sephora", "Rahel", "Zeki", "Alex", "Ben", "Chris", "David", "Dennis", "Dominik", "Eric", "Felix", "Florian", "Jan", "Jonas", "Julian", "Kevin", "Lukas", "Marcel", "Marco", "Mario", "Markus", "Martin", "Max", "Michael", "Nico", "Niklas", "Patrick", "Paul", "Phil", "Robin", "Sascha", "Sebastian", "Simon", "Stefan", "Sven", "Thomas", "Tim", "Tobias", "Tom", "Kai", "Mike", "Leon", "Elias", "Noah", "Finn", "Luca", "Emre", "Can", "Mehmet", "Ali", "Murat", "Julia", "Lisa", "Laura", "Lena", "Sarah", "Lea", "Marie", "Sophie", "Hannah", "Nina", "Jana", "Katharina", "Melanie", "Sandra", "Jessica", "Michelle", "Vanessa", "Svenja", "Tina", "Kim", "Mia", "Emma", "Lara", "Selin", "Ayse"];
const callSlug = s => String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');
function callKeyOf(x) {
  if (!x) return null;
  if (typeof x === 'object') { const c = x.callName || (x.dart && x.dart.callName); if (c) return 'n_' + c; return 'n_' + callSlug((x.nick || x.name || '').split(' ')[0]); }
  return 'n_' + callSlug(String(x).split(/[ ·]/)[0]);
}
// Caller-Namen auswählen (mit Hörprobe)
function pickCallName(p, done) {
  const cur = p.callName || (p.dart && p.dart.callName) || callSlug(p.name);
  modal(`<h2 class="bb">Wie soll der Caller dich nennen?</h2><p class="mut sm" style="text-align:center">Tippe einen Namen zum Anhören, dann „Übernehmen“.</p><input id="cnf" type="text" placeholder="Suchen …" style="margin-bottom:10px"><div id="cnl" style="display:flex;flex-wrap:wrap;gap:8px;max-height:46vh;overflow:auto"></div><div style="height:12px"></div><button class="btn" id="cnok">Übernehmen</button><button class="btn ghost" id="cnno" style="margin-top:8px">Ohne Namen</button>`, (m, close) => {
    let sel = cur;
    const draw = () => { const q = callSlug($('#cnf', m).value); $('#cnl', m).innerHTML = CALL_NAMES.filter(n => !q || callSlug(n).includes(q)).map(n => `<button class="badge ${callSlug(n) === sel ? 'or' : ''}" style="font-size:15px;padding:9px 14px" data-cn="${callSlug(n)}">${esc(n)}</button>`).join(''); };
    draw(); $('#cnf', m).oninput = draw;
    on(m, '[data-cn]', 'click', b => { sel = b.dataset.cn; draw(); const l = S.settings.caller === 'en' ? 'en' : 'de'; proManifest(l).then(man => { if (man && man.keys.includes('n_' + sel)) proPlay(l, ['n_' + sel], { flush: true }); else say(b.textContent, null, { flush: true }); }); });
    const set = v => { p.callName = v; p.dart = Object.assign({}, p.dart || {}, { callName: v }); save(true); if (p.id === S.me && typeof pushProfile === 'function') pushProfile(); close(); done && done(); };
    $('#cnok', m).onclick = () => set(sel);
    $('#cnno', m).onclick = () => set('');
  });
}
// Ansage nach Art: score / bust / game / match / require / first
function callout(kind, n, name, opts = {}) {
  const lang = S.settings.caller; if (!lang || lang === 'off') return;
  const man = PRO.man[lang];
  if (S.settings.voiceEngine === 'pro' && man) {
    const nk = callKeyOf(name);
    const hasN = nk && man.keys.includes(nk);
    const keys = kind === 'total' ? (man.keys.includes('totalis') ? ['totalis', 's_' + n] : ['s_' + n]) : kind === 'score' ? ['s_' + n] : kind === 'bust' ? ['bust'] : kind === 'game' ? (hasN ? ['gameshot', nk] : ['gameshot']) : kind === 'match' ? (hasN ? ['gameshot_match', nk] : ['gameshot_match']) : kind === 'first' ? (hasN ? [nk, 'begins', 'gameon'] : ['gameon']) : kind === 'require' ? (hasN ? [nk, 'require', 'r_' + n] : ['require', 'r_' + n]) : [];
    if (keys.every(k => man.keys.includes(k))) return proPlay(lang, keys, opts);
  }
  if (name && typeof name === 'object') name = pName(name);
  const t = kind === 'total' ? (n === 0 ? CALL.score(0) : 'Total is ' + n) : kind === 'score' ? CALL.score(n) : kind === 'bust' ? CALL.bust() : kind === 'game' ? CALL.game(name || '') : kind === 'match' ? CALL.match(name || '') : kind === 'first' ? CALL.first(name || '') : kind === 'require' ? CALL.require(name || '', n) : '';
  if (t) say(t, null, opts);
}
function say(text, lang, opts = {}) {
  lang = lang || S.settings.caller; if (!lang || lang === 'off') return;
  webSay(text, lang, opts);
}
function webSay(text, lang, opts = {}) {
  if (!('speechSynthesis' in window)) return;
  try {
    if (opts.flush) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'en' ? 'en-GB' : 'de-DE';
    const v = bestVoice(lang);
    if (v) u.voice = v;
    u.rate = opts.rate || (lang === 'en' ? .95 : 1); u.pitch = opts.pitch || 1; u.volume = S.settings.volume;
    speechSynthesis.speak(u);
  } catch (e) {}
}
const CALL = {
  score(n) {
    const l = S.settings.caller;
    if (l === 'en') return n === 180 ? 'One hundred and eighty!' : n === 0 ? 'No score' : String(n);
    return n === 180 ? 'Hundertachtzig!' : n === 0 ? 'Kein Score' : String(n);
  },
  bust() { return S.settings.caller === 'en' ? 'No score' : 'Überworfen'; },
  game(name) { return S.settings.caller === 'en' ? `Game shot, and the leg, ${name}!` : `Game Shot! Das Leg geht an ${name}!`; },
  match(name) { return S.settings.caller === 'en' ? `Game shot, and the match, ${name}!` : `Game Shot und Match! ${name} gewinnt!`; },
  require(name, n) { return S.settings.caller === 'en' ? `${name}, you require ${n}` : `${name}, du brauchst ${n}`; },
  first(name) { return S.settings.caller === 'en' ? `${name} to throw first. Game on!` : `${name} beginnt. Game on!`; },
};

/* ================= DART DESIGN ================= */
const SHAFT_LEN = { short: 28, inbetween: 35, medium: 41, long: 48 };
const SHAFT_LBL = { short: 'Short (28 mm)', inbetween: 'Inbetween (35 mm)', medium: 'Medium (41 mm)', long: 'Long (48 mm)' };
const DEFAULT_DART = { name: 'Meine Darts', system: 'classic', tipLen: 32, tipColor: '#c9ccd0', barrelShape: 'straight', barrelLen: 50, barrelWeight: 22, barrelColor: '#5b5f66', barrelColor2: '#ff6b00', grip: 'ring', shaftLen: 'inbetween', shaftColor: '#1d1d1f', flightShape: 'standard', flightNo: '2', flightColor: '#ff6b00', flightColor2: '#111111', flightLogo: null, photos: [] };
function dartOf(p) { return Object.assign({}, DEFAULT_DART, (p && p.dart) || {}); }
// Seitenansicht, Spitze oben (0,0). Breite 44, Höhe ~ Gesamtlänge.
function dartSVG(d, idp = 'd') {
  d = Object.assign({}, DEFAULT_DART, d);
  const tip = d.tipLen, bl = d.barrelLen, sh = d.system === 'onepiece' ? 22 : SHAFT_LEN[d.shaftLen] || 35;
  const flH = { standard: 40, slim: 40, kite: 42, pear: 38, teardrop: 40 }[d.flightShape] || 40;
  const W = 44, cx = 22, bw = 3.6 + d.barrelWeight / 9;
  let y = 0; let s = '';
  const H = tip + bl + sh + flH - 8;
  s += `<svg viewBox="0 -2 ${W} ${H + 4}" width="${W}" height="${H + 4}" xmlns="http://www.w3.org/2000/svg"><defs>`;
  s += `<linearGradient id="${idp}m" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".35" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>`;
  // tip
  s += `</defs><path d="M${cx} 0 L${cx + 1.3} ${tip * .35} L${cx + 1.5} ${tip} L${cx - 1.5} ${tip} L${cx - 1.3} ${tip * .35}Z" fill="${d.tipColor}"/><path d="M${cx} 0 L${cx + 1.3} ${tip * .35} L${cx + 1.5} ${tip} L${cx - 1.5} ${tip} L${cx - 1.3} ${tip * .35}Z" fill="url(#${idp}m)"/>`;
  y = tip;
  // barrel outline
  const prof = { straight: [.82, 1, 1, 1, 1, .86], torpedo: [.7, .95, 1, .92, .8, .66], scalloped: [.85, 1, .82, 1, .82, .86], bomb: [.75, 1, 1.12, 1, .82, .7] }[d.barrelShape] || [.85, 1, 1, 1, 1, .85];
  let L = [], Rr = [];
  prof.forEach((k, i) => { const yy = y + bl * i / (prof.length - 1); L.push(`${(cx - bw * k).toFixed(2)} ${yy.toFixed(2)}`); Rr.push(`${(cx + bw * k).toFixed(2)} ${yy.toFixed(2)}`); });
  const bpath = `M${L.join(' L')} L${Rr.reverse().join(' L')}Z`;
  s += `<path d="${bpath}" fill="${d.barrelColor}"/>`;
  s += `<clipPath id="${idp}c"><path d="${bpath}"/></clipPath><g clip-path="url(#${idp}c)">`;
  // grip
  const gy1 = y + bl * .25, gy2 = y + bl * .78;
  if (d.grip === 'ring') for (let g = gy1; g < gy2; g += 3) s += `<rect x="0" y="${g.toFixed(1)}" width="${W}" height="1.4" fill="${d.barrelColor2}"/>`;
  else if (d.grip === 'shark') for (let g = gy1; g < gy2; g += 4) s += `<path d="M0 ${g + 3} L${cx} ${g} L${W} ${g + 3} L${W} ${g + 4} L${cx} ${g + 1.3} L0 ${g + 4}Z" fill="${d.barrelColor2}"/>`;
  else if (d.grip === 'knurl') for (let g = gy1; g < gy2; g += 2) for (let x = 0; x < W; x += 2) s += `<rect x="${x + (g % 4 ? 1 : 0)}" y="${g}" width="1" height="1" fill="${d.barrelColor2}"/>`;
  else s += `<rect x="0" y="${(y + bl * .45).toFixed(1)}" width="${W}" height="${(bl * .12).toFixed(1)}" fill="${d.barrelColor2}"/>`;
  s += `<rect x="0" y="${y}" width="${W}" height="${bl}" fill="url(#${idp}m)"/></g>`;
  y += bl;
  // shaft
  if (d.system === 'classic') {
    s += `<rect x="${cx - 2.4}" y="${y}" width="4.8" height="${sh}" rx="1.5" fill="${d.shaftColor}"/><rect x="${cx - 2.4}" y="${y}" width="4.8" height="${sh}" rx="1.5" fill="url(#${idp}m)"/>`;
    s += `<rect x="${cx - 3.2}" y="${y + sh - 6}" width="6.4" height="4" rx="1" fill="${d.shaftColor}"/>`;
  } else {
    s += `<path d="M${cx - 2.6} ${y} L${cx + 2.6} ${y} L${cx + 2} ${y + sh} L${cx - 2} ${y + sh}Z" fill="${d.flightColor}"/><path d="M${cx - 2.6} ${y} L${cx + 2.6} ${y} L${cx + 2} ${y + sh} L${cx - 2} ${y + sh}Z" fill="url(#${idp}m)"/>`;
  }
  const fy = y + sh - 10;
  // flight
  const fw = { standard: 21, slim: 13, kite: 19, pear: 18, teardrop: 16 }[d.flightShape] || 21;
  let fp;
  if (d.flightShape === 'kite') fp = `M${cx} ${fy} L${cx + fw} ${fy + flH * .7} L${cx + fw * .8} ${fy + flH} L${cx - fw * .8} ${fy + flH} L${cx - fw} ${fy + flH * .7}Z`;
  else if (d.flightShape === 'pear') fp = `M${cx} ${fy} C${cx + fw * .3} ${fy + 4} ${cx + fw} ${fy + flH * .45} ${cx + fw} ${fy + flH * .75} C${cx + fw} ${fy + flH} ${cx - fw} ${fy + flH} ${cx - fw} ${fy + flH * .75} C${cx - fw} ${fy + flH * .45} ${cx - fw * .3} ${fy + 4} ${cx} ${fy}Z`;
  else if (d.flightShape === 'teardrop') fp = `M${cx} ${fy} C${cx + fw * .6} ${fy + flH * .3} ${cx + fw} ${fy + flH * .7} ${cx + fw * .7} ${fy + flH} L${cx - fw * .7} ${fy + flH} C${cx - fw} ${fy + flH * .7} ${cx - fw * .6} ${fy + flH * .3} ${cx} ${fy}Z`;
  else fp = `M${cx} ${fy} L${cx + fw} ${fy + flH * .55} L${cx + fw} ${fy + flH} L${cx - fw} ${fy + flH} L${cx - fw} ${fy + flH * .55}Z`;
  s += `<clipPath id="${idp}f"><path d="${fp}"/></clipPath><path d="${fp}" fill="${d.flightColor}"/>`;
  s += `<g clip-path="url(#${idp}f)"><rect x="0" y="${fy + flH * .62}" width="${W}" height="${flH * .12}" fill="${d.flightColor2}"/>`;
  if (d.flightLogo) s += `<image href="${d.flightLogo}" x="${cx - fw * .7}" y="${fy + flH * .25}" width="${fw * 1.4}" height="${flH * .6}" preserveAspectRatio="xMidYMid meet"/>`;
  s += `</g><path d="${fp}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".8"/><line x1="${cx}" y1="${fy}" x2="${cx}" y2="${fy + flH}" stroke="#000" stroke-opacity=".4" stroke-width="1.2"/>`;
  s += `</svg>`;
  return s;
}
function dartWeightTotal(d) { d = Object.assign({}, DEFAULT_DART, d); return d.barrelWeight + (d.system === 'onepiece' ? 1.2 : 1.6) + 0.6; }
