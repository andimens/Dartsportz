#!/bin/bash
# =====================================================================
#  Dartsportz – Profi-Caller mit ElevenLabs erzeugen (einmalig)
#  Starten im Terminal:   bash ~/Downloads/Dartsportz-Stimme.command
# =====================================================================
clear
echo "🎯  DARTSPORTZ – Caller-Stimme erzeugen"
echo "----------------------------------------"
echo "Du brauchst: ElevenLabs API-Key + Voice ID."
echo ""
read -r -s -p "ElevenLabs API-Key (wird nicht angezeigt): " KEY; echo ""
read -r -p "Voice ID: " VOICE
read -r -p "Sprache – de oder en [de]: " SPR; SPR=${SPR:-de}
if [ -z "$KEY" ] || [ -z "$VOICE" ]; then echo "❌ API-Key und Voice ID werden benötigt."; exit 1; fi
if [ "$SPR" != "de" ] && [ "$SPR" != "en" ]; then echo "❌ Sprache muss de oder en sein."; exit 1; fi

BASE="$HOME/Desktop/dartsportz-stimme"; OUT="$BASE/$SPR"; mkdir -p "$OUT"
DATA=$(sed -n '/^__DATA__$/,$p' "$0" | tail -n +2 | awk -F'\t' -v l="$SPR" '$1==l')
TOTAL=$(printf "%s\n" "$DATA" | grep -c .)
echo ""; echo "Erzeuge $TOTAL Ansagen nach: $OUT"
echo "(Schon vorhandene Dateien werden übersprungen – du kannst jederzeit abbrechen und neu starten.)"; echo ""

i=0
while IFS=$'\t' read -r L K BIG T; do
  [ -z "$K" ] && continue
  i=$((i+1)); f="$OUT/$K.mp3"
  if [ -s "$f" ]; then continue; fi
  if [ "$BIG" = "1" ]; then ST=0.25; STY=0.85; else ST=0.45; STY=0.45; fi
  JSON="{\"text\":\"$T\",\"model_id\":\"eleven_multilingual_v2\",\"voice_settings\":{\"stability\":$ST,\"similarity_boost\":0.85,\"style\":$STY,\"use_speaker_boost\":true}}"
  for try in 1 2 3 4 5 6; do
    CODE=$(printf "%s" "$JSON" | curl -s -o "$f.tmp" -w "%{http_code}" -X POST \
      "https://api.elevenlabs.io/v1/text-to-speech/$VOICE?output_format=mp3_44100_96" \
      -H "xi-api-key: $KEY" -H "Content-Type: application/json" -H "Accept: audio/mpeg" --data-binary @-)
    if [ "$CODE" = "200" ]; then mv "$f.tmp" "$f"; break; fi
    if [ "$CODE" = "429" ]; then sleep $((try*4)); continue; fi
    echo ""; echo "❌ Fehler $CODE bei \"$T\":"; cat "$f.tmp"; echo ""; rm -f "$f.tmp"
    echo "Tipp: 401 = API-Key falsch · 404 = Voice ID falsch · 402/quota = Guthaben aufgebraucht"
    exit 1
  done
  printf "\r  %d / %d  %-30s" "$i" "$TOTAL" "$T"
done <<< "$DATA"

