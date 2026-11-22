/* ================= ONLINE (Supabase) ================= */
const SB_URL = 'https://vsreutpxuwckyvycelwt.supabase.co';
const SB_KEY = 'sb_publishable_QxtipKYdcDu-Bo4hrC7nIg_TKjmYI1y';
let sb = null;
const AUTH = { user: null, profile: null, friends: [], unread: {}, ready: false };
const online = () => !!(sb && AUTH.user && navigator.onLine !== false);
function cloudInit() {
  try { if (!window.supabase || !window.supabase.createClient) return; sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } }); } catch (e) { sb = null; return; }
  const q = new URLSearchParams(location.search); const inv = q.get('invite'); if (inv) { try { localStorage.setItem('dsz_invite', inv.toUpperCase()); } catch (e) {} }
  sb.auth.onAuthStateChange((ev, session) => {
    const was = AUTH.user && AUTH.user.id; AUTH.user = session ? session.user : null;
    if (AUTH.user && AUTH.user.id !== was) setTimeout(onLogin, 0);
    if (!AUTH.user) { AUTH.profile = null; AUTH.friends = []; unsubscribeAll(); }
  });
  window.addEventListener('online', () => { flushQueue(); });
}
async function onLogin() {
  const uidv = AUTH.user.id;
  const { data: prof } = await sb.from('profiles').select('*').eq('id', uidv).maybeSingle();
  if (prof && prof.banned) { await sb.auth.signOut(); toast('Dein Zugang wurde gesperrt.'); return; }
  AUTH.profile = prof;
  // Einladung einlösen (falls Registrierung mit Code)
  let inv = null; try { inv = localStorage.getItem('dsz_invite'); } catch (e) {}
  if (inv) { await sb.rpc('redeem_invite', { p_code: inv }); try { localStorage.removeItem('dsz_invite'); } catch (e) {} }
  // lokales Profil verknüpfen
  let mp = me();
  if (!mp) { mp = newPlayer({ name: prof ? prof.name : 'Spieler', guest: false }); S.me = mp.id; }
  mp.uid = uidv; mp.guest = false; mp.admin = prof && prof.role === 'admin';
  if (prof && prof.updated_at && prof.dart && Object.keys(prof.dart).length && !mp._synced) {
    Object.assign(mp, { name: prof.name, nick: prof.nick || '', country: prof.country || mp.country, age: prof.age || '', height: prof.height || '', hand: prof.hand || mp.hand, board: prof.board || mp.board, color: prof.color || mp.color });
    mp.dart = Object.assign({}, DEFAULT_DART, prof.dart, { photos: (mp.dart && mp.dart.photos) || [] });
    if (prof.avatar_url) mp.avatar = prof.avatar_url;
  } else pushProfile(true);
  mp._synced = true; save(true);
  // globale Scheiben-Sounds vom Admin
  const { data: st } = await sb.from('app_settings').select('*').eq('key', 'boardSounds').maybeSingle();
  if (st && st.value && !mp.admin) { S.settings.boardSounds = st.value; save(); }
  await loadFriends(); subscribeAll(); flushQueue(); AUTH.ready = true;
  if (['account', 'home', 'friends'].includes(route.name)) render();
}
let profT = null;
function pushProfile(now) {
  if (!online()) return; clearTimeout(profT);
  profT = setTimeout(async () => {
    const p = me(); if (!p) return; const d = Object.assign({}, p.dart); delete d.photos;
    await sb.from('profiles').update({ name: p.name, nick: p.nick, country: p.country, age: +p.age || null, height: +p.height || null, hand: p.hand, board: p.board, color: p.color, dart: d, avatar_url: p.avatar || null, updated_at: new Date().toISOString() }).eq('id', AUTH.user.id);
  }, now ? 0 : 1500);
}
function pushBoardSounds() { if (online() && me().admin) sb.from('app_settings').upsert({ key: 'boardSounds', value: S.settings.boardSounds, updated_at: new Date().toISOString() }).then(() => {}); }

