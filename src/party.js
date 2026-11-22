/* ================= CRICKET & PARTYSPIELE ================= */
const CR_T = [20, 19, 18, 17, 16, 15, 25];
const PARTY = {
  cricket: {
    name: 'Cricket', em: '❌', color: 't-or2', desc: 'Schließe 15–20 und Bull, sammle Punkte und spiel den Gegner aus.',
    cfg: { mode: 'standard', rounds: 20 },
    settings: c => `<div class="lbl">Variante</div>${pseg('mode', [['standard', 'Standard'], ['cut', 'Cut-Throat']], c)}<div class="xs mut">Cut-Throat: Deine Punkte bekommen die Gegner – wenig Punkte gewinnen.</div>${pstep('Max. Runden', 'rounds', c)}`,
    init(P) { P.d = { marks: P.players.map(() => Object.fromEntries(CR_T.map(t => [t, 0]))), pts: P.players.map(() => 0) }; },
    dart(P, n, m) {
      if (!CR_T.includes(n)) return;
      const d = P.d, me = P.cur, mk = d.marks[me], had = mk[n];
      const close = Math.max(0, Math.min(m, 3 - had)), extra = m - close; mk[n] += m;
      if (extra > 0) {
        const val = (n === 25 ? 25 : n) * extra;
        const open = P.players.map((_, i) => i).filter(i => i !== me && d.marks[i][n] < 3);
        if (P.cfg.mode === 'cut') open.forEach(i => d.pts[i] += val);
        else if (open.length) d.pts[me] += val;
      }
      if (had < 3 && mk[n] >= 3) return { msg: (n === 25 ? 'Bull' : n) + ' zu!' };
    },
    over(P) {
      const d = P.d, cut = P.cfg.mode === 'cut';
      const best = (arr) => cut ? Math.min(...arr) : Math.max(...arr);
      for (let i = 0; i < P.players.length; i++) { const all = CR_T.every(t => d.marks[i][t] >= 3); if (all && d.pts[i] === best(d.pts)) return i; }
      if (P.round > P.cfg.rounds) { const b = best(d.pts); return d.pts.indexOf(b); }
      return null;
    },
    panel(P) {
      const d = P.d, sym = k => k <= 0 ? '' : k === 1 ? '/' : k === 2 ? '✕' : '⊗';
      return `<div class="card" style="padding:8px;margin:0 10px"><table class="ptable"><tr><th></th>${P.players.map((pid, i) => `<th style="color:${i === P.cur ? 'var(--or)' : 'inherit'}">${esc(pName(playerById(pid)).slice(0, 8))}</th>`).join('')}</tr>
        ${CR_T.map(t => `<tr class="${P.players.every((_, i) => d.marks[i][t] >= 3) ? 'cl' : ''}"><td class="num">${t === 25 ? 'B' : t}</td>${P.players.map((_, i) => `<td class="mk" style="color:${d.marks[i][t] >= 3 ? 'var(--ok)' : '#fff'}">${sym(d.marks[i][t])}</td>`).join('')}</tr>`).join('')}
        <tr><td class="mut xs">Pkt</td>${d.pts.map((p, i) => `<td class="bb" style="font-size:24px;color:${i === P.cur ? 'var(--or)' : '#fff'}">${p}</td>`).join('')}</tr></table></div>`;
    },
  },
  killer: {
    name: 'Killer', em: '💀', color: 't-or', desc: 'Werde zum Killer, nimm deine Rivalen ins Visier – der Letzte gewinnt.',
    cfg: { lives: 3, seg: true, chaos: false, assign: 'random' }, min: 2,
    settings: c => `<div class="lbl">Leben</div>${pseg('lives', [[3, '3'], [5, '5'], [10, '10']], c)}
      <div class="row" style="margin:12px 0"><b class="sp">Steigerung nach Segmenten</b><button class="switch ${c.seg ? 'on' : ''}" data-psw="seg"></button></div><div class="xs mut">Single = 1, Double = 2, Triple = 3. Aus: jeder Treffer zählt 1.</div>
      <div class="row" style="margin:12px 0"><b class="sp">Chaos</b><button class="switch ${c.chaos ? 'on' : ''}" data-psw="chaos"></button></div><div class="xs mut">Triffst du eine fremde Zahl, bevor du Killer bist, schenkst du dem Gegner Leben.</div>
      <div class="lbl">Zahlen-Vergabe</div>${pseg('assign', [['random', 'Zufällig'], ['manual', 'Selbst wählen']], c)}`,
    init(P) {
      const n = P.players.length;
      let nums = P.cfg.nums;
      if (!nums) { const pool = Array.from({ length: 20 }, (_, i) => i + 1).sort(() => Math.random() - .5); nums = pool.slice(0, n); }
      P.d = { nums, lives: Array(n).fill(0), killer: Array(n).fill(false), out: Array(n).fill(false) };
    },
    dart(P, n, m) {
      const d = P.d, L = P.cfg.lives, me = P.cur; if (!n || n === 25) return;
      const val = P.cfg.seg ? m : 1; const owner = d.nums.findIndex((x, i) => x === n && !d.out[i]);
      if (owner < 0) return;
      const nm = i => pName(playerById(P.players[i]));
      if (owner === me) {
        if (!d.killer[me]) { d.lives[me] = Math.min(L, d.lives[me] + val); if (d.lives[me] >= L) { d.killer[me] = true; return { msg: '💀 ' + nm(me) + ' ist KILLER!' }; } }
        else { d.lives[me] -= val; if (d.lives[me] <= 0) { d.out[me] = true; return { msg: nm(me) + ' hat sich selbst erledigt!', end: true }; } }
      } else if (d.killer[me]) {
        d.lives[owner] -= val; if (d.lives[owner] <= 0) { d.lives[owner] = 0; d.out[owner] = true; return { msg: '☠️ ' + nm(owner) + ' ist raus!' }; }
        return { msg: nm(owner) + ' verliert ' + val + (val > 1 ? ' Leben' : ' Leben') };
      } else if (P.cfg.chaos) d.lives[owner] = Math.min(L, d.lives[owner] + val);
    },
    alive(P, i) { return !P.d.out[i]; },
    over(P) { const al = P.d.out.map((o, i) => o ? -1 : i).filter(i => i >= 0); return al.length === 1 ? al[0] : al.length === 0 ? P.cur : null; },
    panel(P) {
      const d = P.d, L = P.cfg.lives;
      return `<div class="sides">${P.players.map((pid, i) => `<div class="pside ${i === P.cur ? 'act' : ''} ${d.out[i] ? 'out' : ''}"><div class="nm">${esc(pName(playerById(pid)))}</div><div class="big">${d.nums[i]}</div><div class="lives">${'❤️'.repeat(Math.max(0, d.lives[i]))}${'🖤'.repeat(Math.max(0, L - d.lives[i]))}</div><div class="sub">${d.out[i] ? 'RAUS' : d.killer[i] ? '💀 KILLER' : 'sammelt Leben'}</div></div>`).join('')}</div>`;
    },
    hint(P) { const d = P.d, me = P.cur; return d.killer[me] ? 'Ziel: Zahlen der Gegner' : 'Triff deine ' + d.nums[me] + ' um Killer zu werden'; },
  },
  highscore: {
    name: 'Highscore', em: '🔥', color: 't-dk', desc: 'Wer holt in X Runden die meisten Punkte?',
    cfg: { rounds: 7 },
    settings: c => pstep('Runden', 'rounds', c),
    init(P) { P.d = { pts: P.players.map(() => 0) }; },
    dart(P, n, m) { P.d.pts[P.cur] += n * m; },
    over(P) { if (P.round > P.cfg.rounds) return P.d.pts.indexOf(Math.max(...P.d.pts)); return null; },
    panel(P) { return `<div class="sides">${P.players.map((pid, i) => `<div class="pside ${i === P.cur ? 'act' : ''}"><div class="nm">${esc(pName(playerById(pid)))}</div><div class="big">${P.d.pts[i]}</div><div class="sub">Ø ${fmt(P.d.pts[i] / Math.max(1, P.round - (i < P.cur ? 0 : 1)), 1)}</div></div>`).join('')}</div>`; },
    hint(P) { return `Runde ${Math.min(P.round, P.cfg.rounds)} / ${P.cfg.rounds}`; },
  },
  shanghai: {
    name: 'Shanghai', em: '🀄', color: 't-gr', desc: 'Runde 1 zählt nur die 1, Runde 2 nur die 2 … Shanghai = sofortiger Sieg!',
    cfg: { rounds: 7 },
    settings: c => `${pseg('rounds', [[7, '1–7'], [10, '1–10'], [20, '1–20']], c)}<div class="xs mut">Shanghai: Single, Double und Triple der Rundenzahl in einer Aufnahme.</div>`,
    init(P) { P.d = { pts: P.players.map(() => 0), sh: [] }; },
    dart(P, n, m) {
      if (P.darts.length === 0) P.d.sh = [];
      if (n === P.round) { P.d.pts[P.cur] += n * m; P.d.sh.push(m); if ([1, 2, 3].every(k => P.d.sh.includes(k))) { P.d.win = P.cur; return { msg: '🀄 SHANGHAI!', end: true }; } }
    },
    over(P) { if (P.d.win != null) return P.d.win; if (P.round > P.cfg.rounds) return P.d.pts.indexOf(Math.max(...P.d.pts)); return null; },
    panel(P) { return `<div class="sides">${P.players.map((pid, i) => `<div class="pside ${i === P.cur ? 'act' : ''}"><div class="nm">${esc(pName(playerById(pid)))}</div><div class="big">${P.d.pts[i]}</div></div>`).join('')}</div>`; },
    hint(P) { return `Runde ${Math.min(P.round, P.cfg.rounds)}: Ziel ist die ${Math.min(P.round, P.cfg.rounds)}`; },
  },
};
Object.assign(RULES, {
  cricket: { t: 'Cricket', s: [['Es zählen nur 15, 16, 17, 18, 19, 20 und das Bull.', 'single'], ['Single = 1 Treffer, Double = 2, Triple = 3. Nach 3 Treffern ist die Zahl „zu“.', 'treble'], ['Weitere Treffer auf deine geschlossene Zahl geben Punkte – solange der Gegner sie noch offen hat.', 'treble'], ['Wer zuerst alles geschlossen hat und mindestens gleich viele Punkte hat, gewinnt.', 'bull']] },
  killer: { t: 'Killer', s: [['Jeder Spieler bekommt eine eigene Zahl (1–20).', 'single'], ['Triff deine Zahl, bis deine Leben voll sind – dann bist du KILLER.', 'double'], ['Als Killer triffst du die Zahlen der Gegner und nimmst ihnen Leben. Vorsicht: Deine eigene Zahl kostet dich jetzt Leben!', 'treble'], ['Wer 0 Leben hat, ist raus. Der Letzte gewinnt.', null]] },
  highscore: { t: 'Highscore', s: [['Jeder wirft pro Runde 3 Darts. Alle Punkte zählen.', 'treble'], ['Nach der letzten Runde gewinnt die höchste Gesamtpunktzahl.', null]] },
  shanghai: { t: 'Shanghai', s: [['In Runde 1 zählt nur die 1, in Runde 2 nur die 2 usw.', 'single'], ['Punkte = Zahl × Multiplikator. Andere Felder zählen nicht.', 'treble'], ['Single + Double + Triple der Rundenzahl in einer Aufnahme = SHANGHAI und sofortiger Sieg!', 'double']] },
});
function pseg(k, opts, c) { return `<div class="seg">${opts.map(([v, l]) => `<button data-pk="${k}" data-v="${v}" class="${c[k] == v ? 'on' : ''}">${l}</button>`).join('')}</div>`; }
function pstep(l, k, c) { return `<div class="row" style="margin:12px 0"><span class="sp">${l}</span><div class="stepper"><button data-pst="${k}" data-d="-1">−</button><b class="bb">${c[k]}</b><button data-pst="${k}" data-d="1">＋</button></div></div>`; }

