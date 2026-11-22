// Erzeugt alle Caller-Ansagen mit ElevenLabs und legt sie unter audio/<lang>/ ab.
// Aufruf (GitHub Action): node tools/gen-voice.mjs <lang> <voiceId> [modelId]
import fs from 'node:fs';
const [lang, voiceId, model = 'eleven_multilingual_v2'] = process.argv.slice(2);
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY || !voiceId || !['de', 'en'].includes(lang)) { console.error('Nutzung: node tools/gen-voice.mjs de|en VOICE_ID'); process.exit(1); }

const E = ['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn'];
const Z = ['','','zwanzig','dreißig','vierzig','fünfzig','sechzig','siebzig','achtzig','neunzig'];
function deWord(n) { if (n >= 100) return 'hundert' + (n % 100 ? deWord(n % 100) : ''); if (n < 20) return E[n]; const e = n % 10, z = Math.floor(n / 10); return e ? (e === 1 ? 'ein' : E[e]) + 'und' + Z[z] : Z[z]; }
const EO = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const ET = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function enWord(n) { if (n >= 100) return 'one hundred' + (n % 100 ? ' and ' + enWord(n % 100) : ''); if (n < 20) return EO[n]; const e = n % 10, z = Math.floor(n / 10); return ET[z] + (e ? '-' + EO[e] : ''); }
const cap = s => s[0].toUpperCase() + s.slice(1);
const de = n => n === 180 ? 'HUNDERTACHTZIIIG!' : n === 0 ? 'Kein Score!' : cap(deWord(n)) + (n >= 100 ? '!' : '.');
const en = n => n === 180 ? 'ONE HUNDRED AND EIGHTYYY!' : n === 0 ? 'No score!' : cap(enWord(n)) + (n >= 100 ? '!' : '.');
const T = {};
for (let n = 0; n <= 180; n++) T['s_' + n] = lang === 'de' ? de(n) : en(n);
for (let n = 2; n <= 170; n++) T['r_' + n] = cap(lang === 'de' ? deWord(n) : enWord(n)) + '.';
Object.assign(T, lang === 'de'
  ? { bust: 'Überworfen!', gameshot: 'Game Shot – und das Leg!', gameshot_match: 'Game Shot – und das MATCH!', require: 'Du brauchst …', gameon: 'Game on!' }
  : { bust: 'No score!', gameshot: 'Game shot, and the leg!', gameshot_match: 'Game shot, and the MATCH!', require: 'You require …', gameon: 'Game on!' });

const dir = `audio/${lang}`; fs.mkdirSync(dir, { recursive: true });
const manPath = `${dir}/manifest.json`;
const old = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, 'utf8')) : { texts: {} };
const sameVoice = old.voiceId === voiceId;
let made = 0, chars = 0;
for (const [key, text] of Object.entries(T)) {
  const file = `${dir}/${key}.mp3`;
  if (sameVoice && old.texts && old.texts[key] === text && fs.existsSync(file)) continue; // schon vorhanden
  const big = key === 's_180' || key.startsWith('gameshot') || (key.startsWith('s_') && +key.slice(2) >= 100);
  const body = { text, model_id: model, voice_settings: { stability: big ? 0.25 : 0.45, similarity_boost: 0.85, style: big ? 0.85 : 0.45, use_speaker_boost: true } };
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_96`, { method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, body: JSON.stringify(body) });
    if (r.ok) { fs.writeFileSync(file, Buffer.from(await r.arrayBuffer())); break; }
    const err = await r.text();
    if (r.status === 429 && attempt < 6) { await new Promise(s => setTimeout(s, 4000 * attempt)); continue; }
    console.error(`Fehler bei ${key}: ${r.status} ${err}`);
    fs.writeFileSync(manPath, JSON.stringify({ lang, voiceId, voice: process.env.VOICE_NAME || voiceId, keys: Object.keys(T).filter(k => fs.existsSync(`${dir}/${k}.mp3`)), texts: T }, null, 1));
    process.exit(1);
  }
  made++; chars += text.length;
  if (made % 25 === 0) console.log(`${made} erzeugt …`);
}
fs.writeFileSync(manPath, JSON.stringify({ lang, voiceId, voice: process.env.VOICE_NAME || voiceId, keys: Object.keys(T), texts: T }, null, 1));
console.log(`Fertig: ${made} neue Ansagen (${chars} Zeichen), ${Object.keys(T).length} insgesamt.`);
