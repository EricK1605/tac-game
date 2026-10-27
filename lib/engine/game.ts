import type { GameSettings, GameState, LogEntry, Move, Player } from "@/types/game";
import { initialMarbles, teamComplete } from "./board";
import { PLAYER_COLORS, TEAM_NAMES, buildDeck, cardLabel, nextPlayer, partnerOf, shuffle } from "./constants";
import { hasOpener, lastRelevantEntry, legalMoves } from "./moves";
import { DEFAULT_BOTS, personaById } from "@/lib/personas";

export function newGame(settings: GameSettings): GameState {
  const bots = settings.bots ?? DEFAULT_BOTS;
  const players: Player[] = [0, 1, 2, 3].map((id) => {
    const persona = id === 0 ? null : (personaById(bots[id - 1]) ?? personaById(DEFAULT_BOTS[id - 1]))!;
    return {
      id,
      name: persona ? persona.name : settings.playerName || "Du",
      isHuman: id === 0,
      difficulty: settings.difficulty,
      persona: persona?.id ?? null,
      hand: [],
    };
  });
  const s: GameState = {
    phase: "swap",
    players,
    marbles: initialMarbles(),
    deck: shuffle(buildDeck(settings.master)),
    discardPile: [],
    dealer: Math.floor(Math.random() * 4),
    dealNumber: 0,
    current: 0,
    history: [],
    skipPending: false,
    subTurn: null,
    swapSelections: [null, null, null, null],
    pendingWin: null,
    noTacThisTurn: false,
    winner: null,
    master: settings.master,
    log: [],
    logCounter: 0,
    lastMove: null,
    moveCounter: 0,
    announcements: [null, null, null, null],
  };
  pushLog(s, { player: null, kind: "system", text: `Neues Spiel${settings.master ? " (Meisterversion)" : ""} – ${TEAM_NAMES[0]} gegen ${TEAM_NAMES[1]}` });
  startDeal(s, s.dealer);
  return s;
}

export function pushLog(s: GameState, e: Omit<LogEntry, "id">) {
  s.log = [...s.log.slice(-199), { ...e, id: s.logCounter++ }];
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({ ...p, hand: [...p.hand] })),
    history: [...state.history],
    discardPile: [...state.discardPile],
    swapSelections: [...state.swapSelections],
    announcements: [...state.announcements],
  };
}

export function startDeal(s: GameState, dealer: number) {
  s.dealer = dealer;
  s.dealNumber++;
  let per = s.master && s.deck.length === 24 ? 6 : 5;
  if (s.deck.length < per * 4) {
    s.deck = shuffle(buildDeck(s.master));
    s.discardPile = [];
    per = 5;
    pushLog(s, { player: null, kind: "system", text: "Der Stapel ist aufgebraucht – es wird neu gemischt." });
  }
  for (let r = 0; r < per; r++)
    for (let i = 1; i <= 4; i++) {
      const p = (dealer + i) % 4;
      s.players[p].hand.push(s.deck.pop()!);
    }
  s.history = [];
  s.skipPending = false;
  s.subTurn = null;
  s.phase = "swap";
  s.swapSelections = [null, null, null, null];
  s.current = nextPlayer(dealer);
  s.announcements = s.players.map((p) => hasOpener(p.hand));
  pushLog(s, {
    player: dealer,
    kind: "deal",
    text: `${s.players[dealer].name} gibt ${per} Karten${per === 6 ? " (Meisterrunde)" : ""}.`,
  });
  for (const p of s.players)
    pushLog(s, { player: p.id, kind: "system", text: `${p.name}: „${s.announcements[p.id] ? "Ich kann!" : "Ich kann nicht!"}“` });
}

export function selectSwap(state: GameState, player: number, cardId: string): GameState {
  const s = cloneState(state);
  s.swapSelections[player] = cardId;
  if (s.swapSelections.every((x) => x !== null)) performSwap(s);
  return s;
}

function performSwap(s: GameState) {
  const take = (p: number) => {
    const id = s.swapSelections[p]!;
    const card = s.players[p].hand.find((c) => c.id === id)!;
    s.players[p].hand = s.players[p].hand.filter((c) => c.id !== id);
    return card;
  };
  for (const [a, b] of [
    [0, 2],
    [1, 3],
  ]) {
    const ca = take(a);
    const cb = take(b);
    s.players[a].hand.push(cb);
    s.players[b].hand.push(ca);
  }
  s.phase = "play";
  s.current = nextPlayer(s.dealer);
  pushLog(s, { player: null, kind: "system", text: "Die Partner haben je eine Karte getauscht." });
}

