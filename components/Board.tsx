"use client";

import { memo, useMemo, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { Marble } from "@/types/game";
import { PLAYER_COLORS, startOf } from "@/lib/engine/constants";
import {
  CENTER,
  HOLE_R,
  MARBLE_R,
  RING_R,
  SIZE,
  baseCenter,
  basePoint,
  homePoint,
  marblePoint,
  posPoint,
  ringPoint,
  type Pt,
} from "@/lib/layout";
import { STEP_MS, type AnimSpec } from "@/store/gameStore";

export interface BoardTarget {
  key: string;
  point: Pt;
  onClick: () => void;
  variant?: "move" | "swap" | "capture";
}

interface Props {
  marbles: Marble[];
  anim: AnimSpec | null;
  selectable: Set<number>;
  selected: number | null;
  targets: BoardTarget[];
  onMarbleClick: (id: number) => void;
  activeColor: number | null;
  preview?: string | null;
  overlay?: ReactNode;
}

interface AnimInfo {
  pts: Pt[];
  delay: number;
  duration: number;
}

export function Board({ marbles, anim, selectable, selected, targets, onMarbleClick, activeColor, preview, overlay }: Props) {
  const animMap = useMemo(() => {
    const map = new Map<number, AnimInfo>();
    if (!anim) return map;
    let longest = 0;
    for (const a of anim.anims) {
      const m = anim.from[a.marbleId];
      if (!m) continue;
      const pts = [marblePoint(m), ...a.path.map((p) => posPoint(m.color, p, m.id % 4))];
      map.set(a.marbleId, { pts, delay: 0, duration: (a.path.length * STEP_MS) / 1000 });
      longest = Math.max(longest, a.path.length);
    }
    for (const id of anim.captured) {
      const m = anim.from[id];
      if (!m || map.has(id)) continue;
      map.set(id, { pts: [marblePoint(m), basePoint(m.color, id % 4)], delay: (longest * STEP_MS) / 1000, duration: 0.45 });
    }
    return map;
  }, [anim]);

  return (
    <div className="relative aspect-square w-full select-none">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full drop-shadow-[0_25px_40px_rgba(0,0,0,0.6)]">
        <BoardDefs />
        <StaticBoard activeColor={activeColor} />

        {/* Kugeln */}
        {marbles.map((m) => (
          <MarbleView
            key={m.id}
            m={m}
            anim={animMap.get(m.id)}
            selectable={selectable.has(m.id)}
            selected={selected === m.id}
            onClick={() => onMarbleClick(m.id)}
          />
        ))}

        {/* Zielfelder – über den Kugeln, damit Schlag- und Tauschziele klickbar bleiben */}
        {targets.map((t) => (
          <g key={t.key} onClick={t.onClick} className="cursor-pointer">
            <motion.circle
              cx={t.point.x}
              cy={t.point.y}
              r={HOLE_R + 6}
              fill={t.variant === "swap" ? "rgba(96,165,250,0.3)" : t.variant === "capture" ? "rgba(239,68,68,0.3)" : "rgba(250,204,21,0.35)"}
              stroke={t.variant === "swap" ? "#93c5fd" : t.variant === "capture" ? "#fca5a5" : "#fde047"}
              strokeWidth={3}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0.65, 1, 0.65], scale: 1 }}
              transition={{ opacity: { repeat: Infinity, duration: 1.2 }, scale: { duration: 0.2 } }}
              style={{ transformOrigin: `${t.point.x}px ${t.point.y}px` }}
            />
            <circle cx={t.point.x} cy={t.point.y} r={HOLE_R + 10} fill="transparent" />
          </g>
        ))}

      </svg>
      {preview && (
        <div className="pointer-events-none absolute left-1/2 top-[30%] -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-amber-200 shadow-lg backdrop-blur">
          {preview}
        </div>
      )}
      {overlay}
    </div>
  );
}

