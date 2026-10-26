import type { Card, CardValue, Difficulty, GameState, Marble, Move } from "@/types/game";
import { allHome, controllableColors, ringDist } from "@/lib/engine/board";
import { BASE, HOME_OFFSET, isHome, isRing, partnerOf, startOf, teamOf } from "@/lib/engine/constants";
import { activeHandOwner, cardMoves, decider, legalMoves } from "@/lib/engine/moves";

/**
 * KI-Gegner für TAC.
 *  - easy:   zufälliger legaler Zug
 *  - medium: gierig – schmeißen, eröffnen, ins Haus ziehen
 *  - hard:   wie Mittel, zusätzlich Gefahrenanalyse (Abstände zu gegnerischen Kugeln,
 *            gegnerische Startfelder), Teampartner-Schutz, TAC aufheben, kluger Kartentausch
 */

const FORWARD_THREATS = new Set([1, 2, 3, 5, 6, 7, 8, 9, 10, 12, 13]);

/** Wie weit ist die Kugel auf dem Weg nach Hause? (0 … ~110) */
function progress(m: Marble): number {
  if (m.pos === BASE) return 0;
  if (isHome(m.pos)) return 140 + (m.pos - HOME_OFFSET) * 2;
  const start = startOf(m.color);
  const toStart = m.fresh && m.pos === start ? 64 : ringDist(m.pos, start);
  let v = 18 + (64 - toStart);
  // Die 4 rückwärts ins Haus: 1–3 Felder hinter dem Startfeld ist fast schon zu Hause.
  const behind = ringDist(start, m.pos);
  if (!m.fresh && behind >= 1 && behind <= 3) v = Math.max(v, 70);
  return v;
}

/** Wahrscheinlichkeitsgewichtete Bedrohung einer Kugel durch gegnerische Kugeln. */
function danger(m: Marble, marbles: Marble[], enemyColors: number[]): number {
  if (!isRing(m.pos)) return 0;
  let threats = 0;
  for (const o of marbles) {
    if (!enemyColors.includes(o.color)) continue;
    if (isRing(o.pos)) {
      const d = ringDist(o.pos, m.pos);
      if (FORWARD_THREATS.has(d)) threats += d <= 7 ? 1.3 : 1;
      if (ringDist(m.pos, o.pos) === 4) threats += 0.9;
    }
  }
  // Auf einem gegnerischen Startfeld zu stehen ist gefährlich, solange dort Kugeln im Vorfeld warten.
  for (const c of enemyColors) {
    if (m.pos === startOf(c) && marbles.some((o) => o.color === c && o.pos === BASE)) threats += 1.6;
    const ahead = ringDist(startOf(c), m.pos);
    if (ahead > 0 && ahead <= 13 && marbles.some((o) => o.color === c && o.pos === BASE)) threats += 0.25;
  }
  return Math.min(threats, 4) * 0.11;
}

export function evaluate(marbles: Marble[], team: number, withDanger: boolean): number {
  const mine = [team, team + 2];
  const theirs = [1 - team, 3 - team];
  let score = 0;
  for (const m of marbles) {
    const own = mine.includes(m.color);
    let v = progress(m);
    if (withDanger) v -= progress(m) * danger(m, marbles, own ? theirs : mine);
    score += own ? v : -v;
  }
  // Endphase: eine Farbe komplett fertig ist viel wert.
  for (const c of [0, 1, 2, 3]) if (allHome(marbles, c)) score += mine.includes(c) ? 25 : -25;
  return score;
}

/** Wie wertvoll ist es, diese Karte zu behalten? (für Abwurf, Tausch und Kartenkosten) */
function keepValue(v: CardValue, s: GameState, player: number): number {
  const cols = controllableColors(s.marbles, player);
  const baseCount = s.marbles.filter((m) => cols.includes(m.color) && m.pos === BASE).length;
  const inRing = s.marbles.some((m) => cols.includes(m.color) && isRing(m.pos));
  switch (v) {
    case "tac":
      return 10;
    case 7:
      return 8;
    case "teufel":
    case "krieger":
      return 7;
    case 1:
    case 13:
      return baseCount > 0 ? (inRing ? 6 : 9) : 3;
    case 4:
      return 6;
    case "trickser":
      return inRing ? 6 : 3;
    case 8:
      return 5;
    case "engel":
    case "narr":
      return 2;
    default:
      return 3 + (v as number) / 12;
  }
}

