"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { CardValue } from "@/types/game";
import { useGameStore } from "@/store/gameStore";
import { CardFace } from "./CardView";

const TABS = ["Grundlagen", "Karten", "Spielablauf", "Meisterkarten", "Steuerung"] as const;

const CARDS: { v: CardValue; title: string; text: string }[] = [
  { v: 1, title: "1 und 13 – Eröffnungskarten", text: "Eine Kugel vom Vorfeld auf das eigene Startfeld setzen – oder 1 bzw. 13 Felder vorwärts ziehen." },
  { v: 2, title: "2, 3, 5, 6, 9, 10, 12 – Normalkarten", text: "Eine eigene Kugel genau so viele Felder im Uhrzeigersinn ziehen. Keine Kugel darf übersprungen werden." },
  {
    v: 4,
    title: "4 – Rückwärts",
    text: "Eine eigene Kugel genau 4 Felder rückwärts ziehen. Trick: Direkt nach dem Eröffnen 4 zurück – dann bist du fast schon vor deinem Haus! Aus dem Haus heraus darf nicht rückwärts gezogen werden.",
  },
  {
    v: 7,
    title: "7 – Die Aufteilbare",
    text: "Sieben Einzelschritte, beliebig auf eigene Kugeln verteilt. Alle 7 Schritte müssen gezogen werden. Als einzige Karte wirft die 7 jede Kugel, über die sie hinwegzieht – im Zweifel auch eigene! Im Haus darf mit der 7 vor und zurück gezogen werden.",
  },
  {
    v: 8,
    title: "8 – Ziehen oder Aussetzen",
    text: "8 Felder vorwärts oder den nächsten Spieler aussetzen lassen (er legt eine Karte ungenutzt ab). Aussetzen geht nur mit eigener Kugel im Kreis.",
  },
  {
    v: "trickser",
    title: "Trickser",
    text: "Zwei beliebige Kugeln im Spielkreis tauschen – eigene, gegnerische oder die des Partners. Nur mit eigener Kugel im Kreis. Kugeln im Haus sind tabu.",
  },
  {
    v: "tac",
    title: "TAC",
    text: "Macht den letzten Zug des Spielers vor dir rückgängig – und du nutzt dessen Karte selbst! Geworfene Kugeln kommen zurück. Auch ein Siegeszug kann so verhindert werden. Nicht als erste Karte nach dem Geben.",
  },
];

const MASTER: { v: CardValue; title: string; text: string }[] = [
  { v: "engel", title: "Engel", text: "Für den linken Nachbarn eine Kugel aufs Startfeld setzen (wirft dort jede Kugel). Hat er keine im Vorfeld, bewegt der Engel eine seiner Kugeln 1 oder 13 Felder." },
  { v: "teufel", title: "Teufel", text: "Du siehst die Karten deines linken Nachbarn, spielst eine davon für ihn und bewegst seine Kugeln. Er setzt danach aus." },
  { v: "krieger", title: "Krieger", text: "Eine eigene Kugel stürmt vor bis zur nächsten Kugel und wirft sie – egal welcher Farbe. Steht sonst keine im Kreis, wirft sie sich selbst." },
  { v: "narr", title: "Narr", text: "Alle geben ihre Handkarten an den rechten Nachbarn. Du spielst sofort eine deiner neuen Karten." },
];

