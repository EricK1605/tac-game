"use client";

import Link from "next/link";
import { useT } from "@/lib/useI18n";

/** Dezenter Fuß auf allen Seiten: Unabhängigkeits-Hinweis und rechtliche Links. */
export function SiteFooter() {
  const { t } = useT();
  return (
    // unten Platz lassen, damit der Emote-Knopf am Handy nichts verdeckt
    <footer className="px-4 pb-24 pt-6 text-center text-[11px] leading-relaxed text-white/50 sm:text-xs lg:pb-6">
      <p className="mx-auto max-w-2xl">{t("footer.disclaimer")}</p>
      <nav className="mt-2 flex items-center justify-center gap-3" aria-label={t("footer.legal")}>
        <Link href="/impressum" className="underline-offset-2 transition-colors hover:text-white/85 hover:underline">
          {t("footer.imprint")}
        </Link>
        <span aria-hidden>·</span>
        <Link href="/datenschutz" className="underline-offset-2 transition-colors hover:text-white/85 hover:underline">
          {t("footer.privacy")}
        </Link>
      </nav>
    </footer>
  );
}
