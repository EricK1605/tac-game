// Geometrie des Spielbretts (SVG viewBox 0 0 1000 1000).
import { BASE, HOME_OFFSET, isHome, startOf } from "@/lib/engine/constants";
import type { Marble } from "@/types/game";

export const SIZE = 1000;
export const CENTER = 500;
export const RING_R = 380;
export const HOLE_R = 16;
export const MARBLE_R = 14;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Winkel des Kreisfelds i – Spieler 0 unten, im Uhrzeigersinn. */
export const ringAngle = (i: number) => 90 + i * (360 / 64);

export interface Pt {
  x: number;
  y: number;
}

export function ringPoint(i: number): Pt {
  const a = rad(ringAngle(i));
  return { x: CENTER + RING_R * Math.cos(a), y: CENTER + RING_R * Math.sin(a) };
}

export function homePoint(color: number, idx: number): Pt {
  const a = rad(ringAngle(startOf(color)) + (idx + 1) * 4.2);
  const r = RING_R - 52 * (idx + 1);
  return { x: CENTER + r * Math.cos(a), y: CENTER + r * Math.sin(a) };
}

export function baseCenter(color: number): Pt {
  const a = rad(ringAngle(startOf(color)) - 45);
  return { x: CENTER + 545 * Math.cos(a), y: CENTER + 545 * Math.sin(a) };
}

export function basePoint(color: number, slot: number): Pt {
  const c = baseCenter(color);
  const dx = slot % 2 === 0 ? -22 : 22;
  const dy = slot < 2 ? -22 : 22;
  return { x: c.x + dx, y: c.y + dy };
}

export function posPoint(color: number, pos: number, slot = 0): Pt {
  if (pos === BASE) return basePoint(color, slot);
  if (isHome(pos)) return homePoint(color, pos - HOME_OFFSET);
  return ringPoint(pos);
}

export const marblePoint = (m: Marble) => posPoint(m.color, m.pos, m.id % 4);

/** Sitzplätze der Spieler (für Namensschilder, in % der Brettgröße). */
export const SEAT_POS = [
  { left: "50%", top: "97%" },
  { left: "3%", top: "50%" },
  { left: "50%", top: "3%" },
  { left: "97%", top: "50%" },
];