const MarbleView = memo(function MarbleView({
  m,
  anim,
  selectable,
  selected,
  onClick,
}: {
  m: Marble;
  anim?: AnimInfo;
  selectable: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  const final = marblePoint(m);
  const last = anim?.pts[anim.pts.length - 1];
  const useAnim = anim && last && Math.abs(last.x - final.x) < 0.5 && Math.abs(last.y - final.y) < 0.5;
  return (
    <motion.g
      initial={false}
      animate={useAnim ? { x: anim.pts.map((p) => p.x), y: anim.pts.map((p) => p.y) } : { x: final.x, y: final.y }}
      transition={useAnim ? { duration: Math.max(anim.duration, 0.2), delay: anim.delay, ease: "linear" } : { type: "spring", stiffness: 160, damping: 22 }}
      onClick={selectable ? onClick : undefined}
      className={selectable ? "cursor-pointer" : ""}
    >
      {selectable && (
        <motion.circle
          r={MARBLE_R + 7}
          fill="none"
          stroke={selected ? "#fde047" : "#fef3c7"}
          strokeWidth={selected ? 4 : 2.5}
          animate={{ opacity: selected ? 1 : [0.35, 1, 0.35] }}
          transition={{ repeat: selected ? 0 : Infinity, duration: 1.1 }}
        />
      )}
      <ellipse cx={3} cy={5} rx={MARBLE_R} ry={MARBLE_R * 0.8} fill="rgba(0,0,0,0.45)" filter="url(#blur)" />
      <circle r={MARBLE_R} fill={`url(#marble-${m.color})`} stroke="rgba(0,0,0,0.35)" strokeWidth={0.8} />
      <circle r={MARBLE_R} fill="url(#marble-gloss)" />
      <ellipse cx={-4.5} cy={-5.5} rx={4.2} ry={2.8} fill="rgba(255,255,255,0.85)" transform="rotate(-30 -4.5 -5.5)" />
    </motion.g>
  );
});

function BoardDefs() {
  return (
    <defs>
      <linearGradient id="wood-base" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#c58b4f" />
        <stop offset="50%" stopColor="#a96e37" />
        <stop offset="100%" stopColor="#8a5527" />
      </linearGradient>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.003 0.085" numOctaves={4} seed={11} result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.24  0 0 0 0 0.12  0 0 0 0 0.04  0 0 0 1.3 -0.42" />
      </filter>
      <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.2" />
      </filter>
      <filter id="inner" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <radialGradient id="hole" cx="45%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#24130a" />
        <stop offset="70%" stopColor="#3b2112" />
        <stop offset="100%" stopColor="#7a4a26" />
      </radialGradient>
      <radialGradient id="center-well" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#6b3f1d" />
        <stop offset="85%" stopColor="#4d2b12" />
        <stop offset="100%" stopColor="#2f190a" />
      </radialGradient>
      <radialGradient id="marble-gloss" cx="50%" cy="50%" r="50%">
        <stop offset="60%" stopColor="rgba(255,255,255,0)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.18)" />
      </radialGradient>
      {PLAYER_COLORS.map((c, i) => (
        <radialGradient key={i} id={`marble-${i}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
          <stop offset="18%" stopColor={c.light} />
          <stop offset="55%" stopColor={c.hex} />
          <stop offset="100%" stopColor={c.dark} />
        </radialGradient>
      ))}
    </defs>
  );
}

const Hole = ({ p, r = HOLE_R }: { p: Pt; r?: number }) => (
  <g>
    <circle cx={p.x} cy={p.y + 1.5} r={r + 1.5} fill="rgba(255,235,200,0.18)" />
    <circle cx={p.x} cy={p.y} r={r} fill="url(#hole)" />
  </g>
);

const StaticBoard = memo(function StaticBoard({ activeColor }: { activeColor: number | null }) {
  return (
    <g>
      {/* Holzplatte */}
      <rect x={8} y={8} width={SIZE - 16} height={SIZE - 16} rx={70} fill="url(#wood-base)" />
      <rect x={8} y={8} width={SIZE - 16} height={SIZE - 16} rx={70} filter="url(#grain)" />
      <rect x={8} y={8} width={SIZE - 16} height={SIZE - 16} rx={70} fill="none" stroke="#5a3214" strokeWidth={6} />
      <rect x={22} y={22} width={SIZE - 44} height={SIZE - 44} rx={58} fill="none" stroke="rgba(255,230,190,0.25)" strokeWidth={2} />

      {/* Laufrille */}
      <circle cx={CENTER} cy={CENTER} r={RING_R} fill="none" stroke="rgba(40,20,5,0.28)" strokeWidth={50} />
      <circle cx={CENTER} cy={CENTER} r={RING_R + 26} fill="none" stroke="rgba(255,230,190,0.18)" strokeWidth={2} />
      <circle cx={CENTER} cy={CENTER} r={RING_R - 26} fill="none" stroke="rgba(255,230,190,0.12)" strokeWidth={2} />

      {/* Kartenablage */}
      <circle cx={CENTER} cy={CENTER} r={135} fill="url(#center-well)" stroke="#3a1f0c" strokeWidth={4} />
      <circle cx={CENTER} cy={CENTER} r={128} fill="none" stroke="rgba(255,220,170,0.15)" strokeWidth={2} />
      <text x={CENTER} y={CENTER + 105} textAnchor="middle" fontFamily="Georgia, serif" fontSize={22} fontWeight={900} fill="rgba(255,225,180,0.25)" letterSpacing={8}>
        TAC
      </text>

      {/* Spielkreis */}
      {Array.from({ length: 64 }, (_, i) => (
        <Hole key={i} p={ringPoint(i)} />
      ))}

      {[0, 1, 2, 3].map((c) => {
        const col = PLAYER_COLORS[c];
        const s = ringPoint(startOf(c));
        const bc = baseCenter(c);
        const active = activeColor === c;
        return (
          <g key={c}>
            {/* Startfeld */}
            <circle cx={s.x} cy={s.y} r={HOLE_R + 7} fill="none" stroke={col.hex} strokeWidth={5} opacity={0.95} />
            {/* Haus */}
            <path
              d={[0, 1, 2, 3].map((i, k) => `${k ? "L" : "M"}${homePoint(c, i).x},${homePoint(c, i).y}`).join(" ")}
              stroke={col.hex}
              strokeOpacity={0.35}
              strokeWidth={34}
              strokeLinecap="round"
              fill="none"
            />
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <Hole p={homePoint(c, i)} />
                {i === 3 && <circle cx={homePoint(c, i).x} cy={homePoint(c, i).y} r={3.5} fill="#d9dde3" opacity={0.9} />}
              </g>
            ))}
            {/* Vorfeld */}
            <circle cx={bc.x} cy={bc.y} r={62} fill={col.hex} opacity={active ? 0.38 : 0.2} stroke={col.hex} strokeOpacity={0.7} strokeWidth={active ? 4 : 2} />
            {[0, 1, 2, 3].map((slot) => (
              <Hole key={slot} p={basePoint(c, slot)} />
            ))}
          </g>
        );
      })}
    </g>
  );
});

