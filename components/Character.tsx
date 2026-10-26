"use client";

import { motion, type TargetAndTransition } from "framer-motion";
import { PLAYER_COLORS } from "@/lib/engine/constants";

export type Mood = "idle" | "happy" | "sad" | "angry" | "think";

const OUTLINE = "#1b1630";
const SKIN = ["#ffd2b0", "#f1c29a", "#ffdcc0", "#f7c9a3"];

/** Comic-Figur je Spielerfarbe: Ritter (Rot), Zauberer (Blau), Bogenschützin (Grün), Prinzessin (Gelb). */
export function Character({ player, mood = "idle", size = 64, className = "" }: { player: number; mood?: Mood; size?: number; className?: string }) {
  const body: Record<Mood, TargetAndTransition> = {
    idle: { y: [0, -2, 0], rotate: 0, scale: 1, transition: { repeat: Infinity, duration: 2.4, ease: "easeInOut" } },
    happy: { y: [0, -26, 0, -14, 0], rotate: [0, -8, 8, -4, 0], scale: [1, 1.08, 0.95, 1.04, 1], transition: { duration: 1.1, ease: "easeOut" } },
    sad: { y: [0, 3, 3, 0], scale: [1, 1.04, 0.96, 1], x: [0, -3, 3, -2, 0], transition: { duration: 0.9 } },
    angry: { x: [0, -4, 4, -4, 4, 0], rotate: [0, -3, 3, 0], transition: { duration: 0.6 } },
    think: { rotate: [0, -6, -6, 0], transition: { duration: 1.6, repeat: Infinity } },
  };

  return (
    <motion.div className={`relative ${className}`} style={{ width: size, height: size }} animate={body[mood]} key={mood}>
      <svg viewBox="0 0 100 100" width={size} height={size} className="overflow-visible drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]">
        <Bust player={player} mood={mood} />
        <Head player={player} mood={mood} />
      </svg>
    </motion.div>
  );
}

function Bust({ player, mood }: { player: number; mood: Mood }) {
  const c = PLAYER_COLORS[player];
  const armsUp = mood === "happy";
  return (
    <g stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round">
      {/* Arme */}
      {armsUp ? (
        <>
          <path d="M26 82 L12 52" stroke={OUTLINE} strokeWidth={13} />
          <path d="M26 82 L12 52" stroke={c.hex} strokeWidth={7} />
          <path d="M74 82 L88 52" stroke={OUTLINE} strokeWidth={13} />
          <path d="M74 82 L88 52" stroke={c.hex} strokeWidth={7} />
          <circle cx={11} cy={49} r={6} fill={SKIN[player]} />
          <circle cx={89} cy={49} r={6} fill={SKIN[player]} />
        </>
      ) : null}
      <path d="M20 100 Q20 72 50 70 Q80 72 80 100 Z" fill={c.hex} />
      <path d="M36 74 Q50 84 64 74" fill="none" stroke={c.light} strokeWidth={3} />
      {player === 0 && <path d="M50 76 L50 100" stroke={c.dark} strokeWidth={3} />}
    </g>
  );
}

function Head({ player, mood }: { player: number; mood: Mood }) {
  const skin = SKIN[player];
  return (
    <g>
      {/* Haare hinter dem Kopf */}
      {player === 2 && <path d="M28 40 Q22 70 34 78 L40 60 Z" fill="#8a4b22" stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round" />}
      {player === 3 && <path d="M24 44 Q18 76 32 80 L36 56 Z M76 44 Q82 76 68 80 L64 56 Z" fill="#ffcf3a" stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round" />}
      <ellipse cx={50} cy={46} rx={25} ry={24} fill={skin} stroke={OUTLINE} strokeWidth={4} />
      {/* Wangen */}
      <circle cx={34} cy={53} r={4.5} fill="#ff8c8c" opacity={0.55} />
      <circle cx={66} cy={53} r={4.5} fill="#ff8c8c" opacity={0.55} />
      <Face mood={mood} />
      <Hat player={player} />
      {player === 1 && (
        <path d="M33 58 Q50 92 67 58 Q60 66 50 66 Q40 66 33 58 Z" fill="#f2f2f7" stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round" />
      )}
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
      {mood === "happy" && <path d="M40 55 Q50 68 60 55 Z" fill="#7a1f2b" stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />}
      {mood === "idle" && <path d="M43 56 Q50 61 57 56" {...s} />}
      {mood === "think" && <path d="M45 58 L56 57" {...s} />}
      {mood === "sad" && <path d="M43 60 Q50 54 57 60" {...s} />}
      {mood === "angry" && <path d="M42 59 Q50 54 58 59 Z" fill="#7a1f2b" stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />}
    </g>
  );
}

function Hat({ player }: { player: number }) {
  const c = PLAYER_COLORS[player];
  const o = { stroke: OUTLINE, strokeWidth: 4, strokeLinejoin: "round" as const };
  switch (player) {
    case 0: // Ritterhelm mit Federbusch
      return (
        <g>
          <path d="M50 10 Q66 0 72 14 Q62 10 54 18 Z" fill={c.hex} {...o} />
          <path d="M24 40 Q24 14 50 14 Q76 14 76 40 L70 40 Q70 26 50 26 Q30 26 30 40 Z" fill="#c9cfdb" {...o} />
          <path d="M50 14 L50 26" stroke={OUTLINE} strokeWidth={3} />
          <rect x={22} y={36} width={56} height={7} rx={3} fill="#9aa3b5" {...o} />
        </g>
      );
    case 1: // Zauberhut
      return (
        <g>
          <path d="M20 32 Q50 40 80 32 Q74 26 62 26 L52 -6 Q46 6 38 26 Q26 26 20 32 Z" fill={c.hex} {...o} />
          <path d="M44 14 l2 4 4 .5 -3 3 .8 4 -3.8 -2 -3.8 2 .8 -4 -3 -3 4 -.5 Z" fill="#ffe066" stroke="none" />
          <circle cx={58} cy={22} r={2} fill="#ffe066" />
        </g>
      );
    case 2: // Kapuze der Bogenschützin
      return (
        <g>
          <path d="M22 50 Q18 14 50 12 Q82 14 78 50 Q74 30 50 28 Q26 30 22 50 Z" fill={c.hex} {...o} />
          <path d="M50 12 Q60 4 70 8" fill="none" stroke={OUTLINE} strokeWidth={3} />
          <path d="M30 32 Q50 22 70 32" fill="none" stroke={c.light} strokeWidth={3} />
        </g>
      );
    default: // Krone der Prinzessin
      return (
        <g>
          <path d="M26 36 Q24 18 50 18 Q76 18 74 36 Q66 26 50 27 Q34 26 26 36 Z" fill="#ffcf3a" {...o} />
          <path d="M33 22 L36 6 L44 16 L50 2 L56 16 L64 6 L67 22 Z" fill="#ffd84a" {...o} />
          <circle cx={50} cy={16} r={3} fill="#e0245e" />
        </g>
      );
  }
}

export const CHARACTER_TITLE = ["Ritter", "Zauberer", "Bogenschützin", "Prinzessin"];
