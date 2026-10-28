import type { Card, CardValue, GameState, HistoryEntry, Marble, Move, MoveKind } from "@/types/game";
import {
  boardKey,
  controllableColors,
  hasRingMarble,
  lockedSet,
  occupancy,
  unitSteps,
  walk,
  withMoved,
  allHome,
} from "./board";
import { BASE, HOME_OFFSET, ORACLE_SEAT, isHome, isRing, nextPlayer, partnerOf, startOf } from "./constants";
import { ph, type Phrase } from "@/lib/i18n";

interface Ctx {
  state: GameState;
  /** Spieler, dessen Kugeln bewegt werden (beim Teufel der Gegner). */
  actor: number;
  handOwner: number;
  card: Card;
}

let moveSeq = 0;

function mk(ctx: Ctx, effect: CardValue | null, kind: MoveKind, board: Marble[], before: Marble[], extra: Partial<Move> = {}): Move {
  const captured = board
    .filter((m) => m.pos === BASE && before[m.id].pos !== BASE)
    .map((m) => m.id);
  return {
    id: `m${moveSeq++}`,
    kind,
    cardId: ctx.card.id,
    effect,
    handOwner: ctx.handOwner,
    board,
    anims: [],
    captured,
    label: "",
    ...extra,
  };
}

function captureSuffix(before: Marble[], captured: number[]): Phrase {
  if (!captured.length) return "";
  return ph("cap", { who: { j: captured.map((id) => ({ col: before[id].color })) } });
}

// ---------------------------------------------------------------- Einzelne Effekte

function enterMoves(board: Marble[], ctx: Ctx, effect: CardValue, colors: number[], forceCaptureAny = false): Move[] {
  const out: Move[] = [];
  const occ = occupancy(board);
  for (const c of colors) {
    const mb = board.find((m) => m.color === c && m.pos === BASE);
    if (!mb) continue;
    const s = startOf(c);
    const occupant = occ.ring[s];
    if (occupant !== -1 && board[occupant].color === c && !forceCaptureAny) continue;
    let nb = withMoved(board, mb.id, s, true);
    if (occupant !== -1) nb = withMoved(nb, occupant, BASE);
    const m = mk(ctx, effect, "enter", nb, board, { marbleId: mb.id, target: s });
    m.anims = [{ marbleId: mb.id, path: [s] }];
    m.label = ph("mv.enter", { adj: { adj: c }, cap: captureSuffix(board, m.captured) });
    out.push(m);
  }
  return out;
}

function stepMoves(board: Marble[], ctx: Ctx, effect: CardValue, k: number, dir: 1 | -1, colors?: number[], ringOnly = false): Move[] {
  const out: Move[] = [];
  const cols = colors ?? controllableColors(board, ctx.actor);
  const locked = lockedSet(board);
  for (const m of board) {
    if (!cols.includes(m.color) || m.pos === BASE || locked.has(m.id)) continue;
    if (ringOnly && !isRing(m.pos)) continue;
    for (const r of walk(board, m, k, dir)) {
      let nb = withMoved(board, m.id, r.to, false);
      if (r.captured !== null) nb = withMoved(nb, r.captured, BASE);
      const mv = mk(ctx, effect, "steps", nb, board, { marbleId: m.id, target: r.to });
      mv.anims = [{ marbleId: m.id, path: r.path }];
      const where: Phrase = isHome(r.to) ? ph(isHome(m.pos) ? "where.inHome" : "where.home") : "";
      mv.label = ph("mv.steps", {
        col: { col: m.color },
        n: k,
        unit: ph(k === 1 ? "unit.one" : "unit.many"),
        dir: dir < 0 ? ph("dir.back") : "",
        where,
        cap: captureSuffix(board, mv.captured),
      });
      out.push(mv);
    }
  }
  return out;
}

export interface SevenTrace {
  mid: number;
  to: number;
}

function sevenCtxColors(board: Marble[], actor: number) {
  return controllableColors(board, actor);
}

/** Alle unterschiedlichen Endstellungen einer 7. */
export function sevenFinals(board: Marble[], actor: number, locked = lockedSet(board)) {
  const finals = new Map<string, { board: Marble[]; trace: SevenTrace[] }>();
  const seen = new Set<string>();
  const dfs = (b: Marble[], rem: number, trace: SevenTrace[]) => {
    const key = boardKey(b) + "#" + rem;
    if (seen.has(key)) return;
    seen.add(key);
    if (rem === 0) {
      const k = boardKey(b);
      if (!finals.has(k)) finals.set(k, { board: b, trace });
      return;
    }
    for (const c of sevenCtxColors(b, actor))
      for (let i = 0; i < 4; i++) {
        const id = c * 4 + i;
        for (const u of unitSteps(b, id, locked)) dfs(u.board, rem - 1, [...trace, { mid: id, to: u.to }]);
      }
  };
  dfs(board, 7, []);
  return [...finals.values()];
}

