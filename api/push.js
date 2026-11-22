// Sendet Push-Benachrichtigungen an einen Freund (Vercel Serverless Function)
const webpush = require('web-push');

const SB = process.env.SUPABASE_URL;
const SECRET = process.env.SUPABASE_SECRET_KEY;          // sb_secret_… (nur hier, nie im Browser)
const PUB = process.env.VAPID_PUBLIC_KEY;
const PRIV = process.env.VAPID_PRIVATE_KEY;

async function rest(path, opts = {}) {
  const r = await fetch(`${SB}/rest/v1/${path}`, { ...opts, headers: { apikey: SECRET, 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!SB || !SECRET || !PUB || !PRIV) return res.status(500).json({ error: 'Server nicht konfiguriert (Environment Variables fehlen)' });
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    const ur = await fetch(`${SB}/auth/v1/user`, { headers: { apikey: SECRET, Authorization: `Bearer ${token}` } });
    if (!ur.ok) return res.status(401).json({ error: 'nicht eingeloggt' });
    const me = await ur.json();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const to = String(body.to || '');
    if (!/^[0-9a-f-]{36}$/.test(to) || to === me.id) return res.status(400).json({ error: 'Empfänger ungültig' });
    const [prof] = await rest(`profiles?id=eq.${me.id}&select=name,banned`);
    if (!prof || prof.banned) return res.status(403).json({ error: 'gesperrt' });
    const a = me.id < to ? me.id : to, b = me.id < to ? to : me.id;
    const fr = await rest(`friendships?user_a=eq.${a}&user_b=eq.${b}&select=user_a`);
    if (!fr.length) return res.status(403).json({ error: 'nur an Freunde' });
    const subs = await rest(`push_subscriptions?user_id=eq.${to}&select=id,subscription`);
    webpush.setVapidDetails('mailto:push@dartsportz.app', PUB, PRIV);
    const payload = JSON.stringify({
      title: String(body.title || prof.name).slice(0, 80),
      body: String(body.body || '').slice(0, 200),
      url: String(body.url || '/').startsWith('/') ? String(body.url || '/') : '/',
      tag: String(body.tag || 'dartsportz').slice(0, 40),
    });
    let sent = 0;
    for (const s of subs) {
      try { await webpush.sendNotification(s.subscription, payload, { TTL: 3600 }); sent++; }
      catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await rest(`push_subscriptions?id=eq.${s.id}`, { method: 'DELETE' }); }
    }
    res.status(200).json({ sent });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
