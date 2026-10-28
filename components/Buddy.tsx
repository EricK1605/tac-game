"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, type TargetAndTransition } from "framer-motion";
import { PLAYER_COLORS } from "@/lib/engine/constants";
import type { LookId } from "@/lib/personas";

/**
 * Figuren: bohnenförmiger Körper mit Ärmchen und Füßen, Knopfaugen, kaum Mimik.
 * Gefühle zeigen sie über Körpersprache. Jede Figur hat eine feste Körperfarbe und Silhouette –
 * die Platzfarbe steckt im Accessoire – und ein Markenzeichen, an dem man sie erkennt.
 */

export type BuddyMood = "idle" | "happy" | "sad" | "angry" | "think" | "wow" | "signature";

const INK = "#1b1630";
type Col = (typeof PLAYER_COLORS)[number];

interface Geo {
  cx: number;
  w: number;
  top: number;
  bottom: number;
}

type ArmPose = { l: number | number[]; r: number | number[]; dur?: number; loop?: boolean };

interface BuddyLook {
  /** halbe Körperbreite – schmal = groß und hager, breit = rund und gemütlich */
  w: number;
  /** Oberkante des Körpers – größer = kleinere Figur */
  top: number;
  body: string;
  shade: string;
  belly?: string;
  /** Abstand der Augen von der Mitte */
  ex?: number;
  /** hinter dem Körper (Umhang, Ohren, Haare) */
  back?: (g: Geo, c: Col) => ReactNode;
  /** auf dem Körper, unter den Augen (Schnauze, Augenschlitz) */
  under?: (g: Geo, c: Col) => ReactNode;
  /** über dem Gesicht (Bart, Nase) */
  face?: (g: Geo, c: Col, mood: BuddyMood) => ReactNode;
  /** über allem (Hut, Brille, Fliege) */
  over?: (g: Geo, c: Col, mood: BuddyMood) => ReactNode;
  mouthY?: number;
  /** Markenzeichen: Armhaltung, Blick und Körper */
  sigArms: ArmPose;
  sigFace: "smile" | "sly" | "focus" | "open";
  sigBody?: TargetAndTransition;
}

const stroke = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const };

/** Kappe, die die Oberseite des Körpers bedeckt (Helm, Haare, Kapuze). */
const dome = ({ cx, w, top }: Geo, to: number, pad = 1) =>
  `M${cx - w - pad} ${top + to} L${cx - w - pad} ${top + Math.min(to, w * 0.9)} C${cx - w - pad} ${top - 3} ${cx + w + pad} ${top - 3} ${cx + w + pad} ${top + Math.min(to, w * 0.9)} L${cx + w + pad} ${top + to} Z`;

const roundGlasses = (cx: number, y: number, ex: number) => (
  <g fill="rgba(255,255,255,0.22)" stroke={INK} strokeWidth={2.5}>
    <circle cx={cx - ex} cy={y} r={7.5} />
    <circle cx={cx + ex} cy={y} r={7.5} />
    <path d={`M${cx - ex + 7.5} ${y} Q${cx} ${y - 3} ${cx + ex - 7.5} ${y}`} fill="none" />
  </g>
);

