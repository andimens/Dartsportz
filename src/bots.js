/* ================= BOTS / KARRIERE ================= */
const SIGMA_TABLE = [[6, 118.7], [8, 102], [10, 88.4], [12, 77.3], [15, 64.8], [18, 56.2], [22, 48.5], [26, 43.8], [32, 39.9], [40, 36.6], [50, 33.5], [65, 29.5], [80, 26.3], [100, 22.5], [130, 18]];
const botAvg = L => Math.round(20 + (L - 1) * 90 / 29);
function sigmaForAvg(a) {
  // Zielwert leicht höher, da Finish-Phase den Schnitt drückt
  a = a * 1.06;
  for (let i = 0; i < SIGMA_TABLE.length - 1; i++) {
    const [s1, a1] = SIGMA_TABLE[i], [s2, a2] = SIGMA_TABLE[i + 1];
    if (a <= a1 && a >= a2) return s1 + (s2 - s1) * (a1 - a) / (a1 - a2);
  }
  return a > SIGMA_TABLE[0][1] ? 5 : 140;
}
const CHAPTERS = [
  { from: 1, to: 10, name: 'Kapitel 1 · Die Eckkneipe', text: 'Alles beginnt im „Goldenen Pfeil“. Ein Board, schiefe Lampe, die Stammgäste kennen jeden Wurf. Wer hier gewinnt, kommt in die Vereinsliga.' },
  { from: 11, to: 20, name: 'Kapitel 2 · Vereinsliga', text: 'Trikots, Spielberichtsbögen und Gegner, die jede Woche trainieren. Ab jetzt zählt jeder Doppelversuch.' },
  { from: 21, to: 29, name: 'Kapitel 3 · Die Profi-Tour', text: 'Licht, Kameras, Walk-on-Musik. Die Tour verzeiht keine Fehler – hier wird man zur Legende oder fliegt raus.' },
  { from: 30, to: 30, name: 'Finale · Der Champion', text: 'Ein Gegner bleibt übrig. Ungeschlagen seit Jahren. Er wartet schon auf dich.' },
];
const BOT_DEFS = [
  ['Opa Heinz', 'opa'], ['Tina Tresen', 'nett'], ['Kalle Kegel', 'frech'], ['Wirt Wolfgang', 'opa'], ['Jenny Jägermeister', 'frech'],
  ['Bernd „Bierdeckel“', 'nervoes'], ['Uschi Uhlig', 'nett'], ['Dieter Doppel', 'arrogant'], ['Mo Murmel', 'nervoes'], ['Der Stammtisch-König', 'arrogant'],
  ['Svenja Sisal', 'nett'], ['Ralf „Rakete“ Rose', 'frech'], ['Marco Monotone', 'profi'], ['Elif Eisern', 'profi'], ['Gerd Grobmotorik', 'opa'],
  ['Lina Laser', 'arrogant'], ['Tobi Triple', 'frech'], ['Hakan Hammer', 'profi'], ['Petra Präzise', 'profi'], ['Ligaboss Lothar', 'arrogant'],
  ['„The Machine“ Mats', 'profi'], ['Rico Rhythm', 'frech'], ['Natalia Night', 'arrogant'], ['Big Ben Brenner', 'profi'], ['Kai „Kühlschrank“', 'profi'],
  ['Viktor Vollgas', 'frech'], ['Olivia Oche', 'arrogant'], ['Duke Dexter', 'profi'], ['Ivan Iceman', 'profi'], ['Der Champion', 'boss'],
];
const BOT_COLORS = ['#6b7280', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6', '#f43f5e', '#84cc16', '#eab308'];
function botDef(L) { const [name, pers] = BOT_DEFS[L - 1]; return { level: L, name, pers, avg: botAvg(L), color: BOT_COLORS[L % BOT_COLORS.length] }; }
function BOT_PLAYER(id) {
  if (!id || !String(id).startsWith('bot:')) return null;
  const L = +id.split(':')[1], b = botDef(L);
  return { id, name: b.name, nick: '', color: b.color, board: BOARDS[(L * 3) % BOARDS.length].id, bot: true, country: '', dart: Object.assign({}, DEFAULT_DART, { flightColor: b.color, flightColor2: '#000', barrelColor: '#7a7f87', grip: ['ring', 'shark', 'knurl'][L % 3], flightShape: ['standard', 'slim', 'kite', 'pear'][L % 4] }) };
}
const LINES = {
  intro: { opa: ['Na Jungchen, früher haben wir noch auf Kork geworfen!', 'Ich spiel seit 1974. Mal sehen, was du kannst.'], nett: ['Hey! Schön, dass du da bist. Viel Glück!', 'Auf ein faires Spiel!'], frech: ['Na, wieder Lust zu verlieren?', 'Ich hoffe, du hast dein Taschengeld dabei!'], nervoes: ['Oh Mann, ich bin so nervös … meine Hände schwitzen.', 'Bitte nicht zu doll, ja?'], arrogant: ['Ah. Noch ein Opfer.', 'Wirf ruhig zuerst. Macht eh keinen Unterschied.'], profi: ['Konzentration. Rhythmus. Los geht’s.', 'Gutes Spiel. Möge der Bessere gewinnen.'], boss: ['Ich habe auf dich gewartet. Zeig mir, dass du es verdient hast, hier zu stehen.'] },
  youHigh: { opa: ['Donnerwetter!', 'Da hätte ich früher auch nicht besser geworfen.'], nett: ['Wow, richtig stark!', 'Schöner Wurf!'], frech: ['Glückstreffer. Kommt nicht wieder vor.', 'Okay … das war ganz okay.'], nervoes: ['Oh nein, oh nein …', 'Das ist jetzt nicht gut für mich.'], arrogant: ['Selbst ein blindes Huhn …', 'Hm. Netter Versuch.'], profi: ['Gut gespielt.', 'Starker Score.'], boss: ['Interessant. Weiter so.'] },
  you180: { opa: ['HUNDERTACHTZIG! Ich brauch nen Schnaps.'], nett: ['Hundertachtzig! Unglaublich!'], frech: ['Okay, okay … Respekt. Diesmal.'], nervoes: ['Hundertachtzig?! Ich geh nach Hause.'], arrogant: ['… Das hast du geübt, oder?'], profi: ['Maximum. Respekt.'], boss: ['Endlich ein würdiger Gegner.'] },
  youLow: { opa: ['Daneben ist auch vorbei.', 'Brille vergessen?'], nett: ['Kopf hoch, das wird!', 'Passiert den Besten.'], frech: ['Hast du die Augen zu gehabt?', 'Die Scheibe ist da vorne!'], nervoes: ['Puh, Glück für mich.'], arrogant: ['Wie erwartet.', 'Typischer Anfänger-Score.'], profi: ['Ruhig bleiben, Rhythmus finden.'], boss: ['Ist das alles?'] },
  youBust: { opa: ['Überworfen! Wie mein Neffe.'], nett: ['Oh, knapp drüber!'], frech: ['Rechnen ist nicht so deins, was?'], nervoes: ['Oh, das passiert mir auch ständig.'], arrogant: ['Mathematik, mein Freund.'], profi: ['Kontrolle ist alles.'], boss: ['Fehler werden hier bestraft.'] },
  meHigh: { opa: ['Siehste! Alte Schule!'], nett: ['Oh, das lief gut!'], frech: ['Lern was, Kleiner!', 'Zack!'], nervoes: ['Oh! Hat geklappt?!'], arrogant: ['Wie immer.', 'Zu leicht.'], profi: ['Weiter.', 'Sauber.'], boss: ['So spielt ein Champion.'] },
  meLow: { opa: ['Das Knie, das Knie …', 'Früher war mehr Licht hier.'], nett: ['Hoppla, das war nix.'], frech: ['Die Scheibe hängt schief!', 'Das zählt nicht, ich hab geniest!'], nervoes: ['Oh nein, oh nein, oh nein.'], arrogant: ['Absicht. Ich lass dich ran.'], profi: ['Abhaken.'], boss: ['…'] },
  meBust: { opa: ['Ach, verflixt!'], nett: ['Mist, verzählt!'], frech: ['Das war Taktik!'], nervoes: ['Ich wusste es …'], arrogant: ['Das Board ist kaputt.'], profi: ['Ärgerlich.'], boss: ['Interessant.'] },
  meLeg: { opa: ['Leg für den Opa!'], nett: ['Juhu, das Leg ist meins!'], frech: ['Und tschüss!'], nervoes: ['Ich hab’s geschafft?!'], arrogant: ['Natürlich.'], profi: ['Leg gewonnen. Weiter.'], boss: ['Eins näher am Ende. Deinem.'] },
  youLeg: { opa: ['Gut gemacht, Jungchen.'], nett: ['Glückwunsch, verdient!'], frech: ['Hmpf. Zufall.'], nervoes: ['Wusste ich’s doch.'], arrogant: ['Ich war abgelenkt.'], profi: ['Gut gecheckt.'], boss: ['Du blutest noch nicht genug.'] },
  meMatch: { opa: ['Komm wieder, wenn du groß bist!'], nett: ['Gutes Spiel! Nächstes Mal klappt’s bestimmt.'], frech: ['Wer ist hier der Chef?!'], nervoes: ['Ich … hab gewonnen? Wahnsinn!'], arrogant: ['War klar.'], profi: ['Gutes Match. Trainier die Doppel.'], boss: ['Noch nicht. Komm stärker zurück.'] },
  youMatch: { opa: ['Du hast es drauf. Ab in die nächste Runde!'], nett: ['Glückwunsch! Du bist bereit für mehr!'], frech: ['Okay, okay. Revanche später!'], nervoes: ['War eh klar. Viel Erfolg weiter!'], arrogant: ['… Das bleibt unter uns.'], profi: ['Verdient. Man sieht sich auf der Tour.'], boss: ['Du bist der neue Champion. Die Bühne gehört dir.'] },
};
function botLine(level, ev) { const p = botDef(level).pers; const pool = (LINES[ev] || {})[p] || (LINES[ev] || {}).profi; return pool ? pick(pool) : ''; }
function careerFormat(L) { return { start: 501, inMode: 'single', outMode: 'double', fmt: 'first', count: L <= 10 ? 2 : L < 30 ? 3 : 4, unit: 'legs' }; }

// Wurf-Entscheidung
const SETUP_LEAVES = [32, 40, 16, 36, 24, 20, 8, 12, 50];
function botTarget(rem, dartsLeft, out, opened, inMode) {
  if (!opened) return inMode === 'triple' ? { n: 20, m: 3 } : { n: 20, m: 2 };
  if (rem <= 170) { const r = checkout(rem, dartsLeft, out); if (r) return { n: r[0].n, m: r[0].m }; }
  if (rem <= 60) { for (const lv of SETUP_LEAVES) { const s = rem - lv; if (s >= 1 && s <= 20) return { n: s, m: 1 }; } }
  if (rem < 100 && rem > 60) { const s = rem - 40; if (s % 3 === 0 && s / 3 <= 20) return { n: s / 3, m: 3 }; }
  if (rem === 99 || rem === 97 || rem <= 60) return { n: 19, m: 3 };
  return { n: 20, m: 3 };
}
const REAL_MAP = [[20, 5.9], [25, 9.1], [30, 14.8], [35, 22], [40, 30], [50, 42], [60, 51.8], [70, 60.7], [80, 72.1], [90, 82], [100, 90.2], [110, 100.6], [120, 112.6]];
function inputFor(real) { for (let i = 0; i < REAL_MAP.length - 1; i++) { const [a1, r1] = REAL_MAP[i], [a2, r2] = REAL_MAP[i + 1]; if (real >= r1 && real <= r2) return a1 + (a2 - a1) * (real - r1) / (r2 - r1); } return real < 6 ? 20 : 120; }
function botThrow(level, target) {
  const sig = sigmaForAvg(inputFor(botAvg(level)));
  const aim = target.n === 25 ? [0, 0] : pointFor(target.n, target.m, true);
  const g = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
  const k = 1;
  const x = aim[0] + g() * sig * k, y = aim[1] + g() * sig * k;
  return { pt: [x, y], ...hitAt(x, y) };
}