/* ---------- Spiele in die Cloud ---------- */
function shareablePlayers(ids) { return ids.filter(id => !String(id).startsWith('bot:')).map(id => { const p = playerById(id); if (!p) return null; const d = Object.assign({}, p.dart || {}); delete d.photos; return { id: p.id, uid: p.uid || null, name: p.name, nick: p.nick, color: p.color, country: p.country, board: p.board, dart: d }; }).filter(Boolean); }
function queueMatch(m) {
  const ids = m.sides ? m.sides.flatMap(s => s.members) : m.players;
  const pl = shareablePlayers(ids); const uids = [...new Set(pl.map(p => p.uid).filter(Boolean))];
  if (!uids.length) return;
  S.cloudQueue = S.cloudQueue || []; S.cloudQueue.push({ id: m.id, mode: m.mode, players: uids, data: Object.assign({}, m, { pl }) }); save(); flushQueue();
}
async function flushQueue() {
  if (!online() || !S.cloudQueue || !S.cloudQueue.length) return;
  const q = [...S.cloudQueue];
  for (const it of q) { const { error } = await sb.from('matches').upsert({ id: it.id, mode: it.mode, owner: AUTH.user.id, players: it.players, data: it.data }); if (!error || /duplicate/.test(error.message)) S.cloudQueue = S.cloudQueue.filter(x => x.id !== it.id); }
  save();
}

/* ---------- Freunde ---------- */
async function loadFriends() {
  if (!online()) return;
  const u = AUTH.user.id;
  const { data } = await sb.from('friendships').select('user_a,user_b').or(`user_a.eq.${u},user_b.eq.${u}`);
  const ids = (data || []).map(r => r.user_a === u ? r.user_b : r.user_a);
  if (!ids.length) { AUTH.friends = []; return; }
  const { data: pr } = await sb.from('profiles').select('*').in('id', ids);
  AUTH.friends = (pr || []).filter(p => !p.banned);
}
function friendAsPlayer(f) {
  let p = S.players.find(x => x.uid === f.id);
  const d = Object.assign({}, DEFAULT_DART, f.dart || {});
  if (!p) p = newPlayer({ name: f.name, guest: false, friend: true });
  Object.assign(p, { uid: f.id, name: f.name, nick: f.nick || '', country: f.country || 'DE', board: f.board || p.board, color: f.color || p.color, avatar: f.avatar_url || null, dart: d, friend: true, guest: false });
  save(); return p;
}
async function cloudH2H(fid) {
  const u = AUTH.user.id;
  const { data } = await sb.from('matches').select('id,mode,data,created_at').contains('players', [u, fid]).eq('mode', 'x01').order('created_at', { ascending: false }).limit(50);
  const r = { w: 0, l: 0, games: [] };
  (data || []).forEach(row => {
    const m = row.data; if (!m || !m.finished || !m.sides) return;
    const pidOf = uidv => (m.pl || []).find(p => p.uid === uidv);
    const mine = pidOf(u), his = pidOf(fid); if (!mine || !his) return;
    const si = m.sides.findIndex(s => s.members.includes(mine.id)); const oi = m.sides.findIndex(s => s.members.includes(his.id));
    if (si < 0 || oi < 0 || si === oi) return;
    const won = m.winner === si; won ? r.w++ : r.l++;
    if (r.games.length < 8) r.games.push({ d: m.created, won, my: matchAvg(m, mine.id), op: matchAvg(m, his.id), score: `${m.legsWon[si]}:${m.legsWon[oi]}` });
  });
  return r;
}

