import type { GameSettings, GameState, LogEntry, Move, Player, SeatSpec } from "@/types/game";
import { initialMarbles, teamComplete } from "./board";
import { ORACLE_SEAT, PLAYER_COLORS, buildDeck, nextPlayer, partnerOf, shuffle } from "./constants";
import { ph } from "@/lib/i18n";
import { hasOpener, lastRelevantEntry, legalMoves } from "./moves";
import { DEFAULT_BOTS, ORACLE, ORACLE_OPPONENTS, personaById } from "@/lib/personas";

/** Besetzung der vier Plätze je Modus (Platz 0 = Spieler an diesem Gerät, 2 = Partner). */
function seatsFor(settings: GameSettings): SeatSpec[] {
  if (settings.seats?.length === 4) return settings.seats;
  const me: SeatSpec = { human: true, name: settings.playerName };
  if (settings.mode === "oracle")
    return [me, { human: false, persona: ORACLE_OPPONENTS[0] }, { human: true, persona: ORACLE.id }, { human: false, persona: ORACLE_OPPONENTS[1] }];
  const bots = settings.bots ?? DEFAULT_BOTS;
  return [me, ...[0, 1, 2].map((i) => ({ human: false, persona: personaById(bots[i]) ? bots[i] : DEFAULT_BOTS[i] }))];
}

export function newGame(settings: GameSettings): GameState {
  const players: Player[] = seatsFor(settings).map((spec, id) => {
    const persona = personaById(spec.persona);
    return {
      id,
      // Anzeigenamen werden je Sprache aufgelöst (lib/useI18n playerName); gespeichert wird der deutsche bzw. eingegebene Name
      name: persona ? persona.de.name : spec.name || "Du",
      isHuman: spec.human,
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
    mode: settings.mode ?? "classic",
    log: [],
    logCounter: 0,
    lastMove: null,
    moveCounter: 0,
    announcements: [null, null, null, null],
  };
  pushLog(s, { player: null, kind: "system", text: ph("log.newGame", { master: settings.master ? ph("log.newGameMaster") : "", t0: ph("team.0"), t1: ph("team.1") }) });
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
    oracleKnown: state.oracleKnown && [...state.oracleKnown],
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
    pushLog(s, { player: null, kind: "system", text: ph("log.reshuffle") });
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
  if (s.mode === "oracle") s.oracleKnown = [];
  s.current = nextPlayer(dealer);
  s.announcements = s.players.map((p) => hasOpener(p.hand));
  pushLog(s, {
    player: dealer,
    kind: "deal",
    text: ph("log.deal", { who: { pl: dealer }, n: per, master: per === 6 ? ph("log.dealMaster") : "" }),
  });
  for (const p of s.players)
    pushLog(s, { player: p.id, kind: "system", text: ph(s.announcements[p.id] ? "log.can" : "log.cannot", { who: { pl: p.id } }) });
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
  // Die Karte, die das Orakel von dir bekommt, kennst du
  if (s.mode === "oracle") s.oracleKnown = [...(s.oracleKnown ?? []), s.swapSelections[partnerOf(ORACLE_SEAT)]!];
  s.phase = "play";
  s.current = nextPlayer(s.dealer);
  pushLog(s, { player: null, kind: "system", text: ph("log.swapped") });
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
  // Deine eigenen Karten bleiben dir bekannt, auch wenn sie beim Orakel landen
  if (s.mode === "oracle") s.oracleKnown = [...(s.oracleKnown ?? []), ...hands[partnerOf(ORACLE_SEAT)].map((c) => c.id)];
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

  const actor = sub ? sub.actor : s.current;
  const forName = sub?.type === "devil" ? ph("log.for", { who: { pl: sub.target } }) : "";
  pushLog(s, {
    player: move.handOwner,
    card: card.value,
    kind: discarded ? "discard" : card.value === "tac" ? "tac" : move.captured.length ? "capture" : "play",
    text: discarded
      ? ph("log.discard", { who: { pl: move.handOwner }, card: { card: card.value }, skip: state.skipPending ? ph("log.discardSkip") : "" })
      : ph("log.play", {
          actor: { pl: actor },
          for: forName,
          card: { card: card.value },
          // „– der Narr verfällt“ & Co. schließen ohne Doppelpunkt an
          sep: move.kind === "jester" || move.kind === "void" ? " " : ": ",
          label: move.label,
        }),
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
          pushLog(s, { player: null, kind: "system", text: ph("log.lastTac", { team: ph(team === 0 ? "team.0" : "team.1"), who: { pl: n } }) });
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
    pushLog(s, { player: null, kind: "system", text: ph("log.win", { team: ph(team === 0 ? "team.0" : "team.1") }) });
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