# Liste aller vorhandenen Ansagen für die App
KEYS=$(ls "$OUT" | grep '\.mp3$' | sed 's/\.mp3$//' | awk '{printf "%s\"%s\"", (NR>1?",":""), $0}')
printf '{"lang":"%s","voiceId":"%s","voice":"ElevenLabs","keys":[%s]}\n' "$SPR" "$VOICE" "$KEYS" > "$OUT/manifest.json"
cd "$BASE" && rm -f "dartsportz-stimme-$SPR.zip" && zip -rq "dartsportz-stimme-$SPR.zip" "$SPR"
echo ""; echo ""
echo "✅ Fertig! Datei: $BASE/dartsportz-stimme-$SPR.zip"
echo "   Schick diese ZIP-Datei an Claude in den Chat – dann wird sie in die App eingebaut."
open -R "$BASE/dartsportz-stimme-$SPR.zip" 2>/dev/null
exit 0
__DATA__
de	s_0	0	Kein Score!
de	s_1	0	Eins.
de	s_2	0	Zwei.
de	s_3	0	Drei.
de	s_4	0	Vier.
de	s_5	0	Fünf.
de	s_6	0	Sechs.
de	s_7	0	Sieben.
de	s_8	0	Acht.
de	s_9	0	Neun.
de	s_10	0	Zehn.
de	s_11	0	Elf.
de	s_12	0	Zwölf.
de	s_13	0	Dreizehn.
de	s_14	0	Vierzehn.
de	s_15	0	Fünfzehn.
de	s_16	0	Sechzehn.
de	s_17	0	Siebzehn.
de	s_18	0	Achtzehn.
de	s_19	0	Neunzehn.
de	s_20	0	Zwanzig.
de	s_21	0	Einundzwanzig.
de	s_22	0	Zweiundzwanzig.
de	s_23	0	Dreiundzwanzig.
de	s_24	0	Vierundzwanzig.
de	s_25	0	Fünfundzwanzig.
de	s_26	0	Sechsundzwanzig.
de	s_27	0	Siebenundzwanzig.
de	s_28	0	Achtundzwanzig.
de	s_29	0	Neunundzwanzig.
de	s_30	0	Dreißig.
de	s_31	0	Einunddreißig.
de	s_32	0	Zweiunddreißig.
de	s_33	0	Dreiunddreißig.
de	s_34	0	Vierunddreißig.
de	s_35	0	Fünfunddreißig.
de	s_36	0	Sechsunddreißig.
de	s_37	0	Siebenunddreißig.
de	s_38	0	Achtunddreißig.
de	s_39	0	Neununddreißig.
de	s_40	0	Vierzig.
de	s_41	0	Einundvierzig.
de	s_42	0	Zweiundvierzig.
de	s_43	0	Dreiundvierzig.
de	s_44	0	Vierundvierzig.
de	s_45	0	Fünfundvierzig.
de	s_46	0	Sechsundvierzig.
de	s_47	0	Siebenundvierzig.
de	s_48	0	Achtundvierzig.
de	s_49	0	Neunundvierzig.
de	s_50	0	Fünfzig.
de	s_51	0	Einundfünfzig.
de	s_52	0	Zweiundfünfzig.
de	s_53	0	Dreiundfünfzig.
de	s_54	0	Vierundfünfzig.
de	s_55	0	Fünfundfünfzig.
de	s_56	0	Sechsundfünfzig.
de	s_57	0	Siebenundfünfzig.
de	s_58	0	Achtundfünfzig.
de	s_59	0	Neunundfünfzig.
de	s_60	0	Sechzig.
de	s_61	0	Einundsechzig.
de	s_62	0	Zweiundsechzig.
de	s_63	0	Dreiundsechzig.
de	s_64	0	Vierundsechzig.
de	s_65	0	Fünfundsechzig.
de	s_66	0	Sechsundsechzig.
de	s_67	0	Siebenundsechzig.
de	s_68	0	Achtundsechzig.
de	s_69	0	Neunundsechzig.
de	s_70	0	Siebzig.
de	s_71	0	Einundsiebzig.
de	s_72	0	Zweiundsiebzig.
de	s_73	0	Dreiundsiebzig.
de	s_74	0	Vierundsiebzig.
de	s_75	0	Fünfundsiebzig.
de	s_76	0	Sechsundsiebzig.
de	s_77	0	Siebenundsiebzig.
de	s_78	0	Achtundsiebzig.
de	s_79	0	Neunundsiebzig.
de	s_80	0	Achtzig.
de	s_81	0	Einundachtzig.
de	s_82	0	Zweiundachtzig.
de	s_83	0	Dreiundachtzig.
de	s_84	0	Vierundachtzig.
de	s_85	0	Fünfundachtzig.
de	s_86	0	Sechsundachtzig.
de	s_87	0	Siebenundachtzig.
de	s_88	0	Achtundachtzig.
de	s_89	0	Neunundachtzig.
de	s_90	0	Neunzig.
de	s_91	0	Einundneunzig.
de	s_92	0	Zweiundneunzig.
de	s_93	0	Dreiundneunzig.
de	s_94	0	Vierundneunzig.
de	s_95	0	Fünfundneunzig.
de	s_96	0	Sechsundneunzig.
de	s_97	0	Siebenundneunzig.
de	s_98	0	Achtundneunzig.
de	s_99	0	Neunundneunzig.
de	s_100	1	Hundert!
de	s_101	1	Hunderteins!
de	s_102	1	Hundertzwei!
de	s_103	1	Hundertdrei!
de	s_104	1	Hundertvier!
de	s_105	1	Hundertfünf!
de	s_106	1	Hundertsechs!
de	s_107	1	Hundertsieben!
de	s_108	1	Hundertacht!
de	s_109	1	Hundertneun!
de	s_110	1	Hundertzehn!
de	s_111	1	Hundertelf!
de	s_112	1	Hundertzwölf!
de	s_113	1	Hundertdreizehn!
de	s_114	1	Hundertvierzehn!
de	s_115	1	Hundertfünfzehn!
de	s_116	1	Hundertsechzehn!
de	s_117	1	Hundertsiebzehn!
de	s_118	1	Hundertachtzehn!
de	s_119	1	Hundertneunzehn!
de	s_120	1	Hundertzwanzig!
de	s_121	1	Hunderteinundzwanzig!
de	s_122	1	Hundertzweiundzwanzig!
de	s_123	1	Hundertdreiundzwanzig!
de	s_124	1	Hundertvierundzwanzig!
de	s_125	1	Hundertfünfundzwanzig!
de	s_126	1	Hundertsechsundzwanzig!
de	s_127	1	Hundertsiebenundzwanzig!
de	s_128	1	Hundertachtundzwanzig!
de	s_129	1	Hundertneunundzwanzig!
de	s_130	1	Hundertdreißig!
de	s_131	1	Hunderteinunddreißig!
de	s_132	1	Hundertzweiunddreißig!
de	s_133	1	Hundertdreiunddreißig!
de	s_134	1	Hundertvierunddreißig!
de	s_135	1	Hundertfünfunddreißig!
de	s_136	1	Hundertsechsunddreißig!
de	s_137	1	Hundertsiebenunddreißig!
de	s_138	1	Hundertachtunddreißig!
de	s_139	1	Hundertneununddreißig!
de	s_140	1	Hundertvierzig!
de	s_141	1	Hunderteinundvierzig!
de	s_142	1	Hundertzweiundvierzig!
de	s_143	1	Hundertdreiundvierzig!
de	s_144	1	Hundertvierundvierzig!
de	s_145	1	Hundertfünfundvierzig!
de	s_146	1	Hundertsechsundvierzig!
de	s_147	1	Hundertsiebenundvierzig!
de	s_148	1	Hundertachtundvierzig!
de	s_149	1	Hundertneunundvierzig!
de	s_150	1	Hundertfünfzig!
de	s_151	1	Hunderteinundfünfzig!
de	s_152	1	Hundertzweiundfünfzig!
de	s_153	1	Hundertdreiundfünfzig!
de	s_154	1	Hundertvierundfünfzig!
de	s_155	1	Hundertfünfundfünfzig!
de	s_156	1	Hundertsechsundfünfzig!
de	s_157	1	Hundertsiebenundfünfzig!
de	s_158	1	Hundertachtundfünfzig!
de	s_159	1	Hundertneunundfünfzig!
de	s_160	1	Hundertsechzig!
de	s_161	1	Hunderteinundsechzig!
de	s_162	1	Hundertzweiundsechzig!
de	s_163	1	Hundertdreiundsechzig!
de	s_164	1	Hundertvierundsechzig!
de	s_165	1	Hundertfünfundsechzig!
de	s_166	1	Hundertsechsundsechzig!
de	s_167	1	Hundertsiebenundsechzig!
de	s_168	1	Hundertachtundsechzig!
de	s_169	1	Hundertneunundsechzig!
de	s_170	1	Hundertsiebzig!
de	s_171	1	Hunderteinundsiebzig!
de	s_172	1	Hundertzweiundsiebzig!
de	s_173	1	Hundertdreiundsiebzig!
de	s_174	1	Hundertvierundsiebzig!
de	s_175	1	Hundertfünfundsiebzig!
de	s_176	1	Hundertsechsundsiebzig!
de	s_177	1	Hundertsiebenundsiebzig!
de	s_178	1	Hundertachtundsiebzig!
de	s_179	1	Hundertneunundsiebzig!
de	s_180	1	HUNDERTACHTZIIIG!
de	r_2	0	Zwei.
de	r_3	0	Drei.
de	r_4	0	Vier.
de	r_5	0	Fünf.
de	r_6	0	Sechs.
de	r_7	0	Sieben.
de	r_8	0	Acht.
de	r_9	0	Neun.
de	r_10	0	Zehn.
de	r_11	0	Elf.
de	r_12	0	Zwölf.
de	r_13	0	Dreizehn.
de	r_14	0	Vierzehn.
de	r_15	0	Fünfzehn.
de	r_16	0	Sechzehn.
de	r_17	0	Siebzehn.
de	r_18	0	Achtzehn.
de	r_19	0	Neunzehn.
de	r_20	0	Zwanzig.
de	r_21	0	Einundzwanzig.
de	r_22	0	Zweiundzwanzig.
de	r_23	0	Dreiundzwanzig.
de	r_24	0	Vierundzwanzig.
de	r_25	0	Fünfundzwanzig.
de	r_26	0	Sechsundzwanzig.
de	r_27	0	Siebenundzwanzig.
de	r_28	0	Achtundzwanzig.
de	r_29	0	Neunundzwanzig.
de	r_30	0	Dreißig.
de	r_31	0	Einunddreißig.
de	r_32	0	Zweiunddreißig.
de	r_33	0	Dreiunddreißig.
de	r_34	0	Vierunddreißig.
de	r_35	0	Fünfunddreißig.
de	r_36	0	Sechsunddreißig.
de	r_37	0	Siebenunddreißig.
de	r_38	0	Achtunddreißig.
de	r_39	0	Neununddreißig.
de	r_40	0	Vierzig.
de	r_41	0	Einundvierzig.
de	r_42	0	Zweiundvierzig.
de	r_43	0	Dreiundvierzig.
de	r_44	0	Vierundvierzig.
de	r_45	0	Fünfundvierzig.
de	r_46	0	Sechsundvierzig.
de	r_47	0	Siebenundvierzig.
de	r_48	0	Achtundvierzig.
de	r_49	0	Neunundvierzig.
de	r_50	0	Fünfzig.
de	r_51	0	Einundfünfzig.
de	r_52	0	Zweiundfünfzig.
de	r_53	0	Dreiundfünfzig.
de	r_54	0	Vierundfünfzig.
de	r_55	0	Fünfundfünfzig.
de	r_56	0	Sechsundfünfzig.
de	r_57	0	Siebenundfünfzig.
de	r_58	0	Achtundfünfzig.
de	r_59	0	Neunundfünfzig.
de	r_60	0	Sechzig.
de	r_61	0	Einundsechzig.
de	r_62	0	Zweiundsechzig.
de	r_63	0	Dreiundsechzig.
de	r_64	0	Vierundsechzig.
de	r_65	0	Fünfundsechzig.
de	r_66	0	Sechsundsechzig.
de	r_67	0	Siebenundsechzig.
de	r_68	0	Achtundsechzig.
de	r_69	0	Neunundsechzig.
de	r_70	0	Siebzig.
de	r_71	0	Einundsiebzig.
de	r_72	0	Zweiundsiebzig.
de	r_73	0	Dreiundsiebzig.
de	r_74	0	Vierundsiebzig.
de	r_75	0	Fünfundsiebzig.
de	r_76	0	Sechsundsiebzig.
de	r_77	0	Siebenundsiebzig.
de	r_78	0	Achtundsiebzig.
de	r_79	0	Neunundsiebzig.
de	r_80	0	Achtzig.
de	r_81	0	Einundachtzig.
de	r_82	0	Zweiundachtzig.
de	r_83	0	Dreiundachtzig.
de	r_84	0	Vierundachtzig.
de	r_85	0	Fünfundachtzig.
de	r_86	0	Sechsundachtzig.
de	r_87	0	Siebenundachtzig.
de	r_88	0	Achtundachtzig.
de	r_89	0	Neunundachtzig.
de	r_90	0	Neunzig.
de	r_91	0	Einundneunzig.
de	r_92	0	Zweiundneunzig.
de	r_93	0	Dreiundneunzig.
de	r_94	0	Vierundneunzig.
de	r_95	0	Fünfundneunzig.
de	r_96	0	Sechsundneunzig.
de	r_97	0	Siebenundneunzig.
de	r_98	0	Achtundneunzig.
de	r_99	0	Neunundneunzig.
de	r_100	0	Hundert.
de	r_101	0	Hunderteins.
de	r_102	0	Hundertzwei.
de	r_103	0	Hundertdrei.
de	r_104	0	Hundertvier.
de	r_105	0	Hundertfünf.
de	r_106	0	Hundertsechs.
de	r_107	0	Hundertsieben.
de	r_108	0	Hundertacht.
de	r_109	0	Hundertneun.
de	r_110	0	Hundertzehn.
de	r_111	0	Hundertelf.
de	r_112	0	Hundertzwölf.
de	r_113	0	Hundertdreizehn.
de	r_114	0	Hundertvierzehn.
de	r_115	0	Hundertfünfzehn.
de	r_116	0	Hundertsechzehn.
de	r_117	0	Hundertsiebzehn.
de	r_118	0	Hundertachtzehn.
de	r_119	0	Hundertneunzehn.
de	r_120	0	Hundertzwanzig.
de	r_121	0	Hunderteinundzwanzig.
de	r_122	0	Hundertzweiundzwanzig.
de	r_123	0	Hundertdreiundzwanzig.
de	r_124	0	Hundertvierundzwanzig.
de	r_125	0	Hundertfünfundzwanzig.
de	r_126	0	Hundertsechsundzwanzig.
de	r_127	0	Hundertsiebenundzwanzig.
de	r_128	0	Hundertachtundzwanzig.
de	r_129	0	Hundertneunundzwanzig.
de	r_130	0	Hundertdreißig.
de	r_131	0	Hunderteinunddreißig.
de	r_132	0	Hundertzweiunddreißig.
de	r_133	0	Hundertdreiunddreißig.
de	r_134	0	Hundertvierunddreißig.
de	r_135	0	Hundertfünfunddreißig.
de	r_136	0	Hundertsechsunddreißig.
de	r_137	0	Hundertsiebenunddreißig.
de	r_138	0	Hundertachtunddreißig.
de	r_139	0	Hundertneununddreißig.
de	r_140	0	Hundertvierzig.
de	r_141	0	Hunderteinundvierzig.
de	r_142	0	Hundertzweiundvierzig.
de	r_143	0	Hundertdreiundvierzig.
de	r_144	0	Hundertvierundvierzig.
de	r_145	0	Hundertfünfundvierzig.
de	r_146	0	Hundertsechsundvierzig.
de	r_147	0	Hundertsiebenundvierzig.
de	r_148	0	Hundertachtundvierzig.
de	r_149	0	Hundertneunundvierzig.
de	r_150	0	Hundertfünfzig.
de	r_151	0	Hunderteinundfünfzig.
de	r_152	0	Hundertzweiundfünfzig.
de	r_153	0	Hundertdreiundfünfzig.
de	r_154	0	Hundertvierundfünfzig.
de	r_155	0	Hundertfünfundfünfzig.
de	r_156	0	Hundertsechsundfünfzig.
de	r_157	0	Hundertsiebenundfünfzig.
de	r_158	0	Hundertachtundfünfzig.
de	r_159	0	Hundertneunundfünfzig.
de	r_160	0	Hundertsechzig.
de	r_161	0	Hunderteinundsechzig.
de	r_162	0	Hundertzweiundsechzig.
de	r_163	0	Hundertdreiundsechzig.
de	r_164	0	Hundertvierundsechzig.
de	r_165	0	Hundertfünfundsechzig.
de	r_166	0	Hundertsechsundsechzig.
de	r_167	0	Hundertsiebenundsechzig.
de	r_168	0	Hundertachtundsechzig.
de	r_169	0	Hundertneunundsechzig.
de	r_170	0	Hundertsiebzig.
de	bust	0	Überworfen!
de	gameshot	1	Game Shot – und das Leg!
de	gameshot_match	1	Game Shot – und das MATCH!
de	require	0	du brauchst …
de	gameon	1	Game on!
de	begins	0	beginnt!
de	n_harm	0	Harm!
de	n_daniel	0	Daniel!
de	n_andreas	0	Andreas!
de	n_andi	0	Andi!
de	n_vero	0	Vero!
de	n_benny	0	Benny!
de	n_tan	0	Tan!
de	n_peter	0	Peter!
de	n_anna	0	Anna!
de	n_mary	0	Mary!
de	n_levi	0	Levi!
de	n_sephora	0	Sephora!
de	n_rahel	0	Rahel!
de	n_zeki	0	Zeki!
de	n_alex	0	Alex!
de	n_ben	0	Ben!
de	n_chris	0	Chris!
de	n_david	0	David!
de	n_dennis	0	Dennis!
de	n_dominik	0	Dominik!
de	n_eric	0	Eric!
de	n_felix	0	Felix!
de	n_florian	0	Florian!
de	n_jan	0	Jan!
de	n_jonas	0	Jonas!
de	n_julian	0	Julian!
de	n_kevin	0	Kevin!
de	n_lukas	0	Lukas!
de	n_marcel	0	Marcel!
de	n_marco	0	Marco!
de	n_mario	0	Mario!
de	n_markus	0	Markus!
de	n_martin	0	Martin!
de	n_max	0	Max!
de	n_michael	0	Michael!
de	n_nico	0	Nico!
de	n_niklas	0	Niklas!
de	n_patrick	0	Patrick!
de	n_paul	0	Paul!
de	n_phil	0	Phil!
de	n_robin	0	Robin!
de	n_sascha	0	Sascha!
de	n_sebastian	0	Sebastian!
de	n_simon	0	Simon!
de	n_stefan	0	Stefan!
de	n_sven	0	Sven!
de	n_thomas	0	Thomas!
de	n_tim	0	Tim!
de	n_tobias	0	Tobias!
de	n_tom	0	Tom!
de	n_kai	0	Kai!
de	n_mike	0	Mike!
de	n_leon	0	Leon!
de	n_elias	0	Elias!
de	n_noah	0	Noah!
de	n_finn	0	Finn!
de	n_luca	0	Luca!
de	n_emre	0	Emre!
de	n_can	0	Can!
de	n_mehmet	0	Mehmet!
de	n_ali	0	Ali!
de	n_murat	0	Murat!
de	n_julia	0	Julia!
de	n_lisa	0	Lisa!
de	n_laura	0	Laura!
de	n_lena	0	Lena!
de	n_sarah	0	Sarah!
de	n_lea	0	Lea!
de	n_marie	0	Marie!
de	n_sophie	0	Sophie!
de	n_hannah	0	Hannah!
de	n_nina	0	Nina!
de	n_jana	0	Jana!
de	n_katharina	0	Katharina!
de	n_melanie	0	Melanie!
de	n_sandra	0	Sandra!
de	n_jessica	0	Jessica!
de	n_michelle	0	Michelle!
de	n_vanessa	0	Vanessa!
de	n_svenja	0	Svenja!
de	n_tina	0	Tina!
de	n_kim	0	Kim!
de	n_mia	0	Mia!
de	n_emma	0	Emma!
de	n_lara	0	Lara!
de	n_selin	0	Selin!
de	n_ayse	0	Ayse!
de	n_gast	0	Gast!
de	n_teameins	0	Team eins!
de	n_teamzwei	0	Team zwei!
de	n_teamdrei	0	Team drei!
de	n_teamvier	0	Team vier!
en	s_0	0	No score!
en	s_1	0	One.
en	s_2	0	Two.
en	s_3	0	Three.
en	s_4	0	Four.
en	s_5	0	Five.
en	s_6	0	Six.
en	s_7	0	Seven.
en	s_8	0	Eight.
en	s_9	0	Nine.
en	s_10	0	Ten.
en	s_11	0	Eleven.
en	s_12	0	Twelve.
en	s_13	0	Thirteen.
en	s_14	0	Fourteen.
en	s_15	0	Fifteen.
en	s_16	0	Sixteen.
en	s_17	0	Seventeen.
en	s_18	0	Eighteen.
en	s_19	0	Nineteen.
en	s_20	0	Twenty.
en	s_21	0	Twenty-one.
en	s_22	0	Twenty-two.
en	s_23	0	Twenty-three.
en	s_24	0	Twenty-four.
en	s_25	0	Twenty-five.
en	s_26	0	Twenty-six.
en	s_27	0	Twenty-seven.
en	s_28	0	Twenty-eight.
en	s_29	0	Twenty-nine.
en	s_30	0	Thirty.
en	s_31	0	Thirty-one.
en	s_32	0	Thirty-two.
en	s_33	0	Thirty-three.
en	s_34	0	Thirty-four.
en	s_35	0	Thirty-five.
en	s_36	0	Thirty-six.
en	s_37	0	Thirty-seven.
en	s_38	0	Thirty-eight.
en	s_39	0	Thirty-nine.
en	s_40	0	Forty.
en	s_41	0	Forty-one.
en	s_42	0	Forty-two.
en	s_43	0	Forty-three.
en	s_44	0	Forty-four.
en	s_45	0	Forty-five.
en	s_46	0	Forty-six.
en	s_47	0	Forty-seven.
en	s_48	0	Forty-eight.
en	s_49	0	Forty-nine.
en	s_50	0	Fifty.
en	s_51	0	Fifty-one.
en	s_52	0	Fifty-two.
en	s_53	0	Fifty-three.
en	s_54	0	Fifty-four.
en	s_55	0	Fifty-five.
en	s_56	0	Fifty-six.
en	s_57	0	Fifty-seven.
en	s_58	0	Fifty-eight.
en	s_59	0	Fifty-nine.
en	s_60	0	Sixty.
en	s_61	0	Sixty-one.
en	s_62	0	Sixty-two.
en	s_63	0	Sixty-three.
en	s_64	0	Sixty-four.
en	s_65	0	Sixty-five.
en	s_66	0	Sixty-six.
en	s_67	0	Sixty-seven.
en	s_68	0	Sixty-eight.
en	s_69	0	Sixty-nine.
en	s_70	0	Seventy.
en	s_71	0	Seventy-one.
en	s_72	0	Seventy-two.
en	s_73	0	Seventy-three.
en	s_74	0	Seventy-four.
en	s_75	0	Seventy-five.
en	s_76	0	Seventy-six.
en	s_77	0	Seventy-seven.
en	s_78	0	Seventy-eight.
en	s_79	0	Seventy-nine.
en	s_80	0	Eighty.
en	s_81	0	Eighty-one.
en	s_82	0	Eighty-two.
en	s_83	0	Eighty-three.
en	s_84	0	Eighty-four.
en	s_85	0	Eighty-five.
en	s_86	0	Eighty-six.
en	s_87	0	Eighty-seven.
en	s_88	0	Eighty-eight.
en	s_89	0	Eighty-nine.
en	s_90	0	Ninety.
en	s_91	0	Ninety-one.
en	s_92	0	Ninety-two.
en	s_93	0	Ninety-three.
en	s_94	0	Ninety-four.
en	s_95	0	Ninety-five.
en	s_96	0	Ninety-six.
en	s_97	0	Ninety-seven.
en	s_98	0	Ninety-eight.
en	s_99	0	Ninety-nine.
en	s_100	1	One hundred!
en	s_101	1	One hundred and one!
en	s_102	1	One hundred and two!
en	s_103	1	One hundred and three!
en	s_104	1	One hundred and four!
en	s_105	1	One hundred and five!
en	s_106	1	One hundred and six!
en	s_107	1	One hundred and seven!
en	s_108	1	One hundred and eight!
en	s_109	1	One hundred and nine!
en	s_110	1	One hundred and ten!
en	s_111	1	One hundred and eleven!
en	s_112	1	One hundred and twelve!
en	s_113	1	One hundred and thirteen!
en	s_114	1	One hundred and fourteen!
en	s_115	1	One hundred and fifteen!
en	s_116	1	One hundred and sixteen!
en	s_117	1	One hundred and seventeen!
en	s_118	1	One hundred and eighteen!
en	s_119	1	One hundred and nineteen!
en	s_120	1	One hundred and twenty!
en	s_121	1	One hundred and twenty-one!
en	s_122	1	One hundred and twenty-two!
en	s_123	1	One hundred and twenty-three!
en	s_124	1	One hundred and twenty-four!
en	s_125	1	One hundred and twenty-five!
en	s_126	1	One hundred and twenty-six!
en	s_127	1	One hundred and twenty-seven!
en	s_128	1	One hundred and twenty-eight!
en	s_129	1	One hundred and twenty-nine!
en	s_130	1	One hundred and thirty!
en	s_131	1	One hundred and thirty-one!
en	s_132	1	One hundred and thirty-two!
en	s_133	1	One hundred and thirty-three!
en	s_134	1	One hundred and thirty-four!
en	s_135	1	One hundred and thirty-five!
en	s_136	1	One hundred and thirty-six!
en	s_137	1	One hundred and thirty-seven!
en	s_138	1	One hundred and thirty-eight!
en	s_139	1	One hundred and thirty-nine!
en	s_140	1	One hundred and forty!
en	s_141	1	One hundred and forty-one!
en	s_142	1	One hundred and forty-two!
en	s_143	1	One hundred and forty-three!
en	s_144	1	One hundred and forty-four!
en	s_145	1	One hundred and forty-five!
en	s_146	1	One hundred and forty-six!
en	s_147	1	One hundred and forty-seven!
en	s_148	1	One hundred and forty-eight!
en	s_149	1	One hundred and forty-nine!
en	s_150	1	One hundred and fifty!
en	s_151	1	One hundred and fifty-one!
en	s_152	1	One hundred and fifty-two!
en	s_153	1	One hundred and fifty-three!
en	s_154	1	One hundred and fifty-four!
en	s_155	1	One hundred and fifty-five!
en	s_156	1	One hundred and fifty-six!
en	s_157	1	One hundred and fifty-seven!
en	s_158	1	One hundred and fifty-eight!
en	s_159	1	One hundred and fifty-nine!
en	s_160	1	One hundred and sixty!
en	s_161	1	One hundred and sixty-one!
en	s_162	1	One hundred and sixty-two!
en	s_163	1	One hundred and sixty-three!
en	s_164	1	One hundred and sixty-four!
en	s_165	1	One hundred and sixty-five!
en	s_166	1	One hundred and sixty-six!
en	s_167	1	One hundred and sixty-seven!
en	s_168	1	One hundred and sixty-eight!
en	s_169	1	One hundred and sixty-nine!
en	s_170	1	One hundred and seventy!
en	s_171	1	One hundred and seventy-one!
en	s_172	1	One hundred and seventy-two!
en	s_173	1	One hundred and seventy-three!
en	s_174	1	One hundred and seventy-four!
en	s_175	1	One hundred and seventy-five!
en	s_176	1	One hundred and seventy-six!
en	s_177	1	One hundred and seventy-seven!
en	s_178	1	One hundred and seventy-eight!
en	s_179	1	One hundred and seventy-nine!
en	s_180	1	ONE HUNDRED AND EIGHTYYY!
en	r_2	0	Two.
en	r_3	0	Three.
en	r_4	0	Four.
en	r_5	0	Five.
en	r_6	0	Six.
en	r_7	0	Seven.
en	r_8	0	Eight.
en	r_9	0	Nine.
en	r_10	0	Ten.
en	r_11	0	Eleven.
en	r_12	0	Twelve.
en	r_13	0	Thirteen.
en	r_14	0	Fourteen.
en	r_15	0	Fifteen.
en	r_16	0	Sixteen.
en	r_17	0	Seventeen.
en	r_18	0	Eighteen.
en	r_19	0	Nineteen.
en	r_20	0	Twenty.
en	r_21	0	Twenty-one.
en	r_22	0	Twenty-two.
en	r_23	0	Twenty-three.
en	r_24	0	Twenty-four.
en	r_25	0	Twenty-five.
en	r_26	0	Twenty-six.
en	r_27	0	Twenty-seven.
en	r_28	0	Twenty-eight.
en	r_29	0	Twenty-nine.
en	r_30	0	Thirty.
en	r_31	0	Thirty-one.
en	r_32	0	Thirty-two.
en	r_33	0	Thirty-three.
en	r_34	0	Thirty-four.
en	r_35	0	Thirty-five.
en	r_36	0	Thirty-six.
en	r_37	0	Thirty-seven.
en	r_38	0	Thirty-eight.
en	r_39	0	Thirty-nine.
en	r_40	0	Forty.
en	r_41	0	Forty-one.
en	r_42	0	Forty-two.
en	r_43	0	Forty-three.
en	r_44	0	Forty-four.
en	r_45	0	Forty-five.
en	r_46	0	Forty-six.
en	r_47	0	Forty-seven.
en	r_48	0	Forty-eight.
en	r_49	0	Forty-nine.
en	r_50	0	Fifty.
en	r_51	0	Fifty-one.
en	r_52	0	Fifty-two.
en	r_53	0	Fifty-three.
en	r_54	0	Fifty-four.
en	r_55	0	Fifty-five.
en	r_56	0	Fifty-six.
en	r_57	0	Fifty-seven.
en	r_58	0	Fifty-eight.
en	r_59	0	Fifty-nine.
en	r_60	0	Sixty.
en	r_61	0	Sixty-one.
en	r_62	0	Sixty-two.
en	r_63	0	Sixty-three.
en	r_64	0	Sixty-four.
en	r_65	0	Sixty-five.
en	r_66	0	Sixty-six.
en	r_67	0	Sixty-seven.
en	r_68	0	Sixty-eight.
en	r_69	0	Sixty-nine.
en	r_70	0	Seventy.
en	r_71	0	Seventy-one.
en	r_72	0	Seventy-two.
en	r_73	0	Seventy-three.
en	r_74	0	Seventy-four.
en	r_75	0	Seventy-five.
en	r_76	0	Seventy-six.
en	r_77	0	Seventy-seven.
en	r_78	0	Seventy-eight.
en	r_79	0	Seventy-nine.
en	r_80	0	Eighty.
en	r_81	0	Eighty-one.
en	r_82	0	Eighty-two.
en	r_83	0	Eighty-three.
en	r_84	0	Eighty-four.
en	r_85	0	Eighty-five.
en	r_86	0	Eighty-six.
en	r_87	0	Eighty-seven.
en	r_88	0	Eighty-eight.
en	r_89	0	Eighty-nine.
en	r_90	0	Ninety.
en	r_91	0	Ninety-one.
en	r_92	0	Ninety-two.
en	r_93	0	Ninety-three.
en	r_94	0	Ninety-four.
en	r_95	0	Ninety-five.
en	r_96	0	Ninety-six.
en	r_97	0	Ninety-seven.
en	r_98	0	Ninety-eight.
en	r_99	0	Ninety-nine.
en	r_100	0	One hundred.
en	r_101	0	One hundred and one.
en	r_102	0	One hundred and two.
en	r_103	0	One hundred and three.
en	r_104	0	One hundred and four.
en	r_105	0	One hundred and five.
en	r_106	0	One hundred and six.
en	r_107	0	One hundred and seven.
en	r_108	0	One hundred and eight.
en	r_109	0	One hundred and nine.
en	r_110	0	One hundred and ten.
en	r_111	0	One hundred and eleven.
en	r_112	0	One hundred and twelve.
en	r_113	0	One hundred and thirteen.
en	r_114	0	One hundred and fourteen.
en	r_115	0	One hundred and fifteen.
en	r_116	0	One hundred and sixteen.
en	r_117	0	One hundred and seventeen.
en	r_118	0	One hundred and eighteen.
en	r_119	0	One hundred and nineteen.
en	r_120	0	One hundred and twenty.
en	r_121	0	One hundred and twenty-one.
en	r_122	0	One hundred and twenty-two.
en	r_123	0	One hundred and twenty-three.
en	r_124	0	One hundred and twenty-four.
en	r_125	0	One hundred and twenty-five.
en	r_126	0	One hundred and twenty-six.
en	r_127	0	One hundred and twenty-seven.
en	r_128	0	One hundred and twenty-eight.
en	r_129	0	One hundred and twenty-nine.
en	r_130	0	One hundred and thirty.
en	r_131	0	One hundred and thirty-one.
en	r_132	0	One hundred and thirty-two.
en	r_133	0	One hundred and thirty-three.
en	r_134	0	One hundred and thirty-four.
en	r_135	0	One hundred and thirty-five.
en	r_136	0	One hundred and thirty-six.
en	r_137	0	One hundred and thirty-seven.
en	r_138	0	One hundred and thirty-eight.
en	r_139	0	One hundred and thirty-nine.
en	r_140	0	One hundred and forty.
en	r_141	0	One hundred and forty-one.
en	r_142	0	One hundred and forty-two.
en	r_143	0	One hundred and forty-three.
en	r_144	0	One hundred and forty-four.
en	r_145	0	One hundred and forty-five.
en	r_146	0	One hundred and forty-six.
en	r_147	0	One hundred and forty-seven.
en	r_148	0	One hundred and forty-eight.
en	r_149	0	One hundred and forty-nine.
en	r_150	0	One hundred and fifty.
en	r_151	0	One hundred and fifty-one.
en	r_152	0	One hundred and fifty-two.
en	r_153	0	One hundred and fifty-three.
en	r_154	0	One hundred and fifty-four.
en	r_155	0	One hundred and fifty-five.
en	r_156	0	One hundred and fifty-six.
en	r_157	0	One hundred and fifty-seven.
en	r_158	0	One hundred and fifty-eight.
en	r_159	0	One hundred and fifty-nine.
en	r_160	0	One hundred and sixty.
en	r_161	0	One hundred and sixty-one.
en	r_162	0	One hundred and sixty-two.
en	r_163	0	One hundred and sixty-three.
en	r_164	0	One hundred and sixty-four.
en	r_165	0	One hundred and sixty-five.
en	r_166	0	One hundred and sixty-six.
en	r_167	0	One hundred and sixty-seven.
en	r_168	0	One hundred and sixty-eight.
en	r_169	0	One hundred and sixty-nine.
en	r_170	0	One hundred and seventy.
en	bust	0	No score!
en	gameshot	1	Game shot, and the leg!
en	gameshot_match	1	Game shot, and the MATCH!
en	require	0	you require …
en	gameon	1	Game on!
en	begins	0	to throw first!
en	n_harm	0	Harm!
en	n_daniel	0	Daniel!
en	n_andreas	0	Andreas!
en	n_andi	0	Andi!
en	n_vero	0	Vero!
en	n_benny	0	Benny!
en	n_tan	0	Tan!
en	n_peter	0	Peter!
en	n_anna	0	Anna!
en	n_mary	0	Mary!
en	n_levi	0	Levi!
en	n_sephora	0	Sephora!
en	n_rahel	0	Rahel!
en	n_zeki	0	Zeki!
en	n_alex	0	Alex!
en	n_ben	0	Ben!
en	n_chris	0	Chris!
en	n_david	0	David!
en	n_dennis	0	Dennis!
en	n_dominik	0	Dominik!
en	n_eric	0	Eric!
en	n_felix	0	Felix!
en	n_florian	0	Florian!
en	n_jan	0	Jan!
en	n_jonas	0	Jonas!
en	n_julian	0	Julian!
en	n_kevin	0	Kevin!
en	n_lukas	0	Lukas!
en	n_marcel	0	Marcel!
en	n_marco	0	Marco!
en	n_mario	0	Mario!
en	n_markus	0	Markus!
en	n_martin	0	Martin!
en	n_max	0	Max!
en	n_michael	0	Michael!
en	n_nico	0	Nico!
en	n_niklas	0	Niklas!
en	n_patrick	0	Patrick!
en	n_paul	0	Paul!
en	n_phil	0	Phil!
en	n_robin	0	Robin!
en	n_sascha	0	Sascha!
en	n_sebastian	0	Sebastian!
en	n_simon	0	Simon!
en	n_stefan	0	Stefan!
en	n_sven	0	Sven!
en	n_thomas	0	Thomas!
en	n_tim	0	Tim!
en	n_tobias	0	Tobias!
en	n_tom	0	Tom!
en	n_kai	0	Kai!
en	n_mike	0	Mike!
en	n_leon	0	Leon!
en	n_elias	0	Elias!
en	n_noah	0	Noah!
en	n_finn	0	Finn!
en	n_luca	0	Luca!
en	n_emre	0	Emre!
en	n_can	0	Can!
en	n_mehmet	0	Mehmet!
en	n_ali	0	Ali!
en	n_murat	0	Murat!
en	n_julia	0	Julia!
en	n_lisa	0	Lisa!
en	n_laura	0	Laura!
en	n_lena	0	Lena!
en	n_sarah	0	Sarah!
en	n_lea	0	Lea!
en	n_marie	0	Marie!
en	n_sophie	0	Sophie!
en	n_hannah	0	Hannah!
en	n_nina	0	Nina!
en	n_jana	0	Jana!
en	n_katharina	0	Katharina!
en	n_melanie	0	Melanie!
en	n_sandra	0	Sandra!
en	n_jessica	0	Jessica!
en	n_michelle	0	Michelle!
en	n_vanessa	0	Vanessa!
en	n_svenja	0	Svenja!
en	n_tina	0	Tina!
en	n_kim	0	Kim!
en	n_mia	0	Mia!
en	n_emma	0	Emma!
en	n_lara	0	Lara!
en	n_selin	0	Selin!
en	n_ayse	0	Ayse!
en	n_gast	0	Gast!
en	n_teameins	0	Team eins!
en	n_teamzwei	0	Team zwei!
en	n_teamdrei	0	Team drei!
en	n_teamvier	0	Team vier!
