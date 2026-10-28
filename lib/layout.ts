// Geometrie des Spielbretts (SVG viewBox 0 0 1000 1000).
import { BASE, HOME_OFFSET, isHome, startOf } from "@/lib/engine/constants";
import type { Marble } from "@/types/game";

export const SIZE = 1000;
export const CENTER = 500;
export const RING_R = 408;
export const HOLE_R = 18;
export const MARBLE_R = 16.5;
/** Abstand der vier Vorfeld-Mulden vom Vorfeld-Mittelpunkt */
const BASE_SPREAD = 26;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Platz, der unten am Brett sitzt (Freunde-Modus: jeder sieht sich selbst unten). */
let viewSeat = 0;
export function setViewSeat(seat: number) {
  viewSeat = seat;
}

/** Platz eines Spielers aus Sicht des Betrachters: 0 = unten, 1 = links, 2 = oben, 3 = rechts. */
export const relSeat = (player: number) => (player - viewSeat + 4) % 4;

/** Winkel des Kreisfelds i – der Betrachter unten, im Uhrzeigersinn. */
export const ringAngle = (i: number) => 90 + i * (360 / 64) - viewSeat * 90;

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
  const r = RING_R - 54 * (idx + 1);
  return { x: CENTER + r * Math.cos(a), y: CENTER + r * Math.sin(a) };
}

export function baseCenter(color: number): Pt {
  const a = rad(ringAngle(startOf(color)) - 45);
  return { x: CENTER + 560 * Math.cos(a), y: CENTER + 560 * Math.sin(a) };
}

export function basePoint(color: number, slot: number): Pt {
  const c = baseCenter(color);
  const dx = slot % 2 === 0 ? -BASE_SPREAD : BASE_SPREAD;
  const dy = slot < 2 ? -BASE_SPREAD : BASE_SPREAD;
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
