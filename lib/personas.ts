// Bot-Charaktere: Aussehen, Beschreibung, Sprüche und Spielweise.

export type LookId = "ritter" | "wikinger" | "oma" | "professor" | "clown" | "rennfahrerin" | "graf" | "baer" | "ninja";

/** Gewichte für die KI – 1 entspricht dem neutralen Standard-Bot. */
export interface Playstyle {
  /** Lust aufs Rauswerfen gegnerischer Kugeln */
  capture: number;
  /** Gewicht der Gefahrenanalyse (eigene Kugeln in Sicherheit bringen) */
  safety: number;
  /** Fortschritt und Ins-Haus-Ziehen */
  rush: number;
  /** Neue Kugeln eröffnen */
  open: number;
  /** Gemeinheiten: Aussetzen lassen, Teufel, Trickser */
  tricks: number;
  /** TAC aufheben statt sofort spielen */
  tacHoard: number;
  /** Zufallsanteil der Bewertung */
  chaos: number;
  /** Großzügigkeit beim Kartentausch mit dem Partner */
  team: number;
  /** Vorausplanen von Kartenkombinationen (ab 1 auch schon auf „Mittel“) */
  plan: number;
}

export const NEUTRAL_STYLE: Playstyle = { capture: 1, safety: 1, rush: 1, open: 1, tricks: 1, tacHoard: 1, chaos: 2, team: 1, plan: 1 };

export type CommentKind = "greet" | "capturedEnemy" | "gotCaptured" | "partnerGood" | "home" | "tac" | "win" | "lose";

export interface Persona {
  id: Exclude<LookId, "ritter">;
  name: string;
  title: string;
  description: string;
  /** Kurze Stichpunkte zur Spielweise für den Auswahlbildschirm */
  traits: string[];
  style: Playstyle;
  lines: Partial<Record<CommentKind, string[]>>;
}

const style = (s: Partial<Playstyle>): Playstyle => ({ ...NEUTRAL_STYLE, ...s });

