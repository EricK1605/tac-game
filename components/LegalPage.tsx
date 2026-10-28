import Link from "next/link";

/** Gemeinsamer Rahmen für Impressum und Datenschutzerklärung (Server-Komponente, reiner Text). */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="px-4 pt-8 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/30 p-6 text-sm leading-relaxed text-amber-50/85 shadow-xl backdrop-blur-sm sm:p-10 sm:text-[15px] [&_a]:text-amber-200 [&_a]:underline [&_a]:underline-offset-2 [&_h2]:font-display [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:text-amber-200 [&_h3]:mt-5 [&_h3]:font-semibold [&_h3]:text-amber-100 [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
        <Link href="/" className="!text-amber-100/60 !no-underline transition-colors hover:!text-amber-100">
          ← Zurück zum Spiel
        </Link>
        <h1 className="font-display text-stroke mt-4 text-3xl text-amber-200 sm:text-4xl">{title}</h1>
        <p className="text-xs italic text-amber-100/50">This page is only available in German, as required for websites operated from Germany.</p>
        {children}
      </article>
    </main>
  );
}
