"use client";

import type { ReactNode } from "react";
import { motion, type TargetAndTransition } from "framer-motion";
import { PLAYER_COLORS } from "@/lib/engine/constants";
import type { LookId } from "@/lib/personas";

export type Mood = "idle" | "happy" | "sad" | "angry" | "think";

const OUTLINE = "#1b1630";
const o = { stroke: OUTLINE, strokeWidth: 4, strokeLinejoin: "round" as const };

type Col = (typeof PLAYER_COLORS)[number];

interface Look {
  skin: string;
  /** hinter dem Kopf (Haare, Ohren) */
  back?: (c: Col) => ReactNode;
  /** auf dem Gesicht, unter Augen und Mund (Schnauze) */
  under?: (c: Col) => ReactNode;
  /** über allem (Hüte, Bärte, Brillen, Masken) */
  over: (c: Col) => ReactNode;
}

const glasses = (
  <g fill="none" stroke={OUTLINE} strokeWidth={2.5}>
    <circle cx={41} cy={45} r={7.5} fill="rgba(200,230,255,0.25)" />
    <circle cx={59} cy={45} r={7.5} fill="rgba(200,230,255,0.25)" />
    <path d="M48.5 45 Q50 43 51.5 45" />
  </g>
);

const LOOKS: Record<LookId, Look> = {
  ritter: {
    skin: "#ffd2b0",
    over: (c) => (
      <g>
        <path d="M50 10 Q66 0 72 14 Q62 10 54 18 Z" fill={c.hex} {...o} />
        <path d="M24 40 Q24 14 50 14 Q76 14 76 40 L70 40 Q70 26 50 26 Q30 26 30 40 Z" fill="#c9cfdb" {...o} />
        <path d="M50 14 L50 26" stroke={OUTLINE} strokeWidth={3} />
        <rect x={22} y={36} width={56} height={7} rx={3} fill="#9aa3b5" {...o} />
      </g>
    ),
  },
  wikinger: {
    skin: "#f7c9a3",
    over: () => (
      <g>
        <path d="M27 31 Q8 28 7 6 Q17 20 31 22 Z" fill="#f3ead2" {...o} />
        <path d="M73 31 Q92 28 93 6 Q83 20 69 22 Z" fill="#f3ead2" {...o} />
        <path d="M24 38 Q24 14 50 14 Q76 14 76 38 Z" fill="#9aa3b5" {...o} />
        <rect x={22} y={34} width={56} height={7} rx={3} fill="#6b7280" {...o} />
        <path d="M29 55 Q30 86 50 88 Q70 86 71 55 Q62 68 50 68 Q38 68 29 55 Z" fill="#c2410c" {...o} />
      </g>
    ),
  },
  oma: {
    skin: "#ffdcc0",
    back: () => <circle cx={50} cy={14} r={10} fill="#d4d4d8" {...o} />,
    over: (c) => (
      <g>
        <path d="M25 44 Q22 18 50 18 Q78 18 75 44 Q70 28 50 28 Q30 28 25 44 Z" fill="#e4e4e7" {...o} />
        <path d="M44 9 L56 19" stroke={c.hex} strokeWidth={3} strokeLinecap="round" />
        <circle cx={57} cy={20} r={2.5} fill={c.hex} />
        {glasses}
      </g>
    ),
  },
  professor: {
    skin: "#ffd2b0",
    back: () => (
      <g fill="#f5f5f5" {...o}>
        <path d="M27 48 Q12 44 17 28 Q22 38 30 36 Z" />
        <path d="M73 48 Q88 44 83 28 Q78 38 70 36 Z" />
      </g>
    ),
    over: () => (
      <g>
        <path d="M32 24 L32 32 Q50 38 68 32 L68 24 Z" fill="#1f2937" {...o} />
        <path d="M14 22 L50 9 L86 22 L50 34 Z" fill="#1f2937" {...o} />
        <path d="M50 21 L78 25 L79 38" fill="none" stroke="#fbbf24" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={79} cy={40} r={3} fill="#fbbf24" />
        {glasses}
        <path d="M39 56 Q45 51 50 55 Q55 51 61 56 Q55 60 50 57 Q45 60 39 56 Z" fill="#f5f5f5" stroke={OUTLINE} strokeWidth={2} />
      </g>
    ),
  },
  clown: {
    skin: "#fff1e6",
    back: () => (
      <g {...o}>
        <circle cx={24} cy={40} r={10} fill="#f472b6" />
        <circle cx={76} cy={40} r={10} fill="#60a5fa" />
        <circle cx={28} cy={28} r={8} fill="#a3e635" />
        <circle cx={72} cy={28} r={8} fill="#fb923c" />
      </g>
    ),
    over: (c) => (
      <g>
        <path d="M36 27 L50 -4 L64 27 Z" fill={c.hex} {...o} />
        <path d="M41 17 L59 17 M45 8 L55 8" stroke="#fde047" strokeWidth={3} />
        <circle cx={50} cy={-5} r={5} fill="#fde047" {...o} />
        <circle cx={50} cy={52} r={5.5} fill="#ef4444" stroke={OUTLINE} strokeWidth={2.5} />
      </g>
    ),
  },
  rennfahrerin: {
    skin: "#f1c29a",
    back: () => <path d="M68 44 Q86 52 80 74 Q74 62 66 58 Z" fill="#7c2d12" {...o} />,
    over: (c) => (
      <g>
        <path d="M22 46 Q20 14 50 14 Q80 14 78 46 L72 46 Q72 30 50 30 Q28 30 28 46 Z" fill={c.hex} {...o} />
        <path d="M50 15 L50 30" stroke="#fff" strokeWidth={5} />
        <path d="M31 39 H69 V45 Q67 52 58 51 Q53 50 50 45 Q47 50 42 51 Q33 52 31 45 Z" fill="#111827" stroke={OUTLINE} strokeWidth={2.5} />
        <path d="M35 42 L40 42" stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeLinecap="round" />
      </g>
    ),
  },
  graf: {
    skin: "#e9e4f0",
    over: (c) => (
      <g>
        <path d="M26 40 Q30 26 50 28 Q70 26 74 40 Q62 32 50 37 Q38 32 26 40 Z" fill="#111827" {...o} />
        <rect x={34} y={-2} width={32} height={30} rx={2} fill="#111827" {...o} />
        <rect x={34} y={19} width={32} height={6} fill={c.hex} stroke={OUTLINE} strokeWidth={2} />
        <rect x={24} y={25} width={52} height={6} rx={3} fill="#111827" {...o} />
        <circle cx={59} cy={45} r={7.5} fill="rgba(255,255,255,0.15)" stroke="#fbbf24" strokeWidth={2.5} />
        <path d="M66 48 Q70 58 66 66" fill="none" stroke="#fbbf24" strokeWidth={1.5} />
        <path d="M38 57 Q44 52 50 56 Q56 52 62 57 Q66 55 67 50 Q68 60 59 59 Q54 58 50 58 Q46 58 41 59 Q32 60 33 50 Q34 55 38 57 Z" fill="#111827" />
      </g>
    ),
  },
  baer: {
    skin: "#c08a52",
    back: () => (
      <g>
        <circle cx={28} cy={25} r={11} fill="#a0693a" {...o} />
        <circle cx={72} cy={25} r={11} fill="#a0693a" {...o} />
        <circle cx={28} cy={25} r={5} fill="#f3c98b" />
        <circle cx={72} cy={25} r={5} fill="#f3c98b" />
      </g>
    ),
    under: () => (
      <g>
        <ellipse cx={50} cy={57} rx={12} ry={9} fill="#f3d9b1" stroke={OUTLINE} strokeWidth={2.5} />
        <ellipse cx={50} cy={52} rx={4.5} ry={3.2} fill={OUTLINE} />
      </g>
    ),
    over: (c) => (
      <g>
        <path d="M38 76 L50 82 L62 76 L62 88 L50 82 L38 88 Z" fill={c.light} {...o} strokeWidth={3} />
      </g>
    ),
  },
  ninja: {
    skin: "#f7c9a3",
    over: (c) => (
      <g>
        <path d="M24 40 Q22 18 50 18 Q78 18 76 40 Z" fill="#1f2937" {...o} />
        <path d="M25 51 Q50 47 75 51 Q74 70 50 72 Q26 70 25 51 Z" fill="#1f2937" {...o} />
        <rect x={22} y={33} width={56} height={7} rx={2} fill={c.hex} {...o} strokeWidth={3} />
        <path d="M76 36 Q90 28 95 38 Q86 38 80 42 Z" fill={c.hex} {...o} strokeWidth={3} />
        <path d="M78 40 Q88 44 90 54 Q82 48 76 44 Z" fill={c.hex} {...o} strokeWidth={3} />
      </g>
    ),
  },
};