/** Kann von dieser Stellung aus die 7 mit `rem` Schritten vollständig gezogen werden? */
export function canCompleteSeven(board: Marble[], actor: number, rem: number, locked: Set<number>, memo = new Map<string, boolean>()): boolean {
  if (rem === 0) return true;
  const key = boardKey(board) + "#" + rem;
  const hit = memo.get(key);
  if (hit !== undefined) return hit;
  let ok = false;
  outer: for (const c of sevenCtxColors(board, actor))
    for (let i = 0; i < 4; i++)
      for (const u of unitSteps(board, c * 4 + i, locked))
        if (canCompleteSeven(u.board, actor, rem - 1, locked, memo)) {
          ok = true;
          break outer;
        }
  memo.set(key, ok);
  return ok;
}

export interface SevenSegment {
  marbleId: number;
  to: number;
  steps: number;
  board: Marble[];
  path: number[];
}

/** Für die interaktive 7: alle Teilzüge einer einzelnen Kugel, nach denen der Rest noch aufgeht. */
export function sevenSegments(board: Marble[], actor: number, rem: number, locked: Set<number>): SevenSegment[] {
  const out: SevenSegment[] = [];
  const memo = new Map<string, boolean>();
  for (const c of sevenCtxColors(board, actor))
    for (let i = 0; i < 4; i++) {
      const id = c * 4 + i;
      let frontier: { board: Marble[]; path: number[]; dir: "f" | "b" | null }[] = [{ board, path: [], dir: null }];
      for (let k = 1; k <= rem; k++) {
        const next: typeof frontier = [];
        for (const f of frontier)
          for (const u of unitSteps(f.board, id, locked)) {
            if (f.dir && u.dir !== f.dir) continue;
            next.push({ board: u.board, path: [...f.path, u.to], dir: u.dir });
          }
        for (const n of next)
          if (canCompleteSeven(n.board, actor, rem - k, locked, memo))
            out.push({ marbleId: id, to: n.path[n.path.length - 1], steps: k, board: n.board, path: n.path });
        frontier = next;
        if (!frontier.length) break;
      }
    }
  return out;
}

export function buildSevenMove(ctx: Ctx, effect: CardValue, before: Marble[], after: Marble[], segments: { marbleId: number; path: number[] }[]): Move {
  const mv = mk(ctx, effect, "seven", after, before);
  const byMarble = new Map<number, number[]>();
  for (const s of segments) byMarble.set(s.marbleId, [...(byMarble.get(s.marbleId) ?? []), ...s.path]);
  mv.anims = [...byMarble.entries()].map(([marbleId, path]) => ({ marbleId, path }));
  const parts: Phrase[] = [...byMarble.entries()].map(([id, p]) => ({ j: [{ col: before[id].color }, String(p.length)], s: " " }));
  mv.label = ph("mv.seven", { parts: { j: parts, s: " + " }, cap: captureSuffix(before, mv.captured) });
  if (segments.length === 1) {
    mv.marbleId = segments[0].marbleId;
    mv.target = after[segments[0].marbleId].pos;
  }
  return mv;
}

function sevenMoves(board: Marble[], ctx: Ctx, effect: CardValue): Move[] {
  return sevenFinals(board, ctx.actor).map((f) => {
    const segs: { marbleId: number; path: number[] }[] = [];
    for (const t of f.trace) {
      const last = segs[segs.length - 1];
      if (last && last.marbleId === t.mid) last.path.push(t.to);
      else segs.push({ marbleId: t.mid, path: [t.to] });
    }
    return buildSevenMove(ctx, effect, board, f.board, segs);
  });
}

