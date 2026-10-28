"use client";

import { Drama, Feather, Flame, Shuffle, Swords, Undo2 } from "lucide-react";
import type { CardValue } from "@/types/game";
import { isRedNumber } from "@/lib/engine/constants";
import { cardName } from "@/lib/i18n";
import { useT } from "@/lib/useI18n";

const MASTER_ICON = { engel: Feather, teufel: Flame, krieger: Swords, narr: Drama } as const;

interface Props {
  value: CardValue;
  size?: "sm" | "hand" | "md" | "lg";
  dimmed?: boolean;
  selected?: boolean;
  className?: string;
}

const SIZES = {
  sm: "w-11 h-16 text-lg rounded-md",
  hand: "w-14 h-20 text-2xl rounded-lg sm:w-16 sm:h-[5.6rem] sm:text-[1.75rem] sm:rounded-xl",
  md: "w-[4.6rem] h-[6.6rem] sm:w-20 sm:h-28 text-3xl rounded-xl",
  lg: "w-24 h-36 text-5xl rounded-2xl",
};

export function CardFace({ value, size = "md", dimmed, selected, className = "" }: Props) {
  const isNum = typeof value === "number";
  const red = isNum && isRedNumber(value);
  const master = value === "engel" || value === "teufel" || value === "krieger" || value === "narr";
  const Icon = master ? MASTER_ICON[value] : null;
  const { t, lang } = useT();

  return (
    <div
      title={t(`hint.${String(value)}` as Parameters<typeof t>[0])}
      className={`relative select-none overflow-hidden border shadow-[0_6px_14px_rgba(0,0,0,0.45)] transition ${SIZES[size]} ${
        master
          ? "border-amber-300/70 bg-gradient-to-br from-[#2b1d3f] via-[#3d2a5c] to-[#1d1430] text-amber-200"
          : "border-[#cdb894] bg-gradient-to-br from-[#fffaf0] via-[#f8eed8] to-[#ecdcb8]"
      } ${dimmed ? "opacity-45 saturate-50" : ""} ${selected ? "ring-4 ring-amber-300 ring-offset-2 ring-offset-transparent" : ""} ${className}`}
    >
      {/* Rahmenlinie */}
      <div className={`pointer-events-none absolute inset-1 rounded-[inherit] border ${master ? "border-amber-200/30" : "border-[#b8a07a]/40"}`} />
      {isNum && (
        <>
          <span className={`absolute left-1.5 top-0.5 font-serif text-[0.45em] font-bold ${red ? "text-[#b3121b]" : "text-[#1d1a16]"}`}>{value}</span>
          <span className={`absolute bottom-0.5 right-1.5 rotate-180 font-serif text-[0.45em] font-bold ${red ? "text-[#b3121b]" : "text-[#1d1a16]"}`}>{value}</span>
          <div className="flex h-full items-center justify-center">
            <span className={`font-serif font-black drop-shadow-sm ${red ? "text-[#b3121b]" : "text-[#1d1a16]"}`}>{value}</span>
          </div>
          {value === 4 && <Undo2 className="absolute bottom-[18%] left-1/2 h-[0.4em] w-[0.4em] -translate-x-1/2 text-[#b3121b]/70" />}
          {value === 7 && <span className="absolute bottom-[14%] left-1/2 -translate-x-1/2 text-[0.22em] font-semibold tracking-widest text-[#b3121b]/70">1+1+…</span>}
        </>
      )}
      {value === "tac" && (
        <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#ffe9e9,transparent_70%)]">
          <span className="font-serif text-[0.62em] font-black tracking-tight text-[#b3121b] drop-shadow">TAC</span>
          <Undo2 className="mt-0.5 h-[0.35em] w-[0.35em] text-[#b3121b]/80" />
        </div>
      )}
      {value === "trickser" && (
        <div className="flex h-full flex-col items-center justify-center text-[#1f4e8c]">
          <Shuffle className="h-[0.75em] w-[0.75em]" strokeWidth={2.4} />
          <span className="mt-1 text-[0.24em] font-bold uppercase tracking-wider">{cardName(lang, "trickser")}</span>
        </div>
      )}
      {Icon && (
        <div className="flex h-full flex-col items-center justify-center">
          <Icon className="h-[0.75em] w-[0.75em] drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" strokeWidth={2} />
          <span className="mt-1 text-[0.24em] font-bold uppercase tracking-wider">{cardName(lang, value)}</span>
        </div>
      )}
    </div>
  );
}

export function CardBack({ className = "", mini = false }: { className?: string; mini?: boolean }) {
  return (
    <div
      className={`rounded-md border border-[#e9d9b5]/40 bg-[repeating-linear-gradient(45deg,#7b1f1f_0_6px,#962a2a_6px_12px)] shadow-md ${className}`}
    >
      {!mini && <div className="flex h-full items-center justify-center font-serif text-[10px] font-black text-[#f5e6c8]/80">TAC</div>}
    </div>
  );
}
