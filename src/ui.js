/* ================= ROUTER / SHELL ================= */
const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h9a8 8 0 1 1 0 16H4zm9 4a4 4 0 1 0 3.9 5H13v-2h3.9A4 4 0 0 0 13 8z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/></svg>',
  career: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l3 2 4-6 4 6 3-2-1.5 9h-11z" fill="currentColor"/><path d="M6 21h12"/></svg>',
  train: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  friends: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><circle cx="9" cy="10.5" r=".6" fill="currentColor"/><circle cx="12.5" cy="10.5" r=".6" fill="currentColor"/><circle cx="16" cy="10.5" r=".6" fill="currentColor"/></svg>',
  stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 15l3-3 3 2 4-5"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/></svg>',
};
const NAV = [['home', 'Start'], ['play', 'Spielen'], ['career', 'Karriere'], ['friends', 'Freunde'], ['stats', 'Statistik'], ['user', 'Profil']];
const V = {};
let route = { name: 'home', p: {} };
function go(name, p = {}) { route = { name, p }; render(); window.scrollTo(0, 0); }
function back() { go(route.p.from || 'home'); }
function render() {
  const old = $('#app'); const app = old.cloneNode(false); old.replaceWith(app);
  if (!me() && route.name !== 'game' && route.name !== 'pgame') { route = { name: 'welcome', p: {} }; }
  const v = V[route.name](route.p);
  if (v.full) { app.innerHTML = v.html; $('.nav') && $('.nav').remove(); v.mount && v.mount(app); return; }
  app.innerHTML = `<div class="top">${v.left || ''}${v.title ? `<h1 class="bb">${v.title}</h1>` : ''}${v.right || ''}</div><div class="view">${v.html}</div>`;
  let nav = $('.nav');
  if (v.nav !== false) {
    if (!nav) { nav = document.createElement('div'); nav.className = 'nav'; document.body.appendChild(nav); }
    const tab = v.tab || route.name;
    nav.innerHTML = '<div class="in">' + NAV.map(([k, l]) => `<button data-nav="${k}" class="${tab === k ? 'on' : ''}">${ICONS[k]}<span>${l}</span></button>`).join('') + '</div>';
    nav.onclick = e => { const b = e.target.closest('[data-nav]'); if (b) { vibrate(); go(b.dataset.nav); } };
    if (typeof updateBadge === 'function') updateBadge();
  } else if (nav) nav.remove();
  v.mount && v.mount(app);
}
const backBtn = (to = 'home') => `<button class="ic ghost" onclick="go('${to}')">←</button>`;
const spacer = '<div style="width:40px"></div>';
function on(root, sel, ev, fn) { root.addEventListener(ev, e => { const t = e.target.closest(sel); if (t && root.contains(t)) fn(t, e); }); }

/* ================= WILLKOMMEN ================= */
V.welcome = () => ({
  nav: false, title: '', left: '<div class="logo"><b>DARTS<span>PORTZ</span></b></div>',
  html: `<div class="card" style="text-align:center"><div style="font-size:54px">🎯</div><h2 class="bb" style="font-size:34px;margin:6px 0">Willkommen!</h2><p class="mut">Leg dein Profil an. Alles funktioniert offline – Login & Online-Spiele kommen mit der Supabase-Anbindung.</p></div>
  <div class="card"><div class="field"><label>Name</label><input id="wn" type="text" placeholder="z. B. Andreas"></div>
  <div class="field"><label>Land</label><select id="wc">${COUNTRIES.map(([c, n]) => `<option value="${c}">${flag(c)} ${n}</option>`).join('')}</select></div>
  <div class="field"><label>Lieblingsscheibe</label><select id="wb">${BOARDS.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}</select></div></div>
  <button class="btn" id="wgo">Los geht's</button>`,
  mount(r) {
    $('#wgo', r).onclick = () => {
      const n = $('#wn', r).value.trim(); if (!n) return toast('Bitte Namen eingeben');
      const p = newPlayer({ name: n, country: $('#wc', r).value, board: $('#wb', r).value, guest: false, color: '#ff6b00', admin: true });
      S.me = p.id; S.setup = null; save(true); ac(); go('home');
    };
  }
});

