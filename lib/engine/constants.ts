import type { Card, CardValue } from "@/types/game";

// Namen und Hinweise zu Karten, Farben und Teams stehen übersetzt in lib/i18n.ts.

export const RING_SIZE = 64;
export const HOME_OFFSET = 64;
export const BASE = -1;

export const PLAYER_COLORS = [
  { name: "Rot", hex: "#d62e2e", light: "#ff8a80", dark: "#7a0f0f", text: "text-red-400" },
  { name: "Blau", hex: "#2463d6", light: "#8ab4ff", dark: "#0c2a6b", text: "text-blue-400" },
  { name: "Grün", hex: "#1f9a4a", light: "#7fe0a0", dark: "#0b4a22", text: "text-emerald-400" },
  { name: "Gelb", hex: "#e6b400", light: "#ffe680", dark: "#7a5a00", text: "text-amber-300" },
] as const;

export const startOf = (color: number) => color * 16;
export const teamOf = (player: number) => player % 2;
export const partnerOf = (player: number) => (player + 2) % 4;
export const nextPlayer = (player: number) => (player + 1) % 4;
/** Platz des blinden Orakels (Partner des Spielers auf Platz 0). */
export const ORACLE_SEAT = 2;

export const isRing = (pos: number) => pos >= 0 && pos < RING_SIZE;
export const isHome = (pos: number) => pos >= HOME_OFFSET;

/** Kartenverteilung der Basisversion (100 Karten). */
export const DECK_COUNTS: [CardValue, number][] = [
  [1, 9],
  [2, 7],
  [3, 7],
  [4, 7],
  [5, 7],
  [6, 7],
  [7, 8],
  [8, 7],
  [9, 7],
  [10, 7],
  [12, 7],
  [13, 9],
  ["trickser", 7],
  ["tac", 4],
];

export const MASTER_CARDS: CardValue[] = ["engel", "teufel", "krieger", "narr"];

export function buildDeck(master: boolean): Card[] {
  const cards: Card[] = [];
  let n = 0;
  for (const [value, count] of DECK_COUNTS) {
    for (let i = 0; i < count; i++) cards.push({ id: `c${n++}`, value });
  }
  if (master) for (const value of MASTER_CARDS) cards.push({ id: `c${n++}`, value });
  return cards;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Rote Zahlen = Sonderkarten mit Zusatzfunktion. */
export const isRedNumber = (v: CardValue) => v === 1 || v === 4 || v === 7 || v === 8 || v === 13;