function nextTurnPlayer(s: GameState, from: number): number | null {
  let n = nextPlayer(from);
  for (let i = 0; i < 4; i++) {
    if (s.players[n].hand.length > 0) return n;
    n = nextPlayer(n);
  }
  return null;
}

function advance(s: GameState, from: number) {
  s.subTurn = null;
  const n = nextTurnPlayer(s, from);
  if (n === null) {
    startDeal(s, nextPlayer(s.dealer));
    return;
  }
  s.current = n;
}

function passHandsRight(s: GameState) {
  const hands = s.players.map((p) => p.hand);
  // Jeder gibt an den rechten Nachbarn (gegen den Uhrzeigersinn) – man erhält vom linken.
  for (let p = 0; p < 4; p++) s.players[p].hand = hands[nextPlayer(p)];
}

export function applyMove(state: GameState, move: Move): GameState {
  const s = cloneState(state);
  const sub = state.subTurn;
  const owner = s.players[move.handOwner];
  const card = owner.hand.find((c) => c.id === move.cardId);
  if (!card) return state;
  owner.hand = owner.hand.filter((c) => c.id !== move.cardId);
  s.discardPile = [...s.discardPile.slice(-15), { card, player: move.handOwner }];

  const discarded = move.kind === "discard";
  const effect = discarded ? (card.value === "tac" ? lastRelevantEntry(s.history)?.effect ?? null : card.value) : move.effect;
  s.history.push({
    player: move.handOwner,
    card,
    effect,
    boardBefore: state.marbles,
    discarded,
    transparent: move.kind === "jester" || move.kind === "devil",
  });
  s.marbles = move.board;
  s.lastMove = move;
  s.moveCounter++;

  const actorName = s.players[sub ? sub.actor : s.current].name;
  const forName = sub?.type === "devil" ? ` (als Teufel für ${s.players[sub.target].name})` : "";
  pushLog(s, {
    player: move.handOwner,
    card: card.value,
    kind: discarded ? "discard" : card.value === "tac" ? "tac" : move.captured.length ? "capture" : "play",
    text: discarded
      ? `${s.players[move.handOwner].name} legt ${cardLabel(card.value)} ungenutzt ab${state.skipPending ? " (Aussetzen)" : ""}.`
      : `${actorName}${forName} spielt ${cardLabel(card.value)}${move.label.startsWith("–") ? " " : ": "}${move.label}.`,
  });

  const blockedWin = state.pendingWin !== null;
  s.pendingWin = null;
  s.noTacThisTurn = false;
  s.skipPending = move.kind === "skip";

  if (move.kind === "devil") {
    s.subTurn = { type: "devil", actor: s.current, target: nextPlayer(s.current) };
    return s;
  }
  if (move.kind === "jester") {
    passHandsRight(s);
    const decider = sub?.type === "devil" ? sub : { type: "jester" as const, actor: s.current };
    s.subTurn = decider;
    const handOwner = decider.type === "devil" ? decider.target : decider.actor;
    if (s.players[handOwner].hand.length > 0) return s;
  }

  // Wer war eigentlich am Zug? Beim Teufel wird der Zug des Opfers verbraucht.
  const turnOf = sub?.type === "devil" ? sub.target : s.current;

  for (const team of [0, 1]) {
    if (!teamComplete(s.marbles, team)) continue;
    if (!blockedWin) {
      const n = nextTurnPlayer(s, turnOf);
      if (n !== null) {
        const probe: GameState = { ...s, current: n, subTurn: null, skipPending: false, pendingWin: team };
        if (legalMoves(probe).length > 0) {
          pushLog(s, { player: null, kind: "system", text: `${TEAM_NAMES[team]} hat alle Kugeln im Haus – doch ${s.players[n].name} kann noch TAC spielen!` });
          s.current = n;
          s.subTurn = null;
          s.skipPending = false;
          s.pendingWin = team;
          return s;
        }
      }
    }
    s.phase = "gameOver";
    s.winner = team;
    pushLog(s, { player: null, kind: "system", text: `🏆 ${TEAM_NAMES[team]} gewinnt!` });
    return s;
  }

  advance(s, turnOf);
  if (blockedWin) s.noTacThisTurn = true;
  return s;
}

export function teamOfPlayerName(s: GameState, player: number) {
  return `${s.players[player].name} & ${s.players[partnerOf(player)].name}`;
}

export const colorOf = (p: number) => PLAYER_COLORS[p];
