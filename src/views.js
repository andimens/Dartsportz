/* ================= KARRIERE ================= */
function startCareer(L) {
  const b = botDef(L), p = me();
  const sides = [{ name: pName(p), color: p.color, members: [p.id] }, { name: b.name, color: b.color, members: ['bot:' + L], bot: { level: L } }];
  whoStarts(sides, st => launchMatch(sides, careerFormat(L), st, { career: L }));
}
V.career = () => {
  const cur = Math.min(30, S.career.best + 1);
  let h = `<div class="story"><div class="row"><span style="font-size:30px">🏆</span><div class="sp"><b>Fortschritt ${S.career.best}/30</b><div class="bar" style="margin-top:6px"><i style="width:${S.career.best / 30 * 100}%"></i></div></div><button class="q" data-rules="career">?</button></div></div>`;
  for (const ch of CHAPTERS) {
    const open = cur >= ch.from;
    h += `<div class="lbl" style="color:${open ? 'var(--or)' : 'var(--dim)'}">${esc(ch.name)}</div>${open ? `<p class="mut sm" style="margin-top:0">${esc(ch.text)}</p>` : ''}`;
    for (let L = ch.from; L <= ch.to; L++) {
      const b = botDef(L), done = L <= S.career.best, lock = L > cur, rs = S.career.results[L];
      h += `<button class="lvl ${done ? 'done' : ''} ${L === cur ? 'cur' : ''} ${lock ? 'lock' : ''}" style="width:100%" data-l="${L}" ${lock ? 'disabled' : ''}><span class="n">${lock ? '🔒' : L}</span><div class="sp" style="text-align:left"><b>${esc(b.name)}</b><div class="mut xs">Ø ca. ${b.avg} · First to ${careerFormat(L).count} Legs${rs ? ` · ${rs.w}S/${rs.l}N` : ''}</div></div>${avatar(BOT_PLAYER('bot:' + L), 's')}</button>`;
    }
  }
  return {
    title: 'KARRIERE', left: backBtn(), right: spacer, html: h,
    mount(r) {
      on(r, '[data-rules]', 'click', () => showRules('career'));
      on(r, '[data-l]', 'click', bt => {
        const L = +bt.dataset.l, b = botDef(L);
        modal(`<div style="display:flex;justify-content:center">${avatar(BOT_PLAYER('bot:' + L))}</div><h2 class="bb">${esc(b.name)}</h2><div class="bubble" style="position:static;margin-bottom:14px"><small>Level ${L}</small>„${esc(botLine(L, 'intro'))}“</div><div class="stats3" style="margin-bottom:14px"><div class="stat"><b>${b.avg}</b><span>Ø Average</span></div><div class="stat"><b>501</b><span>Doppel aus</span></div><div class="stat"><b>FT${careerFormat(L).count}</b><span>Legs</span></div></div><button class="btn" id="cgo">Match starten</button>`, (m, close) => { $('#cgo', m).onclick = () => { close(); startCareer(L); }; });
      });
    }
  };
};

