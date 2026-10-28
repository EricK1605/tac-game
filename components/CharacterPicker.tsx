"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PLAYER_COLORS } from "@/lib/engine/constants";
import { PERSONAS, personaById, type Persona } from "@/lib/personas";
import { haptics } from "@/lib/haptics";
import { useT } from "@/lib/useI18n";
import { Character } from "./Character";

/** Raster aller Charaktere plus Beschreibung des gerade gezeigten. */
function PersonaGrid({
  bots,
  seat,
  onPick,
}: {
  bots: string[];
  /** Platz, der gerade besetzt wird (1 = links, 2 = Partner, 3 = rechts) */
  seat: number;
  onPick: (id: Persona["id"]) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const { lang } = useT();
  const shownPersona = personaById(hover ?? bots[seat - 1])!;
  const shown = shownPersona[lang];

  return (
    <div>
      <div className="grid grid-cols-4 gap-1.5">
        {PERSONAS.map((p) => {
          const at = bots.indexOf(p.id) + 1;
          const here = at === seat;
          return (
            <motion.button
              key={p.id}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                haptics.tap();
                onPick(p.id);
              }}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              className={`relative flex flex-col items-center rounded-xl p-1 pt-1.5 ring-1 transition ${
                here ? "bg-amber-300/20 ring-2 ring-amber-300" : at ? "bg-black/30 ring-amber-200/20 opacity-70" : "bg-black/15 ring-amber-200/10 hover:bg-black/30"
              }`}
              aria-label={p[lang].title}
              aria-pressed={here}
            >
              <Character look={p.id} color={here || !at ? seat : at} size={52} />
              <span className="mt-0.5 w-full truncate text-center text-[11px] font-bold leading-tight text-amber-50">{p[lang].name}</span>
              {at > 0 && !here && (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full ring-1 ring-black/40" style={{ background: PLAYER_COLORS[at].hex }} />
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={shownPersona.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="mt-3 min-h-[7.5rem] rounded-2xl bg-black/25 p-3 ring-1 ring-amber-200/10"
        >
          <div className="font-display text-lg text-amber-200">{shown.title}</div>
          <p className="text-sm text-amber-100/75">{shown.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {shown.traits.map((t) => (
              <span key={t} className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Setzt einen Charakter auf einen Platz; sitzt er schon woanders, tauschen die beiden. */
function assign(bots: string[], seat: number, id: string): string[] {
  const next = [...bots];
  const other = next.indexOf(id);
  if (other !== -1) next[other] = next[seat - 1];
  next[seat - 1] = id;
  return next;
}

export function PartnerPicker({ bots, onChange }: { bots: string[]; onChange: (bots: string[]) => void }) {
  return <PersonaGrid bots={bots} seat={2} onPick={(id) => onChange(assign(bots, 2, id))} />;
}

const OPPONENT_SEATS = [
  { seat: 1, label: "opp.left" },
  { seat: 3, label: "opp.right" },
] as const;

export function OpponentPicker({ bots, onChange }: { bots: string[]; onChange: (bots: string[]) => void }) {
  const [slot, setSlot] = useState(0);
  const { t, lang } = useT();
  const seat = OPPONENT_SEATS[slot].seat;

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        {OPPONENT_SEATS.map((s, i) => {
          const p = personaById(bots[s.seat - 1])!;
          const col = PLAYER_COLORS[s.seat];
          const active = i === slot;
          return (
            <button
              key={s.seat}
              onClick={() => setSlot(i)}
              className={`flex items-center gap-2 rounded-2xl p-2 text-left ring-1 transition ${
                active ? "bg-amber-300/15 ring-2 ring-amber-300" : "bg-black/20 ring-amber-200/15 hover:bg-black/30"
              }`}
            >
              <AnimatePresence mode="popLayout">
                <motion.div key={p.id} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}>
                  <Character look={p.id} color={s.seat} size={48} />
                </motion.div>
              </AnimatePresence>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-100/60">{t(s.label)}</div>
                <div className="font-display text-stroke truncate rounded-md px-1.5 text-sm text-white" style={{ background: `linear-gradient(${col.light}, ${col.hex} 45%, ${col.dark})` }}>
                  {p[lang].title}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <PersonaGrid
        bots={bots}
        seat={seat}
        onPick={(id) => {
          onChange(assign(bots, seat, id));
          // Nach der Wahl direkt zum anderen Gegner wechseln
          setSlot((i) => (i + 1) % OPPONENT_SEATS.length);
        }}
      />
    </div>
  );
}