export const PERSONAS: Persona[] = [
  {
    id: "wikinger",
    name: "Rudi",
    title: "Rambo-Rudi",
    description: "Schmeißt alles raus, was nicht bei drei im Haus ist. Eigene Sicherheit? Hat er beim Plündern verloren.",
    traits: ["Wirft rücksichtslos raus", "Ignoriert Gefahren"],
    style: style({ capture: 2.2, safety: 0.25, open: 1.3, rush: 0.8 }),
    lines: {
      greet: ["HARR! Wer nicht rennt, fliegt raus!"],
      capturedEnemy: ["WALHALLA! ⚔️", "Ab ins Vorfeld, Landratte!", "Noch einer für die Sammlung!"],
      gotCaptured: ["Das war ein Hinterhalt!", "RACHE! 😤", "Mein Helm! Meine Ehre!"],
      tac: ["TAC! Mit der Axt zurück!"],
      win: ["SIEG! Met für alle! 🍺"],
      lose: ["Ich war nur… am Aufwärmen."],
    },
  },
  {
    id: "oma",
    name: "Oma Hilde",
    title: "Strickoma",
    description: "Spielt TAC seit 1962 und lässt sich von niemandem hetzen. Jede Kugel wird sicher geparkt, bevor die nächste Masche dran ist.",
    traits: ["Extrem vorsichtig", "Bringt Kugeln sicher heim"],
    style: style({ safety: 2.4, capture: 0.6, rush: 1.4, tacHoard: 1.6 }),
    lines: {
      greet: ["Na, Kindchen, magst du erst ein Plätzchen? 🍪"],
      capturedEnemy: ["Tut mir leid, Schätzchen 🧶", "Das hab ich nicht mit Absicht… oder doch."],
      gotCaptured: ["Also so was! In meinem Alter!", "Früher hätte man sich entschuldigt."],
      home: ["Schön ins Körbchen 🧺", "Die ist versorgt."],
      tac: ["Na na na, nicht so hastig! TAC!"],
      win: ["Wie damals '74 ☕"],
      lose: ["Jetzt gibt's erst mal Kuchen."],
    },
  },
  {
    id: "professor",
    name: "Prof. Knobel",
    title: "Taktik-Genie",
    description: "Hat TAC durchgerechnet. Zweimal. Hortet TAC-Karten wie andere Briefmarken und erklärt dir gern, warum dein Zug suboptimal war.",
    traits: ["Plant voraus", "Hortet TAC-Karten"],
    style: style({ safety: 1.4, tacHoard: 2.5, chaos: 0.5, rush: 1.1, plan: 2.2 }),
    lines: {
      greet: ["Statistisch gesehen gewinne ich. Viel Glück trotzdem."],
      capturedEnemy: ["Wie berechnet. 🧮", "Q.e.d.", "Eine Frage der Wahrscheinlichkeit."],
      gotCaptured: ["Ein Rundungsfehler.", "Das war… nicht im Modell vorgesehen."],
      tac: ["TAC. Exakt im richtigen Moment."],
      win: ["Die Theorie hält der Praxis stand. 🎓"],
      lose: ["Interessant. Ich muss meine Formel überarbeiten."],
    },
  },
  {
    id: "clown",
    name: "Kalle",
    title: "Chaos-Kalle",
    description: "Hat die Regeln nur überflogen und spielt nach Bauchgefühl – und das Bauchgefühl hat meistens Hunger. Völlig unberechenbar.",
    traits: ["Unberechenbar", "Manchmal genial, meist albern"],
    style: style({ chaos: 22, tricks: 1.5, team: 0.6, plan: 0 }),
    lines: {
      greet: ["Welche Farbe bin ich nochmal? 🤡"],
      capturedEnemy: ["Huch! War das ich? 😂", "Ups, Tröööt! 🎺", "Ich wollte eigentlich woanders hin."],
      gotCaptured: ["Hihi, nochmal von vorne!", "Egal, Hauptsache bunt!"],
      partnerGood: ["Wuuuhuuu! 🎉"],
      tac: ["TAC! …was macht die nochmal?"],
      win: ["Ich hab keine Ahnung, wie, aber JA! 🎈"],
      lose: ["Gewinnen ist eh überbewertet."],
    },
  },
  {
    id: "rennfahrerin",
    name: "Tina",
    title: "Turbo-Tina",
    description: "Will nur eins: nach Hause. Schnell. Rauswerfen kostet Zeit, und Zeit ist das Einzige, was sie nicht hat.",
    traits: ["Rast Richtung Haus", "Kaum Interesse an Kämpfen"],
    style: style({ rush: 2.4, capture: 0.5, open: 0.8, safety: 0.8 }),
    lines: {
      greet: ["Ready, set… GO! 🏁"],
      capturedEnemy: ["Platz da, ich komm durch! 💨"],
      gotCaptured: ["Boxenstopp?! Jetzt?!", "Unfair, ich war in der Kurve!"],
      home: ["Zielflagge! 🏁", "Persönliche Bestzeit!"],
      tac: ["TAC! Rückwärtsgang!"],
      win: ["Erste! Wie immer! 🏆"],
      lose: ["Ich hatte Gegenwind."],
    },
  },
  {
    id: "graf",
    name: "Graf Fiesling",
    title: "Meister der Gemeinheit",
    description: "Liebt Aussetzen, Teufel und Trickser. Freut sich diebisch, wenn du dich ärgerst, und zwirbelt dabei genüsslich seinen Schnurrbart.",
    traits: ["Spielt gern 8 und Trickser", "Setzt TAC sofort ein"],
    style: style({ tricks: 2.6, tacHoard: 0.2, capture: 1.3 }),
    lines: {
      greet: ["Mwahaha… ich meine: Guten Abend. 🎩"],
      capturedEnemy: ["Mwahahaha! 😈", "Wie bedauerlich… für dich.", "Exquisit."],
      gotCaptured: ["Das wirst du bereuen!", "Unverschämtheit!"],
      tac: ["TAC! Mwahaha!", "Dein Zug? Welcher Zug? 😏"],
      win: ["Das Böse siegt. Natürlich. 🦇"],
      lose: ["Das war nur ein Teil meines Plans…"],
    },
  },
  {
    id: "baer",
    name: "Kuschelbär",
    title: "Sir Kuschelbär",
    description: "Ein Teamplayer durch und durch. Schenkt dem Partner die besten Karten und entschuldigt sich bei jedem Rauswurf mit einer Umarmung.",
    traits: ["Gibt dem Partner gute Karten", "Wirft ungern raus"],
    style: style({ team: 2.5, capture: 0.7, safety: 1.3, open: 1.2 }),
    lines: {
      greet: ["Wir schaffen das zusammen! 🧸"],
      capturedEnemy: ["Oh nein, tut mir so leid! 🤗", "Komm her, Umarmung!"],
      gotCaptured: ["Schnüff… 🥺", "Ist schon okay, ich mag dich trotzdem."],
      partnerGood: ["Du bist der Beste! 💛", "Super, Partner! 🧸", "Teamwork! 🤝"],
      home: ["Kuschelig im Haus!"],
      tac: ["Sorry… TAC! 🙈"],
      win: ["Gruppenkuscheln! 🧸💛"],
      lose: ["Hauptsache, wir hatten Spaß!"],
    },
  },
  {
    id: "ninja",
    name: "Nori",
    title: "Ninja Nori",
    description: "Lautlos, geduldig, tödlich. Bleibt in Deckung, bis sich die perfekte Gelegenheit bietet – dann schlägt sie zu, ohne mit der Wimper zu zucken.",
    traits: ["Lauert auf Gelegenheiten", "Bleibt in Deckung"],
    style: style({ safety: 1.6, capture: 1.5, rush: 0.9, chaos: 0.5 }),
    lines: {
      greet: ["…"],
      capturedEnemy: ["🥷", "Lautlos.", "Du hast mich nicht kommen sehen."],
      gotCaptured: ["Unmöglich…", "Ich… habe geblinzelt."],
      tac: ["Schatten-TAC. 🌑"],
      win: ["Mission erfüllt."],
      lose: ["Ich verschwinde im Nebel…"],
    },
  },
];

export const DEFAULT_BOTS: Persona["id"][] = ["wikinger", "baer", "graf"];

export const personaById = (id: string | null | undefined) => PERSONAS.find((p) => p.id === id) ?? null;

export const styleOf = (id: string | null | undefined) => personaById(id)?.style ?? NEUTRAL_STYLE;

export const lookOf = (id: string | null | undefined): LookId => personaById(id)?.id ?? "ritter";
