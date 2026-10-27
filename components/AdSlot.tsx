/**
 * Platzhalter für einen späteren Google-AdSense-Block.
 *
 * Breite Bildschirme (ab 1700 px): schmale Sidebar (160 × 600, „Skyscraper“) links bzw. rechts vom Spiel, beim Scrollen angeheftet.
 * Darunter (Handy, Tablet, Laptop): Banner unter dem Spiel – die Reihenfolge regelt das umgebende Layout per `order`.
 *
 * AdSense einbauen:
 *  1. In app/layout.tsx das Skript laden:
 *     <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX" crossOrigin="anonymous" strategy="afterInteractive" />
 *  2. Hier den Platzhalter-Inhalt ersetzen durch
 *     <ins className="adsbygoogle block h-full w-full" data-ad-client="ca-pub-XXXX" data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
 *     und nach dem Einhängen einmal `(window.adsbygoogle = window.adsbygoogle || []).push({})` aufrufen (Client-Komponente).
 */
export function AdSlot({ slot, className = "" }: { slot: string; className?: string }) {
  return (
    <aside
      aria-label="Anzeige"
      data-ad-slot={slot}
      className={`mx-auto flex h-[100px] w-full max-w-[728px] shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-amber-200/15 bg-black/20 sm:max-[1699px]:h-[90px] min-[1700px]:sticky min-[1700px]:top-4 min-[1700px]:mx-0 min-[1700px]:h-[600px] min-[1700px]:w-[160px] ${className}`}
    >
      <div className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/30">
        Anzeige
        <div className="mt-1 normal-case tracking-normal text-amber-100/20">Werbefläche</div>
      </div>
    </aside>
  );
}