const LOOKS: Record<LookId, BuddyLook> = {
  ritter: {
    w: 31,
    top: 24,
    body: "#f7c393",
    shade: "#dc9c66",
    sigArms: { l: 14, r: -172 },
    sigFace: "smile",
    sigBody: { scaleY: [1, 1.06, 1], scaleX: [1, 0.97, 1], transition: { duration: 0.5, repeat: Infinity } },
    over: (g, c, mood) => (
      <g {...stroke}>
        {/* Helmbusch in der Platzfarbe */}
        <motion.path
          d={`M${g.cx} ${g.top - 1} Q${g.cx + 2} ${g.top - 24} ${g.cx + 20} ${g.top - 22} Q${g.cx + 10} ${g.top - 12} ${g.cx + 8} ${g.top + 1} Z`}
          fill={c.hex}
          style={{ originX: 0, originY: 1 }}
          animate={mood === "signature" || mood === "happy" ? { rotate: [0, -10, 0] } : { rotate: 0 }}
          transition={{ duration: 0.5, repeat: mood === "signature" || mood === "happy" ? Infinity : 0 }}
        />
        <path d={dome(g, 17)} fill="#b8c2d3" />
        <rect x={g.cx - g.w - 2} y={g.top + 14} width={g.w * 2 + 4} height={6} rx={3} fill="#8f9ab0" strokeWidth={3} />
        <path d={`M${g.cx} ${g.top + 1} V${g.top + 14}`} strokeWidth={2.5} />
      </g>
    ),
  },
  wikinger: {
    w: 37,
    top: 26,
    body: "#a9c8ea",
    shade: "#7fa3cc",
    sigArms: { l: [-45, -12, -45], r: [12, 45, 12], dur: 0.28, loop: true },
    sigFace: "smile",
    sigBody: { scaleY: [1, 0.96, 1], scaleX: [1.04, 1.08, 1.04], transition: { duration: 0.28, repeat: Infinity } },
    over: (g) => (
      <g {...stroke}>
        <path d={`M${g.cx - g.w + 4} ${g.top + 8} Q${g.cx - g.w - 14} ${g.top + 4} ${g.cx - g.w - 12} ${g.top - 16} Q${g.cx - g.w - 4} ${g.top - 4} ${g.cx - g.w + 10} ${g.top} Z`} fill="#f3ead2" />
        <path d={`M${g.cx + g.w - 4} ${g.top + 8} Q${g.cx + g.w + 14} ${g.top + 4} ${g.cx + g.w + 12} ${g.top - 16} Q${g.cx + g.w + 4} ${g.top - 4} ${g.cx + g.w - 10} ${g.top} Z`} fill="#f3ead2" />
        <path d={dome(g, 14)} fill="#9aa3b5" />
        <rect x={g.cx - g.w - 2} y={g.top + 11} width={g.w * 2 + 4} height={6} rx={3} fill="#6b7280" strokeWidth={3} />
      </g>
    ),
    // Rauschebart mit Zopf – verdeckt den Mund
    face: ({ cx, top }, c) => (
      <g {...stroke} strokeWidth={3.5}>
        <path d={`M${cx - 22} ${top + 35} Q${cx} ${top + 44} ${cx + 22} ${top + 35} Q${cx + 24} ${top + 58} ${cx} ${top + 66} Q${cx - 24} ${top + 58} ${cx - 22} ${top + 35} Z`} fill="#d9692b" />
        <path d={`M${cx} ${top + 64} L${cx} ${top + 74}`} stroke="#d9692b" strokeWidth={6} strokeLinecap="round" />
        <circle cx={cx} cy={top + 70} r={3} fill={c.hex} strokeWidth={2} />
        <path d={`M${cx - 12} ${top + 39} Q${cx} ${top + 34} ${cx + 12} ${top + 39}`} fill="none" stroke="#b44f17" strokeWidth={4} strokeLinecap="round" />
      </g>
    ),
  },
  oma: {
    w: 30,
    top: 38,
    body: "#f5b9cf",
    shade: "#e08fae",
    ex: 10,
    sigArms: { l: [-55, -38, -55], r: [55, 38, 55], dur: 0.35, loop: true },
    sigFace: "smile",
    back: ({ cx, top }) => <circle cx={cx} cy={top - 6} r={9} fill="#dcdce6" {...stroke} />,
    over: (g, c) => (
      <g {...stroke}>
        <path d={dome(g, 12)} fill="#e6e6ee" />
        <path d={`M${g.cx - 14} ${g.top + 3} Q${g.cx - 6} ${g.top + 9} ${g.cx + 2} ${g.top + 3}`} fill="none" stroke="#c4c4d0" strokeWidth={2} />
        <circle cx={g.cx + 17} cy={g.top + 3} r={4.5} fill={c.hex} strokeWidth={2.5} />
        <circle cx={g.cx + 17} cy={g.top + 3} r={1.6} fill={c.light} strokeWidth={0} />
        {roundGlasses(g.cx, g.top + 27, 10)}
      </g>
    ),
  },
  professor: {
    w: 30,
    top: 22,
    body: "#a3dcc2",
    shade: "#76b99a",
    ex: 10,
    sigArms: { l: 14, r: -165 },
    sigFace: "open",
    back: ({ cx, w, top }) => (
      <g fill="#f4f4f4" {...stroke}>
        <ellipse cx={cx - w - 3} cy={top + 20} rx={7} ry={9} />
        <ellipse cx={cx + w + 3} cy={top + 20} rx={7} ry={9} />
      </g>
    ),
    face: ({ cx, top }) => (
      <path
        d={`M${cx} ${top + 41} Q${cx - 6} ${top + 36} ${cx - 14} ${top + 40} Q${cx - 10} ${top + 47} ${cx} ${top + 44} Q${cx + 10} ${top + 47} ${cx + 14} ${top + 40} Q${cx + 6} ${top + 36} ${cx} ${top + 41} Z`}
        fill="#f4f4f4"
        {...stroke}
        strokeWidth={2.5}
      />
    ),
    over: ({ cx, top }, c) => (
      <g {...stroke}>
        <path d={`M${cx - 17} ${top - 4} L${cx - 17} ${top + 6} Q${cx} ${top + 11} ${cx + 17} ${top + 6} L${cx + 17} ${top - 4} Z`} fill="#26313f" />
        <path d={`M${cx - 30} ${top - 6} L${cx} ${top - 17} L${cx + 30} ${top - 6} L${cx} ${top + 4} Z`} fill="#26313f" />
        <path d={`M${cx} ${top - 7} L${cx + 24} ${top - 3} L${cx + 25} ${top + 10}`} fill="none" stroke={c.hex} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx + 25} cy={top + 12} r={3} fill={c.hex} strokeWidth={2} />
        {roundGlasses(cx, top + 27, 10)}
      </g>
    ),
    mouthY: 56,
  },
  clown: {
    w: 33,
    top: 26,
    body: "#fff3e0",
    shade: "#ecd6b4",
    sigArms: { l: [150, 118, 150], r: [-118, -150, -118], dur: 0.33, loop: true },
    sigFace: "smile",
    back: ({ cx, w, top }) => (
      <g {...stroke}>
        <circle cx={cx - w - 2} cy={top + 18} r={9} fill="#f472b6" />
        <circle cx={cx + w + 2} cy={top + 18} r={9} fill="#60a5fa" />
        <circle cx={cx - w + 2} cy={top + 6} r={7} fill="#a3e635" />
        <circle cx={cx + w - 2} cy={top + 6} r={7} fill="#fb923c" />
      </g>
    ),
    face: ({ cx, top }) => <circle cx={cx} cy={top + 35} r={5.5} fill="#ef4444" stroke={INK} strokeWidth={2.5} />,
    over: ({ cx, top }, c) => (
      <g {...stroke}>
        <path d={`M${cx - 14} ${top + 4} L${cx + 2} ${top - 28} L${cx + 15} ${top + 4} Z`} fill={c.hex} />
        <path d={`M${cx - 9} ${top - 6} L${cx + 10} ${top - 6} M${cx - 4} ${top - 16} L${cx + 6} ${top - 16}`} stroke="#fde047" strokeWidth={3} />
        <circle cx={cx + 2} cy={top - 30} r={5} fill="#fde047" strokeWidth={2.5} />
      </g>
    ),
    mouthY: 52,
  },
  rennfahrerin: {
    w: 31,
    top: 24,
    body: "#ffb08a",
    shade: "#ec8b60",
    sigArms: { l: -62, r: 62 },
    sigFace: "focus",
    sigBody: { rotate: -9, scaleY: [1, 0.97, 1], transition: { duration: 0.2, repeat: Infinity } },
    back: ({ cx, w, top }) => (
      <path d={`M${cx + w - 8} ${top + 10} Q${cx + w + 20} ${top + 16} ${cx + w + 14} ${top + 46} Q${cx + w + 6} ${top + 32} ${cx + w - 4} ${top + 24} Z`} fill="#7c2d12" {...stroke} />
    ),
    over: (g, c) => (
      <g {...stroke}>
        <path d={dome(g, 18)} fill={c.hex} />
        <path d={`M${g.cx - 3} ${g.top - 1} H${g.cx + 3} V${g.top + 9} H${g.cx - 3} Z`} fill="#fff" strokeWidth={0} />
        {/* hochgeklapptes Visier */}
        <rect x={g.cx - g.w + 3} y={g.top + 10} width={g.w * 2 - 6} height={7} rx={3.5} fill="#1f2937" strokeWidth={2.5} />
        <path d={`M${g.cx - g.w + 8} ${g.top + 12.5} H${g.cx - g.w + 15}`} stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeLinecap="round" />
      </g>
    ),
  },
  graf: {
    w: 27,
    top: 22,
    body: "#cfc4ec",
    shade: "#a597cf",
    ex: 9.5,
    sigArms: { l: 14, r: [118, 128, 118], dur: 0.45, loop: true },
    sigFace: "sly",
    back: ({ cx, w, top, bottom }, c) => (
      <g {...stroke}>
        {/* Umhang mit hohem Kragen, Futter in der Platzfarbe */}
        <path d={`M${cx - w - 14} ${top + 30} L${cx - w - 4} ${top + 46} L${cx - w - 10} ${bottom + 2} L${cx + w + 10} ${bottom + 2} L${cx + w + 4} ${top + 46} L${cx + w + 14} ${top + 30} L${cx} ${top + 44} Z`} fill="#2a1f45" />
        <path d={`M${cx - w - 10} ${top + 33} L${cx - w + 2} ${top + 44} L${cx} ${top + 46} L${cx + w - 2} ${top + 44} L${cx + w + 10} ${top + 33}`} fill="none" stroke={c.hex} strokeWidth={3} />
      </g>
    ),
    face: ({ cx, top }, _c, mood) => (
      <motion.g
        style={{ originX: 0.5, originY: 0.5 }}
        animate={mood === "signature" ? { rotate: [0, -6, 6, -6, 6, 0], scale: [1, 1.12, 1, 1.12, 1] } : { rotate: 0, scale: 1 }}
        transition={{ duration: 0.9, repeat: mood === "signature" ? Infinity : 0 }}
      >
        <path
          d={`M${cx} ${top + 40} Q${cx - 6} ${top + 35} ${cx - 13} ${top + 39} Q${cx - 20} ${top + 43} ${cx - 19} ${top + 35} Q${cx - 23} ${top + 46} ${cx - 12} ${top + 45} Q${cx - 5} ${top + 45} ${cx} ${top + 42} Q${cx + 5} ${top + 45} ${cx + 12} ${top + 45} Q${cx + 23} ${top + 46} ${cx + 19} ${top + 35} Q${cx + 20} ${top + 43} ${cx + 13} ${top + 39} Q${cx + 6} ${top + 35} ${cx} ${top + 40} Z`}
          fill="#2b2140"
          stroke={INK}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </motion.g>
    ),
    over: ({ cx, top }, c) => (
      <g {...stroke}>
        <g transform={`rotate(-8 ${cx} ${top})`}>
          <rect x={cx - 15} y={top - 28} width={30} height={30} rx={3} fill="#241b38" />
          <rect x={cx - 15} y={top - 8} width={30} height={7} fill={c.hex} strokeWidth={2.5} />
          <rect x={cx - 25} y={top - 2} width={50} height={7} rx={3.5} fill="#241b38" />
        </g>
        <circle cx={cx + 9.5} cy={top + 27} r={9} fill="rgba(255,255,255,0.12)" stroke="#f5b82e" strokeWidth={3} />
        <path d={`M${cx + 18} ${top + 30} Q${cx + 25} ${top + 46} ${cx + 21} ${top + 60}`} fill="none" stroke="#f5b82e" strokeWidth={1.5} />
      </g>
    ),
    mouthY: 54,
  },
  baer: {
    w: 38,
    top: 30,
    body: "#b87b45",
    shade: "#94602f",
    belly: "#f1d29f",
    sigArms: { l: -62, r: 62 },
    sigFace: "smile",
    back: ({ cx, w, top }) => (
      <g {...stroke}>
        <circle cx={cx - w + 8} cy={top + 4} r={11} fill="#b87b45" />
        <circle cx={cx + w - 8} cy={top + 4} r={11} fill="#b87b45" />
        <circle cx={cx - w + 8} cy={top + 4} r={5} fill="#f1b9a0" strokeWidth={0} />
        <circle cx={cx + w - 8} cy={top + 4} r={5} fill="#f1b9a0" strokeWidth={0} />
      </g>
    ),
    under: ({ cx, top }) => (
      <g>
        <ellipse cx={cx} cy={top + 45} rx={17} ry={12.5} fill="#f1d29f" stroke={INK} strokeWidth={3} />
        <path d={`M${cx - 5.5} ${top + 37} Q${cx} ${top + 34} ${cx + 5.5} ${top + 37} Q${cx + 5} ${top + 42} ${cx} ${top + 43} Q${cx - 5} ${top + 42} ${cx - 5.5} ${top + 37} Z`} fill={INK} />
      </g>
    ),
    over: ({ cx, top }, c) => (
      <g {...stroke} strokeWidth={3}>
        <path d={`M${cx} ${top + 62} L${cx - 12} ${top + 55} L${cx - 12} ${top + 69} Z`} fill={c.hex} />
        <path d={`M${cx} ${top + 62} L${cx + 12} ${top + 55} L${cx + 12} ${top + 69} Z`} fill={c.hex} />
        <circle cx={cx} cy={top + 62} r={3.5} fill={c.light} />
      </g>
    ),
    mouthY: 48,
  },
  ninja: {
    w: 27,
    top: 24,
    body: "#3f4763",
    shade: "#2c3249",
    ex: 9.5,
    sigArms: { l: -62, r: 62 },
    sigFace: "sly",
    sigBody: { opacity: [1, 1, 0.1, 0.1, 1], scaleY: 1, transition: { duration: 1.6, repeat: Infinity } },
    // heller Augenschlitz in der Maske
    under: ({ cx, w, top }) => <rect x={cx - w + 2} y={top + 20} width={w * 2 - 4} height={15} rx={6} fill="#f6caa4" stroke={INK} strokeWidth={2.5} />,
    over: ({ cx, w, top }, c, mood) => (
      <g {...stroke} strokeWidth={3}>
        <motion.g style={{ originX: 0, originY: 0.5 }} animate={{ rotate: [0, -8, 4, 0] }} transition={{ duration: mood === "idle" ? 2.4 : 0.6, repeat: Infinity }}>
          <path d={`M${cx + w - 2} ${top + 13} Q${cx + w + 14} ${top + 4} ${cx + w + 22} ${top + 12} Q${cx + w + 12} ${top + 12} ${cx + w + 4} ${top + 17} Z`} fill={c.hex} />
          <path d={`M${cx + w} ${top + 16} Q${cx + w + 12} ${top + 22} ${cx + w + 16} ${top + 32} Q${cx + w + 8} ${top + 26} ${cx + w - 2} ${top + 19} Z`} fill={c.hex} />
        </motion.g>
        <rect x={cx - w - 1} y={top + 11} width={w * 2 + 2} height={7} rx={3} fill={c.hex} />
      </g>
    ),
  },
  orakel: {
    w: 32,
    top: 24,
    body: "#9a83e0",
    shade: "#7660c2",
    sigArms: { l: -50, r: 50 },
    sigFace: "open",
    back: ({ cx, w, top }) => <path d={`M${cx - w - 7} ${top + 44} Q${cx - w - 9} ${top - 10} ${cx} ${top - 12} Q${cx + w + 9} ${top - 10} ${cx + w + 7} ${top + 44} Z`} fill="#4c2a8a" {...stroke} />,
    over: (g, c) => (
      <g {...stroke}>
        <path d={dome(g, 12, 2)} fill="#5d36a8" />
        {/* Augenbinde – das Orakel ist blind */}
        <path d={`M${g.cx - g.w - 1} ${g.top + 20} Q${g.cx} ${g.top + 17} ${g.cx + g.w + 1} ${g.top + 20} L${g.cx + g.w + 1} ${g.top + 33} Q${g.cx} ${g.top + 30} ${g.cx - g.w - 1} ${g.top + 33} Z`} fill={c.hex} strokeWidth={3} />
        <path d={`M${g.cx + g.w} ${g.top + 25} Q${g.cx + g.w + 10} ${g.top + 28} ${g.cx + g.w + 13} ${g.top + 38} M${g.cx + g.w} ${g.top + 28} Q${g.cx + g.w + 6} ${g.top + 35} ${g.cx + g.w + 5} ${g.top + 43}`} fill="none" stroke={c.hex} strokeWidth={3.5} strokeLinecap="round" />
        {/* drittes Auge */}
        <path d={`M${g.cx - 6} ${g.top + 9} Q${g.cx} ${g.top + 3} ${g.cx + 6} ${g.top + 9} Q${g.cx} ${g.top + 15} ${g.cx - 6} ${g.top + 9} Z`} fill="#fde68a" strokeWidth={2} />
        <circle cx={g.cx} cy={g.top + 9} r={2.2} fill={INK} strokeWidth={0} />
      </g>
    ),
  },
};