/* ---------- Realtime: Einladungen + Chat ---------- */
let chans = [];
function unsubscribeAll() { chans.forEach(c => { try { sb.removeChannel(c); } catch (e) {} }); chans = []; }
function subscribeAll() {
  unsubscribeAll(); const u = AUTH.user.id;
  chans.push(sb.channel('live-' + u).on('postgres_changes', { event: '*', schema: 'public', table: 'live_games' }, pl => onLiveChange(pl.new)).subscribe());
  chans.push(sb.channel('chat-' + u).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `receiver=eq.${u}` }, pl => onChat(pl.new)).subscribe());
  sb.from('live_games').select('*').contains('players', [u]).eq('status', 'invited').neq('host', u).then(({ data }) => (data || []).forEach(onLiveChange));
  sb.from('chat_messages').select('sender').eq('receiver', u).is('read_at', null).then(({ data }) => { AUTH.unread = {}; (data || []).forEach(m => AUTH.unread[m.sender] = (AUTH.unread[m.sender] || 0) + 1); updateBadge(); });
}
function updateBadge() { const n = Object.values(AUTH.unread).reduce((a, b) => a + b, 0); const b = $('[data-nav="friends"]'); if (b) { let x = b.querySelector('.nb'); if (!x) { x = document.createElement('i'); x.className = 'nb'; b.appendChild(x); } x.textContent = n || ''; x.style.display = n ? 'grid' : 'none'; } }
function onChat(msg) {
  if (route.name === 'chatroom' && route.p.fid === msg.sender) { CHAT.msgs.push(msg); drawChat(); sb.from('chat_messages').update({ read_at: new Date().toISOString() }).eq('id', msg.id).then(() => {}); return; }
  AUTH.unread[msg.sender] = (AUTH.unread[msg.sender] || 0) + 1; updateBadge();
  const f = AUTH.friends.find(x => x.id === msg.sender); toast('💬 ' + (f ? f.name : 'Nachricht') + ': ' + msg.body.slice(0, 60), 2600); chime();
}

