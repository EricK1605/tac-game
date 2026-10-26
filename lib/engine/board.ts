import type { Marble } from "@/types/game";
import { BASE, HOME_OFFSET, RING_SIZE, isHome, isRing, partnerOf, startOf } from "./constants";

export function initialMarbles(): Marble[] {
  const marbles: Marble[] = [];
  for (let c = 0; c < 4; c++)
    for (let i = 0; i < 4; i++) marbles.push({ id: c * 4 + i, color: c, pos: BASE, fresh: false });
  return marbles;
}

export interface Occupancy {
  ring: number[]; // marble id oder -1
  home: number[][]; // [farbe][slot] -> marble id oder -1
}

export function occupancy(marbles: Marble[]): Occupancy {
  const ring = new Array(RING_SIZE).fill(-1);
  const home = [0, 1, 2, 3].map(() => [-1, -1, -1, -1]);
  for (const m of marbles) {
    if (isRing(m.pos)) ring[m.pos] = m.id;
    else if (isHome(m.pos)) home[m.color][m.pos - HOME_OFFSET] = m.id;
  }
  return { ring, home };
}

export const boardKey = (marbles: Marble[]) =>
  marbles.map((m) => (m.fresh ? `${m.pos}f` : `${m.pos}`)).join(",");

export function allHome(marbles: Marble[], color: number) {
  return marbles.every((m) => m.color !== color || isHome(m.pos));
}

/** Farben, deren Kugeln der Spieler bewegen darf (Endphase: die des Partners). */
export function controllableColors(marbles: Marble[], player: number): number[] {
  return allHome(marbles, player) ? [partnerOf(player)] : [player];
}

export function hasRingMarble(marbles: Marble[], colors: number[]) {
  return marbles.some((m) => colors.includes(m.color) && isRing(m.pos));
}

/** Eingerastet: im Haus und kein freies Feld mehr davor. */
export function isLocked(marbles: Marble[], m: Marble, occ = occupancy(marbles)): boolean {
  if (!isHome(m.pos)) return false;
  for (let i = m.pos - HOME_OFFSET + 1; i < 4; i++) if (occ.home[m.color][i] === -1) return false;
  return true;
}

export function lockedSet(marbles: Marble[]): Set<number> {
  const occ = occupancy(marbles);
  return new Set(marbles.filter((m) => isLocked(marbles, m, occ)).map((m) => m.id));
}

export function teamComplete(marbles: Marble[], team: number) {
  return allHome(marbles, team) && allHome(marbles, team + 2);
}

/** Wirft eine Kugel ins Vorfeld zurück (gibt neues Array zurück). */
export function withMoved(marbles: Marble[], id: number, pos: number, fresh = false): Marble[] {
  return marbles.map((m) => (m.id === id ? { ...m, pos, fresh } : m));
}

export interface WalkResult {
  to: number;
  path: number[];
  captured: number | null;
}

/**
 * Ein Zug über `steps` Felder ohne Überspringen (alle Karten außer der 7).
 * dir = 1 vorwärts, -1 rückwärts (nur die 4). Verzweigt am eigenen Startfeld ins Haus.
 */
export function walk(marbles: Marble[], m: Marble, steps: number, dir: 1 | -1): WalkResult[] {
  if (m.pos === BASE) return [];
  if (isHome(m.pos) && dir === -1) return [];
  const occ = occupancy(marbles);
  const start = startOf(m.color);
  const results: WalkResult[] = [];

  const rec = (pos: number, left: number, path: number[]) => {
    if (left === 0) {
      const last = path[path.length - 1];
      const occId = isRing(last) ? occ.ring[last] : -1;
      results.push({ to: last, path, captured: occId !== -1 && occId !== m.id ? occId : null });
      return;
    }
    const nexts: number[] = [];
    if (isHome(pos)) {
      const i = pos - HOME_OFFSET;
      if (i < 3) nexts.push(pos + 1);
    } else {
      nexts.push((pos + dir + RING_SIZE) % RING_SIZE);
      if (pos === start && (path.length > 0 || !m.fresh)) nexts.push(HOME_OFFSET);
    }
    for (const n of nexts) {
      const occId = isHome(n) ? occ.home[m.color][n - HOME_OFFSET] : occ.ring[n];
      if (occId !== -1 && occId !== m.id) {
        // Überspringen verboten; schlagen nur auf dem Zielfeld im Kreis.
        if (left > 1 || isHome(n)) continue;
      }
      rec(n, left - 1, [...path, n]);
    }
  };
  rec(m.pos, steps, []);
  return results;
}

export interface UnitStep {
  board: Marble[];
  to: number;
  dir: "f" | "b";
  captured: number | null;
}

/** Einzelschritt einer Kugel für die 7 (wirft im Vorbeiziehen, im Haus hin und her). */
export function unitSteps(marbles: Marble[], id: number, locked: Set<number>): UnitStep[] {
  const m = marbles[id];
  if (m.pos === BASE || locked.has(id)) return [];
  const occ = occupancy(marbles);
  const out: UnitStep[] = [];
  if (isRing(m.pos)) {
    const n = (m.pos + 1) % RING_SIZE;
    const victim = occ.ring[n];
    let board = withMoved(marbles, id, n);
    if (victim !== -1 && victim !== id) board = withMoved(board, victim, BASE);
    out.push({ board, to: n, dir: "f", captured: victim !== -1 && victim !== id ? victim : null });
    if (m.pos === startOf(m.color) && !m.fresh && occ.home[m.color][0] === -1)
      out.push({ board: withMoved(marbles, id, HOME_OFFSET), to: HOME_OFFSET, dir: "f", captured: null });
  } else {
    const i = m.pos - HOME_OFFSET;
    if (i < 3 && occ.home[m.color][i + 1] === -1)
      out.push({ board: withMoved(marbles, id, m.pos + 1), to: m.pos + 1, dir: "f", captured: null });
    if (i > 0 && occ.home[m.color][i - 1] === -1)
      out.push({ board: withMoved(marbles, id, m.pos - 1), to: m.pos - 1, dir: "b", captured: null });
  }
  return out;
}

/** Distanz (vorwärts) von a nach b auf dem Kreis. */
export const ringDist = (a: number, b: number) => (b - a + RING_SIZE) % RING_SIZE;