/** Armhaltung je Stimmung (Grad, links/rechts). */
const ARMS: Record<Exclude<BuddyMood, "signature">, ArmPose> = {
  idle: { l: 14, r: -14 },
  // winkt mit einer Hand
  happy: { l: 24, r: [-150, -115, -150], dur: 0.4, loop: true },
  sad: { l: 4, r: -4 },
  angry: { l: -35, r: 35 },
  think: { l: 18, r: 122 },
  wow: { l: 120, r: -120 },
};

const BODY: Record<BuddyMood, TargetAndTransition> = {
  // Atmen und ab und zu ein kleines Watscheln
  idle: { scaleY: [1, 1.025, 1, 1.025, 1], scaleX: [1, 0.99, 1, 0.99, 1], rotate: [0, 0, 0, -3, 3, 0], opacity: 1, transition: { duration: 5.2, repeat: Infinity, ease: "easeInOut" } },
  happy: { scaleY: [1, 0.86, 1.08, 1], scaleX: [1, 1.1, 0.95, 1], rotate: [0, -5, 5, 0], opacity: 1, transition: { duration: 0.6, repeat: Infinity, repeatDelay: 0.1 } },
  // zusammengesackt, schwer
  sad: { scaleY: 0.88, scaleX: 1.07, rotate: [0, -2, 0, 2, 0], opacity: 1, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  // aufplustern und stampfen
  angry: { scaleY: [1, 0.9, 1], scaleX: [1.06, 1.12, 1.06], rotate: 0, opacity: 1, transition: { duration: 0.32, repeat: Infinity } },
  think: { scaleY: 1, scaleX: 1, rotate: [0, 4, 4, 0], opacity: 1, transition: { duration: 2.4, repeat: Infinity } },
  wow: { scaleY: [1, 1.18, 1.08], scaleX: [1, 0.88, 0.95], rotate: 0, opacity: 1, transition: { duration: 0.35 } },
  signature: { scaleY: [1, 0.96, 1.03, 0.96, 1], scaleX: 1, rotate: 0, opacity: 1, transition: { duration: 0.32, repeat: Infinity } },
};

/** Sprung des ganzen Körpers (getrennt vom Stauchen, damit der Schatten mitspielen kann). */
const JUMP: Record<BuddyMood, TargetAndTransition> = {
  idle: { y: 0 },
  happy: { y: [0, 0, -11, 0], transition: { duration: 0.6, repeat: Infinity, repeatDelay: 0.1 } },
  sad: { y: 3 },
  angry: { y: [0, -3, 0], transition: { duration: 0.32, repeat: Infinity } },
  think: { y: 0 },
  wow: { y: [0, -10, -4], transition: { duration: 0.35 } },
  signature: { y: 0 },
};

function useBlink() {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setClosed(true);
        t = setTimeout(() => {
          setClosed(false);
          loop();
        }, 120);
      }, 2200 + Math.random() * 3400);
    };
    loop();
    return () => clearTimeout(t);
  }, []);
  return closed;
}