/* ---------- Live-Spiele ---------- */
const LIVE = { id: null, version: 0, host: false, pushing: false, pending: false };
function liveStripState(m) { const ids = m.sides.flatMap(s => s.members); return { match: m, players: shareablePlayers(ids) }; }
async function startLiveMatch(sides, settings, starter) {
  const bc = chooseBoard(sides); const m = createMatch({ sides, settings, boardId: bc.id, starter });
  const uids = [...new Set(sides.flatMap(s => s.members).map(id => (playerById(id) || {}).uid).filter(Boolean))];
  if (!uids.includes(AUTH.user.id)) uids.push(AUTH.user.id);
  m.live = true; m.hostUid = AUTH.user.id;
  const { data, error } = await sb.from('live_games').insert({ host: AUTH.user.id, players: uids, status: 'invited', state: liveStripState(m) }).select().single();
  if (error) return toast('Fehler: ' + error.message, 3500);
  m.liveId = data.id; LIVE.id = data.id; LIVE.version = 0; LIVE.host = true;
  S.active = m; save(true);
  const names = AUTH.friends.filter(f => uids.includes(f.id)).map(f => f.name).join(', ');
  const close = modal(`<div style="text-align:center;font-size:50px" class="pulse">📡</div><h2 class="bb">Warte auf ${esc(names)}…</h2><p class="mut sm" style="text-align:center">Einladung gesendet. Sobald angenommen wird, startet das Spiel automatisch.</p><button class="btn sec" id="lgo">Trotzdem starten</button><button class="btn ghost" id="lx" style="margin-top:8px">Abbrechen</button>`, (md, c) => {
    $('#lgo', md).onclick = () => { c(); liveSetStatus('running'); go('game', { fresh: true, why: bc.why }); };
    $('#lx', md).onclick = () => { c(); liveSetStatus('cancelled'); S.active = null; save(); };
  });
  LIVE.waitClose = close;
}
function liveSetStatus(s) { if (LIVE.id) sb.from('live_games').update({ status: s }).eq('id', LIVE.id).then(() => {}); }
function onLiveChange(row) {
  if (!row || !AUTH.user) return; const u = AUTH.user.id;
  if (row.status === 'invited' && row.host !== u && (row.players || []).includes(u)) {
    const host = AUTH.friends.find(f => f.id === row.host); const m = row.state.match;
    chime(); vibrate(200);
    modal(`<div style="text-align:center;font-size:50px">🎯</div><h2 class="bb">${esc(host ? host.name : 'Ein Freund')} lädt dich ein!</h2><p style="text-align:center" class="mut">${m.settings.start} · ${m.settings.fmt === 'best' ? 'Best of' : 'First to'} ${m.settings.count} ${m.settings.unit === 'sets' ? 'Sets' : 'Legs'}<br>${esc(m.sides.map(s => s.name).join(' vs '))}</p><div class="grid2"><button class="btn sec" id="ln">Ablehnen</button><button class="btn" id="ly">Annehmen</button></div>`, (md, c) => {
      $('#ln', md).onclick = () => { c(); sb.from('live_games').update({ status: 'cancelled' }).eq('id', row.id).then(() => {}); };
      $('#ly', md).onclick = async () => { c(); await sb.from('live_games').update({ status: 'running' }).eq('id', row.id); joinLive(row); };
    });
    return;
  }
  if (row.id !== LIVE.id) return;
  if (row.status === 'running' && LIVE.waitClose) { LIVE.waitClose(); LIVE.waitClose = null; toast('✅ Angenommen – Game on!'); go('game', { fresh: true }); }
  if (row.status === 'cancelled' && LIVE.waitClose) { LIVE.waitClose(); LIVE.waitClose = null; toast('Einladung abgelehnt'); S.active = null; save(); return; }
  if (row.version > LIVE.version && row.state && row.state.match) applyRemote(row);
}
function mergeRemotePlayers(pl) { (pl || []).forEach(rp => { if (rp.uid && AUTH.user && rp.uid === AUTH.user.id) return; let p = S.players.find(x => x.id === rp.id); if (!p) { p = { id: rp.id, guest: true, remote: true }; S.players.push(p); } Object.assign(p, rp, { dart: Object.assign({}, DEFAULT_DART, rp.dart) }); }); }
function joinLive(row) {
  mergeRemotePlayers(row.state.players);
  // eigenen Spieler (Host-ID) auf mich abbilden
  const mine = row.state.players.find(p => p.uid === AUTH.user.id);
  if (mine && mine.id !== S.me) { S.aliases = S.aliases || {}; S.aliases[mine.id] = S.me; }
  LIVE.id = row.id; LIVE.version = row.version; LIVE.host = false;
  S.active = Object.assign(row.state.match, { liveId: row.id }); save(true); G = null;
  go('game', { fresh: true });
}
function controlsCurrent(m) {
  if (!m.live) return true;
  const pid = curPid(m); const p = playerById(pid);
  if (String(pid).startsWith('bot:')) return m.hostUid === AUTH.user?.id;
  if (p && p.uid) return AUTH.user && (p.uid === AUTH.user.id || (S.aliases && S.aliases[pid] === S.me));
  return m.hostUid === (AUTH.user && AUTH.user.id); // Gäste steuert der Host
}
function livePush() {
  const m = S.active; if (!m || !m.live || !online()) return;
  if (LIVE.pushing) { LIVE.pending = true; return; }
  LIVE.pushing = true; LIVE.version++;
  sb.from('live_games').update({ state: liveStripState(m), version: LIVE.version, status: m.finished ? 'finished' : 'running', updated_at: new Date().toISOString() }).eq('id', m.liveId).then(() => { LIVE.pushing = false; if (LIVE.pending) { LIVE.pending = false; livePush(); } });
}
function dartCount(m) { return m.legs.reduce((a, l) => a + l.visits.reduce((b, v) => b + v.darts.length, 0), 0) + m.cur.darts.length; }
function applyRemote(row) {
  LIVE.version = row.version;
  const nm = row.state.match; mergeRemotePlayers(row.state.players);
  const old = S.active; S.active = Object.assign(nm, { liveId: row.id });
  if (route.name !== 'game' || !G) { save(); return; }
  const before = old ? dartCount(old) : 0, after = dartCount(nm);
  G.m = S.active; G.hist = [];
  if (after === before + 1) {
    let d = null, vend = null;
    if (nm.cur.darts.length) d = nm.cur.darts[nm.cur.darts.length - 1];
    else { const leg = [...nm.legs].reverse().find(l => l.visits.length); if (leg) { vend = leg.visits[leg.visits.length - 1]; d = vend.darts[vend.darts.length - 1]; } }
    if (d) { const ms = animateThrow(d.x != null ? [d.x, d.y] : pointFor(d.n, d.m), vend ? vend.pid : curPid(nm), nm.cur.darts.slice(0, -1), nm.boardId, dLabelFull(d.n, d.m), $('#bin'), G.stuck); setTimeout(() => impact(nm.boardId, d.n === 0), ms); }
    if (vend) { say(vend.bust ? CALL.bust() : CALL.score(vend.scored)); G.clearT = setTimeout(() => { clearStuck(); G.clearT = null; }, 1100); }
    renderGame();
  } else { renderGame(); redrawStuck(); }
  if (nm.finished && !old.finished) { G.m = S.active; finishMatch(); }
  else maybeBot();
}