export function RulesModal() {
  const show = useGameStore((s) => s.showRules);
  const setShow = useGameStore((s) => s.setShowRules);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Grundlagen");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm"
          onClick={() => setShow(false)}
        >
          <motion.div
            initial={{ y: 40, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 40, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-amber-200/20 bg-gradient-to-b from-[#2a1a0e] to-[#1a100a] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-amber-200/10 px-6 py-4">
              <h2 className="font-serif text-2xl font-black text-amber-50">Wie spiele ich TAC?</h2>
              <button onClick={() => setShow(false)} className="rounded-full p-2 text-amber-100 hover:bg-white/10" aria-label="Schließen">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-1 overflow-x-auto border-b border-amber-200/10 px-4 py-2">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold ${tab === t ? "bg-amber-300 text-amber-950" : "text-amber-100/70 hover:bg-white/10"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto px-6 py-5 text-[15px] leading-relaxed text-amber-50/85">
              {tab === "Grundlagen" && (
                <div className="space-y-3">
                  <p>
                    <b className="text-amber-200">Ziel:</b> Zwei Teams zu je zwei Spielern (Partner sitzen sich gegenüber). Das Team, das zuerst alle <b>acht Kugeln</b> in seine Häuser bringt, gewinnt.
                  </p>
                  <p>
                    <b className="text-amber-200">Der Weg einer Kugel:</b> Vorfeld → (mit 1 oder 13) aufs <b>Startfeld</b> → im Uhrzeigersinn einmal um den <b>Spielkreis</b> (64 Felder) → über das Startfeld ins <b>Haus</b> (4 Felder).
                  </p>
                  <ul className="list-disc space-y-1.5 pl-5">
                    <li><b>Werfen:</b> Landet eine Kugel genau auf einer anderen, muss diese zurück ins Vorfeld – egal welche Farbe.</li>
                    <li><b>Überspringen verboten:</b> Keine Kugel darf übersprungen werden (Ausnahme: die 7 wirft im Vorbeiziehen).</li>
                    <li><b>Frisch eröffnet:</b> Eine gerade aufs Startfeld gesetzte Kugel darf nicht direkt ins Haus – sie muss das Startfeld erst einmal verlassen.</li>
                    <li><b>Haus:</b> Im Haus darf nicht übersprungen werden. Wer nicht exakt passt, muss eventuell noch eine Runde drehen. Eine Kugel ohne freies Feld vor sich ist <i>eingerastet</i>.</li>
                    <li><b>Wer kann, der muss!</b> Kannst du irgendeine Karte spielen, musst du – auch wenn es weh tut. Nur wenn gar nichts geht, legst du eine Karte ungenutzt ab.</li>
                    <li><b>Endphase:</b> Sind alle deine Kugeln im Haus, spielst du mit den Kugeln deines Partners weiter.</li>
                  </ul>
                </div>
              )}
              {tab === "Karten" && (
                <div className="space-y-4">
                  {CARDS.map((c) => (
                    <div key={c.title} className="flex items-start gap-4">
                      <CardFace value={c.v} size="sm" />
                      <div>
                        <div className="font-bold text-amber-200">{c.title}</div>
                        <p className="text-sm">{c.text}</p>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-amber-100/50">Deck: 9× 1, 9× 13, 8× 7, je 7× 2–6, 8–10, 12, 7× Trickser, 4× TAC = 100 Karten. Eine 11 gibt es nicht – 11 Felder Abstand sind „sicher“.</p>
                </div>
              )}
              {tab === "Spielablauf" && (
                <ol className="list-decimal space-y-2 pl-5">
                  <li><b>Geben:</b> Jeder erhält 5 Karten. Nach 5 Runden ist der Stapel (100 Karten) aufgebraucht und wird neu gemischt.</li>
                  <li><b>Melden:</b> Jeder sagt, ob er eröffnen kann („Ich kann!“ / „Ich kann nicht!“) – aber nicht womit.</li>
                  <li><b>Tauschen:</b> Partner tauschen verdeckt je eine Karte. Tipp: Gib deinem Partner eine 1 oder 13, wenn er nicht kann!</li>
                  <li><b>Spielen:</b> Reihum (im Uhrzeigersinn) wird je eine Karte offen ausgespielt und der Zug ausgeführt – erst legen, dann ziehen.</li>
                </ol>
              )}
              {tab === "Meisterkarten" && (
                <div className="space-y-4">
                  <p className="text-sm text-amber-100/60">In der Meisterversion kommen vier Karten hinzu (104 Karten). Bei der letzten Ausgabe eines Stapels gibt es 6 Karten (Meisterrunde).</p>
                  {MASTER.map((c) => (
                    <div key={c.title} className="flex items-start gap-4">
                      <CardFace value={c.v} size="sm" />
                      <div>
                        <div className="font-bold text-purple-200">{c.title}</div>
                        <p className="text-sm">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab === "Steuerung" && (
                <ul className="list-disc space-y-2 pl-5">
                  <li>Klicke eine <b>Karte</b> in deiner Hand. Alle Kugeln, die du damit bewegen kannst, beginnen zu leuchten.</li>
                  <li>Klicke eine leuchtende <b>Kugel</b> und dann ein gelb pulsierendes <b>Zielfeld</b>. Gibt es nur eine Kugel, ist sie automatisch gewählt.</li>
                  <li><b>7:</b> Ziehe Schritt für Schritt – Kugel wählen, Ziel klicken, bis alle 7 Schritte verbraucht sind. „Zurücksetzen“ beginnt neu.</li>
                  <li><b>Trickser:</b> Erste Kugel klicken, dann die blau markierte Tauschpartnerin.</li>
                  <li><b>TAC:</b> Beim Auswählen siehst du eine Vorschau mit zurückgenommenem Zug.</li>
                  <li>Aussetzen (8), Teufel, Narr und Ablegen erscheinen als Buttons über deiner Hand.</li>
                  <li>Im <b>Spielverlauf</b> rechts siehst du jeden Zug, im <b>Chat</b> kannst du deinem Partner schreiben.</li>
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