function captureSummary(move: Move, s: GameState, team: number) {
  let enemy = 0;
  let friendly = 0;
  for (const id of move.captured) {
    if (teamOf(s.marbles[id].color) === team) friendly++;
    else enemy++;
  }
  return { enemy, friendly };
}

function mediumScore(move: Move, s: GameState, team: number): number {
  const { enemy, friendly } = captureSummary(move, s, team);
  let score = enemy * 40 - friendly * 50;
  if (move.kind === "enter") score += teamOf(s.marbles[move.marbleId!].color) === team ? 30 : -30;
  for (const m of move.board) {
    const before = s.marbles[m.id];
    if (isHome(m.pos) && !isHome(before.pos)) score += teamOf(m.color) === team ? 45 : -45;
  }
  score += (evaluate(move.board, team, false) - evaluate(s.marbles, team, false)) * 0.3;
  if (move.kind === "discard") score -= keepValue(s.players[move.handOwner].hand.find((c) => c.id === move.cardId)!.value, s, move.handOwner);
  return score + Math.random() * 2;
}

function hardScore(move: Move, s: GameState, team: number, handCards: Card[]): number {
  // Basis: taktische Prioritäten wie Mittel, plus Veränderung der Gefährdungslage.
  const dangerBefore = evaluate(s.marbles, team, true) - evaluate(s.marbles, team, false);
  const dangerAfter = evaluate(move.board, team, true) - evaluate(move.board, team, false);
  let score = mediumScore(move, s, team) + (dangerAfter - dangerBefore);
  const card = handCards.find((c) => c.id === move.cardId);
  if (!card) return score;
  const devilMode = s.subTurn?.type === "devil";
  if (!devilMode) {
    // TAC nicht verschwenden, wenn der Zug wenig bringt (Simulation: pauschales Kartensparen schadet).
    if (card.value === "tac") score -= 4;
  } else {
    // Beim Teufel verbrennen wir am liebsten die besten Karten des Gegners.
    score += keepValue(card.value, s, move.handOwner) * 0.8;
  }
  if (move.kind === "skip") {
    // Aussetzen lassen ist gut, wenn der nächste Spieler ein Gegner mit bedrohlicher Lage ist.
    score += 6;
  }
  if (move.kind === "devil") score += 14;
  if (move.kind === "jester") score += 2;
  return score;
}

export function chooseMove(s: GameState, difficulty: Difficulty): Move | null {
  const moves = legalMoves(s);
  if (!moves.length) return null;
  if (moves.length === 1) return moves[0];
  const me = decider(s);
  const team = teamOf(me);
  if (difficulty === "easy") {
    // Leicht: zufälliger gültiger Zug (Abwürfe zufällig).
    return moves[Math.floor(Math.random() * moves.length)];
  }
  const hand = s.players[activeHandOwner(s)].hand;
  const scored = moves.map((mv) => {
    let sc = difficulty === "medium" ? mediumScore(mv, s, team) : hardScore(mv, s, team, hand);
    if (mv.kind === "discard" && difficulty === "hard") {
      const card = hand.find((c) => c.id === mv.cardId)!;
      sc = (s.subTurn?.type === "devil" ? 1 : -1) * keepValue(card.value, s, mv.handOwner);
    }
    return { mv, sc };
  });
  scored.sort((a, b) => b.sc - a.sc);
  if (difficulty === "medium" || s.subTurn?.type === "devil" || scored[0].mv.kind === "discard") return scored[0].mv;

  // Schwer: Kombinationen aus der eigenen Hand planen (z. B. eröffnen, dann mit der 4 rückwärts).
  let best = scored[0].mv;
  let bestScore = -Infinity;
  for (const { mv, sc } of scored.slice(0, PLAN_CANDIDATES)) {
    const sc2 = sc + PLAN_WEIGHT * bestFollowUp(s, mv, me, team, hand);
    if (sc2 > bestScore) {
      bestScore = sc2;
      best = mv;
    }
  }
  return best;
}