/* ---------- Gast-Übernahme ---------- */
async function uploadGuestClaim(p) {
  if (!online()) return toast('Bitte einloggen');
  const ms = S.matches.filter(m => m.sides && m.sides.some(s => s.members.includes(p.id)));
  const g = Object.assign({}, p); delete g.avatar; if (g.dart) { g.dart = Object.assign({}, g.dart); delete g.dart.photos; }
  const { error } = await sb.from('guest_claims').upsert({ code: p.linkCode, created_by: AUTH.user.id, guest: g, matches: ms });
  toast(error ? 'Fehler: ' + error.message : 'Code aktiviert: ' + p.linkCode, 2600);
}
async function redeemGuestClaim(code) {
  if (!code || !code.trim()) return;
  const { data, error } = await sb.rpc('claim_guest', { p_code: code.trim().toUpperCase() });
  if (error || !data) return toast('Code nicht gefunden oder schon eingelöst');
  const gid = data.guest.id; let n = 0;
  (data.matches || []).forEach(m => { if (S.matches.some(x => x.id === m.id)) return; const s = JSON.stringify(m).split('"' + gid + '"').join('"' + S.me + '"'); S.matches.push(JSON.parse(s)); n++; });
  save(true); toast(`✅ ${n} Spiele übernommen`, 2600);
}