V.partylist = () => ({
  title: 'CRICKET & PARTY', tab: 'play', left: backBtn(), right: spacer,
  html: Object.entries(PARTY).map(([k, g]) => `<button class="tile ${g.color}" style="width:100%;margin-bottom:12px;min-height:110px" data-pg="${k}"><span class="em" style="opacity:.6;font-size:40px">${g.em}</span><h3 class="bb">${g.name.toUpperCase()}</h3><p>${g.desc}</p></button>`).join(''),
  mount(r) { on(r, '[data-pg]', 'click', b => go('psetup', { g: b.dataset.pg })); }
});
V.psetup = (p) => {
  const g = PARTY[p.g]; S.psetup = S.psetup || {}; const su = S.psetup[p.g] = S.psetup[p.g] || { players: [S.me], cfg: Object.assign({}, g.cfg) };
  su.players = su.players.filter(id => S.players.some(x => x.id === id));
  return {
    title: g.name.toUpperCase(), tab: 'play', left: backBtn('partylist'), right: `<button class="ic" data-rules="${p.g}">?</button>`,
    html: `<div class="card"><div class="sec-h"><span style="font-size:22px">👥</span><h2 class="bb">Spieler</h2></div><div class="chips">${su.players.map(id => plChip(playerById(id), { x: true })).join('')}<div class="pl"><button class="add" data-addp>+</button><div class="nm mut">Spieler<br>hinzufügen</div></div></div></div>
      <div class="card"><div class="sec-h"><span style="font-size:22px">⚙️</span><h2 class="bb">Einstellungen</h2><button class="q" data-rules="${p.g}">?</button></div>${g.settings(su.cfg)}</div>
      <button class="btn" data-go>Spiel anfangen</button>`,
    mount(r) {
      on(r, '[data-rules]', 'click', b => showRules(b.dataset.rules));
      on(r, '[data-x]', 'click', b => { su.players = su.players.filter(id => id !== b.dataset.x); save(); render(); });
      on(r, '[data-addp]', 'click', () => addPlayerModal(su.players, id => { su.players.push(id); save(); render(); }));
      on(r, '[data-pk]', 'click', b => { const v = b.dataset.v; su.cfg[b.dataset.pk] = isNaN(+v) ? v : +v; save(); render(); });
      on(r, '[data-psw]', 'click', b => { su.cfg[b.dataset.psw] = !su.cfg[b.dataset.psw]; save(); render(); });
      on(r, '[data-pst]', 'click', b => { su.cfg[b.dataset.pst] = clamp(su.cfg[b.dataset.pst] + +b.dataset.d, 1, 30); save(); render(); });
      on(r, '[data-go]', 'click', () => {
        if (su.players.length < (g.min || 1)) return toast(`Mindestens ${g.min} Spieler`);
        const start = cfg => { const sides = su.players.map(id => ({ members: [id] })); const P = { id: uid(), mode: p.g, created: Date.now(), players: [...su.players], cfg, cur: 0, round: 1, darts: [], boardId: chooseBoard(sides).id }; g.init(P); S.pactive = P; save(true); go('pgame', { fresh: true }); };
        if (p.g === 'killer' && su.cfg.assign === 'manual') {
          const used = {};
          return modal(`<h2 class="bb">Zahlen wählen</h2>${su.players.map(id => `<div class="row field"><b class="sp">${esc(pName(playerById(id)))}</b><select data-num="${id}" style="width:100px">${Array.from({ length: 20 }, (_, i) => `<option>${i + 1}</option>`).join('')}</select></div>`).join('')}<button class="btn" id="kn">Start</button>`, (m, close) => {
            su.players.forEach((id, i) => { $(`[data-num="${id}"]`, m).value = String(20 - i); });
            $('#kn', m).onclick = () => { const nums = su.players.map(id => +$(`[data-num="${id}"]`, m).value); if (new Set(nums).size !== nums.length) return toast('Jede Zahl nur einmal'); close(); start({ ...su.cfg, nums }); };
          });
        }
        start({ ...su.cfg, nums: null });
      });
    }
  };
};
let PG = null;
V.pgame = (p) => {
  const P = S.pactive; if (!P) return { full: true, html: '', mount() { go('home'); } };
  const g = PARTY[P.mode];
  if (!PG || PG.P.id !== P.id) PG = { P, hist: [], mult: 1, stuck: [] };
  PG.P = P;
  return {
    full: true,
    html: `<div class="game"><div class="g-top"><button id="gx">⇦</button><h1 class="bb">${g.name.toUpperCase()}</h1><button id="grules">?</button></div>
      <div id="ppanel"></div><div class="who" id="who"></div>
      <div class="bwrap"><div class="bin" id="bin">${boardSVG(boardById(P.boardId))}</div><div id="bub"></div></div>
      <div class="visit"><div class="d" id="v0"></div><div class="d" id="v1"></div><div class="d" id="v2"></div><div class="tot" id="vt"></div><button class="sub" id="vsub">Weiter</button></div>
      <div class="pad"><div class="mrow"><button data-mu="1" class="on">Single</button><button data-mu="2" class="d2">Double</button><button data-mu="3" class="t3">Treble</button><button data-b="50">Bull<br><small>50</small></button><button data-b="25">Outer<br><small>25</small></button></div>
      <div class="keys" id="keys">${keysHTML(1)}</div>
      <div class="brow"><button id="gu">↶</button><button class="miss" id="gm">FALSCH</button><button id="gst">📈</button></div></div></div>`,
    mount() {
      sizeBoard(); prender(); pRedraw();
      const press = (n, mu) => { if (P.finished || inputLocked()) return; vibrate(8); pThrow(n, mu); };
      $('#keys').onclick = e => { const b = e.target.closest('[data-n]'); if (b) press(+b.dataset.n, PG.mult); };
      $$('[data-b]').forEach(b => b.onclick = () => press(25, b.dataset.b === '50' ? 2 : 1));
      $$('[data-mu]').forEach(b => b.onclick = () => { PG.mult = +b.dataset.mu; renderMult(PG.mult); });
      $('#gm').onclick = () => press(0, 0);
      $('#gu').onclick = pUndo;
      $('#vsub').onclick = () => { if (P.finished) return; while (PG.P.darts.length && !PG.P.finished) pThrow(0, 0, true); if (!PG.P.darts.length) { pThrow(0, 0, true); pThrow(0, 0, true); pThrow(0, 0, true); } };
      $('#grules').onclick = () => showRules(P.mode);
      $('#gx').onclick = () => modal(`<h2 class="bb">Spiel verlassen</h2><button class="btn" id="xp" style="margin-bottom:10px">⏸ Pausieren – später weiterspielen</button><button class="btn sec" id="xd" style="color:#f87171">🗑 Beenden ohne Wertung</button>`, (md, close) => { $('#xp', md).onclick = () => { close(); save(true); go('home'); }; $('#xd', md).onclick = () => { close(); discardGame('party'); }; });
      $('#gst').onclick = () => toast(g.hint ? g.hint(P) : 'Runde ' + P.round, 2200);
      if (p.fresh) { p.fresh = false; setTimeout(() => say((S.settings.caller === 'en' ? 'Game on! ' : 'Game on! ') + pName(playerById(P.players[0]))), 200); }
    }
  };
};
function prender() {
  const P = PG.P, g = PARTY[P.mode];
  $('#ppanel').innerHTML = g.panel(P);
  $('#who').innerHTML = P.finished ? 'SPIEL BEENDET' : `${esc(pName(playerById(P.players[P.cur]))).toUpperCase()} IST DRAN <span style="font-family:Inter;font-size:13px;color:var(--mut);margin-left:auto">${g.hint ? esc(g.hint(P)) : 'Runde ' + P.round}</span>`;
  for (let i = 0; i < 3; i++) $('#v' + i).innerHTML = dartBox(P.darts[i]);
  $('#vt').textContent = P.darts.reduce((a, d) => a + d.n * d.m, 0);
  renderMult(PG.mult);
}
function pRedraw() { PG.stuck.forEach(e => e.remove()); PG.stuck = []; sizeBoard(); PG.P.darts.forEach(d => flyDart($('#bin'), [d.x, d.y], PG.P.players[PG.P.cur], false, PG.stuck)); }
function pThrow(n, mu, silent) {
  const P = PG.P, g = PARTY[P.mode]; if (P.finished) return;
  if (PG.clearT) { clearTimeout(PG.clearT); PG.clearT = null; PG.stuck.forEach(e => e.remove()); PG.stuck = []; }
  PG.hist.push(JSON.stringify(P)); if (PG.hist.length > 300) PG.hist.shift();
  if (n === 0) mu = 0;
  const pt = pointFor(n, mu), pid = P.players[P.cur];
  if (!silent) { const ms = animateThrow(pt, pid, P.darts, P.boardId, dLabelFull(n, mu), $('#bin'), PG.stuck); setTimeout(() => impact(P.boardId, n === 0), ms); }
  const res = g.dart(P, n, mu) || {};
  if (S.settings.callEach && !silent && n > 0) callout('dart', n, mu);
  P.darts.push({ n, m: mu, x: +pt[0].toFixed(1), y: +pt[1].toFixed(1) });
  PG.mult = 1;
  if (res.msg) { toast(res.msg, 1600); say(res.msg.replace(/[^\p{L}\p{N} !]/gu, '')); }
  if (res.end || P.darts.length >= 3) pNext();
  else if (g.over(P) != null) pFinish();
  prender(); save();
}
function pNext() {
  const P = PG.P, g = PARTY[P.mode];
  const sc = P.darts.reduce((a, d) => a + d.n * d.m, 0);
  if (P.mode !== 'killer' && P.mode !== 'cricket') callout(S.settings.callEach ? 'total' : 'score', sc);
  P.darts = []; PG.clearT = setTimeout(() => { PG.stuck.forEach(e => e.remove()); PG.stuck = []; PG.clearT = null; }, 1000);
  if (g.over(P) != null) return pFinish();
  const n = P.players.length; let nx = P.cur, guard = 0;
  do { nx = (nx + 1) % n; if (nx === 0) P.round++; } while (g.alive && !g.alive(P, nx) && ++guard < n * 2);
  P.cur = nx;
  if (g.over(P) != null) return pFinish();
}
function pFinish() {
  const P = PG.P, g = PARTY[P.mode]; if (P.finished) return;
  P.finished = true; P.winner = g.over(P); P.ended = Date.now();
  S.party = S.party || []; S.party.push(P); S.pactive = null; save(true); chime(true); queueMatch(P);
  const w = playerById(P.players[P.winner]);
  say(S.settings.caller === 'en' ? `Game shot! ${pName(w)} wins!` : `${pName(w)} gewinnt!`);
  setTimeout(() => modal(`<div style="text-align:center;font-size:56px">🏆</div><h2 class="bb">${esc(pName(w))} gewinnt!</h2><p class="mut" style="text-align:center">${g.name}</p><div class="grid2"><button class="btn sec" id="pd">Fertig</button><button class="btn" id="pr">Nochmal</button></div>`, (m, close) => {
    $('#pd', m).onclick = () => { close(); PG = null; go('partylist'); };
    $('#pr', m).onclick = () => { close(); PG = null; go('psetup', { g: P.mode }); };
  }), 700);
}
function pUndo() {
  if (!PG.hist.length) return toast('Nichts zum Rückgängigmachen');
  const P = JSON.parse(PG.hist.pop()); S.pactive = P; PG.P = P; save();
  prender(); pRedraw(); vibrate(20);
}
