"use client";

import { memo, useMemo, useRef, useState, type ReactNode } from "react";
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
import { haptics } from "@/lib/haptics";

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

/** Fangradius fürs magnetische Tippen (SVG-Einheiten, Brett = 1000). Feldabstand ≈ 40. */
const SNAP_R = 95;
/** Lupe am Handy: Durchmesser in px und Vergrößerung. */
const LOUPE_PX = 132;
const LOUPE_ZOOM = 2.4;

interface Candidate {
  key: string;
  point: Pt;
  act: () => void;
  kind: "target" | "marble";
  variant?: BoardTarget["variant"];
}

interface Aim {
  /** Finger-/Mausposition in SVG-Koordinaten */
  x: number;
  y: number;
  /** und in Pixeln relativ zum Brett (für die Lupe) */
  px: number;
  py: number;
  cand: Candidate | null;
  touch: boolean;
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

  // Alles Antippbare: Zielfelder und auswählbare Kugeln. Getroffen wird das nächstgelegene – Felder müssen nicht exakt getroffen werden.
  const candidates = useMemo<Candidate[]>(
    () => [
      ...targets.map((t) => ({ key: `t-${t.key}`, point: t.point, act: t.onClick, kind: "target" as const, variant: t.variant })),
      ...marbles.filter((m) => selectable.has(m.id)).map((m) => ({ key: `m-${m.id}`, point: marblePoint(m), act: () => onMarbleClick(m.id), kind: "marble" as const })),
    ],
    [targets, marbles, selectable, onMarbleClick],
  );

  const svgRef = useRef<SVGSVGElement>(null);
  const pressed = useRef(false);
  const [aim, setAim] = useState<Aim | null>(null);

  const nearest = (x: number, y: number): Candidate | null => {
    let best: Candidate | null = null;
    let bestD = SNAP_R;
    for (const c of candidates) {
      // Zielfelder leicht bevorzugen: sie sind der eigentliche Zug
      const d = Math.hypot(c.point.x - x, c.point.y - y) * (c.kind === "target" ? 0.85 : 1);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  };

  const measure = (e: React.PointerEvent, touch: boolean): Aim | null => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const rect = svg.getBoundingClientRect();
    return { x: p.x, y: p.y, px: e.clientX - rect.left, py: e.clientY - rect.top, cand: nearest(p.x, p.y), touch };
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!candidates.length) return;
    pressed.current = true;
    const touch = e.pointerType !== "mouse";
    if (touch) e.currentTarget.setPointerCapture(e.pointerId);
    const a = measure(e, touch);
    setAim(a);
    if (touch && a?.cand) haptics.tap();
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const touch = e.pointerType !== "mouse";
    if (touch && !pressed.current) return;
    const a = measure(e, touch);
    // Beim Wechsel des Ziels kurz vibrieren – wie ein spürbares Einrasten
    if (touch && a?.cand && a.cand.key !== aim?.cand?.key) haptics.tap();
    setAim(a);
  };
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pressed.current) return;
    pressed.current = false;
    const touch = e.pointerType !== "mouse";
    const a = measure(e, touch);
    setAim(touch ? null : a);
    a?.cand?.act();
  };
  const cancel = () => {
    pressed.current = false;
    setAim(null);
  };

  const selMarble = selected !== null ? marbles[selected] : null;
  const ghost = aim?.cand?.kind === "target" && aim.cand.variant !== "swap" && selMarble ? selMarble.color : null;

  return (
    <div className="relative aspect-square w-full select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={`h-full w-full drop-shadow-[0_10px_22px_rgba(0,0,0,0.5)] ${aim?.cand ? "cursor-pointer" : ""}`}
        style={{ touchAction: candidates.length ? "none" : "auto" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={cancel}
        onPointerLeave={(e) => e.pointerType === "mouse" && cancel()}
      >
        <BoardDefs />
        <g id="tac-board-layer">
          <StaticBoard activeColor={activeColor} />

          {/* Kugeln */}
          {marbles.map((m) => (
            <MarbleView key={m.id} m={m} anim={animMap.get(m.id)} selectable={selectable.has(m.id)} selected={selected === m.id} />
          ))}

          {/* Zielfelder – über den Kugeln, damit Schlag- und Tauschziele sichtbar bleiben */}
          {targets.map((t) => (
            <motion.circle
              key={t.key}
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
          ))}

          {/* Eingerastetes Ziel: Geisterkugel und Leuchtring */}
          {aim?.cand && (
            <g pointerEvents="none">
              {ghost !== null && <circle cx={aim.cand.point.x} cy={aim.cand.point.y} r={MARBLE_R} fill={`url(#marble-${ghost})`} opacity={0.6} />}
              <circle cx={aim.cand.point.x} cy={aim.cand.point.y} r={HOLE_R + 11} fill="none" stroke="#fff" strokeWidth={4} opacity={0.95} />
              <circle cx={aim.cand.point.x} cy={aim.cand.point.y} r={HOLE_R + 17} fill="none" stroke="#fde047" strokeWidth={2.5} opacity={0.7} />
            </g>
          )}
        </g>
      </svg>

      {aim?.touch && <Loupe aim={aim} boardPx={svgRef.current?.getBoundingClientRect().width ?? 1} />}

      {preview && (
        <div className="pointer-events-none absolute left-1/2 top-[30%] -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-amber-200 shadow-lg backdrop-blur">
          {preview}
        </div>
      )}
      {overlay}
    </div>
  );
}

/** Lupe über dem Finger: zeigt vergrößert, worauf man gerade zielt (der Finger verdeckt sonst die kleinen Felder). */
function Loupe({ aim, boardPx }: { aim: Aim; boardPx: number }) {
  const span = (LOUPE_PX * (SIZE / boardPx)) / LOUPE_ZOOM;
  const center = aim.cand?.point ?? { x: aim.x, y: aim.y };
  // Über dem Finger; ganz oben am Brett stattdessen daneben, damit die Lupe sichtbar bleibt
  const above = aim.py - LOUPE_PX - 40 > -60;
  const left = Math.min(Math.max(aim.px - LOUPE_PX / 2, -20), boardPx - LOUPE_PX + 20);
  const top = above ? aim.py - LOUPE_PX - 40 : aim.py - LOUPE_PX / 2;
  const sideLeft = above ? left : aim.px > boardPx / 2 ? aim.px - LOUPE_PX - 50 : aim.px + 50;

  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="pointer-events-none absolute z-50 overflow-hidden rounded-full border-4 border-white bg-[#a96e37] shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
      style={{ width: LOUPE_PX, height: LOUPE_PX, left: sideLeft, top }}
    >
      <svg viewBox={`${center.x - span / 2} ${center.y - span / 2} ${span} ${span}`} width="100%" height="100%">
        <use href="#tac-board-layer" />
      </svg>
      {!aim.cand && (
        <div className="absolute inset-x-0 bottom-3 text-center text-[10px] font-bold uppercase tracking-wider text-white drop-shadow">kein Ziel</div>
      )}
    </motion.div>
  );
}