/* ================= HOME ================= */
V.home = () => {
  const p = me(); const st = statsFor(p.id);
  const L = Math.min(30, S.career.best + 1); const ch = CHAPTERS.find(c => L >= c.from && L <= c.to);
  return {
    title: '', left: `<div class="logo"><svg width="34" height="34" viewBox="0 0 24 24" fill="#ff6b00"><path d="M4 4h9a8 8 0 1 1 0 16H4zm9 4a4 4 0 1 0 3.9 5H13v-2h3.9A4 4 0 0 0 13 8z"/></svg><b>DARTS<span>PORTZ</span></b></div>`,
    html: `<div class="row card" style="background:none;padding:6px 2px" data-go="user">${avatar(p)}<div class="sp"><div style="font-size:22px;font-weight:800">${esc(p.name)} <span class="flag">${flag(p.country)}</span></div><div class="row" style="gap:6px"><span class="bb" style="font-size:30px;color:var(--or)">${fmt(st.avg)}</span><span class="mut sm">Ø 3-Dart · ${st.matches} Spiele</span></div></div>${p.admin ? '<span class="badge or">ADMIN</span>' : ''}</div>
    ${S.active ? `<button class="card row" style="width:100%;border:1px solid var(--or)" data-resume><span style="font-size:26px">⏯</span><div class="sp" style="text-align:left"><b>Spiel fortsetzen</b><div class="mut sm">${esc(S.active.sides.map(s => s.name).join(' vs '))}</div></div><span class="mut">›</span></button>` : ''}
    <div class="grid2"><button class="tile t-or" data-go="play"><span class="em">🎯</span><h3 class="bb">LOKAL<br>SPIELEN</h3><p>Allein, mit Freunden, Teams oder gegen den Bot</p></button>
    <button class="tile t-or2" data-go="friends"><span class="em">🌍</span><h3 class="bb">ONLINE<br>SPIELEN</h3><p>${AUTH.user ? AUTH.friends.length + ' Freunde · Live-Sync & Chat' : 'Login, Freunde, Live-Sync & Chat'}</p></button></div>
    ${S.pactive ? `<button class="card row" style="width:100%;border:1px solid var(--or)" data-presume><span style="font-size:26px">⏯</span><div class="sp" style="text-align:left"><b>${PARTY[S.pactive.mode].name} fortsetzen</b><div class="mut sm">${esc(S.pactive.players.map(id => pName(playerById(id))).join(', '))}</div></div><span class="mut">›</span></button>` : ''}
    <button class="tile t-gr" style="width:100%;margin-bottom:12px;min-height:100px;background:linear-gradient(135deg,#5b2a86,#2a1640)" data-go="partylist"><span class="em">🎉</span><h3 class="bb">CRICKET & PARTYSPIELE</h3><p>Cricket, Killer, Highscore, Shanghai</p></button>
    <button class="tile t-dk" style="width:100%;margin-bottom:12px" data-go="career"><span class="em">🏆</span><h3 class="bb">KARRIERE</h3><p>${esc(ch.name)} · Level ${L}/30 – nächster Gegner: ${esc(botDef(L).name)}</p></button>
    <div class="grid2"><button class="tile t-gr" data-go="train"><span class="em">⚡</span><h3 class="bb">TRAINING</h3><p>Bull, Doppel, Around the Clock, Bob's 27 …</p></button>
    <button class="tile t-gr" data-go="stats"><span class="em">📈</span><h3 class="bb">STATISTIK</h3><p>Average, Checkout, Heatmap, Bilanz</p></button></div>`,
    mount(r) {
      on(r, '[data-go]', 'click', b => go(b.dataset.go));
      on(r, '[data-resume]', 'click', () => go('game', { resume: true }));
      on(r, '[data-presume]', 'click', () => go('pgame', {}));
      on(r, '[data-online]', 'click', () => modal(`<h2 class="bb">Online spielen</h2><p class="mut">Live-Synchronisation, Freundesliste, Einladungslinks und Push-Benachrichtigungen kommen mit der Supabase-Anbindung in Schritt 2. Bis dahin läuft alles lokal und offline.</p><button class="btn" onclick="this.closest('.modal-bg').remove()">Alles klar</button>`));
    }
  };
};

