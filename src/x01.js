/* ================= SPIELER ================= */
const COLORS = ['#ff6b00', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#eab308', '#14b8a6', '#ec4899', '#f97316', '#84cc16'];
function playerById(id) { const al = S.aliases && S.aliases[id]; if (al) id = al; return S.players.find(p => p.id === id) || BOT_PLAYER(id); }
function me() { return S.players.find(p => p.id === S.me); }
function newPlayer(o = {}) {
  const p = Object.assign({ id: uid(), name: 'Spieler', nick: '', country: 'DE', age: '', height: '', hand: 'rechts', board: BOARDS[0].id, color: COLORS[S.players.length % COLORS.length], guest: true, avatar: null, dart: Object.assign({}, DEFAULT_DART), linkCode: Math.random().toString(36).slice(2, 8).toUpperCase(), created: Date.now() }, o);
  S.players.push(p); save(); return p;
}
function avatar(p, cls = '') {
  if (!p) return '';
  const bg = p.avatar ? `background-image:url(${p.avatar})` : `background:${p.color || '#ccc'}`;
  return `<div class="av ${cls}" style="${bg}">${p.avatar ? '' : esc((p.name || '?')[0].toUpperCase())}</div>`;
}
function pName(p) { return p ? (p.nick || p.name) : '?'; }

/* ================= CHECKOUT ================= */
const DBL_PREF = [20, 16, 8, 10, 12, 18, 4, 6, 14, 2, 9, 5, 7, 3, 11, 13, 15, 17, 19, 1, 25];
const ALL_DARTS = (() => {
  const a = [];
  for (let n = 20; n >= 1; n--) a.push({ n, m: 3, v: n * 3, r: n >= 16 ? 20 - n : 30 + (20 - n) });
  for (let n = 20; n >= 1; n--) a.push({ n, m: 1, v: n, r: 5 + (20 - n) });
  a.push({ n: 25, m: 1, v: 25, r: 26 }, { n: 25, m: 2, v: 50, r: 60 });
  for (let n = 20; n >= 1; n--) a.push({ n, m: 2, v: n * 2, r: 70 + (20 - n) });
  return a;
})();
const dLabel = d => d.n === 25 ? (d.m === 2 ? 'BULL' : '25') : (d.m === 3 ? 'T' : d.m === 2 ? 'D' : '') + d.n;
const coCache = {};
function isFinisher(d, out) { return out === 'single' ? true : out === 'master' ? d.m >= 2 : d.m === 2; }
function checkout(rem, dartsLeft = 3, out = 'double') {
  if (rem < 2 && out !== 'single') return null;
  if (rem > 170 || rem < 1) return null;
  const key = rem + '|' + dartsLeft + '|' + out; if (key in coCache) return coCache[key];
  const fin = ALL_DARTS.filter(d => isFinisher(d, out));
  const fscore = d => d.m === 2 ? DBL_PREF.indexOf(d.n) : 30 + d.r;
  let best = null, bs = 1e9;
  for (let k = 1; k <= dartsLeft; k++) {
    if (k === 1) { for (const f of fin) if (f.v === rem) { const sc = fscore(f); if (sc < bs) { bs = sc; best = [f]; } } }
    if (k === 2) for (const a of ALL_DARTS) { const r2 = rem - a.v; if (r2 < 2 && out !== 'single') continue; for (const f of fin) if (f.v === r2) { const sc = 1000 + fscore(f) * 10 + a.r; if (sc < bs) { bs = sc; best = [a, f]; } } }
    if (k === 3) for (const a of ALL_DARTS) for (const b of ALL_DARTS) { const r3 = rem - a.v - b.v; if (r3 < 2 && out !== 'single') continue; if (r3 > 50) continue; for (const f of fin) if (f.v === r3) { const sc = 2000 + fscore(f) * 10 + a.r + b.r; if (sc < bs) { bs = sc; best = [a, b, f]; } } }
    if (best) break;
  }
  coCache[key] = best; return best;
}

/* ================= X01 ENGINE ================= */
function legsTarget(st) { return st.fmt === 'best' ? Math.ceil(st.count / 2) : st.count; }
function createMatch(cfg) {
  // cfg: {mode, settings, sides:[{name,color,members:[pid],bot:{level}|null, teamId}], boardId, starter}
  const n = cfg.sides.length;
  const m = {
    id: uid(), mode: 'x01', created: Date.now(), settings: cfg.settings, sides: cfg.sides, boardId: cfg.boardId, career: cfg.career || null,
    legs: [], setsWon: Array(n).fill(0), legsInSet: Array(n).fill(0), legsWon: Array(n).fill(0), memberTurn: Array(n).fill(0),
    cur: null, winner: null, finished: false, startSide: cfg.starter || 0, legNo: 0,
  };
  startLeg(m, m.startSide);
  return m;
}
function startLeg(m, starter) {
  const n = m.sides.length, st = m.settings;
  m.legs.push({ starter, visits: [], winner: null, set: m.setsWon.reduce((a, b) => a + b, 0) + 1 });
  m.cur = { side: starter, rem: Array(n).fill(st.start), opened: Array(n).fill(st.inMode === 'single'), darts: [], vrem: st.start, vopen: st.inMode === 'single' };
}
function curPid(m, s = m.cur.side) { const sd = m.sides[s]; return sd.members[m.memberTurn[s] % sd.members.length]; }
function isDoubleCheckout(rem, out) { if (out === 'single') return rem <= 60; if (out === 'master') return rem <= 60 && (rem % 2 === 0 || rem % 3 === 0) || rem === 50; return (rem <= 40 && rem % 2 === 0 && rem > 0) || rem === 50; }
// returns {ended, bust, legWon, matchWon}
function addDart(m, n, mm, pt) {
  const st = m.settings, c = m.cur, s = c.side;
  if (c.darts.length === 0) { c.vrem = c.rem[s]; c.vopen = c.opened[s]; }
  let val = n * mm; if (n === 0) mm = 0;
  const before = c.vrem;
  const dart = { n, m: mm, v: val, x: pt ? +pt[0].toFixed(1) : null, y: pt ? +pt[1].toFixed(1) : null };
  if (isDoubleCheckout(before, st.outMode) && c.vopen) dart.att = before === 50 ? 25 : (st.outMode === 'double' ? before / 2 : before);
  if (!c.vopen) {
    const opens = st.inMode === 'double' ? mm === 2 : st.inMode === 'triple' ? mm === 3 : true;
    if (opens && n > 0) c.vopen = true; else { dart.v = 0; val = 0; }
  }
  c.darts.push(dart);
  const after = before - val;
  let bust = false, won = false;
  if (after < 0) bust = true;
  else if (after === 0) { if (isFinisher({ m: mm }, st.outMode) && n > 0) won = true; else bust = true; }
  else if (after === 1 && st.outMode !== 'single') bust = true;
  if (!bust) c.vrem = after;
  if (bust || won || c.darts.length === 3) return endVisit(m, bust, won);
  return { ended: false };
}
function endVisit(m, bust, won) {
  const c = m.cur, s = c.side, leg = m.legs[m.legs.length - 1];
  const pid = curPid(m, s);
  const scored = bust ? 0 : c.rem[s] - c.vrem;
  const v = { side: s, pid, darts: c.darts, scored, bust: !!bust, before: c.rem[s], after: bust ? c.rem[s] : c.vrem, checkout: !!won };
  leg.visits.push(v);
  if (!bust) { c.rem[s] = c.vrem; c.opened[s] = c.vopen; }
  c.darts = []; m.memberTurn[s]++;
  const res = { ended: true, bust: !!bust, visit: v };
  if (won) {
    leg.winner = s; m.legsWon[s]++;
    const st = m.settings;
    if (st.unit === 'sets') {
      m.legsInSet[s]++;
      if (m.legsInSet[s] >= 3) { m.setsWon[s]++; m.legsInSet = m.legsInSet.map(() => 0); res.setWon = true; }
      if (m.setsWon[s] >= legsTarget(st)) res.matchWon = true;
    } else if (m.legsWon[s] >= legsTarget(st)) res.matchWon = true;
    res.legWon = true;
    if (res.matchWon) { m.winner = s; m.finished = true; m.ended = Date.now(); }
    else { m.legNo++; startLeg(m, (leg.starter + 1) % m.sides.length); }
  } else c.side = (s + 1) % m.sides.length;
  return res;
}
function visitSoFar(m) { const c = m.cur; return c.darts.reduce((a, d) => a + d.v, 0); }

/* ================= BOARD-WAHL ================= */
function chooseBoard(sides, rematchOf) {
  const favs = [];
  sides.forEach(sd => sd.members.forEach(pid => { const p = playerById(pid); const b = p && p.board; if (b && !favs.includes(b)) favs.push(b); }));
  if (!favs.length) return { id: BOARDS[0].id, why: 'Standard' };
  if (favs.length === 1) return { id: favs[0], why: 'Lieblingsscheibe' };
  if (rematchOf) { const i = favs.indexOf(rematchOf); const id = favs[(i + 1) % favs.length]; return { id, why: 'Revanche – Heim/Gast-Wechsel' }; }
  return { id: pick(favs), why: 'ausgelost (unterschiedliche Lieblingsscheiben)' };
}

/* ================= STATISTIK ================= */
function statHidden(pid, t) { const r = (S.statResets || {})[pid]; if (!r || !t) return false; if (r.all && t < r.all) return true; return (r.ranges || []).some(([a, b]) => t >= a && t < b); }
function emptyStats() { return { darts: 0, pts: 0, f9d: 0, f9p: 0, att: 0, hit: 0, s180: 0, s140: 0, s100: 0, s60: 0, hiFin: 0, hiScore: 0, bestLeg: 0, legs: 0, legsWon: 0, matches: 0, wins: 0, losses: 0, dbl: {}, heat: {}, avgs: [] }; }
function statsFor(pid, filter = () => true) {
  const t = emptyStats();
  for (const m of S.matches) {
    if (m.mode !== 'x01' || !filter(m) || statHidden(pid, m.created)) continue;
    const si = m.sides.findIndex(sd => sd.members.includes(pid)); if (si < 0) continue;
    let md = 0, mp = 0;
    for (const leg of m.legs) {
      let cnt = 0, legDarts = 0, played = false;
      for (const v of leg.visits) {
        if (v.pid !== pid) continue; played = true;
        const nd = v.darts.length, sc = v.bust ? 0 : v.scored;
        t.darts += nd; t.pts += sc; md += nd; mp += sc; legDarts += nd;
        if (cnt < 3) { t.f9d += nd; t.f9p += sc; } cnt++;
        if (sc === 180) t.s180++; else if (sc >= 140) t.s140++; else if (sc >= 100) t.s100++; else if (sc >= 60) t.s60++;
        if (sc > t.hiScore) t.hiScore = sc;
        v.darts.forEach((d, i) => {
          const k = d.n === 0 ? 'MISS' : d.n === 25 ? (d.m === 2 ? 'B50' : 'B25') : (d.m === 3 ? 'T' : d.m === 2 ? 'D' : 'S') + d.n;
          t.heat[k] = (t.heat[k] || 0) + 1;
          if (d.att) { t.att++; const dk = d.att === 25 ? 'Bull' : 'D' + d.att; t.dbl[dk] = t.dbl[dk] || { a: 0, h: 0 }; t.dbl[dk].a++; if (v.checkout && i === v.darts.length - 1) { t.hit++; t.dbl[dk].h++; } }
        });
        if (v.checkout && v.before > t.hiFin) t.hiFin = v.before;
      }
      if (played) { t.legs++; if (leg.winner === si) { t.legsWon++; const sideDarts = leg.visits.filter(v => v.side === si).reduce((a, v) => a + v.darts.length, 0); const ld = m.sides[si].members.length === 1 ? legDarts : sideDarts; if (!t.bestLeg || ld < t.bestLeg) t.bestLeg = ld; } }
    }
    if (m.finished) { t.matches++; if (m.winner === si) t.wins++; else t.losses++; }
    if (md) t.avgs.push({ id: m.id, avg: mp / md * 3, won: m.winner === si, d: m.created });
  }
  t.avg = t.darts ? t.pts / t.darts * 3 : 0; t.f9 = t.f9d ? t.f9p / t.f9d * 3 : 0; t.co = t.att ? t.hit / t.att * 100 : 0;
  return t;
}
function matchAvg(m, pid) { let d = 0, p = 0; m.legs.forEach(l => l.visits.forEach(v => { if (v.pid === pid) { d += v.darts.length; p += v.bust ? 0 : v.scored; } })); return d ? p / d * 3 : 0; }
function h2h(pid) {
  const res = {};
  for (const m of S.matches) {
    if (!m.finished || m.mode !== 'x01' || m.sides.length !== 2) continue;
    const si = m.sides.findIndex(sd => sd.members.includes(pid)); if (si < 0) continue;
    const o = m.sides[1 - si]; if (o.members.length !== 1 || m.sides[si].members.length !== 1) continue;
    const oid = o.bot ? 'bot:' + o.bot.level : o.members[0];
    const r = res[oid] = res[oid] || { w: 0, l: 0, games: [] };
    if (m.winner === si) r.w++; else r.l++;
    r.games.push({ m, won: m.winner === si, my: matchAvg(m, pid), op: matchAvg(m, o.members[0]), score: `${m.settings.unit === 'sets' ? m.setsWon[si] : m.legsWon[si]}:${m.settings.unit === 'sets' ? m.setsWon[1 - si] : m.legsWon[1 - si]}` });
  }
  return res;
}
