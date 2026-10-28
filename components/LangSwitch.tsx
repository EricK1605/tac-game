"use client";

import { motion } from "framer-motion";
import type { Lang } from "@/lib/i18n";
import { useLang, useT } from "@/lib/useI18n";
import { haptics } from "@/lib/haptics";

/** Kleine Flaggen als SVG – Flaggen-Emojis zeigt Windows nur als Buchstaben an. */
function Flag({ lang }: { lang: Lang }) {
  if (lang === "de")
    return (
      <svg viewBox="0 0 5 3" className="h-3 w-[1.15rem] rounded-[2px] shadow-sm" aria-hidden>
        <rect width="5" height="1" fill="#000" />
        <rect y="1" width="5" height="1" fill="#dd0000" />
        <rect y="2" width="5" height="1" fill="#ffce00" />
      </svg>
    );
  return (
    <svg viewBox="0 0 19 10" className="h-3 w-[1.15rem] rounded-[2px] shadow-sm" aria-hidden>
      <rect width="19" height="10" fill="#fff" />
      {/* 7 rote von 13 Streifen */}
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} y={(i * 20) / 13} width="19" height={10 / 13} fill="#b22234" />
      ))}
      <rect width="7.6" height={70 / 13} fill="#3c3b6e" />
    </svg>
  );
}

/** DE / EN-Umschalter – die Wahl bleibt im Browser gespeichert. */
export function LangSwitch({ className = "" }: { className?: string }) {
  const lang = useLang((s) => s.lang);
  const setLang = useLang((s) => s.setLang);
  const { t } = useT();
  return (
    <div role="group" aria-label={t("lang.switch")} className={`relative flex rounded-xl border-2 border-[#1b1630] bg-black/40 p-0.5 ${className}`}>
      {(["de", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => {
            haptics.tap();
            setLang(l);
          }}
          aria-pressed={lang === l}
          className={`relative z-10 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition-colors ${lang === l ? "text-amber-950" : "text-amber-100/70 hover:text-amber-100"}`}
        >
          {lang === l && <motion.span layoutId="lang-pill" className="absolute inset-0 -z-10 rounded-lg bg-amber-300" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
          <Flag lang={l} />
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
