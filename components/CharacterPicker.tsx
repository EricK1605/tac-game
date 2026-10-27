"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dices, Handshake, Swords } from "lucide-react";
import { PLAYER_COLORS } from "@/lib/engine/constants";
import { PERSONAS, personaById, type Persona } from "@/lib/personas";
import { haptics } from "@/lib/haptics";
import { Character } from "./Character";

/** Plätze, die der Spieler besetzen kann – Index in `bots` = Sitzplatz − 1. */
const SLOTS = [
  { seat: 2, label: "Partner", icon: Handshake },
  { seat: 1, label: "Gegner links", icon: Swords },
  { seat: 3, label: "Gegner rechts", icon: Swords },
];

export function CharacterPicker({ bots, onChange }: { bots: string[]; onChange: (bots: string[]) => void }) {
  const [slot, setSlot] = useState(1);
  const [hover, setHover] = useState<string | null>(null);
  const activeSeat = SLOTS[slot].seat;
  const shown = personaById(hover ?? bots[activeSeat - 1])!;

  const assign = (id: Persona["id"]) => {
    haptics.tap();
    const next = [...bots];
    const other = next.indexOf(id);
    // Schon an einem anderen Platz? Dann tauschen die beiden die Plätze.
    if (other !== -1) next[other] = next[activeSeat - 1];
    next[activeSeat - 1] = id;
    onChange(next);
    // Nach der Wahl automatisch zum nächsten Platz springen
    setSlot((s) => (s + 1) % SLOTS.length);
  };

  const shuffle = () => {
    haptics.tap();
    const ids = PERSONAS.map((p) => p.id).sort(() => Math.random() - 0.5);
    onChange(ids.slice(0, 3));
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-amber-100/80">Mitspieler wählen</span>
        <button onClick={shuffle} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-amber-200 hover:bg-white/5">
          <Dices className="h-4 w-4" /> Zufall
        </button>
      </div>

      {/* Plätze */}
      <div className="grid grid-cols-3 gap-2">
        {SLOTS.map((s, i) => {
          const p = personaById(bots[s.seat - 1])!;
          const col = PLAYER_COLORS[s.seat];
          const active = i === slot;
          return (
            <button
              key={s.seat}
              onClick={() => setSlot(i)}
              className={`relative flex flex-col items-center rounded-2xl px-1 pb-2 pt-1 ring-1 transition ${
                active ? "bg-amber-300/15 ring-2 ring-amber-300" : "bg-black/20 ring-amber-200/15 hover:bg-black/30"
              }`}
            >
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-100/60">
                <s.icon className="h-3 w-3" /> {s.label}
              </span>
              <AnimatePresence mode="popLayout">
                <motion.div key={p.id} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}>
                  <Character look={p.id} color={s.seat} size={56} />
                </motion.div>
              </AnimatePresence>
              <span
                className="font-display text-stroke mt-1 rounded-md px-1.5 text-xs text-white sm:text-sm"
                style={{ background: `linear-gradient(${col.light}, ${col.hex} 45%, ${col.dark})` }}
              >
                {p.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Auswahl */}
      <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
        {PERSONAS.map((p) => {
          const seat = bots.indexOf(p.id) + 1;
          const inActive = seat === activeSeat;
          return (
            <motion.button
              key={p.id}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => assign(p.id)}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              className={`relative flex flex-col items-center rounded-xl p-1 ring-1 transition ${
                inActive ? "bg-amber-300/20 ring-2 ring-amber-300" : seat ? "bg-black/30 ring-amber-200/25" : "bg-black/15 ring-amber-200/10 hover:bg-black/30"
              }`}
              aria-label={`${p.title} wählen`}
            >
              <Character look={p.id} color={seat || activeSeat} size={44} />
              <span className="mt-0.5 w-full truncate text-center text-[10px] font-bold leading-tight text-amber-50">{p.name}</span>
              {seat > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full ring-1 ring-black/40" style={{ background: PLAYER_COLORS[seat].hex }} />}
            </motion.button>
          );
        })}
      </div>

      {/* Beschreibung */}
      <AnimatePresence mode="wait">
        <motion.div
          key={shown.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="mt-3 rounded-2xl bg-black/25 p-3 ring-1 ring-amber-200/10"
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