const PLAN_CANDIDATES = 8;
const PLAN_WEIGHT = 0.25; // per Simulation ermittelt (63 % Siege gegen „Mittel“)

/** Bester Folgezug mit einer der übrigen eigenen Karten (ohne TAC). */
function bestFollowUp(s: GameState, mv: Move, me: number, team: number, hand: Card[]): number {
  const after: GameState = { ...s, marbles: mv.board, subTurn: null, skipPending: false, pendingWin: null };
  const base = evaluate(mv.board, team, true);
  let best = 0;
  const seen = new Set<CardValue>();
  for (const c of hand) {
    if (c.id === mv.cardId || c.value === "tac" || seen.has(c.value)) continue;
    seen.add(c.value);
    for (const f of cardMoves(after, c, me, me)) {
      if (f.kind !== "steps" && f.kind !== "seven" && f.kind !== "enter" && f.kind !== "swap" && f.kind !== "warrior") continue;
      const gain = evaluate(f.board, team, true) - base;
      if (gain > best) best = gain;
    }
  }
  return best;
}

/** Welche Karte gibt der Bot seinem Partner? */
export function chooseSwapCard(s: GameState, player: number, difficulty: Difficulty): string {
  const hand = s.players[player].hand;
  if (difficulty === "easy") return hand[Math.floor(Math.random() * hand.length)].id;
  const partner = partnerOf(player);
  const pCols = controllableColors(s.marbles, partner);
  const partnerStuck =
    !s.marbles.some((m) => pCols.includes(m.color) && isRing(m.pos)) &&
    s.marbles.some((m) => pCols.includes(m.color) && m.pos === BASE);
  const openers = hand.filter((c) => c.value === 1 || c.value === 13);
  const myCols = controllableColors(s.marbles, player);
  const meInRing = s.marbles.some((m) => myCols.includes(m.color) && isRing(m.pos));

  // Partner kann (vermutlich) nicht eröffnen: Eröffnungskarte abgeben.
  if (difficulty === "hard" && partnerStuck && openers.length > 0 && (openers.length > 1 || meInRing) && !s.announcements[partner])
    return openers[0].id;
  if (partnerStuck && openers.length > 1) return openers[0].id;

  let worst = hand[0];
  let worstVal = Infinity;
  for (const c of hand) {
    let v = keepValue(c.value, s, player);
    if (difficulty === "hard" && (c.value === 1 || c.value === 13) && partnerStuck) v -= 3;
    if (v < worstVal) {
      worstVal = v;
      worst = c;
    }
  }
  return worst.id;
}

/** Kurzer Kommentar des Bots zur Spielsituation. */
export function botComment(kind: "capturedEnemy" | "gotCaptured" | "partnerGood" | "home" | "tac" | "win" | "lose"): string {
  const lines: Record<typeof kind, string[]> = {
    capturedEnemy: ["Ab nach Hause mit dir! 😏", "Tschüss!", "Das musste sein.", "Erwischt!"],
    gotCaptured: ["Autsch! 😩", "Ouch!", "Das gibt Rache…", "Na warte!"],
    partnerGood: ["Guter Zug, Partner! 👍", "Stark gespielt!", "Genau so!", "Klasse!"],
    home: ["Eine mehr im Haus 🏠", "Sicher geparkt.", "Läuft bei uns!"],
    tac: ["TAC! 😈", "Nicht so schnell!", "Das nehme ich mal zurück…"],
    win: ["Gewonnen! 🎉", "Teamwork makes the dream work!"],
    lose: ["Gut gespielt…", "Nächstes Mal!"],
  };
  const arr = lines[kind];
  return arr[Math.floor(Math.random() * arr.length)];
}