/** Augen folgen dem Mauszeiger – oder schauen ab und zu von selbst herum. */
function useGaze(ref: React.RefObject<HTMLDivElement | null>, follow: boolean) {
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (follow) {
      const onMove = (e: PointerEvent) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height * 0.4);
        const d = Math.max(1, Math.hypot(dx, dy));
        const k = Math.min(1, d / 220);
        setGaze({ x: (dx / d) * k, y: (dy / d) * k });
      };
      window.addEventListener("pointermove", onMove);
      return () => window.removeEventListener("pointermove", onMove);
    }
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setGaze(Math.random() < 0.4 ? { x: 0, y: 0 } : { x: Math.random() * 2 - 1, y: Math.random() * 1.2 - 0.6 });
        loop();
      }, 1800 + Math.random() * 3000);
    };
    loop();
    return () => clearTimeout(t);
  }, [follow, ref]);
  return gaze;
}

export function Buddy({
  id,
  color,
  mood: moodProp = "idle",
  size = 120,
  followPointer = false,
  className = "",
}: {
  id: LookId;
  color: number;
  mood?: BuddyMood;
  size?: number;
  followPointer?: boolean;
  className?: string;
}) {
  // Mit der Maus angestupst (am Handy angetippt): kurz hüpfen und winken
  const [poked, setPoked] = useState(false);
  const pokeTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const poke = () => {
    if (poked || moodProp !== "idle") return;
    setPoked(true);
    pokeTimer.current = setTimeout(() => setPoked(false), 760);
  };
  useEffect(() => () => clearTimeout(pokeTimer.current ?? undefined), []);
  const mood: BuddyMood = poked && moodProp === "idle" ? "happy" : moodProp;
  const l = LOOKS[id];
  const c = PLAYER_COLORS[color];
  const g: Geo = { cx: 60, w: l.w, top: l.top, bottom: 108 };
  const ref = useRef<HTMLDivElement>(null);
  const blink = useBlink();
  const free = useGaze(ref, followPointer);
  const gaze = mood === "think" ? { x: 0.7, y: -0.8 } : mood === "sad" ? { x: 0, y: 0.9 } : mood === "wow" ? { x: 0, y: 0 } : free;
  const arms = mood === "signature" ? l.sigArms : ARMS[mood];
  const body = mood === "signature" && l.sigBody ? { ...BODY.signature, ...l.sigBody } : BODY[mood];
  const { cx, w, top, bottom } = g;
  const bodyPath = `M${cx - w} ${top + w * 0.9} C${cx - w} ${top - 2} ${cx + w} ${top - 2} ${cx + w} ${top + w * 0.9} L${cx + w + 1} ${bottom - 12} Q${cx + w + 1} ${bottom} ${cx + w - 12} ${bottom} L${cx - w + 12} ${bottom} Q${cx - w - 1} ${bottom} ${cx - w - 1} ${bottom - 12} Z`;
  const clipId = `buddy-${id}-${color}`;

  return (
    <div ref={ref} onPointerEnter={poke} onPointerDown={poke} className={`relative ${className}`} style={{ width: size, height: size * (142 / 120) }}>
      <svg viewBox="0 -12 120 142" width={size} height={size * (142 / 120)} className="absolute inset-0 overflow-visible">
        {/* Bodenschatten – wird kleiner, wenn die Figur springt */}
        <motion.ellipse
          cx={cx}
          cy={bottom + 9}
          rx={w + 6}
          ry={5}
          fill="rgba(0,0,0,0.28)"
          animate={mood === "happy" ? { scaleX: [1, 1, 0.7, 1], opacity: [1, 1, 0.5, 1] } : { scaleX: 1, opacity: 1 }}
          transition={mood === "happy" ? { duration: 0.6, repeat: Infinity, repeatDelay: 0.1 } : { duration: 0.3 }}
          style={{ originX: 0.5, originY: 0.5 }}
        />
        <motion.g animate={JUMP[mood]} key={`j-${mood}`}>
          {/* Füße */}
          <g stroke={INK} strokeWidth={4}>
            <ellipse cx={cx - w * 0.5} cy={bottom + 3} rx={9} ry={6.5} fill={l.shade} />
            <ellipse cx={cx + w * 0.5} cy={bottom + 3} rx={9} ry={6.5} fill={l.shade} />
          </g>
          <motion.g animate={body} key={`b-${mood}`} style={{ originX: 0.5, originY: 1 }}>
            {l.back?.(g, c)}
            {/* Körper mit weicher Schattierung */}
            <defs>
              <clipPath id={clipId}>
                <path d={bodyPath} />
              </clipPath>
            </defs>
            <path d={bodyPath} fill={l.body} />
            <g clipPath={`url(#${clipId})`}>
              <ellipse cx={cx + w * 0.9} cy={top + 60} rx={w * 0.55} ry={70} fill={l.shade} opacity={0.75} />
              {l.belly && <ellipse cx={cx} cy={bottom - 14} rx={w * 0.62} ry={20} fill={l.belly} />}
              <ellipse cx={cx - w * 0.45} cy={top + 14} rx={w * 0.32} ry={7} fill="#fff" opacity={0.35} transform={`rotate(-20 ${cx - w * 0.45} ${top + 14})`} />
            </g>
            <path d={bodyPath} fill="none" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
            {l.under?.(g, c)}
            <Face g={g} l={l} id={id} mood={mood} blink={blink} gaze={gaze} />
            {l.face?.(g, c, mood)}
            {l.over?.(g, c, mood)}
            <Arm x={cx - w + 2} y={top + 50} pose={arms} side="l" fill={l.body} />
            <Arm x={cx + w - 2} y={top + 50} pose={arms} side="r" fill={l.body} />
          </motion.g>
        </motion.g>
        <Effects g={g} c={c} mood={mood} id={id} />
      </svg>
    </div>
  );
}