const MarbleView = memo(function MarbleView({
  m,
  anim,
  selectable,
  selected,
}: {
  m: Marble;
  anim?: AnimInfo;
  selectable: boolean;
  selected: boolean;
}) {
  const final = marblePoint(m);
  const last = anim?.pts[anim.pts.length - 1];
  const useAnim = anim && last && Math.abs(last.x - final.x) < 0.5 && Math.abs(last.y - final.y) < 0.5;
  return (
    <motion.g
      initial={false}
      animate={useAnim ? { x: anim.pts.map((p) => p.x), y: anim.pts.map((p) => p.y) } : { x: final.x, y: final.y }}
      transition={useAnim ? { duration: Math.max(anim.duration, 0.2), delay: anim.delay, ease: "linear" } : { type: "spring", stiffness: 160, damping: 22 }}
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
      <ellipse cx={3.5} cy={6} rx={MARBLE_R} ry={MARBLE_R * 0.8} fill="rgba(0,0,0,0.45)" filter="url(#blur)" />
      <circle r={MARBLE_R} fill={`url(#marble-${m.color})`} stroke="rgba(0,0,0,0.35)" strokeWidth={0.8} />
      <circle r={MARBLE_R} fill="url(#marble-gloss)" />
      <ellipse cx={-5.3} cy={-6.5} rx={5} ry={3.3} fill="rgba(255,255,255,0.85)" transform="rotate(-30 -5.3 -6.5)" />
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
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.24  0 0 0 0 0.12  0 0 0 0 0.04  0 0 0 1.3 -0.42" result="g" />
        {/* Maserung nur innerhalb der abgerundeten Platte – sonst entstehen dunkle Ecken und ein Streifen unter dem Brett */}
        <feComposite in="g" in2="SourceGraphic" operator="in" />
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
      <circle cx={CENTER} cy={CENTER} r={RING_R} fill="none" stroke="rgba(40,20,5,0.28)" strokeWidth={58} />
      <circle cx={CENTER} cy={CENTER} r={RING_R + 30} fill="none" stroke="rgba(255,230,190,0.18)" strokeWidth={2} />
      <circle cx={CENTER} cy={CENTER} r={RING_R - 30} fill="none" stroke="rgba(255,230,190,0.12)" strokeWidth={2} />

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
              strokeWidth={38}
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
            <circle cx={bc.x} cy={bc.y} r={74} fill={col.hex} opacity={active ? 0.38 : 0.2} stroke={col.hex} strokeOpacity={0.7} strokeWidth={active ? 4 : 2} />
            {[0, 1, 2, 3].map((slot) => (
              <Hole key={slot} p={basePoint(c, slot)} />
            ))}
          </g>
        );
      })}
    </g>
  );
});