function swapMoves(board: Marble[], ctx: Ctx, effect: CardValue): Move[] {
  const cols = controllableColors(board, ctx.actor);
  if (!hasRingMarble(board, cols)) return [];
  const ring = board.filter((m) => isRing(m.pos));
  if (ring.length < 2) return [];
  const out: Move[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < ring.length; i++)
    for (let j = i + 1; j < ring.length; j++) {
      const a = ring[i];
      const b = ring[j];
      let nb = withMoved(board, a.id, b.pos, false);
      nb = withMoved(nb, b.id, a.pos, false);
      const key = boardKey(nb);
      if (seen.has(key)) continue;
      seen.add(key);
      const mv = mk(ctx, effect, "swap", nb, board, { swap: [a.id, b.id] });
      mv.anims = [
        { marbleId: a.id, path: [b.pos] },
        { marbleId: b.id, path: [a.pos] },
      ];
      mv.label = ph("mv.swap", { a: { col: a.color }, b: { col: b.color } });
      out.push(mv);
    }
  return out;
}

function warriorMoves(board: Marble[], ctx: Ctx, effect: CardValue): Move[] {
  const cols = controllableColors(board, ctx.actor);
  const occ = occupancy(board);
  const out: Move[] = [];
  for (const m of board) {
    if (!cols.includes(m.color) || !isRing(m.pos)) continue;
    let victim = m.id;
    const path: number[] = [];
    for (let d = 1; d <= 64; d++) {
      const p = (m.pos + d) % 64;
      path.push(p);
      if (occ.ring[p] !== -1 && occ.ring[p] !== m.id) {
        victim = occ.ring[p];
        break;
      }
    }
    if (victim === m.id) {
      const nb = withMoved(board, m.id, BASE);
      const mv = mk(ctx, effect, "warrior", nb, board, { marbleId: m.id, target: m.pos });
      mv.anims = [{ marbleId: m.id, path: [...path, BASE] }];
      mv.label = ph("mv.warriorSelf");
      out.push(mv);
      continue;
    }
    const to = board[victim].pos;
    let nb = withMoved(board, victim, BASE);
    nb = withMoved(nb, m.id, to, false);
    const mv = mk(ctx, effect, "warrior", nb, board, { marbleId: m.id, target: to });
    mv.anims = [{ marbleId: m.id, path }];
    mv.label = ph("mv.warrior", { col: { col: m.color }, cap: captureSuffix(board, mv.captured) });
    out.push(mv);
  }
  return out;
}

function angelMoves(board: Marble[], ctx: Ctx, effect: CardValue): Move[] {
  let target = nextPlayer(ctx.actor);
  if (allHome(board, target)) target = partnerOf(target);
  const hasBase = board.some((m) => m.color === target && m.pos === BASE);
  let moves: Move[];
  if (hasBase) moves = enterMoves(board, ctx, effect, [target], true);
  else
    moves = [
      ...stepMoves(board, ctx, effect, 1, 1, [target], true),
      ...stepMoves(board, ctx, effect, 13, 1, [target], true),
    ];
  for (const m of moves) m.label = ph("mv.angel", { col: { col: target }, inner: m.label });
  return moves;
}

// ---------------------------------------------------------------- Karten → Züge

export function movesForEffect(board: Marble[], effect: CardValue, ctx: Ctx): Move[] {
  const { state } = ctx;
  const next = nextPlayer(ctx.actor);
  const cols = controllableColors(board, ctx.actor);
  switch (effect) {
    case 1:
    case 13:
      return [...enterMoves(board, ctx, effect, cols), ...stepMoves(board, ctx, effect, effect, 1)];
    case 4:
      return stepMoves(board, ctx, effect, 4, -1);
    case 7:
      return sevenMoves(board, ctx, effect);
    case 8: {
      const moves = stepMoves(board, ctx, effect, 8, 1);
      if (hasRingMarble(board, cols) && state.players[next].hand.length > 0) {
        const mv = mk(ctx, effect, "skip", board, board);
        mv.label = ph("mv.skip", { who: { pl: next } });
        moves.push(mv);
      }
      return moves;
    }
    case "trickser":
      return swapMoves(board, ctx, effect);
    case "krieger":
      return warriorMoves(board, ctx, effect);
    case "engel":
      return angelMoves(board, ctx, effect);
    case "teufel": {
      const has = state.players[next].hand.length > 0;
      const mv = mk(ctx, effect, has ? "devil" : "void", board, board);
      mv.label = has ? ph("mv.devil", { who: { pl: next } }) : ph("mv.devilVoid");
      return [mv];
    }
    case "narr": {
      const has = state.players[next].hand.length > 0;
      const mv = mk(ctx, effect, has ? "jester" : "void", board, board);
      mv.label = has ? ph("mv.jester") : ph("mv.jesterVoid");
      return [mv];
    }
    case "tac":
      return [];
    default:
      return stepMoves(board, ctx, effect, effect, 1);
  }
}