function Arm({ x, y, pose, side, fill }: { x: number; y: number; pose: ArmPose; side: "l" | "r"; fill: string }) {
  return (
    <motion.g
      style={{ originX: 0.5, originY: 0.12 }}
      initial={false}
      animate={{ rotate: pose[side] }}
      transition={pose.loop ? { duration: pose.dur ?? 0.4, repeat: Infinity, ease: "easeInOut" } : { type: "spring", stiffness: 260, damping: 14 }}
    >
      <rect x={x - 6.5} y={y - 4} width={13} height={27} rx={6.5} fill={fill} stroke={INK} strokeWidth={3.5} />
    </motion.g>
  );
}

function Face({ g, l, id, mood, blink, gaze }: { g: Geo; l: BuddyLook; id: LookId; mood: BuddyMood; blink: boolean; gaze: { x: number; y: number } }) {
  const { cx, top } = g;
  const ex = l.ex ?? 11;
  const ey = top + 27;
  const line = { stroke: INK, strokeWidth: 3.5, strokeLinecap: "round" as const, fill: "none" };
  // Gefühle zeigen sich an der Augenform – Knopfaugen, keine Brauen, keine Grimassen
  const sig = mood === "signature" ? l.sigFace : null;
  const smile = mood === "happy" || sig === "smile";
  const big = mood === "wow" || sig === "open";
  const rx = big ? 5.6 : 4.4;
  const ry = big ? 7.2 : 5.8;
  // Lid schneidet das Auge schräg ab: traurig nach außen, wütend/konzentriert nach innen, fies halb zu
  const lid =
    mood === "sad" ? { o: ey - 1, i: ey - 6 } : mood === "angry" || sig === "focus" ? { o: ey - 6, i: ey - 1 } : sig === "sly" ? { o: ey - 1.5, i: ey - 1.5 } : null;

  return (
    <motion.g animate={{ x: gaze.x * 3, y: gaze.y * 2.5 }} transition={{ type: "spring", stiffness: 170, damping: 16 }}>
      {[-1, 1].map((s) => {
        const x = cx + s * ex;
        if (smile) return <path key={s} d={`M${x - 4.5} ${ey + 1.5} Q${x} ${ey - 5.5} ${x + 4.5} ${ey + 1.5}`} {...line} />;
        if (blink && !big) return <path key={s} d={`M${x - 4.5} ${ey} L${x + 4.5} ${ey}`} {...line} />;
        const outer = x + s * (rx + 2);
        const inner = x - s * (rx + 2);
        return (
          <g key={s}>
            <ellipse cx={x} cy={ey} rx={rx} ry={ry} fill={INK} />
            <circle cx={x + 1.4} cy={ey - 2} r={1.5} fill="#fff" />
            {lid && <path d={`M${outer} ${ey - ry - 3} L${outer} ${lid.o} L${inner} ${lid.i} L${inner} ${ey - ry - 3} Z`} fill={id === "ninja" ? "#f6caa4" : l.body} />}
          </g>
        );
      })}
      <Mouth cx={cx} y={top + (l.mouthY ?? 50) - 4} mood={mood} id={id} sig={sig} />
    </motion.g>
  );
}