/** Comic-Figur: Aussehen je Charakter, Kleidung in der Farbe des Sitzplatzes. */
export function Character({
  look,
  color,
  mood = "idle",
  size = 64,
  className = "",
}: {
  look: LookId;
  color: number;
  mood?: Mood;
  size?: number;
  className?: string;
}) {
  const body: Record<Mood, TargetAndTransition> = {
    idle: { y: [0, -2, 0], rotate: 0, scale: 1, transition: { repeat: Infinity, duration: 2.4, ease: "easeInOut" } },
    happy: { y: [0, -26, 0, -14, 0], rotate: [0, -8, 8, -4, 0], scale: [1, 1.08, 0.95, 1.04, 1], transition: { duration: 1.1, ease: "easeOut" } },
    sad: { y: [0, 3, 3, 0], scale: [1, 1.04, 0.96, 1], x: [0, -3, 3, -2, 0], transition: { duration: 0.9 } },
    angry: { x: [0, -4, 4, -4, 4, 0], rotate: [0, -3, 3, 0], transition: { duration: 0.6 } },
    think: { rotate: [0, -6, -6, 0], transition: { duration: 1.6, repeat: Infinity } },
  };
  const l = LOOKS[look];
  const c = PLAYER_COLORS[color];

  return (
    <motion.div className={`relative ${className}`} style={{ width: size, height: size }} animate={body[mood]} key={mood}>
      <svg viewBox="0 0 100 100" width={size} height={size} className="overflow-visible drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]">
        <Bust c={c} skin={l.skin} mood={mood} />
        {l.back?.(c)}
        <ellipse cx={50} cy={46} rx={25} ry={24} fill={l.skin} stroke={OUTLINE} strokeWidth={4} />
        {/* Wangen */}
        <circle cx={34} cy={53} r={4.5} fill="#ff8c8c" opacity={0.55} />
        <circle cx={66} cy={53} r={4.5} fill="#ff8c8c" opacity={0.55} />
        {l.under?.(c)}
        <Face mood={mood} />
        {l.over(c)}
      </svg>
    </motion.div>
  );
}

