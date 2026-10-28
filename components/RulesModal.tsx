"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { CardValue } from "@/types/game";
import type { Lang } from "@/lib/i18n";
import { useGameStore } from "@/store/gameStore";
import { useT } from "@/lib/useI18n";
import { CardFace } from "./CardView";

type Tab = "basics" | "cards" | "flow" | "master" | "controls" | "modes";
const TABS: Tab[] = ["basics", "cards", "flow", "master", "controls", "modes"];

interface Content {
  title: string;
  tabs: Record<Tab, string>;
  basics: string[];
  goal: string;
  path: string;
  cards: { v: CardValue; title: string; text: string }[];
  deck: string;
  flow: string[];
  masterIntro: string;
  master: { v: CardValue; title: string; text: string }[];
  controls: string[];
  modes: string[];
  close: string;
}

const CONTENT: Record<Lang, Content> = {
  de: {
    title: "Wie spiele ich TAC?",
    tabs: { basics: "Grundlagen", cards: "Karten", flow: "Spielablauf", master: "Meisterkarten", controls: "Steuerung", modes: "Spielmodi" },
    goal: "**Ziel:** Zwei Teams zu je zwei Spielern (Partner sitzen sich gegenüber). Das Team, das zuerst alle **acht Kugeln** in seine Häuser bringt, gewinnt.",
    path: "**Der Weg einer Kugel:** Vorfeld → (mit 1 oder 13) aufs **Startfeld** → im Uhrzeigersinn einmal um den **Spielkreis** (64 Felder) → über das Startfeld ins **Haus** (4 Felder).",
    basics: [
      "**Werfen:** Landet eine Kugel genau auf einer anderen, muss diese zurück ins Vorfeld – egal welche Farbe.",
      "**Überspringen verboten:** Keine Kugel darf übersprungen werden (Ausnahme: die 7 wirft im Vorbeiziehen).",
      "**Frisch eröffnet:** Eine gerade aufs Startfeld gesetzte Kugel darf nicht direkt ins Haus – sie muss das Startfeld erst einmal verlassen.",
      "**Haus:** Im Haus darf nicht übersprungen werden. Wer nicht exakt passt, muss eventuell noch eine Runde drehen. Eine Kugel ohne freies Feld vor sich ist *eingerastet*.",
      "**Wer kann, der muss!** Kannst du irgendeine Karte spielen, musst du – auch wenn es weh tut. Nur wenn gar nichts geht, legst du eine Karte ungenutzt ab.",
      "**Endphase:** Sind alle deine Kugeln im Haus, spielst du mit den Kugeln deines Partners weiter.",
    ],
    cards: [
      { v: 1, title: "1 und 13 – Eröffnungskarten", text: "Eine Kugel vom Vorfeld auf das eigene Startfeld setzen – oder 1 bzw. 13 Felder vorwärts ziehen." },
      { v: 2, title: "2, 3, 5, 6, 9, 10, 12 – Normalkarten", text: "Eine eigene Kugel genau so viele Felder im Uhrzeigersinn ziehen. Keine Kugel darf übersprungen werden." },
      { v: 4, title: "4 – Rückwärts", text: "Eine eigene Kugel genau 4 Felder rückwärts ziehen. Trick: Direkt nach dem Eröffnen 4 zurück – dann bist du fast schon vor deinem Haus! Aus dem Haus heraus darf nicht rückwärts gezogen werden." },
      { v: 7, title: "7 – Die Aufteilbare", text: "Sieben Einzelschritte, beliebig auf eigene Kugeln verteilt. Alle 7 Schritte müssen gezogen werden. Als einzige Karte wirft die 7 jede Kugel, über die sie hinwegzieht – im Zweifel auch eigene! Im Haus darf mit der 7 vor und zurück gezogen werden." },
      { v: 8, title: "8 – Ziehen oder Aussetzen", text: "8 Felder vorwärts oder den nächsten Spieler aussetzen lassen (er legt eine Karte ungenutzt ab). Aussetzen geht nur mit eigener Kugel im Kreis." },
      { v: "trickser", title: "Trickser", text: "Zwei beliebige Kugeln im Spielkreis tauschen – eigene, gegnerische oder die des Partners. Nur mit eigener Kugel im Kreis. Kugeln im Haus sind tabu." },
      { v: "tac", title: "TAC", text: "Macht den letzten Zug des Spielers vor dir rückgängig – und du nutzt dessen Karte selbst! Geworfene Kugeln kommen zurück. Auch ein Siegeszug kann so verhindert werden. Nicht als erste Karte nach dem Geben." },
    ],
    deck: "Deck: 9× 1, 9× 13, 8× 7, je 7× 2–6, 8–10, 12, 7× Trickser, 4× TAC = 100 Karten. Eine 11 gibt es nicht – 11 Felder Abstand sind „sicher“.",
    flow: [
      "**Geben:** Jeder erhält 5 Karten. Nach 5 Runden ist der Stapel (100 Karten) aufgebraucht und wird neu gemischt.",
      "**Melden:** Jeder sagt, ob er eröffnen kann („Ich kann!“ / „Ich kann nicht!“) – aber nicht womit.",
      "**Tauschen:** Partner tauschen verdeckt je eine Karte. Tipp: Gib deinem Partner eine 1 oder 13, wenn er nicht kann!",
      "**Spielen:** Reihum (im Uhrzeigersinn) wird je eine Karte offen ausgespielt und der Zug ausgeführt – erst legen, dann ziehen.",
    ],
    masterIntro: "In der Meisterversion kommen vier Karten hinzu (104 Karten). Bei der letzten Ausgabe eines Stapels gibt es 6 Karten (Meisterrunde).",
    master: [
      { v: "engel", title: "Engel", text: "Für den linken Nachbarn eine Kugel aufs Startfeld setzen (wirft dort jede Kugel). Hat er keine im Vorfeld, bewegt der Engel eine seiner Kugeln 1 oder 13 Felder." },
      { v: "teufel", title: "Teufel", text: "Du siehst die Karten deines linken Nachbarn, spielst eine davon für ihn und bewegst seine Kugeln. Er setzt danach aus." },
      { v: "krieger", title: "Krieger", text: "Eine eigene Kugel stürmt vor bis zur nächsten Kugel und wirft sie – egal welcher Farbe. Steht sonst keine im Kreis, wirft sie sich selbst." },
      { v: "narr", title: "Narr", text: "Alle geben ihre Handkarten an den rechten Nachbarn. Du spielst sofort eine deiner neuen Karten." },
    ],
    controls: [
      "Tippe eine **Karte** in deiner Hand an. Alle Kugeln, die du damit bewegen kannst, beginnen zu leuchten.",
      "Tippe eine leuchtende **Kugel** und dann ein gelb pulsierendes **Zielfeld** an – knapp daneben reicht, das Ziel rastet ein. Gibt es nur eine Kugel, ist sie automatisch gewählt.",
      "Am Handy zeigt eine **Lupe** über deinem Finger, worauf du zielst. Loslassen führt den Zug aus.",
      "**7:** Ziehe Schritt für Schritt – Kugel wählen, Ziel antippen, bis alle 7 Schritte verbraucht sind. „Zurücksetzen“ beginnt neu.",
      "**Trickser:** Erste Kugel antippen, dann die blau markierte Tauschpartnerin.",
      "**TAC:** Beim Auswählen siehst du eine Vorschau mit zurückgenommenem Zug.",
      "Aussetzen (8), Teufel, Narr und Ablegen erscheinen als Buttons über deiner Hand.",
      "Im **Spielverlauf** siehst du jeden Zug, im **Chat** kannst du deinem Partner schreiben.",
    ],
    modes: [
      "**Klassisch:** Du und ein Bot-Partner gegen zwei Bots. Jeder Charakter hat seine eigene Spielweise.",
      "**Mit Freunden spielen:** Erstelle einen Raum und teile den Link. Freie Plätze kann der Gastgeber mit Bots besetzen – z. B. 3 Menschen + 1 Bot.",
      "**Das blinde Orakel:** Du spielst allein gegen das stärkste Bot-Duo und steuerst zusätzlich die Karten deines blinden Partners. Sie liegen verdeckt: Du kennst nur die Karte, die du ihm beim Tauschen gibst. Ziehst du blind eine Karte, die nicht spielbar ist, verfällt sie.",
    ],
    close: "Schließen",
  },
  en: {
    title: "How to play TAC?",
    tabs: { basics: "Basics", cards: "Cards", flow: "Game flow", master: "Master cards", controls: "Controls", modes: "Game modes" },
    goal: "**Goal:** Two teams of two players (partners sit opposite each other). The first team to bring all **eight marbles** into their houses wins.",
    path: "**A marble's path:** start area → (with a 1 or 13) onto the **start space** → once clockwise around the **track** (64 spaces) → past the start space into the **house** (4 spaces).",
    basics: [
      "**Knocking out:** If a marble lands exactly on another one, that marble goes back to its start area – whatever its color.",
      "**No jumping:** You may not jump over any marble (exception: the 7 knocks out marbles it passes).",
      "**Freshly entered:** A marble that was just placed on its start space may not go straight into the house – it must leave the start space first.",
      "**House:** No jumping inside the house. If the count doesn't fit exactly, you may have to go around again. A marble with no free space ahead is *locked in*.",
      "**If you can, you must!** If you can play any card, you have to – even if it hurts. Only when nothing works do you discard a card.",
      "**End game:** Once all your marbles are home, you keep playing with your partner's marbles.",
    ],
    cards: [
      { v: 1, title: "1 and 13 – Entry cards", text: "Move a marble from your start area onto your start space – or move 1 or 13 spaces forward." },
      { v: 2, title: "2, 3, 5, 6, 9, 10, 12 – Number cards", text: "Move one of your marbles exactly that many spaces clockwise. You may not jump over any marble." },
      { v: 4, title: "4 – Backwards", text: "Move one of your marbles exactly 4 spaces backwards. Trick: right after entering, go back 4 – you're almost in front of your house! You can't move backwards out of the house." },
      { v: 7, title: "7 – The splitter", text: "Seven single steps, split freely among your marbles. All 7 steps must be used. The 7 is the only card that knocks out every marble it passes – even your own! Inside the house the 7 may move back and forth." },
      { v: 8, title: "8 – Move or skip", text: "Move 8 spaces forward or make the next player skip (they discard a card). Skipping requires one of your marbles on the track." },
      { v: "trickser", title: "Trickster", text: "Swap any two marbles on the track – yours, your opponents' or your partner's. Requires one of your marbles on the track. Marbles in a house are off limits." },
      { v: "tac", title: "TAC", text: "Undoes the last move of the player before you – and you use that card yourself! Knocked-out marbles return. You can even stop a winning move this way. Not allowed as the first card after dealing." },
    ],
    deck: "Deck: 9× 1, 9× 13, 8× 7, 7× each of 2–6, 8–10, 12, 7× Trickster, 4× TAC = 100 cards. There is no 11 – a gap of 11 spaces is “safe”.",
    flow: [
      "**Deal:** Everyone gets 5 cards. After 5 rounds the deck (100 cards) is used up and gets reshuffled.",
      "**Announce:** Everyone says whether they can enter a marble (“I can!” / “I can't!”) – but not with which card.",
      "**Swap:** Partners secretly swap one card each. Tip: give your partner a 1 or 13 if they can't enter!",
      "**Play:** In turn (clockwise), each player plays one card face up and makes the move – play first, then move.",
    ],
    masterIntro: "The master edition adds four cards (104 cards). On the last deal of a deck everyone gets 6 cards (master round).",
    master: [
      { v: "engel", title: "Angel", text: "Place a marble on the start space for your left neighbor (knocking out anything there). If they have none in their start area, the Angel moves one of their marbles 1 or 13 spaces." },
      { v: "teufel", title: "Devil", text: "You see your left neighbor's cards, play one of them for them and move their marbles. They skip afterwards." },
      { v: "krieger", title: "Warrior", text: "One of your marbles charges ahead to the next marble and knocks it out – whatever its color. If no other marble is on the track, it knocks itself out." },
      { v: "narr", title: "Jester", text: "Everyone passes their hand to the right neighbor. You immediately play one of your new cards." },
    ],
    controls: [
      "Tap a **card** in your hand. All marbles you can move with it start to glow.",
      "Tap a glowing **marble** and then a yellow pulsing **target** – close is good enough, it snaps into place. If there's only one marble, it's selected automatically.",
      "On phones a **magnifier** above your finger shows what you're aiming at. Release to make the move.",
      "**7:** Move step by step – pick a marble, tap a target, until all 7 steps are used. “Reset” starts over.",
      "**Trickster:** Tap the first marble, then the blue-marked swap partner.",
      "**TAC:** When you select it, you see a preview with the move undone.",
      "Skip (8), Devil, Jester and Discard appear as buttons above your hand.",
      "The **history** shows every move; use the **chat** to message your partner.",
    ],
    modes: [
      "**Classic:** You and a bot partner vs. two bots. Every character has its own play style.",
      "**Play with Friends:** Create a room and share the link. The host can fill empty seats with bots – e.g. 3 humans + 1 bot.",
      "**The Blind Oracle:** You play alone against the strongest bot duo and also control your blind partner's cards. They lie face down: you only know the card you give it when swapping. Draw a card blindly that can't be played and it's lost.",
    ],
    close: "Close",
  },
};

