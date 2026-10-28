// Bot-Charaktere: Aussehen, Beschreibung, Sprüche (Deutsch / Englisch) und Spielweise.

export type LookId = "ritter" | "wikinger" | "oma" | "professor" | "clown" | "rennfahrerin" | "graf" | "baer" | "ninja" | "orakel";

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

export interface PersonaText {
  name: string;
  title: string;
  description: string;
  /** Kurze Stichpunkte zur Spielweise für den Auswahlbildschirm */
  traits: string[];
  lines: Partial<Record<CommentKind, string[]>>;
}

export interface Persona {
  id: Exclude<LookId, "ritter">;
  style: Playstyle;
  de: PersonaText;
  en: PersonaText;
}

const style = (s: Partial<Playstyle>): Playstyle => ({ ...NEUTRAL_STYLE, ...s });

export const PERSONAS: Persona[] = [
  {
    id: "wikinger",
    style: style({ capture: 2.2, safety: 0.25, open: 1.3, rush: 0.8 }),
    de: {
      name: "Rudi",
      title: "Rambo-Rudi",
      description: "Schmeißt alles raus, was nicht bei drei im Haus ist. Eigene Sicherheit? Hat er beim Plündern verloren.",
      traits: ["Wirft rücksichtslos raus", "Ignoriert Gefahren"],
      lines: {
        greet: ["HARR! Wer nicht rennt, fliegt raus!"],
        capturedEnemy: ["WALHALLA! ⚔️", "Ab ins Vorfeld, Landratte!", "Noch einer für die Sammlung!"],
        gotCaptured: ["Das war ein Hinterhalt!", "RACHE! 😤", "Mein Helm! Meine Ehre!"],
        tac: ["TAC! Mit der Axt zurück!"],
        win: ["SIEG! Met für alle! 🍺"],
        lose: ["Ich war nur… am Aufwärmen."],
      },
    },
    en: {
      name: "Rudi",
      title: "Rampage Rudi",
      description: "Knocks out anything that isn't home by the count of three. His own safety? Lost it while pillaging.",
      traits: ["Knocks out ruthlessly", "Ignores danger"],
      lines: {
        greet: ["HARR! Run or get knocked out!"],
        capturedEnemy: ["VALHALLA! ⚔️", "Back to the start, landlubber!", "Another one for the collection!"],
        gotCaptured: ["That was an ambush!", "REVENGE! 😤", "My helmet! My honor!"],
        tac: ["TAC! Axe in reverse!"],
        win: ["VICTORY! Mead for everyone! 🍺"],
        lose: ["I was just… warming up."],
      },
    },
  },
  {
    id: "oma",
    style: style({ safety: 2.4, capture: 0.6, rush: 1.4, tacHoard: 1.6 }),
    de: {
      name: "Oma Hilde",
      title: "Strickoma",
      description: "Spielt TAC seit 1962 und lässt sich von niemandem hetzen. Jede Kugel wird sicher geparkt, bevor die nächste Masche dran ist.",
      traits: ["Extrem vorsichtig", "Bringt Kugeln sicher heim"],
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
    en: {
      name: "Granny Hilde",
      title: "Knitting Granny",
      description: "Has been playing TAC since 1962 and won't be rushed by anyone. Every marble gets parked safely before the next stitch.",
      traits: ["Extremely careful", "Brings marbles home safely"],
      lines: {
        greet: ["Oh dear, would you like a cookie first? 🍪"],
        capturedEnemy: ["Sorry, sweetheart 🧶", "I didn't do that on purpose… or did I."],
        gotCaptured: ["Well I never! At my age!", "In my day people apologized."],
        home: ["Tucked into the basket 🧺", "That one's taken care of."],
        tac: ["Now now, not so fast! TAC!"],
        win: ["Just like back in '74 ☕"],
        lose: ["Time for some cake now."],
      },
    },
  },
  {
    id: "professor",
    style: style({ safety: 1.4, tacHoard: 2.5, chaos: 0.5, rush: 1.1, plan: 2.2 }),
    de: {
      name: "Prof. Knobel",
      title: "Taktik-Genie",
      description: "Hat TAC durchgerechnet. Zweimal. Hortet TAC-Karten wie andere Briefmarken und erklärt dir gern, warum dein Zug suboptimal war.",
      traits: ["Plant voraus", "Hortet TAC-Karten"],
      lines: {
        greet: ["Statistisch gesehen gewinne ich. Viel Glück trotzdem."],
        capturedEnemy: ["Wie berechnet. 🧮", "Q.e.d.", "Eine Frage der Wahrscheinlichkeit."],
        gotCaptured: ["Ein Rundungsfehler.", "Das war… nicht im Modell vorgesehen."],
        tac: ["TAC. Exakt im richtigen Moment."],
        win: ["Die Theorie hält der Praxis stand. 🎓"],
        lose: ["Interessant. Ich muss meine Formel überarbeiten."],
      },
    },
    en: {
      name: "Prof. Puzzler",
      title: "Tactics Genius",
      description: "Has solved TAC. Twice. Hoards TAC cards like others collect stamps and loves explaining why your move was suboptimal.",
      traits: ["Plans ahead", "Hoards TAC cards"],
      lines: {
        greet: ["Statistically I'll win. Good luck anyway."],
        capturedEnemy: ["As calculated. 🧮", "Q.E.D.", "A matter of probability."],
        gotCaptured: ["A rounding error.", "That was… not in the model."],
        tac: ["TAC. At precisely the right moment."],
        win: ["Theory holds up in practice. 🎓"],
        lose: ["Interesting. I need to revise my formula."],
      },
    },
  },
  {
    id: "clown",
    style: style({ chaos: 22, tricks: 1.5, team: 0.6, plan: 0 }),
    de: {
      name: "Kalle",
      title: "Chaos-Kalle",
      description: "Hat die Regeln nur überflogen und spielt nach Bauchgefühl – und das Bauchgefühl hat meistens Hunger. Völlig unberechenbar.",
      traits: ["Unberechenbar", "Manchmal genial, meist albern"],
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
    en: {
      name: "Kalle",
      title: "Chaos Kalle",
      description: "Only skimmed the rules and plays by gut feeling – and his gut is usually hungry. Completely unpredictable.",
      traits: ["Unpredictable", "Sometimes brilliant, mostly silly"],
      lines: {
        greet: ["Which color am I again? 🤡"],
        capturedEnemy: ["Oops! Was that me? 😂", "Honk honk! 🎺", "I actually meant to go somewhere else."],
        gotCaptured: ["Hehe, back to the start!", "Whatever, as long as it's colorful!"],
        partnerGood: ["Wooohooo! 🎉"],
        tac: ["TAC! …what does that one do again?"],
        win: ["No idea how, but YES! 🎈"],
        lose: ["Winning is overrated anyway."],
      },
    },
  },
  {
    id: "rennfahrerin",
    style: style({ rush: 2.4, capture: 0.5, open: 0.8, safety: 0.8 }),
    de: {
      name: "Tina",
      title: "Turbo-Tina",
      description: "Will nur eins: nach Hause. Schnell. Rauswerfen kostet Zeit, und Zeit ist das Einzige, was sie nicht hat.",
      traits: ["Rast Richtung Haus", "Kaum Interesse an Kämpfen"],
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
    en: {
      name: "Tina",
      title: "Turbo Tina",
      description: "Only wants one thing: to get home. Fast. Knocking others out takes time, and time is the one thing she doesn't have.",
      traits: ["Races for home", "Barely interested in fights"],
      lines: {
        greet: ["Ready, set… GO! 🏁"],
        capturedEnemy: ["Make way, coming through! 💨"],
        gotCaptured: ["A pit stop?! Now?!", "Unfair, I was in the corner!"],
        home: ["Checkered flag! 🏁", "Personal best!"],
        tac: ["TAC! Reverse gear!"],
        win: ["First! As always! 🏆"],
        lose: ["I had a headwind."],
      },
    },
  },
  {
    id: "graf",
    style: style({ tricks: 2.6, tacHoard: 0.2, capture: 1.3 }),
    de: {
      name: "Graf Fiesling",
      title: "Meister der Gemeinheit",
      description: "Liebt Aussetzen, Teufel und Trickser. Freut sich diebisch, wenn du dich ärgerst, und zwirbelt dabei genüsslich seinen Schnurrbart.",
      traits: ["Spielt gern 8 und Trickser", "Setzt TAC sofort ein"],
      lines: {
        greet: ["Mwahaha… ich meine: Guten Abend. 🎩"],
        capturedEnemy: ["Mwahahaha! 😈", "Wie bedauerlich… für dich.", "Exquisit."],
        gotCaptured: ["Das wirst du bereuen!", "Unverschämtheit!"],
        tac: ["TAC! Mwahaha!", "Dein Zug? Welcher Zug? 😏"],
        win: ["Das Böse siegt. Natürlich. 🦇"],
        lose: ["Das war nur ein Teil meines Plans…"],
      },
    },
    en: {
      name: "Count Spiteful",
      title: "Master of Mischief",
      description: "Loves skips, Devils and Tricksters. Gleefully enjoys your frustration while twirling his mustache.",
      traits: ["Loves 8s and Tricksters", "Plays TAC right away"],
      lines: {
        greet: ["Mwahaha… I mean: good evening. 🎩"],
        capturedEnemy: ["Mwahahaha! 😈", "How unfortunate… for you.", "Exquisite."],
        gotCaptured: ["You'll regret that!", "How dare you!"],
        tac: ["TAC! Mwahaha!", "Your move? What move? 😏"],
        win: ["Evil prevails. Naturally. 🦇"],
        lose: ["That was all part of my plan…"],
      },
    },
  },
  {
    id: "baer",
    style: style({ team: 2.5, capture: 0.7, safety: 1.3, open: 1.2 }),
    de: {
      name: "Kuschelbär",
      title: "Sir Kuschelbär",
      description: "Ein Teamplayer durch und durch. Schenkt dem Partner die besten Karten und entschuldigt sich bei jedem Rauswurf mit einer Umarmung.",
      traits: ["Gibt dem Partner gute Karten", "Wirft ungern raus"],
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
    en: {
      name: "Cuddle Bear",
      title: "Sir Cuddle Bear",
      description: "A team player through and through. Gives his partner the best cards and apologizes for every knock-out with a hug.",
      traits: ["Gives partner good cards", "Hates knocking out"],
      lines: {
        greet: ["We can do this together! 🧸"],
        capturedEnemy: ["Oh no, I'm so sorry! 🤗", "Come here, hug!"],
        gotCaptured: ["Sniff… 🥺", "It's okay, I still like you."],
        partnerGood: ["You're the best! 💛", "Great job, partner! 🧸", "Teamwork! 🤝"],
        home: ["Cozy in the house!"],
        tac: ["Sorry… TAC! 🙈"],
        win: ["Group hug! 🧸💛"],
        lose: ["At least we had fun!"],
      },
    },
  },
  {
    id: "ninja",
    style: style({ safety: 1.6, capture: 1.5, rush: 0.9, chaos: 0.5 }),
    de: {
      name: "Nori",
      title: "Ninja Nori",
      description: "Lautlos, geduldig, tödlich. Bleibt in Deckung, bis sich die perfekte Gelegenheit bietet – dann schlägt sie zu, ohne mit der Wimper zu zucken.",
      traits: ["Lauert auf Gelegenheiten", "Bleibt in Deckung"],
      lines: {
        greet: ["…"],
        capturedEnemy: ["🥷", "Lautlos.", "Du hast mich nicht kommen sehen."],
        gotCaptured: ["Unmöglich…", "Ich… habe geblinzelt."],
        tac: ["Schatten-TAC. 🌑"],
        win: ["Mission erfüllt."],
        lose: ["Ich verschwinde im Nebel…"],
      },
    },
    en: {
      name: "Nori",
      title: "Ninja Nori",
      description: "Silent, patient, deadly. Stays in cover until the perfect opportunity – then strikes without blinking.",
      traits: ["Waits for openings", "Stays in cover"],
      lines: {
        greet: ["…"],
        capturedEnemy: ["🥷", "Silent.", "You never saw me coming."],
        gotCaptured: ["Impossible…", "I… blinked."],
        tac: ["Shadow TAC. 🌑"],
        win: ["Mission accomplished."],
        lose: ["I vanish into the mist…"],
      },
    },
  },
];

/** Der blinde Partner im Orakel-Modus – nicht frei wählbar, wird vom Menschen gesteuert. */
export const ORACLE: Persona = {
  id: "orakel",
  style: NEUTRAL_STYLE,
  de: {
    name: "Orakel",
    title: "Das blinde Orakel",
    description: "Sieht nichts – und doch alles. Du führst seine Hand.",
    traits: ["Wird von dir gesteuert"],
    lines: {
      greet: ["Ich sehe… nichts. Führe meine Hand. 👁️"],
      capturedEnemy: ["Es stand in den Sternen. ✨", "Ich habe es kommen sehen. Irgendwie."],
      gotCaptured: ["Das… habe ich nicht gesehen.", "Die Nebel trüben sich."],
      tac: ["Die Zeit fließt rückwärts. ⏳"],
      win: ["Die Prophezeiung hat sich erfüllt! 🔮"],
      lose: ["Selbst Orakel irren sich manchmal."],
    },
  },
  en: {
    name: "Oracle",
    title: "The Blind Oracle",
    description: "Sees nothing – and yet everything. You guide its hand.",
    traits: ["Controlled by you"],
    lines: {
      greet: ["I see… nothing. Guide my hand. 👁️"],
      capturedEnemy: ["It was written in the stars. ✨", "I saw it coming. Somehow."],
      gotCaptured: ["That… I did not see.", "The mists grow dark."],
      tac: ["Time flows backwards. ⏳"],
      win: ["The prophecy is fulfilled! 🔮"],
      lose: ["Even oracles are wrong sometimes."],
    },
  },
};

/** Gegner im Orakel-Modus: das stärkste Bot-Duo aus den Simulationen. */
export const ORACLE_OPPONENTS: [Persona["id"], Persona["id"]] = ["professor", "ninja"];

export const DEFAULT_BOTS: Persona["id"][] = ["wikinger", "baer", "graf"];

export const personaById = (id: string | null | undefined) => (id === ORACLE.id ? ORACLE : (PERSONAS.find((p) => p.id === id) ?? null));

export const styleOf = (id: string | null | undefined) => personaById(id)?.style ?? NEUTRAL_STYLE;

export const lookOf = (id: string | null | undefined): LookId => personaById(id)?.id ?? "ritter";