/* ================= VIEWS ================= */
V.account = () => {
  if (!sb) return { title: 'ONLINE', left: backBtn(), right: spacer, tab: 'friends', html: `<div class="empty">Keine Verbindung zum Server.<br>Prüfe deine Internetverbindung und öffne die App neu.</div>` };
  if (!AUTH.user) {
    const inv = (() => { try { return localStorage.getItem('dsz_invite') || ''; } catch (e) { return ''; } })();
    const mode = route.p.mode || (inv ? 'reg' : 'login');
    return {
      title: 'ONLINE', tab: 'friends', left: backBtn(), right: spacer,
      html: `<div class="card" style="text-align:center"><div style="font-size:46px">🌍</div><p class="mut sm">Mit Account: Freunde, Live-Spiele auf zwei Handys, Chat und Statistiken in der Cloud.</p></div>
      <div class="seg"><button data-m="login" class="${mode === 'login' ? 'on' : ''}">Login</button><button data-m="reg" class="${mode === 'reg' ? 'on' : ''}">Registrieren</button></div>
      <div class="card">${mode === 'reg' ? `<div class="field"><label>Name</label><input id="an" type="text" value="${esc(me() ? me().name : '')}"></div>` : ''}
      <div class="field"><label>E-Mail</label><input id="ae" type="email" autocomplete="email"></div><div class="field"><label>Passwort</label><input id="ap" type="password" autocomplete="${mode === 'reg' ? 'new-password' : 'current-password'}"></div>
      ${mode === 'reg' ? `<div class="field"><label>Einladungscode</label><input id="ai" type="text" value="${esc(inv)}" placeholder="vom Admin erhalten" style="text-transform:uppercase"></div>` : ''}
      <button class="btn" id="ago">${mode === 'reg' ? 'Account erstellen' : 'Einloggen'}</button>${mode === 'login' ? '<button class="btn ghost" id="afg" style="margin-top:8px">Passwort vergessen</button>' : ''}</div>`,
      mount(r) {
        on(r, '[data-m]', 'click', b => go('account', { mode: b.dataset.m }));
        $('#ago', r).onclick = async () => {
          const email = $('#ae', r).value.trim(), pw = $('#ap', r).value; if (!email || pw.length < (mode === 'reg' ? 8 : 6)) return toast(mode === 'reg' ? 'Passwort: mindestens 8 Zeichen' : 'E-Mail und Passwort eingeben');
          const btn = $('#ago', r); btn.textContent = '…';
          if (mode === 'login') { const { error } = await sb.auth.signInWithPassword({ email, password: pw }); if (error) { btn.textContent = 'Einloggen'; return toast(error.message.includes('Invalid') ? 'E-Mail oder Passwort falsch' : error.message, 3000); } go('friends'); return; }
          const code = $('#ai', r).value.trim().toUpperCase();
          const { data: need } = await sb.rpc('needs_invite');
          if (need) { if (!code) { btn.textContent = 'Account erstellen'; return toast('Einladungscode nötig'); } const { data: ok } = await sb.rpc('check_invite', { p_code: code }); if (!ok) { btn.textContent = 'Account erstellen'; return toast('Einladungscode ungültig oder abgelaufen', 3000); } try { localStorage.setItem('dsz_invite', code); } catch (e) {} }
          const { data, error } = await sb.auth.signUp({ email, password: pw, options: { data: { name: $('#an', r).value.trim() || 'Spieler' }, emailRedirectTo: location.origin } });
          if (error) { btn.textContent = 'Account erstellen'; return toast(error.message, 3500); }
          if (!data.session) modal(`<h2 class="bb">Fast geschafft!</h2><p>Bestätige deine E-Mail über den Link, den wir dir geschickt haben. Danach hier einloggen.</p><button class="btn" onclick="this.closest('.modal-bg').remove()">OK</button>`);
          else go('friends');
        };
        $('#afg', r) && ($('#afg', r).onclick = async () => { const email = $('#ae', r).value.trim(); if (!email) return toast('E-Mail eingeben'); await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin }); toast('Link zum Zurücksetzen gesendet'); });
      }
    };
  }
  const isA = AUTH.profile && AUTH.profile.role === 'admin';
  return {
    title: 'ACCOUNT', tab: 'friends', left: backBtn('friends'), right: spacer,
    html: `<div class="card row">${avatar(me())}<div class="sp"><b>${esc(me().name)}</b><div class="mut sm">${esc(AUTH.user.email)}</div></div>${isA ? '<span class="badge or">ADMIN</span>' : ''}</div>
      <div class="card"><b>Gast-Code einlösen</b><div class="mut sm">Hast du vorher als Gast gespielt? Code eingeben, um deine Spiele zu übernehmen.</div><div class="row" style="margin-top:8px"><input id="gc" type="text" placeholder="z. B. AB12CD" style="text-transform:uppercase"><button class="btn sm" id="gcok">OK</button></div></div>
      ${isA ? `<div class="lbl">Admin · Einladungen</div><div class="card"><div class="row"><span class="sp sm">Gültig für</span><select id="iu" style="width:auto"><option value="1">1 Person</option><option value="5">5 Personen</option><option value="25" selected>25 Personen</option></select></div><button class="btn" id="inew" style="margin-top:10px">＋ Einladungslink erstellen</button><div id="ilist" class="list" style="margin-top:8px"></div></div>
      <div class="lbl">Admin · Nutzer</div><div class="card list" id="ulist"><div class="mut sm">Lade…</div></div>` : ''}
      <button class="btn ghost" id="alo" style="color:#f87171">Ausloggen</button>`,
    mount(r) {
      $('#alo', r).onclick = async () => { await sb.auth.signOut(); go('home'); };
      $('#gcok', r).onclick = () => redeemGuestClaim($('#gc', r).value);
      if (!isA) return;
      const link = c => `${location.origin}/?invite=${c}`;
      const loadInv = async () => { const { data } = await sb.from('invites').select('*').order('created_at', { ascending: false }).limit(10); $('#ilist', r).innerHTML = (data || []).map(i => `<div class="it"><div class="sp"><b class="bb" style="font-size:22px;letter-spacing:2px">${i.code}</b><div class="mut xs">${i.uses}/${i.max_uses} genutzt · bis ${new Date(i.expires_at).toLocaleDateString('de-DE')}</div></div><button class="btn sm sec" data-cp="${i.code}">Link kopieren</button><button class="btn sm sec" data-del="${i.code}">✕</button></div>`).join('') || '<div class="mut sm">Noch keine Einladungen</div>'; };
      const loadUsers = async () => { const { data } = await sb.from('profiles').select('id,name,role,banned,country,created_at').order('created_at'); $('#ulist', r).innerHTML = (data || []).map(u => `<div class="it"><div class="sp"><b>${esc(u.name)}</b> ${flag(u.country)}<div class="mut xs">${u.role === 'admin' ? 'Admin' : 'Nutzer'} · seit ${new Date(u.created_at).toLocaleDateString('de-DE')}</div></div>${u.id !== AUTH.user.id ? `<button class="btn sm ${u.banned ? '' : 'sec'}" data-ban="${u.id}" data-b="${u.banned ? 1 : 0}">${u.banned ? 'Entsperren' : 'Sperren'}</button>` : ''}</div>`).join(''); };
      loadInv(); loadUsers();
      $('#inew', r).onclick = async () => { const { data, error } = await sb.from('invites').insert({ created_by: AUTH.user.id, max_uses: +$('#iu', r).value }).select().single(); if (error) return toast(error.message, 3000); await copyText(link(data.code)); loadInv(); };
      on(r, '[data-cp]', 'click', b => copyText(link(b.dataset.cp)));
      on(r, '[data-del]', 'click', async b => { await sb.from('invites').delete().eq('code', b.dataset.del); loadInv(); });
      on(r, '[data-ban]', 'click', async b => { await sb.from('profiles').update({ banned: b.dataset.b !== '1' }).eq('id', b.dataset.ban); loadUsers(); });
    }
  };
};
async function copyText(t) {
  try { if (navigator.share && /iPhone|iPad|Android/i.test(navigator.userAgent)) { await navigator.share({ title: 'Dartsportz', text: 'Komm zu Dartsportz! 🎯', url: t }); return; } } catch (e) {}
  try { await navigator.clipboard.writeText(t); toast('Link kopiert'); } catch (e) { modal(`<h2 class="bb">Link</h2><input type="text" value="${esc(t)}" onclick="this.select()">`); }
}
V.friends = () => {
  if (!AUTH.user) return V.account({});
  return {
    title: 'FREUNDE', left: backBtn(), right: `<button class="ic" onclick="go('account')">👤</button>`,
    html: `<div class="card list">${AUTH.friends.map(f => `<div class="it">${avatar({ name: f.name, color: f.color, avatar: f.avatar_url }, 's')}<div class="sp"><b>${esc(f.name)}</b> ${flag(f.country)}<div class="mut xs" data-h2h="${f.id}">…</div></div><button class="btn sm sec" data-chat="${f.id}" style="position:relative">💬${AUTH.unread[f.id] ? `<i class="nb" style="display:grid">${AUTH.unread[f.id]}</i>` : ''}</button><button class="btn sm" data-fp="${f.id}">🎯</button></div>`).join('') || '<div class="mut sm">Noch keine Freunde. Lade jemanden ein oder suche nach Namen.</div>'}</div>
      <div class="lbl">Freund hinzufügen</div><div class="card"><div class="row"><input id="fs" type="text" placeholder="Name suchen"><button class="btn sm" id="fsok">Suchen</button></div><div id="fres" class="list"></div></div>`,
    async mount(r) {
      on(r, '[data-chat]', 'click', b => go('chatroom', { fid: b.dataset.chat }));
      on(r, '[data-fp]', 'click', b => { const f = AUTH.friends.find(x => x.id === b.dataset.fp); const p = friendAsPlayer(f); const su = getSetup(); if (!su.players.includes(p.id)) su.players.push(p.id); save(); toast(f.name + ' zum Spiel hinzugefügt'); go('play'); });
      $('#fsok', r).onclick = async () => { const q = $('#fs', r).value.trim(); if (q.length < 2) return; const { data } = await sb.from('profiles').select('id,name,country,color').ilike('name', '%' + q + '%').neq('id', AUTH.user.id).limit(10); $('#fres', r).innerHTML = (data || []).map(p => `<div class="it"><b class="sp">${esc(p.name)} ${flag(p.country)}</b>${AUTH.friends.some(f => f.id === p.id) ? '<span class="mut sm">Freund</span>' : `<button class="btn sm" data-add="${p.id}">＋</button>`}</div>`).join('') || '<div class="mut sm">Niemand gefunden</div>'; };
      on(r, '[data-add]', 'click', async b => { const u = AUTH.user.id, o = b.dataset.add; await sb.from('friendships').insert({ user_a: u < o ? u : o, user_b: u < o ? o : u }); await loadFriends(); render(); });
      await loadFriends();
      for (const f of AUTH.friends) { cloudH2H(f.id).then(x => { const el = $(`[data-h2h="${f.id}"]`); if (el) el.innerHTML = x.w + x.l ? `Bilanz <b style="color:${x.w >= x.l ? 'var(--ok)' : 'var(--bad)'}">${x.w}:${x.l}</b> · zuletzt ${x.games.slice(0, 3).map(g => g.won ? '🟢' : '🔴').join('')} Ø ${x.games[0] ? fmt(x.games[0].my) : '–'}` : 'Noch keine Spiele'; }); }
    }
  };
};
const CHAT = { msgs: [], fid: null };
V.chatroom = (p) => {
  const f = AUTH.friends.find(x => x.id === p.fid) || { name: '?' };
  return {
    title: esc(f.name).toUpperCase(), tab: 'friends', left: backBtn('friends'), right: spacer, nav: false,
    html: `<div id="cm" style="display:flex;flex-direction:column;padding-bottom:80px"></div><div style="position:fixed;left:0;right:0;bottom:0;padding:10px 12px calc(10px + var(--safe-b));background:var(--bg2);display:flex;gap:8px;max-width:820px;margin:0 auto"><input id="ct" type="text" placeholder="Nachricht…" style="border-radius:999px"><button class="btn sm" id="cs">➤</button></div>`,
    async mount(r) {
      CHAT.fid = p.fid; CHAT.msgs = [];
      const u = AUTH.user.id;
      const { data } = await sb.from('chat_messages').select('*').or(`and(sender.eq.${u},receiver.eq.${p.fid}),and(sender.eq.${p.fid},receiver.eq.${u})`).order('created_at').limit(200);
      CHAT.msgs = data || []; drawChat();
      sb.from('chat_messages').update({ read_at: new Date().toISOString() }).eq('receiver', u).eq('sender', p.fid).is('read_at', null).then(() => {}); delete AUTH.unread[p.fid]; updateBadge();
      const send = async () => { const t = $('#ct').value.trim(); if (!t) return; $('#ct').value = ''; const { data: m, error } = await sb.from('chat_messages').insert({ sender: u, receiver: p.fid, body: t }).select().single(); if (error) return toast(error.message); CHAT.msgs.push(m); drawChat(); };
      $('#cs').onclick = send; $('#ct').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
    }
  };
};
function drawChat() {
  const el = $('#cm'); if (!el) return; const u = AUTH.user.id;
  el.innerHTML = CHAT.msgs.map(m => `<div class="chat-msg" style="align-self:${m.sender === u ? 'flex-end' : 'flex-start'};background:${m.sender === u ? 'var(--or)' : 'var(--card2)'}">${esc(m.body)}<div class="xs" style="opacity:.6;text-align:right">${new Date(m.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div></div>`).join('') || '<div class="empty">Schreib die erste Nachricht 👋</div>';
  window.scrollTo(0, document.body.scrollHeight);
}