/** Fett (**…**) und kursiv (*…*) in Regeltexten. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? (
          <b key={i} className="text-amber-200">
            {p.slice(2, -2)}
          </b>
        ) : p.startsWith("*") ? (
          <i key={i}>{p.slice(1, -1)}</i>
        ) : (
          p
        ),
      )}
    </>
  );
}

export function RulesModal() {
  const show = useGameStore((s) => s.showRules);
  const setShow = useGameStore((s) => s.setShowRules);
  const [tab, setTab] = useState<Tab>("basics");
  const { lang } = useT();
  const c = CONTENT[lang];

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
              <h2 className="font-display text-2xl text-amber-50">{c.title}</h2>
              <button onClick={() => setShow(false)} className="rounded-full p-2 text-amber-100 hover:bg-white/10" aria-label={c.close}>
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
                  {c.tabs[t]}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto px-6 py-5 text-[15px] leading-relaxed text-amber-50/85">
              {tab === "basics" && (
                <div className="space-y-3">
                  <p>
                    <Rich text={c.goal} />
                  </p>
                  <p>
                    <Rich text={c.path} />
                  </p>
                  <ul className="list-disc space-y-1.5 pl-5">
                    {c.basics.map((b) => (
                      <li key={b}>
                        <Rich text={b} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tab === "cards" && (
                <div className="space-y-4">
                  {c.cards.map((card) => (
                    <div key={card.title} className="flex items-start gap-4">
                      <CardFace value={card.v} size="sm" />
                      <div>
                        <div className="font-bold text-amber-200">{card.title}</div>
                        <p className="text-sm">{card.text}</p>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-amber-100/50">{c.deck}</p>
                </div>
              )}
              {tab === "flow" && (
                <ol className="list-decimal space-y-2 pl-5">
                  {c.flow.map((f) => (
                    <li key={f}>
                      <Rich text={f} />
                    </li>
                  ))}
                </ol>
              )}
              {tab === "master" && (
                <div className="space-y-4">
                  <p className="text-sm text-amber-100/60">{c.masterIntro}</p>
                  {c.master.map((card) => (
                    <div key={card.title} className="flex items-start gap-4">
                      <CardFace value={card.v} size="sm" />
                      <div>
                        <div className="font-bold text-purple-200">{card.title}</div>
                        <p className="text-sm">{card.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {(tab === "controls" || tab === "modes") && (
                <ul className="list-disc space-y-2 pl-5">
                  {c[tab].map((x) => (
                    <li key={x}>
                      <Rich text={x} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