export function lastRelevantEntry(history: HistoryEntry[]): HistoryEntry | null {
  for (let i = history.length - 1; i >= 0; i--) if (!history[i].transparent) return history[i];
  return null;
}

/** Die TAC-Karte: letzten Zug zurücknehmen und dessen Karte selbst nutzen. */
export function tacBase(state: GameState): { board: Marble[]; entry: HistoryEntry } | null {
  if (state.noTacThisTurn) return null;
  const entry = lastRelevantEntry(state.history);
  if (!entry || entry.effect === null || entry.effect === "tac") return null;
  return { board: entry.discarded ? state.marbles : entry.boardBefore, entry };
}

function tacMoves(ctx: Ctx): Move[] {
  const base = tacBase(ctx.state);
  if (!base) return [];
  const { board, entry } = base;
  const moves = movesForEffect(board, entry.effect!, ctx);
  for (const m of moves) {
    m.tacUndo = { player: entry.player, effect: entry.effect };
    m.baseBoard = board;
    m.label = entry.discarded
      ? ph("mv.tacDiscarded", { card: { card: entry.effect! }, inner: m.label })
      : ph("mv.tac", { who: { pl: entry.player }, card: { card: entry.effect! }, inner: m.label });
  }
  return moves;
}

export function cardMoves(state: GameState, card: Card, actor: number, handOwner: number): Move[] {
  const ctx: Ctx = { state, actor, handOwner, card };
  if (card.value === "tac") return tacMoves(ctx);
  return movesForEffect(state.marbles, card.value, ctx);
}

function discardMoves(state: GameState, owner: number, cards: Card[]): Move[] {
  return cards.map((card) => ({
    id: `d${moveSeq++}`,
    kind: "discard" as const,
    cardId: card.id,
    effect: null,
    handOwner: owner,
    board: state.marbles,
    anims: [],
    captured: [],
    label: ph("mv.discard"),
  }));
}

/** Alle legalen Züge für den Spieler, der gerade entscheidet. */
export function legalMoves(state: GameState): Move[] {
  if (state.phase !== "play") return [];
  const sub = state.subTurn;
  if (sub?.type === "devil") {
    const q = sub.target;
    const hand = state.players[q].hand;
    const moves = hand
      .filter((c) => c.value !== "tac" && c.value !== "teufel")
      .flatMap((c) => cardMoves(state, c, q, q));
    return moves.length ? moves : discardMoves(state, q, hand);
  }
  const p = state.current;
  const hand = state.players[p].hand;
  if (state.pendingWin !== null)
    return hand.filter((c) => c.value === "tac").flatMap((c) => cardMoves(state, c, p, p));
  if (state.skipPending) {
    const tac = hand.filter((c) => c.value === "tac").flatMap((c) => cardMoves(state, c, p, p));
    return [...discardMoves(state, p, hand), ...tac];
  }
  const moves = hand.flatMap((c) => cardMoves(state, c, p, p));
  return moves.length ? moves : discardMoves(state, p, hand);
}

/** Wer trifft gerade die Entscheidung (beim Teufel der Teufelsspieler)? */
export function decider(state: GameState): number {
  return state.subTurn ? state.subTurn.actor : state.current;
}

/** Wessen Handkarten werden gerade gespielt? */
export function activeHandOwner(state: GameState): number {
  return state.subTurn?.type === "devil" ? state.subTurn.target : state.current;
}

/** Orakel-Modus: Karten des blinden Orakels, die der Spieler nicht kennt. */
export function hiddenCards(state: GameState): Set<string> {
  if (state.mode !== "oracle") return new Set();
  const known = new Set(state.oracleKnown ?? []);
  return new Set(state.players[ORACLE_SEAT].hand.filter((c) => !known.has(c.id)).map((c) => c.id));
}

/** Züge einer blind gezogenen Karte – ist sie nicht spielbar, verfällt sie. */
export function blindMoves(state: GameState, cardId: string): Move[] {
  const moves = legalMoves(state).filter((m) => m.cardId === cardId);
  if (moves.length) return moves;
  const owner = activeHandOwner(state);
  const card = state.players[owner].hand.find((c) => c.id === cardId);
  return card ? discardMoves(state, owner, [card]) : [];
}

export function hasOpener(cards: Card[]) {
  return cards.some((c) => c.value === 1 || c.value === 13);
}

export { HOME_OFFSET };
