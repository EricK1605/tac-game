# TAC – Online-Version

Browser-Umsetzung des Team-Karten- und Brettspiels **TAC** mit KI-Gegnern. Die Regeln folgen dem offiziellen Regelheft *TACtik* (TAC Verlag, Auflage 2024).

## Starten

```bash
npm install
npm run dev        # http://localhost:3000
npm run simulate -- 100 hard,medium   # Bot gegen Bot (Engine-/KI-Test)
npm run simulate -- 50 hard,easy master
npm run simulate -- 80 medium,medium --personas graf,neutral   # Charakter gegen neutralen Bot
```

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `types/game.ts` | Typen für Karten, Kugeln, Spieler, Züge, Spielzustand |
| `lib/engine/constants.ts` | Deck (100 bzw. 104 Karten), Farben, Hilfsfunktionen |
| `lib/engine/board.ts` | Belegung, Laufwege ohne Überspringen, Einzelschritte der 7, Einrasten |
| `lib/engine/moves.ts` | Zuggenerierung für jede Karte inkl. 7-Aufteilung, Trickser, TAC, Meisterkarten |
| `lib/engine/game.ts` | Ablauf: Geben, Melden, Tauschen, Züge, Aussetzen, Teufel/Narr, Sieg (inkl. TAC gegen Siegeszug) |
| `lib/ai/botEngine.ts` | KI in drei Stufen |
| `store/gameStore.ts` | Zustand-Store, Bot-Schleife, Sounds, Chat-Reaktionen, Stimmungen, Emotes, Effekt-Ereignisse |
| `components/` | Brett (SVG + Framer Motion), Hand, Verlauf/Chat, Regelbuch, Startbildschirm |
| `components/Arena.tsx` | Arena-Ansicht: Spieler-Portraits am Brettrand, Emote- und Chat-Blasen, Effekt-Einblendungen (Rauswurf, Haus, TAC, Sieg), Emote-Knopf, Schublade für Verlauf/Chat auf kleinen Bildschirmen |
| `components/Character.tsx` | Comic-Figuren aller Charaktere mit Stimmungen, Kleidung in der Farbe des Sitzplatzes |
| `components/CharacterPicker.tsx` | Auswahl von Partner und Gegnern auf dem Startbildschirm |
| `lib/personas.ts` | Bot-Charaktere: Beschreibung, Sprüche und Spielweise (Gewichte für die KI) |
| `lib/audio.ts` | Soundeffekte per Web Audio API (synthetisch, keine Dateien) |
| `lib/haptics.ts` | Vibrations-Feedback auf Mobilgeräten |

Sound und Vibration starten erst nach der ersten Nutzer-Geste – vorher blockiert der Browser beides.

Die Engine ist rein funktional: `legalMoves(state)` liefert alle erlaubten Züge mit fertigem Ergebnisbrett, `applyMove(state, move)` erzeugt den nächsten Zustand. UI und Bots wählen nur aus dieser Liste – ungültige Züge sind damit ausgeschlossen.

## KI-Stufen

- **Leicht:** (fast) zufälliger gültiger Zug – der Charakter färbt die Wahl nur leicht.
- **Mittel:** priorisiert Schmeißen, Eröffnen und Ziehen ins Haus.
- **Schwer:** zusätzlich Gefahrenanalyse (Abstände zu gegnerischen Kugeln, gegnerische Startfelder), TAC wird aufgehoben, wenn er wenig bringt, kluger Kartentausch mit dem Partner und Planung von Kartenkombinationen aus der eigenen Hand (z. B. eröffnen, dann mit der 4 rückwärts).

Ergebnisse aus Bot-gegen-Bot-Simulationen: Schwer schlägt Mittel in rund 63 % der Partien, Mittel schlägt Leicht in fast allen.

## Charaktere

Vor dem Spiel wählst du Partner und Gegner aus acht Charakteren. Die Schwierigkeit legt fest, wie stark gerechnet wird; der Charakter, worauf es ankommt:

| Charakter | Spielweise |
| --- | --- |
| Rambo-Rudi | jagt gegnerische Kugeln, ignoriert Gefahren |
| Oma Hilde | sehr vorsichtig, bringt Kugeln sicher heim, hortet TAC |
| Prof. Knobel | plant Kartenkombinationen schon auf „Mittel“, spart TAC am meisten |
| Chaos-Kalle | stark zufällig, verschenkt beliebige Karten |
| Turbo-Tina | rast Richtung Haus, kaum Interesse an Kämpfen |
| Graf Fiesling | lässt am liebsten aussetzen, liebt Trickser und Teufel, spielt TAC sofort |
| Sir Kuschelbär | schenkt dem Partner seine beste Karte, wirft ungern raus |
| Ninja Nori | bleibt in Deckung und schlägt bei Gelegenheit zu |

In Simulationen (je 80 Partien „Mittel“ gegen neutralen „Mittel“-Bot) sind Ninja und Professor die stärksten Gegner, Chaos-Kalle der schwächste; Graf Fiesling lässt gut doppelt so oft aussetzen wie der neutrale Bot. Auf „Leicht“ ist die Bewertung stark verrauscht, der Charakter schimmert nur durch.

## Regelentscheidungen

Wo die Aufgabenbeschreibung vom offiziellen Regelheft abweicht, gilt das Regelheft:

- Gegeben werden je **5 Karten** (Meisterversion: letzte Ausgabe 6), nicht 5 → 4 → 3.
- Wer nicht ziehen kann, legt **eine** Karte ab, nicht die ganze Hand.
- **Engel/Teufel** wirken wie in der Meisterversion beschrieben (Engel eröffnet für den linken Nachbarn, Teufel spielt eine Karte des linken Nachbarn für ihn).
- **8** lässt den nächsten Spieler aussetzen (er legt eine Karte ab oder kontert mit TAC).

Vereinfachung: Beim Teufel darf aus der fremden Hand weder TAC noch Teufel gewählt werden.