function Bust({ c, skin, mood }: { c: Col; skin: string; mood: Mood }) {
  return (
    <g stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round">
      {/* Arme hoch beim Jubeln */}
      {mood === "happy" && (
        <>
          <path d="M26 82 L12 52" stroke={OUTLINE} strokeWidth={13} />
          <path d="M26 82 L12 52" stroke={c.hex} strokeWidth={7} />
          <path d="M74 82 L88 52" stroke={OUTLINE} strokeWidth={13} />
          <path d="M74 82 L88 52" stroke={c.hex} strokeWidth={7} />
          <circle cx={11} cy={49} r={6} fill={skin} />
          <circle cx={89} cy={49} r={6} fill={skin} />
        </>
      )}
      <path d="M20 100 Q20 72 50 70 Q80 72 80 100 Z" fill={c.hex} />
      <path d="M36 74 Q50 84 64 74" fill="none" stroke={c.light} strokeWidth={3} />
    </g>
  );
}

function Face({ mood }: { mood: Mood }) {
  const s = { stroke: OUTLINE, strokeWidth: 3.5, strokeLinecap: "round" as const, fill: "none" };
  return (
    <g>
      {/* Augen */}
      {mood === "happy" ? (
        <>
          <path d="M37 46 Q41 40 45 46" {...s} />
          <path d="M55 46 Q59 40 63 46" {...s} />
        </>
      ) : (
        <>
          <ellipse cx={41} cy={45} rx={4.6} ry={5.6} fill="#fff" stroke={OUTLINE} strokeWidth={2.5} />
          <ellipse cx={59} cy={45} rx={4.6} ry={5.6} fill="#fff" stroke={OUTLINE} strokeWidth={2.5} />
          <circle cx={mood === "think" ? 42.5 : 41.5} cy={mood === "think" ? 42.5 : 46} r={2.4} fill={OUTLINE} />
          <circle cx={mood === "think" ? 60.5 : 59.5} cy={mood === "think" ? 42.5 : 46} r={2.4} fill={OUTLINE} />
        </>
      )}
      {/* Augenbrauen */}
      {mood === "angry" && (
        <>
          <path d="M35 37 L46 41" {...s} />
          <path d="M65 37 L54 41" {...s} />
        </>
      )}
      {mood === "sad" && (
        <>
          <path d="M35 40 L45 36" {...s} />
          <path d="M65 40 L55 36" {...s} />
          <path d="M37 52 Q35 58 37 60 Q39 58 37 52 Z" fill="#7cc8ff" stroke="#3b82c4" strokeWidth={1.5} />
        </>
      )}
      {/* Mund */}
      {mood === "happy" && <path d="M40 58 Q50 70 60 58 Z" fill="#7a1f2b" stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />}
      {mood === "idle" && <path d="M43 59 Q50 64 57 59" {...s} />}
      {mood === "think" && <path d="M45 61 L56 60" {...s} />}
      {mood === "sad" && <path d="M43 63 Q50 57 57 63" {...s} />}
      {mood === "angry" && <path d="M42 62 Q50 57 58 62 Z" fill="#7a1f2b" stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />}
    </g>
  );
}