/** Mund nur, wenn er etwas erzählt – sonst bleibt das Gesicht ruhig. */
function Mouth({ cx, y, mood, id, sig }: { cx: number; y: number; mood: BuddyMood; id: LookId; sig: BuddyLook["sigFace"] | null }) {
  const line = { stroke: INK, strokeWidth: 3, strokeLinecap: "round" as const, fill: "none" };
  // Bärte und Masken verdecken den Mund
  if (id === "wikinger" || id === "ninja") return null;
  if (id === "baer") {
    if (mood === "wow") return <ellipse cx={cx} cy={y + 3} rx={2.6} ry={3.2} fill={INK} />;
    if (mood === "sad" || mood === "angry") return <path d={`M${cx - 4} ${y + 4} Q${cx} ${y + 1} ${cx + 4} ${y + 4}`} {...line} />;
    return <path d={`M${cx - 4} ${y + 1} Q${cx - 2} ${y + 4} ${cx} ${y + 1.5} Q${cx + 2} ${y + 4} ${cx + 4} ${y + 1}`} {...line} strokeWidth={2.5} />;
  }
  if (mood === "happy" || sig === "smile") return <path d={`M${cx - 5} ${y} Q${cx} ${y + 7} ${cx + 5} ${y} Z`} fill={INK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />;
  if (sig === "sly") return <path d={`M${cx - 6} ${y + 1} Q${cx + 1} ${y + 6} ${cx + 7} ${y - 1}`} {...line} />;
  if (sig === "focus") return <path d={`M${cx - 5} ${y + 2} H${cx + 5}`} {...line} />;
  if (mood === "wow" || sig === "open") return <ellipse cx={cx} cy={y + 2} rx={3} ry={4} fill={INK} />;
  if (mood === "sad") return <path d={`M${cx - 4} ${y + 4} Q${cx} ${y + 1} ${cx + 4} ${y + 4}`} {...line} />;
  return null;
}

/** Nur wenige, leise Zeichen rund um die Figur – und die Requisiten der Markenzeichen. */
function Effects({ g, c, mood, id }: { g: Geo; c: Col; mood: BuddyMood; id: LookId }) {
  const { cx, w, top, bottom } = g;
  const ex = LOOKS[id].ex ?? 11;
  const sig = mood === "signature";
  return (
    <AnimatePresence>
      {mood === "sad" && id !== "orakel" && (
        <motion.path
          key="tear"
          d={`M${cx - ex} ${top + 33} q-2.5 5 0 7 q2.5 -2 0 -7 Z`}
          fill="#8fd0ff"
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, 18], opacity: [1, 0] }}
          transition={{ duration: 1.3, repeat: Infinity }}
        />
      )}
      {mood === "think" && (
        <motion.circle key="think" cx={cx + 28} cy={top - 4} r={3} fill="#fff" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], y: [0, -6] }} transition={{ duration: 1.6, repeat: Infinity }} />
      )}
      {sig && id === "baer" && (
        <motion.path
          key="heart"
          d={`M${cx + 30} ${top + 2} c-3.5 -5 -10 -2 -7 3.5 l7 7 l7 -7 c3 -5.5 -3.5 -8.5 -7 -3.5 Z`}
          fill="#ff6f8e"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: -18 }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}
      {sig && id === "ritter" && (
        <motion.path
          key="glint"
          d={`M${cx + w + 8} ${top + 4} l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z`}
          fill="#fff6b0"
          style={{ originX: 0.5, originY: 0.5 }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
      )}
      {sig && id === "oma" && (
        <motion.g key="knit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <circle cx={cx + w - 4} cy={bottom - 4} r={7} fill={c.hex} stroke={INK} strokeWidth={2.5} />
          <path d={`M${cx + w - 9} ${bottom - 7} Q${cx + w - 4} ${bottom - 2} ${cx + w + 1} ${bottom - 7}`} fill="none" stroke={c.light} strokeWidth={1.5} />
          <motion.path d={`M${cx - 12} ${top + 70} L${cx + 10} ${top + 56}`} stroke="#d1a35a" strokeWidth={2.5} strokeLinecap="round" style={{ originX: 0.5, originY: 0.5 }} animate={{ rotate: [0, 14, 0] }} transition={{ duration: 0.35, repeat: Infinity }} />
          <motion.path d={`M${cx + 12} ${top + 70} L${cx - 10} ${top + 56}`} stroke="#d1a35a" strokeWidth={2.5} strokeLinecap="round" style={{ originX: 0.5, originY: 0.5 }} animate={{ rotate: [0, -14, 0] }} transition={{ duration: 0.35, repeat: Infinity }} />
        </motion.g>
      )}
      {sig && id === "professor" && (
        <motion.g key="bulb" style={{ originX: 0.5, originY: 1 }} initial={{ scale: 0 }} animate={{ scale: [0, 1.15, 1] }} transition={{ duration: 0.4 }}>
          <motion.circle cx={cx + 26} cy={top - 20} r={12} fill="#fff3a0" animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 0.8, repeat: Infinity }} />
          <circle cx={cx + 26} cy={top - 20} r={7} fill="#ffe14d" stroke={INK} strokeWidth={2.5} />
          <rect x={cx + 22.5} y={top - 14} width={7} height={5} rx={1.5} fill="#9aa3b5" stroke={INK} strokeWidth={2} />
        </motion.g>
      )}
      {sig &&
        id === "clown" &&
        ["#f472b6", "#fde047", "#60a5fa"].map((fill, i) => (
          <motion.circle
            key={`ball${i}`}
            r={5}
            fill={fill}
            stroke={INK}
            strokeWidth={2}
            initial={{ cx: cx - 20, cy: top }}
            animate={{ cx: [cx - 20, cx, cx + 20, cx, cx - 20], cy: [top, top - 26, top, top + 4, top] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear", delay: -i / 3 }}
          />
        ))}
      {sig &&
        id === "rennfahrerin" &&
        [0, 1, 2].map((i) => (
          <motion.path
            key={`speed${i}`}
            d={`M${cx - w - 26} ${top + 30 + i * 16} H${cx - w - 10}`}
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ x: [10, -12], opacity: [0, 1, 0] }}
            transition={{ duration: 0.45, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      {sig &&
        id === "ninja" &&
        [-1, 0, 1].map((s, i) => (
          <motion.circle
            key={`smoke${i}`}
            cx={cx + s * 18}
            cy={bottom - 8 - Math.abs(s) * 10}
            r={10}
            fill="#e7e5ee"
            stroke={INK}
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0, 1, 0], scale: [0, 0.4, 1.3, 1.6] }}
            transition={{ duration: 1.6, repeat: Infinity, times: [0, 0.3, 0.55, 1] }}
            style={{ originX: 0.5, originY: 0.5 }}
          />
        ))}
      {sig && id === "orakel" && (
        <motion.g key="orb">
          <motion.circle cx={cx} cy={top + 66} r={18} fill={c.light} animate={{ opacity: [0.15, 0.45, 0.15], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ originX: 0.5, originY: 0.5 }} />
          <circle cx={cx} cy={top + 66} r={10} fill="#e9ddff" stroke={INK} strokeWidth={3} />
          <circle cx={cx - 3} cy={top + 63} r={3} fill="#fff" />
        </motion.g>
      )}
    </AnimatePresence>
  );
}
