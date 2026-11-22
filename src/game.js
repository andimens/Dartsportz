/* ================= SPIEL-BILDSCHIRM ================= */
let G = null; // {m, hist, mult, busy, timers, stuckVisit}
function launchMatch(sides, settings, starter, extra = {}) {
  const bc = extra.boardId ? { id: extra.boardId } : chooseBoard(sides);
  const m = createMatch({ sides, settings, boardId: bc.id, starter, career: extra.career });
  setActive(m); save(true);
  go('game', { fresh: true, why: bc.why });
}
const ANIM_MS = { off: 0, fast: 200, normal: 380, slow: 650 };
V.game = (p) => {
  if (!S.active) return { full: true, html: '', mount() { go('home'); } };
  const m = S.active;
  if (!G || G.m.id !== m.id) G = { m, hist: [], mult: 1, timers: [], stuck: [] };
  G.m = m;
  const title = `${m.settings.fmt === 'best' ? 'BEST OF' : 'FIRST TO'} ${m.settings.count} ${m.settings.unit === 'sets' ? 'SETS' : 'LEGS'}`;
  return {
    full: true,
    html: `<div class="game"><div class="g-top"><button id="gx" title="Verlassen">⇦</button><h1 class="bb">${m.career ? 'KARRIERE · L' + m.career : title}</h1><button id="gst" title="Statistik">📈</button><button id="gset" title="Einstellungen">⚙</button></div>
    <div class="sides" id="sides"></div><div class="who" id="who"></div>
    <div class="bwrap"><div class="bin" id="bin">${boardSVG(boardById(m.boardId))}</div><div id="bub"></div></div>
    <div class="visit"><div class="d" id="v0"></div><div class="d" id="v1"></div><div class="d" id="v2"></div><div class="tot" id="vt">0</div><button class="sub" id="vsub">Submit</button></div>
    <div class="pad"><div class="mrow"><button data-mu="1" class="on">Single</button><button data-mu="2" class="d2">Double</button><button data-mu="3" class="t3">Treble</button><button data-b="50">Bull<br><small>50</small></button><button data-b="25">Outer<br><small>25</small></button></div>
    <div class="keys" id="keys">${keysHTML(1)}</div>
    <div class="brow"><button id="gu">↶</button><button class="miss" id="gm">FALSCH</button><button id="grules">?</button></div></div></div>`,
    mount(r) {
      sizeBoard(); renderGame();
      const press = (n, mu) => { if (G.busy || isBotTurn()) return; if (!controlsCurrent(G.m)) return toast('Warte auf ' + pName(playerById(curPid(G.m))) + ' …'); vibrate(8); throwDart(n, mu, null, true); };
      on(r, '[data-n]', 'click', b => press(+b.dataset.n, G.mult));
      on(r, '[data-b]', 'click', b => press(25, b.dataset.b === '50' ? 2 : 1));
      on(r, '[data-mu]', 'click', b => { G.mult = +b.dataset.mu; renderMult(); });
      $('#gm').onclick = () => press(0, 0);
      $('#gu').onclick = undo;
      $('#vsub').onclick = () => { if (isBotTurn() || G.busy || G.m.finished || !controlsCurrent(G.m)) return; let r0, k = 0; do { r0 = throwDart(0, 0, null, true, true); } while (r0 && !r0.ended && ++k < 3); };
      $('#grules').onclick = () => showRules('x01');
      $('#gx').onclick = () => modal(`<h2 class="bb">Spiel verlassen</h2><button class="btn" id="xp" style="margin-bottom:10px">⏸ Pausieren – später weiterspielen</button><button class="btn sec" id="xd" style="color:#f87171">🗑 Beenden ohne Wertung</button>`, (md, close) => { $('#xp', md).onclick = () => { close(); stopTimers(); save(true); go('home'); }; $('#xd', md).onclick = () => { close(); stopTimers(); discardGame('x01').then(() => {}); }; });
      $('#gst').onclick = liveStats;
      $('#gset').onclick = quickSettings;
      if (p.fresh) { const sd = m.sides[m.cur.side]; setTimeout(() => say(CALL.first(sd.name), null, { flush: true }), 250); if (p.why) toast('🎯 ' + boardById(m.boardId).name + ' · ' + p.why, 2400); p.fresh = false; introBubble(); }
      redrawStuck();
      maybeBot();
    }
  };
};
function dLabelFull(n, m) { return n === 0 ? 'Daneben' : n === 25 ? (m === 2 ? 'Bull · 50' : 'Outer · 25') : (m === 3 ? 'Triple ' : m === 2 ? 'Double ' : '') + n + (m > 1 ? ' · ' + n * m : ''); }
function setActive(m) {
  S.paused = (S.paused || []).filter(x => x.id !== m.id && !x.finished);
  if (S.active && S.active.id !== m.id && !S.active.finished) S.paused.unshift(S.active);
  S.active = m; G = null;
  if (m.live && typeof LIVE !== 'undefined') { LIVE.id = m.liveId; LIVE.version = m._v || 0; LIVE.host = AUTH.user && m.hostUid === AUTH.user.id; }
}
function resumeGame(id) { if (S.active && S.active.id === id) return go('game', { resume: true }); const m = (S.paused || []).find(x => x.id === id); if (!m) return; setActive(m); save(true); go('game', { resume: true }); }
function stopTimers() { G && G.timers.forEach(clearTimeout); if (G) { G.timers = []; G.busy = false; } }
function isBotTurn() { const m = G.m; return !m.finished && !!m.sides[m.cur.side].bot; }
function keysHTML(mu) { return Array.from({ length: 20 }, (_, i) => { const n = i + 1; return `<button class="key" data-n="${n}">${mu === 1 ? n : `<b>${n * mu}</b><small>${mu === 2 ? 'D' : 'T'}${n}</small>`}</button>`; }).join(''); }
function renderMult(mult) {
  mult = mult || (G && G.mult) || 1;
  $$('[data-mu]').forEach(b => b.classList.toggle('on', +b.dataset.mu === mult));
  const k = $('#keys'); if (!k) return; if (k.dataset.km != mult) { k.innerHTML = keysHTML(mult); k.dataset.km = mult; }
  k.classList.toggle('dbl', mult === 2); k.classList.toggle('tri', mult === 3);
}
function dartBox(d) { return d ? `<b>${d.v != null ? d.n * d.m : 0}</b><small>${d.n === 0 ? 'Miss' : d.n === 25 ? (d.m === 2 ? 'Bull' : '25') : (d.m === 3 ? 'T' : d.m === 2 ? 'D' : 'S') + d.n}</small>` : ''; }
function sizeBoard() { const w = $('.bwrap'), b = $('#bin'); if (!w || !b) return; const sz = Math.max(90, Math.min(w.clientWidth, w.clientHeight) - 4); b.style.width = b.style.height = sz + 'px'; }
window.addEventListener('resize', () => { sizeBoard(); if (G && $('#bin')) redrawStuck(); });
function renderGame() {
  const m = G.m, c = m.cur, st = m.settings;
  const leg = m.legs[m.legs.length - 1];
  $('#sides').innerHTML = m.sides.map((sd, i) => {
    const act = i === c.side && !m.finished;
    const rem = act ? (c.darts.length ? c.vrem : c.rem[i]) : c.rem[i];
    const lastV = [...leg.visits].reverse().find(v => v.side === i);
    const dl = 3 - (act ? c.darts.length : 0);
    const co = rem <= 170 && (act ? c.vopen : c.opened[i]) ? checkout(rem, dl, st.outMode) : null;
    const pid = act ? curPid(m, i) : sd.members[m.memberTurn[i] % sd.members.length];
    const p = playerById(pid);
    const legDarts = leg.visits.filter(v => v.side === i).reduce((a, v) => a + v.darts.length, 0) + (act ? c.darts.length : 0);
    return `<div class="side ${act ? 'act' : ''}" style="${act ? '' : `border-top:3px solid ${sd.color}`}"><div class="nm">${avatar(p, 'xs')}${esc(sd.members.length > 1 ? sd.name + ' · ' + pName(p) : sd.name)}</div>
      <span class="lg">${st.unit === 'sets' ? m.setsWon[i] + '·' + m.legsInSet[i] : m.legsWon[i]}</span>
      <div class="sc">${rem}</div><div class="meta"><span>Ø ${fmt(sideAvg(m, i))}</span><span>${lastV ? 'L: ' + (lastV.bust ? 'X' : lastV.scored) : ''}</span><span>🎯${legDarts}</span></div>
      ${co ? `<div class="co">${co.map(dLabel).join(' · ')}</div>` : ''}</div>`;
  }).join('');
  const sd = m.sides[c.side], pp = playerById(curPid(m));
  $('#who').innerHTML = m.finished ? 'SPIEL BEENDET' : `${esc(pName(pp)).toUpperCase()} IST AM ZUG!${sd.bot ? ' <span class="pulse">🤖</span>' : ''}${m.live ? (controlsCurrent(m) ? ' <span style="font-size:14px;color:var(--ok)">● LIVE</span>' : ' <span class="pulse" style="font-size:14px">📡 wirft gerade</span>') : ''}`;
  for (let i = 0; i < 3; i++) $('#v' + i).innerHTML = dartBox(c.darts[i]);
  $('#vt').textContent = visitSoFar(m);
  renderMult();
  const act = $('.side.act'); act && act.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
function sideAvg(m, i) { let d = 0, p = 0; m.legs.forEach(l => l.visits.forEach(v => { if (v.side === i) { d += v.darts.length; p += v.bust ? 0 : v.scored; } })); return d ? p / d * 3 : 0; }
function flyDart(cont, pt, pid, animate, list) {
  if (!cont) return 0;
  const p = playerById(pid); const el = document.createElement('div'); el.className = 'fly';
  el.innerHTML = dartSVG(dartOf(p), 'f' + Math.random().toString(36).slice(2, 7)); cont.appendChild(el);
  const svg = el.firstChild; svg.setAttribute('width', 34); svg.setAttribute('height', 150); svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');
  const w = cont.clientWidth, h = cont.clientHeight; const x = (pt[0] + 230) / 460 * w, y = (pt[1] + 230) / 460 * h;
  const sc = clamp(w / 680, .24, .85);
  const end = `translate(${x - 17}px,${y}px) rotate(${14 + Math.random() * 10}deg) scale(${sc})`;
  const ms = ANIM_MS[S.settings.anim] ?? 380;
  if (animate && ms > 0) el.animate([{ transform: `translate(${w * .5 + (x - w / 2) * .3 - 17}px,${h + 60}px) rotate(4deg) scale(${sc * 2.6})`, opacity: .5 }, { transform: end, opacity: 1 }], { duration: ms, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'forwards' });
  el.style.transform = end;
  list && list.push(el);
  return ms;
}
function clearStuck() { G.stuck.forEach(e => e.remove()); G.stuck = []; }
function redrawStuck() { clearStuck(); sizeBoard(); const c = G.m.cur; c.darts.forEach(d => flyDart($('#bin'), d.x != null ? [d.x, d.y] : pointFor(d.n, d.m), curPid(G.m), false, G.stuck)); }
// Großansicht mit Blur während der Wurfanimation
const ZOOM = { t: null };
function zoomShow(boardId, prevDarts, pid, label) {
  if (!S.settings.zoom || !(ANIM_MS[S.settings.anim] > 0)) return null;
  let z = $('#zoom');
  if (!z) { z = document.createElement('div'); z.id = 'zoom'; z.innerHTML = `<div class="zin">${boardSVG(boardById(boardId))}<div class="zlbl"></div></div>`; document.body.appendChild(z); requestAnimationFrame(() => z.classList.add('on')); }
  clearTimeout(ZOOM.r); z.classList.add('on');
  const zin = z.querySelector('.zin');
  if (!prevDarts.length) $$('.fly', zin).forEach(e => e.remove());
  if (!$$('.fly', zin).length) prevDarts.forEach(d => flyDart(zin, d.x != null ? [d.x, d.y] : pointFor(d.n, d.m), pid, false));
  z.querySelector('.zlbl').textContent = label || '';
  clearTimeout(ZOOM.t);
  return zin;
}
function zoomHide(delay) { clearTimeout(ZOOM.t); ZOOM.t = setTimeout(() => { const z = $('#zoom'); if (!z) return; z.classList.remove('on'); ZOOM.r = setTimeout(() => z.remove(), 180); }, delay); }
function animateThrow(pt, pid, prevDarts, boardId, label, smallCont, list) {
  const zin = zoomShow(boardId, prevDarts, pid, label);
  const ms = flyDart(smallCont, pt, pid, !zin, list);
  if (zin) { const m2 = flyDart(zin, pt, pid, true); zoomHide(m2 + 750); return m2; }
  return ms;
}
function throwDart(n, mu, pt, human, silent) {
  const m = G.m; if (m.finished) return;
  if (G.clearT) { clearTimeout(G.clearT); G.clearT = null; clearStuck(); }
  G.hist.push({ s: JSON.stringify(m), human });
  if (G.hist.length > 400) G.hist.shift();
  const pid = curPid(m); const side = m.cur.side;
  pt = pt || pointFor(n, mu);
  const ms = silent ? 0 : animateThrow(pt, pid, m.cur.darts, m.boardId, dLabelFull(n, mu), $('#bin'), G.stuck);
  const bid = m.boardId;
  if (!silent) setTimeout(() => impact(bid, n === 0), ms);
  const res = addDart(m, n, mu, pt);
  if (human) G.mult = 1;
  renderGame(); save(); livePush();
  if (res.ended) afterVisit(res, side);
  return res;
}
function afterVisit(res, side) {
  const m = G.m, v = res.visit, sd = m.sides[side];
  G.clearT = setTimeout(() => { clearStuck(); G.clearT = null; }, 1100);
  if (!res.legWon) say(v.bust ? CALL.bust() : CALL.score(v.scored));
  if (v.scored === 180) chime();
  const bot = m.sides.find(s => s.bot);
  if (bot && Math.random() < .55) {
    const L = bot.bot.level; let ev = null;
    if (sd.bot) ev = v.bust ? 'meBust' : v.scored >= 100 ? 'meHigh' : v.scored < 30 ? 'meLow' : null;
    else ev = v.bust ? 'youBust' : v.scored === 180 ? 'you180' : v.scored >= 100 ? 'youHigh' : v.scored < 26 ? 'youLow' : null;
    if (ev && !res.legWon) botSays(L, ev);
  }
  if (res.legWon) {
    const name = pName(playerById(v.pid));
    chime(true);
    if (res.matchWon) { say(CALL.match(sd.name)); return finishMatch(); }
    say(CALL.game(name));
    if (bot) botSays(bot.bot.level, sd.bot ? 'meLeg' : 'youLeg');
    legBanner(sd.name, v.before);
  } else {
    const nx = m.cur.side, rem = m.cur.rem[nx];
    if (rem <= 170 && checkout(rem, 3, m.settings.outMode) && m.sides.length > 0) G.timers.push(setTimeout(() => say(CALL.require(pName(playerById(curPid(m))), rem)), 50));
  }
  maybeBot();
}
function legBanner(name, fin) {
  const b = document.createElement('div'); b.className = 'toast'; b.style.cssText += ';bottom:auto;top:40%;font-size:22px;padding:18px 26px;background:var(--or);color:#fff';
  b.innerHTML = `<span class="bb" style="font-size:34px">GAME SHOT!</span><br>${esc(name)} checkt ${fin}`; document.body.appendChild(b); setTimeout(() => b.remove(), 1700);
}
function botSays(L, ev) {
  const line = botLine(L, ev); if (!line) return;
  const b = $('#bub'); if (!b) return;
  b.innerHTML = `<div class="bubble"><small>🤖 ${esc(botDef(L).name)}</small>${esc(line)}</div>`;
  clearTimeout(G.bubT); G.bubT = setTimeout(() => { if ($('#bub')) $('#bub').innerHTML = ''; }, 3400);
  if (S.settings.botVoice && S.settings.caller !== 'off') say(line, 'de', { pitch: .9 + (L % 5) * .08, rate: 1.05 });
}
function introBubble() { const bot = G.m.sides.find(s => s.bot); if (bot) setTimeout(() => botSays(bot.bot.level, 'intro'), 900); }
function maybeBot() {
  if (!G || !isBotTurn() || G.busy) return;
  if (G.m.live && !controlsCurrent(G.m)) return;
  G.busy = true; const m = G.m, side = m.cur.side, L = m.sides[side].bot.level;
  const step = (first) => {
    G.timers.push(setTimeout(() => {
      if (!G || G.m !== m || m.finished || m.cur.side !== side) { G.busy = false; return; }
      const c = m.cur; const rem = c.darts.length ? c.vrem : c.rem[side]; const open = c.darts.length ? c.vopen : c.opened[side];
      const tg = botTarget(rem, 3 - c.darts.length, m.settings.outMode, open, m.settings.inMode);
      const t = botThrow(L, tg);
      G.busy = false;
      const res = throwDart(t.n, t.m, t.pt, false);
      if (res && !res.ended) { G.busy = true; step(false); }
    }, first ? 1100 : 650 + (ANIM_MS[S.settings.anim] || 0)));
  };
  step(true);
}
function undo() {
  if (!G.hist.length) return toast('Nichts zum Rückgängigmachen');
  stopTimers();
  let snap = null;
  while (G.hist.length) { snap = G.hist.pop(); if (snap.human) break; }
  if (!snap) return;
  if (!snap.human && !G.hist.length) { /* nur Bot-Würfe */ }
  const restored = JSON.parse(snap.s); S.active = restored; G.m = restored; save();
  if (G.clearT) { clearTimeout(G.clearT); G.clearT = null; }
  renderGame(); redrawStuck(); vibrate(20); livePush();
  if (!snap.human) maybeBot();
}
function finishMatch() {
  let m = G.m; stopTimers();
  if (m.live && S.aliases) { let js = JSON.stringify(m); Object.entries(S.aliases).forEach(([a, b]) => { js = js.split('"' + a + '"').join('"' + b + '"'); }); m = G.m = JSON.parse(js); }
  if (!S.matches.some(x => x.id === m.id)) S.matches.push(m); S.active = null;
  if (!m.live || m.hostUid === (AUTH.user && AUTH.user.id)) queueMatch(m);
  if (m.live) { livePush(); LIVE.id = null; }
  let careerMsg = '';
  if (m.career) {
    const L = m.career, won = !m.sides[m.winner].bot;
    S.career.results[L] = S.career.results[L] || { w: 0, l: 0 };
    S.career.results[L][won ? 'w' : 'l']++;
    if (won && L > S.career.best) { S.career.best = L; careerMsg = L === 30 ? '👑 Du bist der CHAMPION von Dartsportz!' : `🔓 Level ${L + 1} freigeschaltet: ${botDef(L + 1).name}`; }
    G.timers.push(setTimeout(() => botSays(L, won ? 'youMatch' : 'meMatch'), 600));
  }
  save(true);
  const w = m.sides[m.winner];
  const rows = m.sides.flatMap((sd, si) => sd.members.map(pid => { const p = playerById(pid); let d = 0, pt = 0, f = 0, hi = 0, o180 = 0; m.legs.forEach(l => { let k = 0; l.visits.forEach(v => { if (v.pid === pid) { d += v.darts.length; pt += v.bust ? 0 : v.scored; if (v.scored === 180) o180++; if (v.checkout && v.before > hi) hi = v.before; } }); }); return `<tr><td>${esc(pName(p))}</td><td><b>${fmt(d ? pt / d * 3 : 0)}</b></td><td>${o180}</td><td>${hi || '–'}</td><td>${d}</td></tr>`; })).join('');
  setTimeout(() => modal(`<div style="text-align:center;font-size:56px">🏆</div><h2 class="bb">${esc(w.name)} gewinnt!</h2>
    <p class="mut" style="text-align:center;margin-top:-6px">${m.sides.map((s, i) => esc(s.name) + ' ' + (m.settings.unit === 'sets' ? m.setsWon[i] : m.legsWon[i])).join(' : ')}</p>
    ${careerMsg ? `<div class="story" style="text-align:center;font-weight:700">${careerMsg}</div>` : ''}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:14px"><tr class="mut" style="text-align:left"><th>Spieler</th><th>Ø</th><th>180</th><th>Finish</th><th>Darts</th></tr>${rows}</table>
    <div class="grid2"><button class="btn sec" id="mdone">Fertig</button><button class="btn" id="mre">${m.career && !m.sides[m.winner].bot && m.career < 30 ? 'Nächster Gegner' : 'Revanche'}</button></div>`, (md, close) => {
    $('#mdone', md).onclick = () => { close(); G = null; go(m.career ? 'career' : 'home'); };
    $('#mre', md).onclick = () => {
      close(); G = null;
      if (m.career && !m.sides[m.winner].bot && m.career < 30) return startCareer(m.career + 1);
      const sides = m.sides.map(s => ({ ...s, members: [...s.members] }));
      const bc = chooseBoard(sides, m.boardId);
      const mm = createMatch({ sides, settings: m.settings, boardId: bc.id, starter: (m.startSide + 1) % sides.length, career: m.career });
      setActive(mm); save(true); go('game', { fresh: true, why: bc.why });
    };
  }), 900);
}
function liveStats() {
  const m = G.m;
  const rows = m.sides.map((sd, i) => { let d = 0, p = 0, f9d = 0, f9p = 0, s180 = 0, s100 = 0, att = 0, hit = 0; m.legs.forEach(l => { let k = 0; l.visits.forEach(v => { if (v.side !== i) return; d += v.darts.length; const sc = v.bust ? 0 : v.scored; p += sc; if (k < 3) { f9d += v.darts.length; f9p += sc; } k++; if (sc === 180) s180++; else if (sc >= 100) s100++; v.darts.forEach((x, j) => { if (x.att) { att++; if (v.checkout && j === v.darts.length - 1) hit++; } }); }); }); return `<tr><td><b>${esc(sd.name)}</b></td><td>${fmt(d ? p / d * 3 : 0)}</td><td>${fmt(f9d ? f9p / f9d * 3 : 0)}</td><td>${s180}</td><td>${s100}</td><td>${att ? Math.round(hit / att * 100) : 0}% (${hit}/${att})</td></tr>`; }).join('');
  modal(`<h2 class="bb">Live-Statistik</h2><table style="width:100%;font-size:13.5px;border-collapse:collapse"><tr class="mut" style="text-align:left"><th></th><th>Ø</th><th>F9</th><th>180</th><th>100+</th><th>Checkout</th></tr>${rows}</table><p class="mut xs">Scheibe: ${esc(boardById(m.boardId).name)}</p>`);
}
function quickSettings() {
  const s = S.settings;
  modal(`<h2 class="bb">Einstellungen</h2>${settingsBlock()}<button class="btn" onclick="this.closest('.modal-bg').remove()">Fertig</button>`, m => bindSettings(m));
}