/* ================= SPIEL-SETUP ================= */
function getSetup() {
  if (!S.setup) S.setup = { teamMode: false, players: [S.me], teams: [], bot: null, settings: { start: 501, custom: 170, inMode: 'single', outMode: 'double', fmt: 'first', count: 3, unit: 'legs' } };
  S.setup.players = S.setup.players.filter(id => S.players.some(p => p.id === id));
  S.setup.teams = S.setup.teams.filter(id => S.teams.some(t => t.id === id));
  return S.setup;
}
function plChip(p, opts = {}) {
  return `<div class="pl">${avatar(p)}${opts.x ? `<button class="x" data-x="${p.id}">✕</button>` : ''}${opts.cfg ? `<button class="cfg" data-cfg="${p.id}">⚙</button>` : ''}<div class="nm">${esc(pName(p))}</div></div>`;
}
V.play = () => {
  const su = getSetup(), st = su.settings;
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-set="${k}" data-v="${v}" class="${st[k] == v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  let ph = '';
  if (!su.teamMode) {
    ph = `<div class="lbl">Spieler ${su.players.length + (su.bot ? 1 : 0)} / 12</div><div class="chips">${su.players.map(id => plChip(playerById(id), { x: true, cfg: true })).join('')}${su.bot ? `<div class="pl">${avatar(BOT_PLAYER('bot:' + su.bot.level))}<button class="x" data-nobot>✕</button><div class="nm">Bot L${su.bot.level}</div></div>` : ''}<div class="pl"><button class="add" data-addp>+</button><div class="nm mut">Spieler<br>hinzufügen</div></div></div>`;
  } else {
    ph = `<div class="lbl">Teams ${su.teams.length} / 6</div>` + su.teams.map(tid => { const t = S.teams.find(x => x.id === tid); return `<div class="card" style="background:var(--card2);border-left:5px solid ${t.color}"><div class="row"><h3 class="bb" style="margin:0;font-size:26px;flex:1">${t.logo ? `<img src="${t.logo}" style="width:26px;height:26px;border-radius:6px;vertical-align:middle;margin-right:6px">` : ''}${esc(t.name)}</h3><button class="q" style="background:var(--or);color:#fff" data-team="${t.id}">⚙</button><button class="q" style="background:#000;color:#fff" data-rmteam="${t.id}">✕</button></div><div class="chips">${t.members.map(id => plChip(playerById(id))).join('')}<div class="pl"><button class="add" data-tadd="${t.id}">+</button><div class="nm mut">Spieler</div></div></div></div>`; }).join('') + `<button class="btn ghost" data-addteam>＋ Team hinzufügen</button>`;
  }
  const bc = chooseBoardPreview();
  return {
    title: 'SPIEL', tab: 'play', left: backBtn(), right: spacer,
    html: `<div class="card"><div class="sec-h"><span style="font-size:22px">👥</span><h2 class="bb">Spielerdetails</h2></div>
      <button class="row card" style="width:100%;background:#141416;border:1px solid #2e2e33;margin-bottom:6px" data-bot><span style="font-size:26px">🤖</span><b class="sp" style="text-align:left">${su.bot ? `Bot: ${esc(botDef(su.bot.level).name)} (L${su.bot.level}, Ø ${botAvg(su.bot.level)})` : 'Gegen DartBot spielen'}</b><span class="q" style="background:none;border:2px solid #fff;color:#fff;border-radius:8px">＋</span></button>
      <div class="seg"><button data-tm="0" class="${!su.teamMode ? 'on' : ''}">Einzelspieler</button><button data-tm="1" class="${su.teamMode ? 'on' : ''}">Teams</button></div>${ph}</div>
      <div class="card"><div class="sec-h"><span style="font-size:22px">⚙️</span><h2 class="bb">Spieleinstellungen</h2><button class="q" data-rules="x01">?</button></div>
      <div class="row"><div class="sp">${seg('fmt', [['first', 'First to'], ['best', 'Best of']])}</div><div class="stepper"><button data-cnt="-1">−</button><b class="bb">${st.count}</b><button data-cnt="1">＋</button></div><div class="sp">${seg('unit', [['legs', 'Legs'], ['sets', 'Sets']])}</div></div>
      ${seg('start', [[301, '301'], [501, '501'], [701, '701'], ['custom', 'Eigene ' + st.custom]])}
      ${seg('inMode', [['single', 'Einfach in'], ['double', 'Doppel in'], ['triple', 'Dreifach in']])}
      ${seg('outMode', [['double', 'Doppel aus'], ['master', 'Master aus'], ['single', 'Einfach aus']])}
      ${st.unit === 'sets' ? '<div class="xs mut">Ein Set = First to 3 Legs</div>' : ''}</div>
      <div class="card row"><div style="width:64px;height:64px">${boardSVG(boardById(bc.id), { numbers: false })}</div><div class="sp"><b>${esc(boardById(bc.id).name)}</b><div class="mut sm">${bc.why}</div></div></div>
      <button class="btn" data-start>Spiel anfangen</button>`,
    mount(r) {
      on(r, '[data-set]', 'click', b => { let v = b.dataset.v; if (b.dataset.set === 'start' && v === 'custom') { prompt2(); return; } st[b.dataset.set] = isNaN(+v) ? v : +v; save(); render(); });
      on(r, '[data-cnt]', 'click', b => { st.count = clamp(st.count + +b.dataset.cnt, 1, 21); save(); render(); });
      on(r, '[data-tm]', 'click', b => { su.teamMode = b.dataset.tm === '1'; if (su.teamMode && !su.teams.length) { su.teams.push(makeTeam([S.me]).id); su.teams.push(makeTeam([]).id); } save(); render(); });
      on(r, '[data-x]', 'click', b => { su.players = su.players.filter(id => id !== b.dataset.x); save(); render(); });
      on(r, '[data-cfg]', 'click', b => editPlayer(b.dataset.cfg, render));
      on(r, '[data-addp]', 'click', () => addPlayerModal(su.players, id => { su.players.push(id); save(); render(); }));
      on(r, '[data-bot]', 'click', () => botPicker(L => { su.bot = L ? { level: L } : null; save(); render(); }));
      on(r, '[data-nobot]', 'click', () => { su.bot = null; save(); render(); });
      on(r, '[data-rules]', 'click', b => showRules(b.dataset.rules));
      on(r, '[data-addteam]', 'click', () => { if (su.teams.length >= 6) return; su.teams.push(makeTeam([]).id); save(); render(); });
      on(r, '[data-rmteam]', 'click', b => { su.teams = su.teams.filter(t => t !== b.dataset.rmteam); save(); render(); });
      on(r, '[data-team]', 'click', b => editTeam(b.dataset.team, render));
      on(r, '[data-tadd]', 'click', b => { const t = S.teams.find(x => x.id === b.dataset.tadd); const used = su.teams.flatMap(id => S.teams.find(x => x.id === id).members); addPlayerModal(used, id => { t.members.push(id); save(); render(); }); });
      on(r, '[data-start]', 'click', () => {
        const sides = buildSides(su); if (!sides) return;
        const stt = { ...st, start: st.start === 'custom' ? st.custom : st.start };
        const remote = online() && sides.some(sd => sd.members.some(id => { const pp = playerById(id); return pp && pp.uid && pp.uid !== AUTH.user.id; }));
        if (remote) return modal(`<h2 class="bb">Wie spielt ihr?</h2><button class="btn" id="lv" style="margin-bottom:10px">📡 Live auf mehreren Handys</button><button class="btn sec" id="lc">📱 Alle auf diesem Handy</button>`, (m, close) => { $('#lv', m).onclick = () => { close(); whoStarts(sides, s0 => startLiveMatch(sides, stt, s0)); }; $('#lc', m).onclick = () => { close(); whoStarts(sides, s0 => launchMatch(sides, stt, s0)); }; });
        whoStarts(sides, starter => launchMatch(sides, stt, starter));
      });
    }
  };
};
function prompt2() { const su = getSetup(); modal(`<h2 class="bb">Eigene Punktzahl</h2><input id="cu" type="number" value="${su.settings.custom}" inputmode="numeric"><div style="height:10px"></div><button class="btn" id="cuok">Übernehmen</button>`, (m, close) => { $('#cu', m).focus(); $('#cuok', m).onclick = () => { su.settings.custom = clamp(parseInt($('#cu', m).value) || 170, 2, 10001); su.settings.start = 'custom'; save(); close(); render(); }; }); }
function chooseBoardPreview() { try { const sides = buildSides(getSetup(), true); return sides ? chooseBoard(sides) : { id: me().board, why: 'Lieblingsscheibe' }; } catch (e) { return { id: BOARDS[0].id, why: '' }; } }
function makeTeam(members) { const n = S.teams.length + 1; const t = { id: uid(), name: 'Team ' + n, color: COLORS[(n - 1) % COLORS.length], logo: null, members }; S.teams.push(t); save(); return t; }
function buildSides(su, quiet) {
  const sides = [];
  if (!su.teamMode) su.players.forEach(id => { const p = playerById(id); sides.push({ name: pName(p), color: p.color, members: [id] }); });
  else su.teams.forEach(tid => { const t = S.teams.find(x => x.id === tid); if (t.members.length) sides.push({ name: t.name, color: t.color, logo: t.logo, members: [...t.members], teamId: t.id }); });
  if (su.bot) { const b = botDef(su.bot.level); sides.push({ name: b.name, color: b.color, members: ['bot:' + b.level], bot: { level: b.level } }); }
  if (!sides.length) { if (!quiet) toast('Mindestens einen Spieler hinzufügen'); return null; }
  return sides;
}
function addPlayerModal(exclude, cb) {
  const avail = S.players.filter(p => !exclude.includes(p.id) && !p.remote);
  modal(`<h2 class="bb">Spieler hinzufügen</h2><div class="list">${avail.map(p => `<button class="it" style="width:100%" data-pid="${p.id}">${avatar(p, 's')}<b class="sp" style="text-align:left">${esc(p.name)} ${p.nick ? `<span class="mut">„${esc(p.nick)}“</span>` : ''}</b><span class="mut sm">${p.guest ? 'Gast' : 'Profil'}</span></button>`).join('') || '<div class="mut sm">Keine gespeicherten Spieler.</div>'}</div>
    <div class="lbl">Neuer Gast</div><div class="row"><input id="ng" type="text" placeholder="Name"><button class="btn sm" id="ngok">＋</button></div>`, (m, close) => {
    on(m, '[data-pid]', 'click', b => { close(); cb(b.dataset.pid); });
    $('#ngok', m).onclick = () => { const n = $('#ng', m).value.trim(); if (!n) return; const p = newPlayer({ name: n }); close(); cb(p.id); };
  });
}
function botPicker(cb) {
  const lv = Array.from({ length: 30 }, (_, i) => i + 1);
  modal(`<h2 class="bb">DartBot wählen</h2><p class="mut sm" style="text-align:center">Freies Spiel – alle Level wählbar. Die Story findest du unter „Karriere“.</p>${lv.map(L => { const b = botDef(L); return `<button class="lvl" style="width:100%" data-l="${L}"><span class="n">${L}</span><div class="sp" style="text-align:left"><b>${esc(b.name)}</b><div class="mut xs">Ø ca. ${b.avg}</div></div></button>`; }).join('')}<button class="btn sec" data-l="0">Kein Bot</button>`, (m, close) => on(m, '[data-l]', 'click', b => { close(); cb(+b.dataset.l); }));
}
function editTeam(tid, done) {
  const t = S.teams.find(x => x.id === tid);
  modal(`<h2 class="bb">Team bearbeiten</h2><div class="field"><label>Teamname</label><input id="tn" type="text" value="${esc(t.name)}"></div>
    <div class="row field"><label class="sp">Farbe</label><input id="tc" type="color" value="${t.color}"></div>
    <div class="row field"><label class="sp">Logo</label>${t.logo ? `<img src="${t.logo}" style="width:40px;height:40px;border-radius:8px">` : ''}<button class="btn sm sec" id="tl">Hochladen</button>${t.logo ? '<button class="btn sm sec" id="tlx">✕</button>' : ''}</div>
    <div class="lbl">Mitglieder</div><div class="chips">${t.members.map(id => plChip(playerById(id), { x: true })).join('')}</div>
    <button class="btn" id="tok">Speichern</button>`, (m, close) => {
    const sv = () => { t.name = $('#tn', m).value.trim() || t.name; t.color = $('#tc', m).value; save(); };
    $('#tok', m).onclick = () => { sv(); close(); done(); };
    $('#tl', m).onclick = async () => { const f = await pickFile(); if (!f) return; sv(); t.logo = await resizeImage(f, 160, .8); save(); close(); editTeam(tid, done); };
    $('#tlx', m) && ($('#tlx', m).onclick = () => { sv(); t.logo = null; save(); close(); editTeam(tid, done); });
    on(m, '[data-x]', 'click', b => { sv(); t.members = t.members.filter(id => id !== b.dataset.x); save(); close(); editTeam(tid, done); });
  });
}