/* ================= TRAINING ================= */
const DRILLS = [
  { id: 'bull', name: 'Bullseye', em: '🔴', desc: 'X Würfe aufs Bull – Treffer/Daneben' },
  { id: 'double', name: 'Doppel-Training', em: '🟢', desc: 'Ein Doppel oder alle der Reihe nach' },
  { id: 'treble', name: 'Treble-Training', em: '🔺', desc: 'T20, T19 … Scoring trainieren' },
  { id: 'atc', name: 'Around the Clock', em: '🕐', desc: '1 bis 20 + Bull – wie viele Darts?' },
  { id: 'bobs', name: "Bob's 27", em: '💯', desc: 'Der Doppel-Klassiker der Profis' },
  { id: 'finish', name: 'Finish-Training', em: '✅', desc: 'Zufälliger Rest, 9 Darts zum Checken' },
];
const DBL_LIST = [...Array.from({ length: 20 }, (_, i) => 'D' + (i + 1)), 'BULL'];
V.train = () => {
  const recent = S.training.slice(-5).reverse();
  return {
    title: 'TRAINING', left: backBtn(), right: spacer,
    html: DRILLS.map(d => `<button class="card row" style="width:100%" data-d="${d.id}"><span style="font-size:30px">${d.em}</span><div class="sp" style="text-align:left"><b style="font-size:17px">${d.name}</b><div class="mut sm">${d.desc}</div></div><span class="q" data-r="${d.id}">?</span></button>`).join('') +
      (recent.length ? `<div class="lbl">Zuletzt</div><div class="card list">${recent.map(t => `<div class="it"><span class="sp">${esc(drillTitle(t))}<div class="mut xs">${new Date(t.date).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</div></span><b>${t.drill === 'bobs' ? t.score + ' P' : t.drill === 'atc' ? t.attempts + ' Darts' : Math.round(t.hits / Math.max(1, t.attempts) * 100) + '%'}</b></div>`).join('')}</div>` : ''),
    mount(r) {
      on(r, '[data-r]', 'click', (b, e) => { e.stopPropagation(); showRules(b.dataset.r); });
      on(r, '[data-d]', 'click', (b, e) => { if (e.target.closest('[data-r]')) return; drillConfig(b.dataset.d); });
    }
  };
};
function drillTitle(t) { const d = DRILLS.find(x => x.id === t.drill); return d.name + (t.label ? ' · ' + t.label : ''); }
function drillConfig(id) {
  const c = { n: 30, target: id === 'treble' ? 'T20' : id === 'double' ? 'D20' : 'BULL', all: false, per: 3, ring: 'S', bullMode: '50', rounds: 10 };
  const body = () => {
    if (id === 'bull') return `<div class="seg"><button data-k="bullMode" data-v="50" class="${c.bullMode === '50' ? 'on' : ''}">Nur Bull (50)</button><button data-k="bullMode" data-v="25" class="${c.bullMode === '25' ? 'on' : ''}">Bull + 25</button></div>${stepRow('Anzahl Würfe', 'n', c.n)}`;
    if (id === 'double') return `<div class="seg"><button data-k="all" data-v="0" class="${!c.all ? 'on' : ''}">Ein Doppel</button><button data-k="all" data-v="1" class="${c.all ? 'on' : ''}">Alle der Reihe nach</button></div>${c.all ? stepRow('Darts pro Doppel', 'per', c.per) : `<select id="tg">${DBL_LIST.map(x => `<option ${x === c.target ? 'selected' : ''}>${x}</option>`).join('')}</select>${stepRow('Anzahl Würfe', 'n', c.n)}`}`;
    if (id === 'treble') return `<select id="tg">${Array.from({ length: 20 }, (_, i) => 'T' + (20 - i)).map(x => `<option ${x === c.target ? 'selected' : ''}>${x}</option>`).join('')}</select>${stepRow('Anzahl Würfe', 'n', c.n)}`;
    if (id === 'atc') return `<div class="seg"><button data-k="ring" data-v="S" class="${c.ring === 'S' ? 'on' : ''}">Singles</button><button data-k="ring" data-v="D" class="${c.ring === 'D' ? 'on' : ''}">Doppel</button><button data-k="ring" data-v="T" class="${c.ring === 'T' ? 'on' : ''}">Triples</button></div>`;
    if (id === 'finish') return stepRow('Anzahl Runden', 'rounds', c.rounds);
    return '<p class="mut">Start mit 27 Punkten. D1 bis D20, dann Bull. Pro Doppel 3 Darts – du gibst die Anzahl der Treffer ein.</p>';
  };
  const stepRow = (l, k, v) => `<div class="row" style="margin:12px 0"><span class="sp">${l}</span><div class="stepper"><button data-st="${k}" data-d="-1">−</button><b class="bb">${v}</b><button data-st="${k}" data-d="1">＋</button></div></div>`;
  const d = DRILLS.find(x => x.id === id);
  modal(`<h2 class="bb">${d.em} ${d.name}</h2><div id="dc"></div><div style="height:8px"></div><button class="btn" id="dgo">Start</button>`, (m, close) => {
    const draw = () => { $('#dc', m).innerHTML = body(); const tg = $('#tg', m); tg && (tg.onchange = () => c.target = tg.value); };
    draw();
    on(m, '[data-k]', 'click', b => { const v = b.dataset.v; c[b.dataset.k] = b.dataset.k === 'all' ? v === '1' : v; draw(); });
    on(m, '[data-st]', 'click', b => { const k = b.dataset.st, step = k === 'n' ? 5 : 1; c[k] = clamp(c[k] + step * +b.dataset.d, 1, k === 'n' ? 300 : 30); draw(); });
    $('#dgo', m).onclick = () => { close(); go('drill', { id, c }); };
  });
}
function buildDrill(id, c) {
  const run = { id, c, i: 0, log: [], hits: 0, attempts: 0, done: false };
  if (id === 'bull') { run.seq = Array(c.n).fill(c.bullMode === '50' ? 'BULL' : 'BULL / 25'); run.label = c.bullMode === '50' ? 'Bull' : 'Bull+25'; }
  if (id === 'double') { if (c.all) { run.seq = DBL_LIST.flatMap(x => Array(c.per).fill(x)); run.label = 'Alle Doppel'; } else { run.seq = Array(c.n).fill(c.target); run.label = c.target; } }
  if (id === 'treble') { run.seq = Array(c.n).fill(c.target); run.label = c.target; }
  if (id === 'atc') { run.seq = [...Array.from({ length: 20 }, (_, i) => (c.ring === 'S' ? '' : c.ring) + (i + 1)), 'BULL']; run.advance = true; run.label = { S: 'Singles', D: 'Doppel', T: 'Triples' }[c.ring]; }
  if (id === 'bobs') { run.seq = DBL_LIST; run.score = 27; run.label = ''; }
  if (id === 'finish') { run.seq = Array.from({ length: c.rounds }, () => { let r; do { r = 41 + Math.floor(Math.random() * 80); } while (!checkout(r, 3)); return String(r); }); run.label = c.rounds + ' Runden'; }
  return run;
}
V.drill = (p) => {
  if (!p.run) p.run = buildDrill(p.id, p.c);
  const run = p.run, d = DRILLS.find(x => x.id === run.id);
  const draw = r => {
    const t = run.seq[Math.min(run.i, run.seq.length - 1)];
    const pct = run.attempts ? Math.round(run.hits / run.attempts * 100) : 0;
    let mid = '', btns = '';
    if (run.done) {
      mid = `<div style="text-align:center;font-size:60px">🏁</div><div class="drill-big" style="font-size:72px">${run.id === 'bobs' ? run.score : run.id === 'atc' ? run.attempts : pct + '%'}</div><p class="mut" style="text-align:center">${run.id === 'bobs' ? (run.score < 0 ? 'Unter 0 gefallen – Spiel vorbei.' : 'Punkte') : run.id === 'atc' ? 'Darts benötigt' : `${run.hits} von ${run.attempts} getroffen`}</p>`;
      btns = `<div class="grid2"><button class="btn sec" id="dback">Fertig</button><button class="btn" id="dagain">Nochmal</button></div>`;
    } else if (run.id === 'bobs') {
      mid = `<div class="mut" style="text-align:center">Punkte: <b style="color:var(--txt);font-size:22px">${run.score}</b></div><div class="drill-big">${t}</div><p class="mut" style="text-align:center">Wie viele Treffer mit 3 Darts?</p>`;
      btns = `<div class="grid2" style="grid-template-columns:repeat(4,1fr)">${[0, 1, 2, 3].map(k => `<button class="btn ${k ? '' : 'sec'}" style="height:84px;font-size:30px" data-hits="${k}">${k}</button>`).join('')}</div>`;
    } else if (run.id === 'finish') {
      const co = checkout(+t, 3);
      mid = `<div class="mut" style="text-align:center">Runde ${run.i + 1}/${run.seq.length} · ${run.hits} gecheckt</div><div class="drill-big">${t}</div><p style="text-align:center;font-weight:800;color:var(--or2)">${co ? co.map(dLabel).join(' · ') : ''}</p><p class="mut sm" style="text-align:center">9 Darts Zeit</p>`;
      btns = `<div class="hitbtns"><button class="nohit" data-h="0">Nicht gecheckt</button><button class="hit" data-h="1">Gecheckt ✓</button></div>`;
    } else {
      mid = `<div class="mut" style="text-align:center">${run.advance ? `Darts: ${run.attempts}` : `Wurf ${run.attempts + 1}/${run.seq.length} · ${pct}%`}</div><div class="drill-big">${t}</div>`;
      btns = `<div class="hitbtns"><button class="nohit" data-h="0">Daneben ✗</button><button class="hit" data-h="1">Getroffen ✓</button></div>`;
    }
    const hl = run.id === 'bull' ? 'bull' : run.id === 'treble' ? 'treble' : (run.id === 'double' || run.id === 'bobs') ? 'double' : null;
    $('#dv', r).innerHTML = `<div class="bar" style="margin-bottom:10px"><i style="width:${(run.done ? 1 : run.i / run.seq.length) * 100}%"></i></div>${!run.done ? `<div style="width:150px;height:150px;margin:0 auto">${boardSVG(boardById(me().board), { highlight: hl, numbers: false })}</div>` : ''}${mid}${btns}${!run.done && run.log.length ? '<button class="btn ghost" style="margin-top:12px" id="dundo">↶ Rückgängig</button>' : ''}`;
  };
  const finish = () => { run.done = true; S.training.push({ id: uid(), drill: run.id, label: run.label, date: Date.now(), hits: run.hits, attempts: run.attempts, score: run.score, log: run.log, pid: S.me }); save(true); chime(true); };
  return {
    title: d.name.toUpperCase(), tab: 'train', left: backBtn('train'), right: `<button class="ic" onclick="showRules('${run.id}')">?</button>`, html: '<div id="dv"></div>',
    mount(r) {
      draw(r);
      on(r, '[data-h]', 'click', b => {
        const hit = b.dataset.h === '1'; vibrate(hit ? 25 : 8); impact(me().board, !hit);
        run.log.push({ t: run.seq[run.i], hit }); run.attempts++; if (hit) run.hits++;
        if (!run.advance || hit) run.i++;
        if (run.i >= run.seq.length) finish();
        draw(r);
      });
      on(r, '[data-hits]', 'click', b => {
        const k = +b.dataset.hits, t = run.seq[run.i], v = t === 'BULL' ? 50 : 2 * +t.slice(1);
        run.log.push({ t, hits: k }); run.attempts += 3; run.hits += k; run.score += k ? k * v : -v; run.i++;
        impact(me().board, !k);
        if (run.score < 0 || run.i >= run.seq.length) finish();
        draw(r);
      });
      on(r, '#dundo', 'click', () => {
        const l = run.log.pop(); if (!l) return;
        if (run.id === 'bobs') { const v = l.t === 'BULL' ? 50 : 2 * +l.t.slice(1); run.score -= l.hits ? l.hits * v : -v; run.attempts -= 3; run.hits -= l.hits; run.i--; }
        else { run.attempts--; if (l.hit) run.hits--; if (!run.advance || l.hit) run.i--; }
        draw(r);
      });
      on(r, '#dback', 'click', () => go('train'));
      on(r, '#dagain', 'click', () => go('drill', { id: run.id, c: run.c }));
    }
  };
};

/* ================= STATISTIK ================= */
let statUI = { pid: null, tab: 'x01', per: 'year', off: 0 };
function periodFilter() {
  const now = new Date(); const { per, off } = statUI;
  if (per === 'all') return { f: () => true, label: 'Allzeit' };
  if (per === 'year') { const y = now.getFullYear() + off; return { f: m => new Date(m.created || m.date).getFullYear() === y, label: String(y) }; }
  const d = new Date(now.getFullYear(), now.getMonth() + off, 1);
  return { f: m => { const x = new Date(m.created || m.date); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth(); }, label: d.toLocaleString('de-DE', { month: 'long', year: 'numeric' }) };
}
V.stats = () => {
  statUI.pid = statUI.pid && S.players.some(p => p.id === statUI.pid) ? statUI.pid : S.me;
  const pf = periodFilter(); const pid = statUI.pid;
  const pl = S.players.filter(p => !p.remote).map(p => `<button class="pl" data-pid="${p.id}" style="opacity:${p.id === pid ? 1 : .45}">${avatar(p, 's')}<div class="nm">${esc(pName(p))}</div></button>`).join('');
  let body = '';
  if (statUI.tab === 'x01') {
    const t = statsFor(pid, pf.f);
    if (!t.darts) body = '<div class="empty">Noch keine Spiele in diesem Zeitraum.</div>';
    else {
      const hmax = Math.max(1, ...Object.entries(t.heat).filter(([k]) => k !== 'MISS').map(([, v]) => v));
      const avgs = t.avgs.slice(-30), mx = Math.max(60, ...avgs.map(a => a.avg));
      body = `<div class="stats3" style="margin-bottom:8px"><div class="stat"><b style="color:var(--or)">${fmt(t.avg)}</b><span>3-Dart Ø</span></div><div class="stat"><b>${fmt(t.f9)}</b><span>First 9 Ø</span></div><div class="stat"><b>${fmt(t.co, 1)}%</b><span>Checkout (${t.hit}/${t.att})</span></div>
        <div class="stat"><b>${t.s180}</b><span>180er</span></div><div class="stat"><b>${t.s140}</b><span>140+</span></div><div class="stat"><b>${t.s100}</b><span>100+</span></div>
        <div class="stat"><b>${t.hiFin || '–'}</b><span>Höchstes Finish</span></div><div class="stat"><b>${t.bestLeg || '–'}</b><span>Bestes Leg (Darts)</span></div><div class="stat"><b>${t.hiScore}</b><span>Höchste Aufnahme</span></div>
        <div class="stat"><b>${t.wins}:${t.losses}</b><span>Siege:Niederl.</span></div><div class="stat"><b>${t.legsWon}/${t.legs}</b><span>Legs gewonnen</span></div><div class="stat"><b>${t.darts}</b><span>Darts gesamt</span></div></div>
        <div class="card"><div class="lbl" style="margin-top:0">Average-Verlauf</div><div class="chart">${avgs.map(a => `<i class="${a.won ? 'w' : ''}" style="height:${a.avg / mx * 100}%" title="${fmt(a.avg)}"></i>`).join('')}</div><div class="xs mut" style="margin-top:4px">grün = gewonnen</div></div>
        <div class="card"><div class="lbl" style="margin-top:0">Treffer-Heatmap</div><div style="max-width:300px;margin:0 auto">${boardSVG(boardById(me().board), { heat: t.heat, max: hmax })}</div><div class="xs mut" style="text-align:center">Daneben: ${t.heat.MISS || 0}</div></div>
        <div class="card"><div class="lbl" style="margin-top:0">Checkout-Quote pro Doppel</div>${Object.entries(t.dbl).sort((a, b) => b[1].a - a[1].a).map(([k, v]) => `<div class="row sm" style="margin:6px 0"><b style="width:44px">${k}</b><div class="bar sp"><i style="width:${v.h / v.a * 100}%"></i></div><span style="width:86px;text-align:right">${Math.round(v.h / v.a * 100)}% (${v.h}/${v.a})</span></div>`).join('') || '<div class="mut sm">Noch keine Checkout-Versuche</div>'}</div>`;
    }
  } else if (statUI.tab === 'train') {
    const tr = S.training.filter(t => (t.pid || S.me) === pid && pf.f(t) && !statHidden(pid, t.date));
    if (!tr.length) body = '<div class="empty">Noch keine Trainings in diesem Zeitraum.</div>';
    else {
      const g = {}; tr.forEach(t => { const k = drillTitle(t); (g[k] = g[k] || []).push(t); });
      body = Object.entries(g).map(([k, a]) => { const isB = a[0].drill === 'bobs', isA = a[0].drill === 'atc'; const val = t => isB ? t.score : isA ? t.attempts : t.hits / Math.max(1, t.attempts) * 100; const vals = a.map(val); const avg = vals.reduce((x, y) => x + y, 0) / vals.length; const best = isA ? Math.min(...vals) : Math.max(...vals); const mx = Math.max(1, ...vals); return `<div class="card"><div class="row"><b class="sp">${esc(k)}</b><span class="badge">${a.length}×</span></div><div class="stats3" style="margin:10px 0"><div class="stat"><b>${isB || isA ? Math.round(avg) : fmt(avg, 1) + '%'}</b><span>Schnitt</span></div><div class="stat"><b>${isB || isA ? best : fmt(best, 1) + '%'}</b><span>Bestwert</span></div><div class="stat"><b>${isB || isA ? Math.round(vals[vals.length - 1]) : Math.round(vals[vals.length - 1]) + '%'}</b><span>Zuletzt</span></div></div><div class="chart" style="height:50px">${vals.slice(-30).map(v => `<i style="height:${Math.max(2, v / mx * 100)}%"></i>`).join('')}</div></div>`; }).join('');
    }
  } else {
    const r = h2h(pid);
    const ents = Object.entries(r);
    body = ents.length ? ents.map(([oid, x]) => { const o = playerById(oid.startsWith('bot:') ? oid : oid); return `<div class="card"><div class="row">${avatar(o, 's')}<b class="sp">${esc(o ? o.name : '?')}</b><span class="bb" style="font-size:28px;color:${x.w >= x.l ? 'var(--ok)' : 'var(--bad)'}">${x.w}:${x.l}</span></div><div class="list" style="margin-top:6px">${x.games.slice(-5).reverse().map(gm => `<div class="it sm"><span style="color:${gm.won ? 'var(--ok)' : 'var(--bad)'};font-weight:800;width:18px">${gm.won ? 'S' : 'N'}</span><span class="sp">${new Date(gm.m.created).toLocaleDateString('de-DE')} · ${gm.score}</span><span class="mut">Ø ${fmt(gm.my)} : ${fmt(gm.op)}</span></div>`).join('')}</div></div>`; }).join('') : '<div class="empty">Noch keine 1-gegen-1-Spiele.</div>';
  }
  return {
    title: 'STATISTIKEN', left: backBtn(), right: spacer,
    html: `<div class="chips">${pl}</div><div class="seg"><button data-tab="x01" class="${statUI.tab === 'x01' ? 'on' : ''}">X01</button><button data-tab="train" class="${statUI.tab === 'train' ? 'on' : ''}">Training</button><button data-tab="h2h" class="${statUI.tab === 'h2h' ? 'on' : ''}">Bilanz</button></div>
      ${body}<div class="card"><div class="seg" style="margin-top:0"><button data-per="month" class="${statUI.per === 'month' ? 'on' : ''}">Monat</button><button data-per="year" class="${statUI.per === 'year' ? 'on' : ''}">Jahr</button><button data-per="all" class="${statUI.per === 'all' ? 'on' : ''}">Allzeit</button></div>${statUI.per !== 'all' ? `<div class="row"><button class="btn sm sec" data-off="-1">‹</button><b class="sp" style="text-align:center">${pf.label}</b><button class="btn sm sec" data-off="1">›</button></div>` : ''}</div>
      <div class="grid2"><button class="btn sec sm" style="width:100%" data-rst="day">↺ Heute zurücksetzen</button><button class="btn ghost sm" style="width:100%;color:#f87171" data-rst="all">🗑 Alles zurücksetzen</button></div>`,
    mount(r) {
      on(r, '[data-pid]', 'click', b => { statUI.pid = b.dataset.pid; render(); });
      on(r, '[data-tab]', 'click', b => { statUI.tab = b.dataset.tab; render(); });
      on(r, '[data-rst]', 'click', b => b.dataset.rst === 'day' ? resetToday(pid) : resetAll(pid));
      on(r, '[data-per]', 'click', b => { statUI.per = b.dataset.per; statUI.off = 0; render(); });
      on(r, '[data-off]', 'click', b => { statUI.off = Math.min(0, statUI.off + +b.dataset.off); render(); });
    }
  };
};

/* ---------- Statistik zurücksetzen ---------- */
const ADMIN_MAIL = 'Andi.mens@web.de';
async function resetToday(pid) {
  const p = playerById(pid);
  if (!(await confirmBox(`Heutige Statistik von ${pName(p)} zurücksetzen?`, 'Zurücksetzen'))) return;
  const d = new Date(); d.setHours(0, 0, 0, 0);
  S.statResets = S.statResets || {}; const r = S.statResets[pid] = S.statResets[pid] || {};
  (r.ranges = r.ranges || []).push([d.getTime(), Date.now() + 1]); save(true); toast('Heutige Statistik zurückgesetzt'); render();
}
function doResetAll(pid) { S.statResets = S.statResets || {}; S.statResets[pid] = { all: Date.now() + 1 }; save(true); toast('Komplette Statistik zurückgesetzt'); render(); }
async function resetAll(pid) {
  const p = playerById(pid);
  const isAdmin = me() && me().admin;
  if (pid !== S.me || isAdmin || !online()) {
    // Admin, Gäste oder offline: Zahl zur Bestätigung abtippen
    const n = String(100000 + Math.floor(Math.random() * 900000));
    return modal(`<h2 class="bb">Alles löschen?</h2><p class="sm">Die komplette Statistik von <b>${esc(pName(p))}</b> wird zurückgesetzt. Zur Bestätigung diese Zahl eingeben:</p><div class="bb" style="font-size:44px;text-align:center;letter-spacing:6px;color:var(--or)">${n}</div><input id="rn" type="text" inputmode="numeric" placeholder="Zahl eingeben"><div style="height:10px"></div><button class="btn" id="rok" style="background:var(--bad)">Endgültig zurücksetzen</button>`, (m, close) => { $('#rok', m).onclick = () => { if ($('#rn', m).value.trim() !== n) return toast('Zahl stimmt nicht'); close(); doResetAll(pid); }; });
  }
  modal(`<h2 class="bb">Alles löschen?</h2><p class="sm">Zur Sicherheit braucht ein Komplett-Reset einen <b>Bestätigungscode vom Admin</b>.</p><ol class="sm" style="line-height:1.6"><li>Auf „Code anfordern“ tippen – der Admin bekommt den Code in seiner App und eine Mail von dir</li><li>Code vom Admin hier eingeben</li></ol><button class="btn sec" id="rq" style="margin-bottom:10px">📨 Code anfordern</button><input id="rc" type="text" inputmode="numeric" placeholder="6-stelliger Code vom Admin"><div style="height:10px"></div><button class="btn" id="rv" style="background:var(--bad)">Bestätigen & zurücksetzen</button>`, (m, close) => {
    $('#rq', m).onclick = async () => {
      const { error } = await sb.rpc('request_reset'); if (error) return toast('Fehler: ' + error.message, 3500);
      const subj = encodeURIComponent('Dartsportz: Statistik-Reset angefragt'), body = encodeURIComponent(`Hallo Admin,\n\n${me().name} möchte die komplette Statistik zurücksetzen.\nBitte schick mir den Bestätigungscode aus der App (Account → Admin → Reset-Anfragen).\n\nDanke!`);
      toast('Anfrage gesendet – Mail-App öffnet sich', 2500);
      setTimeout(() => { location.href = `mailto:${ADMIN_MAIL}?subject=${subj}&body=${body}`; }, 600);
    };
    $('#rv', m).onclick = async () => { const c = $('#rc', m).value.trim(); if (!c) return; const { data } = await sb.rpc('verify_reset', { p_code: c }); if (!data) return toast('Code falsch oder abgelaufen', 3000); close(); doResetAll(pid); };
  });
}

/* ================= PROFIL / SPIELER ================= */
V.user = () => {
  const p = me(); const guests = S.players.filter(x => x.id !== S.me && !x.remote && !x.friend);
  return {
    title: 'PROFIL', left: backBtn(), right: `<button class="ic" onclick="go('settings')">⚙</button>`,
    html: `<div class="card" style="text-align:center"><div style="display:flex;justify-content:center">${avatar(p)}</div><h2 class="bb" style="font-size:34px;margin:8px 0 0">${esc(p.name)} ${flag(p.country)}</h2><div class="mut sm">${[p.nick && '„' + esc(p.nick) + '“', p.age && p.age + ' Jahre', p.height && p.height + ' cm', p.hand && (p.hand === 'links' ? 'Linkshänder' : 'Rechtshänder')].filter(Boolean).join(' · ')}</div>
      <div class="row" style="justify-content:center;margin-top:8px"><div style="width:44px;height:44px">${boardSVG(boardById(p.board), { numbers: false })}</div><span class="sm">${esc(boardById(p.board).name)}</span></div>
      <div class="grid2" style="margin:14px 0 0"><button class="btn sec" data-edit="${p.id}">Profil bearbeiten</button><button class="btn" data-darts="${p.id}">🎯 Meine Pfeile</button></div></div>
      <div class="dartprev">${dartSVG(dartOf(p), 'pv')}</div>
      <div class="lbl">Gespeicherte Spieler & Gäste</div><div class="card list">${guests.map(g => `<button class="it" style="width:100%" data-edit="${g.id}">${avatar(g, 's')}<div class="sp" style="text-align:left"><b>${esc(g.name)}</b> <span class="flag">${flag(g.country)}</span><div class="mut xs">Gast · Code ${g.linkCode}</div></div><span class="mut">›</span></button>`).join('') || '<div class="mut sm">Noch keine Gäste.</div>'}<button class="btn ghost" style="margin-top:10px" data-new>＋ Gast anlegen</button></div>
      <div class="lbl">Teams</div><div class="card list">${S.teams.map(t => `<button class="it" style="width:100%" data-team="${t.id}"><span style="width:14px;height:14px;border-radius:4px;background:${t.color}"></span><b class="sp" style="text-align:left">${esc(t.name)}</b><span class="mut sm">${t.members.length} Spieler</span></button>`).join('') || '<div class="mut sm">Teams legst du beim Spielstart an.</div>'}</div>`,
    mount(r) {
      on(r, '[data-edit]', 'click', b => editPlayer(b.dataset.edit, render));
      on(r, '[data-darts]', 'click', b => go('darts', { pid: b.dataset.darts }));
      on(r, '[data-new]', 'click', () => { const g = newPlayer({ name: 'Gast ' + (guests.length + 1) }); editPlayer(g.id, render); });
      on(r, '[data-team]', 'click', b => editTeam(b.dataset.team, render));
    }
  };
};
function editPlayer(pid, done) {
  const p = S.players.find(x => x.id === pid); if (!p) return toast('Bots kann man nicht bearbeiten');
  modal(`<h2 class="bb">${p.guest ? 'Gast' : 'Profil'} bearbeiten</h2>
    <div class="row" style="margin-bottom:12px">${avatar(p)}<button class="btn sm sec" id="pav">Foto wählen</button>${p.avatar ? '<button class="btn sm sec" id="pavx">✕</button>' : ''}<span class="sp"></span><input id="pco" type="color" value="${p.color}"></div>
    <div class="grid2" style="margin:0"><div class="field"><label>Name</label><input id="pn" type="text" value="${esc(p.name)}"></div><div class="field"><label>Spitzname</label><input id="pni" type="text" value="${esc(p.nick)}"></div></div>
    <div class="field"><label>Land</label><select id="pc">${COUNTRIES.map(([c, n]) => `<option value="${c}" ${c === p.country ? 'selected' : ''}>${flag(c)} ${n}</option>`).join('')}</select></div>
    <div class="grid2" style="margin:0"><div class="field"><label>Alter</label><input id="pa" type="number" inputmode="numeric" value="${esc(p.age)}"></div><div class="field"><label>Größe (cm)</label><input id="ph" type="number" inputmode="numeric" value="${esc(p.height)}"></div></div>
    <div class="field"><label>Caller-Name</label><button class="btn sec sm" id="pcn" style="width:100%">🎤 ${esc((CALL_NAMES.find(n => callSlug(n) === (p.callName || (p.dart && p.dart.callName))) || (p.callName === '' ? 'ohne Namen' : 'auswählen')))}</button></div>
    <div class="field"><label>Wurfhand</label><div class="seg" style="margin:0"><button data-hand="rechts" class="${p.hand === 'rechts' ? 'on' : ''}">Rechts</button><button data-hand="links" class="${p.hand === 'links' ? 'on' : ''}">Links</button></div></div>
    <div class="field"><label>Lieblingsscheibe</label><div class="grid2" style="grid-template-columns:repeat(5,1fr);gap:6px">${BOARDS.map(b => `<button data-bd="${b.id}" style="border-radius:50%;padding:2px;border:3px solid ${b.id === p.board ? 'var(--or)' : 'transparent'}" title="${esc(b.name)}">${boardSVG(b, { numbers: false })}</button>`).join('')}</div><div class="sm" id="pbn" style="text-align:center;margin-top:4px">${esc(boardById(p.board).name)}</div></div>
    ${p.guest ? `<div class="card" style="background:var(--card2)"><b>Account-Übernahme</b><div class="mut sm">Wenn ${esc(p.name)} sich später registriert, überträgt dieser Code alle Spiele & Statistiken auf seinen Account:</div><div class="bb" style="font-size:34px;color:var(--or);letter-spacing:3px;text-align:center">${p.linkCode}</div><button class="btn sm sec" id="gcl" style="width:100%">☁️ Code mit Spielen hochladen</button></div>` : ''}
    <div class="grid2"><button class="btn sec" id="pd">🎯 Pfeile</button><button class="btn" id="ps">Speichern</button></div>
    ${p.guest ? '<button class="btn ghost" id="pdel" style="color:#f87171">Gast löschen</button>' : ''}`, (m, close) => {
    const sv = () => { p.name = $('#pn', m).value.trim() || p.name; p.nick = $('#pni', m).value.trim(); p.country = $('#pc', m).value; p.age = $('#pa', m).value; p.height = $('#ph', m).value; p.color = $('#pco', m).value; save(); if (p.id === S.me) pushProfile(); };
    $('#gcl', m) && ($('#gcl', m).onclick = () => uploadGuestClaim(p));
    on(m, '[data-hand]', 'click', b => { p.hand = b.dataset.hand; $$('[data-hand]', m).forEach(x => x.classList.toggle('on', x === b)); });
    on(m, '[data-bd]', 'click', b => { p.board = b.dataset.bd; $$('[data-bd]', m).forEach(x => x.style.borderColor = x === b ? 'var(--or)' : 'transparent'); $('#pbn', m).textContent = boardById(p.board).name; });
    $('#ps', m).onclick = () => { sv(); close(); done && done(); };
    $('#pcn', m).onclick = () => { sv(); close(); pickCallName(p, () => editPlayer(pid, done)); };
    $('#pd', m).onclick = () => { sv(); close(); go('darts', { pid, from: route.name }); };
    $('#pav', m).onclick = async () => { const f = await pickFile(); if (!f) return; sv(); p.avatar = await resizeImage(f, 200, .8); save(); close(); editPlayer(pid, done); };
    $('#pavx', m) && ($('#pavx', m).onclick = () => { sv(); p.avatar = null; save(); close(); editPlayer(pid, done); });
    $('#pdel', m) && ($('#pdel', m).onclick = async () => { close(); if (await confirmBox(p.name + ' löschen?', 'Löschen')) { S.players = S.players.filter(x => x.id !== pid); S.teams.forEach(t => t.members = t.members.filter(id => id !== pid)); save(); done && done(); } });
  });
}

/* ================= PFEIL-DESIGNER ================= */
V.darts = (p) => {
  const pl = S.players.find(x => x.id === p.pid) || me();
  pl.dart = dartOf(pl); const d = pl.dart;
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-k="${k}" data-v="${v}" class="${d[k] == v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const rng = (k, l, a, b, unit, step = 1) => `<div class="field"><label>${l}: <b id="l_${k}">${d[k]}</b> ${unit}</label><input type="range" data-r="${k}" min="${a}" max="${b}" step="${step}" value="${d[k]}"></div>`;
  const col = (k, l) => `<div class="row" style="margin:6px 0"><span class="sp sm">${l}</span><input type="color" data-c="${k}" value="${d[k]}"></div>`;
  return {
    title: 'PFEIL-DESIGNER', tab: 'user', left: backBtn(p.from || 'user'), right: spacer,
    html: `<div class="dartprev stick" id="dp">${dartSVG(d, 'dz')}</div>
      <div class="row card"><div class="sp"><b>${esc(pl.name)}</b><div class="mut sm">Gesamtgewicht ca. ${fmt(dartWeightTotal(d), 1)} g · Länge ${d.tipLen + d.barrelLen + (d.system === 'onepiece' ? 22 : SHAFT_LEN[d.shaftLen]) + 30} mm</div></div></div>
      <div class="field"><label>Name des Sets</label><input type="text" id="dn" value="${esc(d.name)}"></div>
      <div class="lbl">System</div>${seg('system', [['classic', 'Schaft + Flight'], ['onepiece', 'Flight-Schaft-System (1 Teil)']])}
      <div class="lbl">Spitze</div><div class="card">${rng('tipLen', 'Länge', 26, 41, 'mm')}${col('tipColor', 'Farbe')}</div>
      <div class="lbl">Barrel</div><div class="card">${seg('barrelShape', [['straight', 'Gerade'], ['torpedo', 'Torpedo'], ['scalloped', 'Scalloped'], ['bomb', 'Bomb']])}${rng('barrelLen', 'Länge', 38, 56, 'mm')}${rng('barrelWeight', 'Gewicht', 16, 30, 'g')}${seg('grip', [['ring', 'Ringe'], ['shark', 'Shark'], ['knurl', 'Rändel'], ['smooth', 'Glatt']])}${col('barrelColor', 'Grundfarbe')}${col('barrelColor2', 'Grip-Farbe')}</div>
      ${d.system === 'classic' ? `<div class="lbl">Schaft</div><div class="card">${seg('shaftLen', [['short', 'Short'], ['inbetween', 'Inbetw.'], ['medium', 'Medium'], ['long', 'Long']])}<div class="xs mut">${SHAFT_LBL[d.shaftLen]}</div>${col('shaftColor', 'Farbe')}</div>` : ''}
      <div class="lbl">Flight${d.system === 'onepiece' ? ' (inkl. Schaft)' : ''}</div><div class="card">${seg('flightShape', [['standard', 'Standard'], ['slim', 'Slim'], ['kite', 'Kite'], ['pear', 'Pear'], ['teardrop', 'Teardrop']])}
        <div class="field"><label>Flight-Nummer / Bezeichnung</label><input type="text" id="fno" value="${esc(d.flightNo)}" placeholder="z. B. No. 2, No. 6"></div>${col('flightColor', 'Hauptfarbe')}${col('flightColor2', 'Streifen')}
        <div class="row" style="margin-top:8px"><span class="sp sm">Logo auf dem Flight</span><button class="btn sm sec" id="flogo">${d.flightLogo ? 'Ändern' : 'Hochladen'}</button>${d.flightLogo ? '<button class="btn sm sec" id="flogox">✕</button>' : ''}</div></div>
      <div class="lbl">Fotos deiner echten Pfeile</div><div class="card"><div class="photos">${(d.photos || []).map((ph, i) => `<img src="${ph}" data-ph="${i}">`).join('')}</div><button class="btn sec" id="padd" style="margin-top:10px">📷 Foto hinzufügen</button><div class="xs mut" style="margin-top:6px">Max. 4 Fotos · Tippen zum Löschen</div></div>`,
    mount(r) {
      const upd = () => { save(); if (pl.id === S.me) pushProfile(); $('#dp', r).innerHTML = dartSVG(d, 'dz' + Math.random().toString(36).slice(2, 5)); };
      on(r, '[data-k]', 'click', b => { d[b.dataset.k] = b.dataset.v; save(); if (pl.id === S.me) pushProfile(); render(); });
      r.addEventListener('input', e => {
        const t = e.target;
        if (t.dataset.r) { d[t.dataset.r] = +t.value; $('#l_' + t.dataset.r, r).textContent = t.value; upd(); }
        if (t.dataset.c) { d[t.dataset.c] = t.value; upd(); }
        if (t.id === 'dn') { d.name = t.value; save(); }
        if (t.id === 'fno') { d.flightNo = t.value; save(); }
      });
      $('#flogo', r).onclick = async () => { const f = await pickFile(); if (!f) return; d.flightLogo = await resizeImage(f, 160, .85); save(); render(); };
      $('#flogox', r) && ($('#flogox', r).onclick = () => { d.flightLogo = null; save(); render(); });
      $('#padd', r).onclick = async () => { if ((d.photos || []).length >= 4) return toast('Maximal 4 Fotos'); const f = await pickFile(); if (!f) return; d.photos = d.photos || []; d.photos.push(await resizeImage(f, 700, .7)); save(); render(); };
      on(r, '[data-ph]', 'click', async b => { if (await confirmBox('Foto löschen?', 'Löschen')) { d.photos.splice(+b.dataset.ph, 1); save(); render(); } });
    }
  };
};

/* ================= EINSTELLUNGEN ================= */
function settingsBlock() {
  const s = S.settings;
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-s="${k}" data-v="${v}" class="${s[k] == v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const sw = (k, l) => `<div class="row" style="margin:12px 0"><span class="sp">${l}</span><button class="switch ${s[k] ? 'on' : ''}" data-sw="${k}"></button></div>`;
  return `<div class="lbl">Wurfanimation</div>${seg('anim', [['off', 'Aus'], ['fast', 'Schnell'], ['normal', 'Normal'], ['slow', 'Langsam']])}
    ${sw('sound', 'Aufprall-Sound')}<div class="field"><label>Lautstärke</label><input type="range" min="0" max="1" step=".05" value="${s.volume}" data-vol></div>
    ${sw('zoom', 'Großansicht beim Wurf (Hintergrund unscharf)')}
    <div class="lbl">Ansager</div>${seg('caller', [['off', 'Aus'], ['de', 'Deutsch'], ['en', 'Englisch']])}
    ${s.caller !== 'off' ? `<div class="field"><label>Sprachausgabe</label><div class="seg" style="margin:0"><button data-s="voiceEngine" data-v="pro" class="${s.voiceEngine === 'pro' ? 'on' : ''}">🔥 Profi-Caller</button><button data-s="voiceEngine" data-v="device" class="${s.voiceEngine === 'device' ? 'on' : ''}">📱 Gerät</button></div><div class="xs mut" id="prost" style="margin-top:4px"></div></div>` : ''}
    ${s.caller !== 'off' && s.voiceEngine === 'device' ? `<div class="field"><label>Stimme</label><select data-voice="${s.caller}">${voicesFor(s.caller).sort((a, b) => voiceScore(b) - voiceScore(a)).map(v => `<option value="${esc(v.voiceURI)}" ${bestVoice(s.caller) === v ? 'selected' : ''}>${esc(v.name)}${voiceScore(v) >= 30 ? ' ⭐' : ''}</option>`).join('') || '<option>Systemstimme</option>'}</select></div>` : ''}
    <button class="btn sm sec" data-test>🔊 Test</button>
    ${sw('botVoice', 'Bots sprechen (Sprachausgabe)')}${sw('vibrate', 'Vibration')}`;
}
function bindSettings(m) {
  on(m, '[data-s]', 'click', b => { S.settings[b.dataset.s] = b.dataset.v; save(); $$(`[data-s="${b.dataset.s}"]`, m).forEach(x => x.classList.toggle('on', x === b)); });
  on(m, '[data-sw]', 'click', b => { const k = b.dataset.sw; S.settings[k] = !S.settings[k]; b.classList.toggle('on', S.settings[k]); save(); });
  on(m, '[data-s="voiceEngine"]', 'click', () => { if (!m.closest('.modal-bg')) setTimeout(render, 10); });
  m.addEventListener('change', e => { const l = e.target.dataset.voice; if (l) { S.settings[l === 'en' ? 'voiceEn' : 'voiceDe'] = e.target.value; save(); say(CALL.score(180), null, { flush: true }); } });
  on(m, '[data-s="caller"]', 'click', () => { const bg = m.closest('.modal-bg'); if (!bg) setTimeout(render, 10); });
  on(m, '[data-test]', 'click', () => { impact(me().board); setTimeout(() => callout('score', 180, '', { flush: true }), 200); });
  const ps = $('#prost', m); if (ps) proManifest(S.settings.caller).then(man => { ps.textContent = man ? `Profi-Caller bereit (${man.keys.length} Ansagen)` : 'Profi-Caller nicht geladen – Internet beim ersten Mal nötig. Bis dahin spricht die Gerätestimme.'; });
  m.addEventListener('input', e => { if (e.target.dataset.vol != null) { S.settings.volume = +e.target.value; save(); } });
}
V.settings = () => {
  const p = me();
  return {
    title: 'EINSTELLUNGEN', tab: 'user', left: backBtn('user'), right: spacer,
    html: `<div class="card">${settingsBlock()}</div>
    ${p.admin ? `<div class="lbl">Admin · Scheiben-Sounds</div><div class="card list">${BOARDS.map(b => { const cur = S.settings.boardSounds[b.id] || b.sound; const custom = cur.startsWith('data:'); return `<div class="it"><div style="width:34px;height:34px;flex:none">${boardSVG(b, { numbers: false })}</div><div class="sp"><b class="sm">${esc(b.name)}</b><select data-bs="${b.id}" style="padding:6px;margin-top:4px;font-size:14px">${Object.entries(SOUND_PRESETS).map(([k, v]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${v.label}</option>`).join('')}${custom ? '<option selected value="__c">Eigene Aufnahme</option>' : ''}</select></div><button class="btn sm sec" data-up="${b.id}">⤒</button><button class="btn sm sec" data-play="${b.id}">▶</button></div>`; }).join('')}<div class="xs mut" style="margin-top:8px">Mit ⤒ lädst du eine eigene Aufnahme hoch (kurze Audiodatei). Die Synchronisation an alle Nutzer folgt mit Supabase.</div></div>` : ''}
    <div class="lbl">Daten</div><div class="card"><div class="grid2"><button class="btn sec" id="bex">Backup kopieren</button><button class="btn sec" id="bim">Backup einfügen</button></div><button class="btn ghost" id="breset" style="color:#f87171">Alle Daten löschen</button></div>
    <div class="lbl">Push-Benachrichtigungen</div><div class="card"><div class="row"><div class="sp"><b>Chat & Spieleinladungen</b><div class="mut xs">${typeof Notification !== 'undefined' && Notification.permission === 'granted' && S.settings.push ? 'Aktiv auf diesem Gerät' : 'Benachrichtigt dich auch, wenn die App zu ist'}</div></div><button class="btn sm ${S.settings.push ? 'sec' : ''}" id="pon">${S.settings.push ? 'Neu verbinden' : 'Aktivieren'}</button></div></div>
    <div class="lbl">Online & Login</div><button class="card row" style="width:100%" onclick="go('account')"><span style="font-size:24px">🌍</span><div class="sp" style="text-align:left"><b>${AUTH.user ? 'Eingeloggt' : 'Login / Registrieren'}</b><div class="mut sm">${AUTH.user ? esc(AUTH.user.email) : 'Freunde, Live-Spiele, Chat'}</div></div><span class="mut">›</span></button>
    <p class="xs dim" style="text-align:center">Dartsportz v0.3 · offline-fähig</p>`,
    mount(r) {
      bindSettings(r);
      $('#pon', r).onclick = enablePush;
      on(r, '[data-bs]', 'change', () => {});
      r.addEventListener('change', e => { const b = e.target.dataset.bs; if (b && e.target.value !== '__c') { S.settings.boardSounds[b] = e.target.value; save(); impact(b); pushBoardSounds(); } });
      on(r, '[data-play]', 'click', b => impact(b.dataset.play));
      on(r, '[data-up]', 'click', async b => { const f = await pickFile('audio/*'); if (!f) return; if (f.size > 400000) return toast('Datei zu groß (max. 400 KB)'); const rd = new FileReader(); rd.onload = () => { S.settings.boardSounds[b.dataset.up] = rd.result; save(); impact(b.dataset.up); pushBoardSounds(); render(); }; rd.readAsDataURL(f); });
      $('#bex', r).onclick = async () => { const txt = JSON.stringify(S); try { await navigator.clipboard.writeText(txt); toast('Backup kopiert (' + Math.round(txt.length / 1024) + ' KB)'); } catch (e) { modal(`<h2 class="bb">Backup</h2><textarea rows="8">${esc(txt)}</textarea>`); } };
      $('#bim', r).onclick = () => modal(`<h2 class="bb">Backup einfügen</h2><textarea id="bt" rows="8" placeholder="Backup-Text hier einfügen"></textarea><div style="height:10px"></div><button class="btn" id="bok">Wiederherstellen</button>`, (m, close) => { $('#bok', m).onclick = () => { try { const d = JSON.parse($('#bt', m).value); if (!d.players) throw 0; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, loadStoreFrom(d)); save(true); close(); toast('Wiederhergestellt'); go('home'); } catch (e) { toast('Ungültiges Backup'); } }; });
      $('#breset', r).onclick = async () => { if (await confirmBox('Wirklich ALLE Daten löschen?', 'Löschen')) { try { localStorage.removeItem(LS_KEY); } catch (e) {} Object.keys(S).forEach(k => delete S[k]); Object.assign(S, loadStoreFrom({})); G = null; go('welcome'); } };
    }
  };
};
function loadStoreFrom(d) { const x = Object.assign({}, d); x.players = x.players || []; x.teams = x.teams || []; x.matches = x.matches || []; x.training = x.training || []; x.career = x.career || { best: 0, results: {} }; x.settings = Object.assign({}, DEFAULT_SETTINGS, x.settings || {}); x.me = x.me || null; return x; }

/* ================= START ================= */
document.addEventListener('click', () => ac(), { once: true });
cloudInit();
setTimeout(() => { const l = S.settings.caller; if (l && l !== 'off') proManifest(l).then(man => { if (man) ['s_180', 's_100', 's_60', 's_26', 'bust', 'gameshot'].forEach(k => proBuf(l, k).catch(() => {})); }); }, 2500);
try { const cq = new URLSearchParams(location.search).get('chat'); if (cq && me()) route = { name: 'chatroom', p: { fid: cq } }; } catch (e) {}
try { if (!me() && new URLSearchParams(location.search).get('invite')) route = { name: 'account', p: { mode: 'reg' } }; } catch (e) {}
render();
if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claudeusercontent|claude\.ai/.test(location.host)) navigator.serviceWorker.register('sw.js').catch(() => {});
