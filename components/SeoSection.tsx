// Info- und SEO-Bereich unter dem Spiel. Server-Komponente: Der Text steht direkt im ausgelieferten HTML.

const FAQ: { q: string; a: string }[] = [
  {
    q: "Wie gewinnt man bei TAC?",
    a: "Ein Team gewinnt, sobald alle acht Kugeln beider Partner in ihren Häusern stehen. Wer seine eigenen vier Kugeln schon im Ziel hat, zieht ab dann mit den Kugeln seines Partners weiter.",
  },
  {
    q: "Wie kommt eine Kugel ins Spiel?",
    a: "Mit einer 1 oder einer 13 setzt du eine Kugel aus deinem Vorfeld auf dein Startfeld. Alternativ ziehst du mit diesen Karten 1 bzw. 13 Felder vorwärts.",
  },
  {
    q: "Darf man Kugeln überspringen?",
    a: "Nein, normale Karten dürfen keine Kugel überspringen. Nur die 7 läuft über Kugeln hinweg – und wirft dabei jede Kugel, die sie überholt, im Zweifel auch eigene.",
  },
  {
    q: "Was passiert beim Rauswerfen?",
    a: "Landet eine Kugel genau auf einem besetzten Feld, muss die Kugel, die dort stand, zurück in ihr Vorfeld – auch wenn sie dem Partner gehört.",
  },
  {
    q: "Was bewirkt die TAC-Karte?",
    a: "Die TAC-Karte macht den letzten Zug deines Vorgängers rückgängig und du nutzt seine Karte selbst. Geworfene Kugeln kehren zurück – so lässt sich sogar ein Siegeszug verhindern.",
  },
  {
    q: "Was ist die Meisterversion?",
    a: "In der Meisterversion kommen vier Sonderkarten hinzu: Engel, Teufel, Krieger und Narr. Sie bringen zusätzliche Taktik und überraschende Wendungen ins Spiel.",
  },
];

/** Strukturierte Daten für Google (FAQ-Snippets und Einordnung als Browserspiel). */
const STRUCTURED_DATA = [
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  },
  {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: "TAC Spiel Online",
    description: "TAC kostenlos im Browser spielen: das taktische Karten- und Brettspiel für zwei Teams gegen Computer-Gegner.",
    genre: ["Brettspiel", "Kartenspiel", "Taktikspiel"],
    gamePlatform: ["Webbrowser", "Smartphone", "Tablet", "PC"],
    playMode: "SinglePlayer",
    inLanguage: "de",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  },
];

export function SeoSection({ withSchema = false }: { withSchema?: boolean }) {
  return (
    <section id="ueber-tac" className="px-3 pt-6 sm:px-6">
      {withSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />}
      <article className="mx-auto max-w-4xl rounded-3xl border border-amber-200/10 bg-black/30 p-6 leading-relaxed text-amber-50/85 shadow-xl backdrop-blur-sm sm:p-10">
        <h1 className="font-display text-stroke text-3xl text-amber-200 sm:text-4xl">TAC Spiel Online Kostenlos Spielen</h1>
        <p className="mt-4">
          Hier kannst du das <strong className="text-amber-100">TAC Spiel online</strong> spielen – kostenlos, ohne Anmeldung und direkt im Browser. Du trittst gemeinsam mit einem
          Computer-Partner gegen zwei Gegner an, die jeweils ihren ganz eigenen Spielstil mitbringen. Ob am Smartphone, Tablet oder PC: Die Partie startet mit einem Klick und wird
          automatisch gespeichert.
        </p>

        <h2 className="font-display mt-8 text-2xl text-amber-200">Was ist das TAC Brettspiel?</h2>
        <p className="mt-3">
          Das <strong className="text-amber-100">TAC Brettspiel</strong> ist ein <strong className="text-amber-100">Karten- und Brettspiel</strong> für vier Personen in zwei Teams.
          Wie bei einem klassischen Laufspiel geht es darum, <strong className="text-amber-100">Murmeln ins Ziel zu bringen</strong> – doch statt zu würfeln, bestimmen Spielkarten
          jeden Zug. Dadurch wird TAC zu einem echten Taktikspiel: Du planst voraus, schützt die Kugeln deines Partners und schickst gegnerische Murmeln zurück ins Vorfeld. Es
          gewinnt das Team, das zuerst alle acht Kugeln in seine Häuser gebracht hat.
        </p>

        <h2 className="font-display mt-8 text-2xl text-amber-200">Die wichtigsten Regeln &amp; Karten</h2>
        <p className="mt-3">
          Die <strong className="text-amber-100">TAC Regeln</strong> sind schnell gelernt: Mit der 1 oder der 13 bringst du eine Kugel ins Spiel, die 4 zieht rückwärts, und die 7
          darfst du beliebig auf deine Kugeln aufteilen. Mit der 8 lässt du den nächsten Spieler aussetzen, der Trickser vertauscht zwei Kugeln. Die stärkste Karte ist die TAC-Karte
          selbst: Sie macht den letzten Zug deines Vorgängers rückgängig – und du nutzt seine Karte für dich.
        </p>
        <div className="mt-5 divide-y divide-amber-200/10 overflow-hidden rounded-2xl border border-amber-200/10 bg-black/20">
          {FAQ.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 font-semibold text-amber-100 transition hover:bg-white/5 sm:px-5 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden className="text-xl leading-none text-amber-300 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="px-4 pb-4 text-sm text-amber-50/75 sm:px-5">{f.a}</p>
            </details>
          ))}
        </div>

        <h2 className="font-display mt-8 text-2xl text-amber-200">Kostenlos im Browser gegen den Computer spielen</h2>
        <p className="mt-3">
          Unser <strong className="text-amber-100">Taktikspiel im Browser</strong> läuft ohne Download und ohne Konto. Wähle aus acht Computer-Charakteren – vom angriffslustigen
          Wikinger bis zur vorsichtigen Strickoma – und stelle die Schwierigkeit von Leicht bis Schwer ein. Hinweise erklären dir jeden möglichen Zug, und dank automatischer
          Speicherung spielst du jederzeit dort weiter, wo du aufgehört hast.
        </p>
      </article>
    </section>
  );
}