/* ================= WER BEGINNT ================= */
function whoStarts(sides, cb) {
  if (sides.length === 1) return cb(0);
  modal(`<h2 class="bb">Wer wirft zuerst?</h2><div class="grid2"><button class="tile t-dk" data-w="wheel" style="min-height:110px;align-items:center;justify-content:center"><span style="font-size:42px">🎡</span><h3 class="bb" style="font-size:26px">Rad drehen</h3></button><button class="tile t-dk" data-w="pick" style="min-height:110px;align-items:center;justify-content:center"><span style="font-size:42px">👆</span><h3 class="bb" style="font-size:26px">Selbst wählen</h3></button></div><button class="btn sec" data-w="skip">Überspringen und starten</button>`, (m, close) => {
    on(m, '[data-w]', 'click', b => {
      close();
      if (b.dataset.w === 'skip') return cb(0);
      if (b.dataset.w === 'pick') return modal(`<h2 class="bb">Wer beginnt?</h2>${sides.map((s, i) => `<button class="btn sec" style="margin-bottom:8px;border-left:6px solid ${s.color}" data-s="${i}">${esc(s.name)}</button>`).join('')}`, (m2, c2) => on(m2, '[data-s]', 'click', x => { c2(); cb(+x.dataset.s); }));
      spinWheel(sides, cb);
    });
  });
}
function spinWheel(sides, cb) {
  const n = sides.length, seg = 360 / n;
  let svg = '<svg viewBox="-100 -100 200 200">';
  sides.forEach((s, i) => { const [ax, ay] = polar(98, i * seg), [bx, by] = polar(98, (i + 1) * seg); svg += `<path d="M0 0L${ax} ${ay}A98 98 0 ${seg > 180 ? 1 : 0} 1 ${bx} ${by}Z" fill="${s.color}" stroke="#111" stroke-width="1.5"/>`; const [x, y] = polar(62, i * seg + seg / 2); svg += `<text x="${x}" y="${y}" fill="#111" font-size="${n > 4 ? 11 : 14}" font-weight="800" text-anchor="middle" dominant-baseline="central" transform="rotate(${i * seg + seg / 2} ${x} ${y})">${esc(s.name.slice(0, 12))}</text>`; });
  svg += '<circle r="12" fill="#fff"/></svg>';
  const win = Math.floor(Math.random() * n);
  modal(`<h2 class="bb">Rad drehen</h2><div class="wheel"><div class="ptr"></div>${svg}</div><div id="wres" class="bb" style="text-align:center;font-size:30px;color:var(--or);min-height:36px"></div><button class="btn" id="wgo">Drehen!</button>`, (m, close) => {
    const btn = $('#wgo', m); let spun = false;
    btn.onclick = () => {
      if (spun) { close(); cb(win); return; }
      spun = true; btn.textContent = '…'; const target = 360 * 6 + (360 - (win * seg + seg / 2)) + (Math.random() - .5) * seg * .6;
      $('svg', $('.wheel', m)).style.transform = `rotate(${target}deg)`; chime();
      setTimeout(() => { $('#wres', m).textContent = sides[win].name + ' beginnt!'; btn.textContent = 'Spiel starten'; chime(true); }, 3300);
    };
  });
}

/* ================= REGELN (mit Animation) ================= */
const RULES = {
  x01: { t: 'X01 – 301 / 501 / 701', s: [['Jeder Spieler startet mit derselben Punktzahl (z. B. 501) und wirft pro Aufnahme 3 Darts.', 'single'], ['Die geworfenen Punkte werden abgezogen. Triple-Ring = 3-fach, Doppel-Ring = 2-fach.', 'treble'], ['Doppel aus: Der letzte Dart muss ein Doppel (äußerer Ring) oder das Bull (50) sein.', 'double'], ['Überworfen (unter 0, genau 1 oder kein Doppel am Ende) → Aufnahme zählt 0 Punkte.', null], ['Master aus: Doppel ODER Triple beenden. Doppel in: Punkte zählen erst nach dem ersten Doppel.', 'double'], ['Das Bull: innen 50 (zählt als Doppel), außen 25. Wer zuerst auf 0 kommt, gewinnt das Leg.', 'bull']] },
  bull: { t: 'Bullseye-Training', s: [['Wirf auf das Bull. Innen 50, außen 25.', 'bull'], ['Nach jedem Dart tippst du „Getroffen“ oder „Daneben“. Am Ende siehst du deine Trefferquote.', null]] },
  double: { t: 'Doppel-Training', s: [['Ziel ist der äußere schmale Ring – das Doppel.', 'double'], ['Wähle ein festes Doppel oder alle Doppel der Reihe nach. Jeder Dart: Getroffen / Daneben.', 'double']] },
  treble: { t: 'Treble-Training', s: [['Ziel ist der innere schmale Ring – das Triple.', 'treble'], ['Ideal für T20/T19 – die Scoring-Felder der Profis.', 'treble']] },
  atc: { t: 'Around the Clock', s: [['Triff die Zahlen der Reihe nach: 1, 2, 3 … 20 und zum Schluss das Bull.', 'single'], ['Erst bei einem Treffer geht es zur nächsten Zahl. Gezählt wird, wie viele Darts du brauchst.', 'bull']] },
  bobs: { t: "Bob's 27", s: [['Du startest mit 27 Punkten und wirfst je 3 Darts auf D1, D2 … D20 und Bull.', 'double'], ['Jeder Treffer bringt den Wert des Doppels. Kein Treffer: das Doppel wird abgezogen.', 'double'], ['Fällst du unter 0, ist das Spiel vorbei. Profis schaffen über 1000.', null]] },
  finish: { t: 'Finish-Training', s: [['Du bekommst einen zufälligen Restwert (z. B. 81) und 3 Aufnahmen (9 Darts) Zeit.', 'treble'], ['Hast du ihn auf Doppel beendet → „Gecheckt“. Der empfohlene Weg wird angezeigt.', 'double']] },
  career: { t: 'Karriere', s: [['30 Gegner in 4 Kapiteln – von der Eckkneipe bis zum Champion.', null], ['Jeder Sieg schaltet den nächsten Gegner frei. Die Bots werden mit jedem Level stärker und kommentieren das Spiel.', 'treble']] },
};
function showRules(key) {
  const r = RULES[key]; if (!r) return; let i = 0, tmr;
  const b = boardById(me().board);
  const draw = m => { const [txt, hl] = r.s[i]; $('#rb', m).innerHTML = boardSVG(b, { highlight: hl }); $('#rt', m).textContent = txt; $('#rd', m).innerHTML = r.s.map((_, j) => `<i style="display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 3px;background:${j === i ? 'var(--or)' : '#444'}"></i>`).join(''); };
  const close = modal(`<h2 class="bb">${r.t}</h2><div id="rb" style="width:210px;height:210px;margin:0 auto"></div><p id="rt" style="min-height:66px;text-align:center;font-size:16px;line-height:1.4"></p><div id="rd" style="text-align:center;margin-bottom:14px"></div><div class="grid2"><button class="btn sec" id="rp">Zurück</button><button class="btn" id="rn">Weiter</button></div>`, m => {
    draw(m);
    const nx = d => { i = (i + d + r.s.length) % r.s.length; draw(m); };
    $('#rn', m).onclick = () => { if (i === r.s.length - 1) { clearInterval(tmr); m.parentNode.remove(); } else nx(1); };
    $('#rp', m).onclick = () => nx(-1);
    tmr = setInterval(() => { if (!document.body.contains(m)) return clearInterval(tmr); nx(1); }, 4200);
  });
}
