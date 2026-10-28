"use client";

import { create } from "zustand";
import type { ChatMessage, GameSettings, GameState, Marble, MarbleAnim, Move } from "@/types/game";
import { applyMove, newGame, selectSwap } from "@/lib/engine/game";
import { activeHandOwner, blindMoves, decider, hiddenCards, legalMoves, tacBase, type SevenSegment } from "@/lib/engine/moves";
import { boardKey, lockedSet } from "@/lib/engine/board";
import { BASE, isHome, partnerOf, teamOf } from "@/lib/engine/constants";
import { botComment, chooseMove, chooseSwapCard } from "@/lib/ai/botEngine";
import { setSoundEnabled, sfx } from "@/lib/audio";
import { haptics } from "@/lib/haptics";
import { DEFAULT_BOTS, personaById, styleOf } from "@/lib/personas";
import { LISTS, tr } from "@/lib/i18n";
import { currentLang, playerName } from "@/lib/useI18n";
import type { Mood } from "@/components/Character";
import { newGameId, persist, readSave } from "@/lib/saves";

export const STEP_MS = 95;

export interface AnimSpec {
  key: number;
  from: Marble[];
  anims: MarbleAnim[];
  captured: number[];
}

export interface SevenBuilder {
  cardId: string;
  board: Marble[];
  remaining: number;
  segments: { marbleId: number; path: number[] }[];
  locked: number[];
}

export interface Emote {
  id: number;
  player: number;
  emoji: string;
  time: number;
}

/** Große Effekt-Einblendung (Kick, Haus, TAC, Sieg). */
export interface FxEvent {
  id: number;
  kind: "kick" | "home" | "tac" | "win";
  player: number;
  victims: number[];
}

export const EMOTES = ["👍", "😂", "😎", "🔥", "👏", "😭", "😡", "😱", "🤔", "🙏"];

/**
 * local: alles läuft auf diesem Gerät (Klassisch, Orakel)
 * host:  Gastgeber im Freunde-Modus – führt Spiel und Bots, schickt den Stand an alle
 * guest: Gast im Freunde-Modus – zeigt den Stand des Gastgebers, schickt nur eigene Aktionen
 */
export type Role = "local" | "host" | "guest";

/** Verbindung in den Raum (Freunde-Modus); wird von der Raum-Seite gesetzt. */
export interface NetLink {
  send: (type: string, payload: unknown) => void;
}

/** Aktion eines Gastes, die der Gastgeber prüft und ausführt. */
export type RemoteAction =
  | { type: "move"; seat: number; cardId: string; kind: Move["kind"]; key: string }
  | { type: "swap"; seat: number; cardId: string }
  | { type: "chat"; seat: number; text: string };

interface Store {
  settings: GameSettings;
  sound: boolean;
  game: GameState | null;
  anim: AnimSpec | null;
  selectedCardId: string | null;
  selectedMarble: number | null;
  seven: SevenBuilder | null;
  chat: ChatMessage[];
  showRules: boolean;
  thinking: boolean;
  moods: { mood: Mood; until: number }[];
  emotes: Emote[];
  fx: FxEvent | null;
  drawerOpen: boolean;
  /** Token der laufenden Spielsitzung (Teil der URL /spiel/<token>) */
  gameId: string | null;
  /** Plätze, die an diesem Gerät gespielt werden – der erste ist „ich“ (unten am Brett) */
  mySeats: number[];
  role: Role;
  net: NetLink | null;

  /** Startet ein neues Spiel und liefert dessen Token. */
  start: (settings: GameSettings, opts?: { mySeats?: number[]; role?: Role; net?: NetLink | null }) => string;
  /** Lädt einen gespeicherten Spielstand – false, wenn es ihn nicht gibt. */
  resume: (id: string, opts?: { role?: Role; net?: NetLink | null }) => boolean;
  /** Gast: übernimmt den Spielstand des Gastgebers. */
  receiveState: (game: GameState, chat: ChatMessage[], mySeats: number[], net: NetLink) => void;
  /** Gastgeber: führt eine geprüfte Aktion eines Gastes aus. */
  hostAction: (a: RemoteAction) => void;
  /** Emote von einem anderen Gerät anzeigen. */
  remoteEmote: (player: number, emoji: string) => void;
  quit: () => void;
  selectCard: (id: string | null) => void;
  selectMarble: (id: number | null) => void;
  playMove: (move: Move) => void;
  sevenStep: (seg: SevenSegment) => void;
  resetSeven: () => void;
  chooseSwap: (cardId: string) => void;
  say: (text: string) => void;
  toggleSound: () => void;
  setShowRules: (v: boolean) => void;
  emote: (emoji: string) => void;
  setDrawerOpen: (v: boolean) => void;
}

let botTimer: ReturnType<typeof setTimeout> | null = null;
let chatId = 0;
let animKey = 0;
let fxId = 0;
/** Orakel: blind gezogene Karte – sie muss gespielt werden, bis der Zug vorbei ist. */
let blindPick: string | null = null;
const idleMoods = () => [0, 1, 2, 3].map(() => ({ mood: "idle" as Mood, until: 0 }));
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function animDuration(move: Move | null): number {
  if (!move) return 0;
  const longest = Math.max(0, ...move.anims.map((a) => a.path.length));
  return longest * STEP_MS + (move.captured.length ? 450 : 0);
}

/** Erster lokaler Platz, der beim Tauschen noch eine Karte wählen muss. */
export function swapSeat(g: GameState, mySeats: number[]): number | null {
  return mySeats.find((p) => g.players[p].isHuman && g.swapSelections[p] === null) ?? null;
}

export const useGameStore = create<Store>()((set, get) => {
  const addChat = (player: number, text: string) => {
    const msg: ChatMessage = { id: chatId++, player, text, time: Date.now() };
    set((s) => ({ chat: [...s.chat.slice(-40), msg] }));
  };

  const setMood = (player: number, mood: Mood, ms = 1800) =>
    set((s) => {
      const moods = [...s.moods];
      moods[player] = { mood, until: Date.now() + ms };
      return { moods };
    });

  const showEmote = (player: number, emoji: string) =>
    set((s) => ({ emotes: [...s.emotes.slice(-20), { id: chatId++, player, emoji, time: Date.now() }] }));

  /** Emote zeigen und – im Freunde-Modus – an alle anderen Geräte schicken. */
  const addEmote = (player: number, emoji: string) => {
    showEmote(player, emoji);
    get().net?.send("emote", { player, emoji });
  };

  const me = () => get().mySeats[0] ?? 0;
  const personaOf = (p: number) => get().game?.players[p].persona ?? null;
  /** Nur Figuren mit Charakter reden von selbst – menschliche Freunde nicht. */
  const speaks = (p: number) => personaOf(p) !== null;
  const comment = (p: number, kind: Parameters<typeof botComment>[0]) => {
    if (speaks(p)) addChat(p, botComment(kind, personaOf(p), currentLang()));
  };
  const bots = (g: GameState) => [0, 1, 2, 3].filter((p) => !g.players[p].isHuman);

  /** Figuren reagieren: Jubel beim Kick, Trauer beim Rauswurf, Effekte für Haus/TAC/Sieg. */
  const celebrate = (before: GameState, move: Move, after: GameState, delayMs: number, emotes: boolean) => {
    const mover = before.subTurn ? before.subTurn.actor : before.current;
    const victims = [...new Set(move.captured.map((id) => before.marbles[id].color))];
    const enemyVictims = victims.filter((c) => teamOf(c) !== teamOf(mover));
    const card = before.players[move.handOwner].hand.find((c) => c.id === move.cardId);
    const newHome = move.board.some((m) => isHome(m.pos) && !isHome(before.marbles[m.id].pos));
    const mine = get().mySeats;
    setTimeout(() => {
      if (after.phase === "gameOver" && after.winner !== null) {
        set({ fx: { id: fxId++, kind: "win", player: after.winner, victims: [] } });
        for (const p of [0, 1, 2, 3]) setMood(p, teamOf(p) === after.winner ? "happy" : "sad", 6000);
        haptics.win();
        return;
      }
      if (victims.length) {
        haptics.capture();
        for (const v of victims) if (v !== mover) setMood(v, Math.random() < 0.5 ? "sad" : "angry", 2200);
        if (enemyVictims.length) {
          setMood(mover, "happy", 1600);
          set({ fx: { id: fxId++, kind: "kick", player: mover, victims } });
          if (!emotes) return;
          if (!before.players[mover].isHuman && Math.random() < 0.55) addEmote(mover, pick(["😎", "😂", "🔥"]));
          for (const v of enemyVictims) if (!before.players[v].isHuman && Math.random() < 0.5) setTimeout(() => addEmote(v, pick(["😭", "😡", "😱"])), 700);
          const partner = partnerOf(mover);
          if (mine.includes(mover) && speaks(partner) && Math.random() < 0.6) setTimeout(() => addEmote(partner, pick(["👏", "🔥", "👍"])), 900);
        }
        return;
      }
      if (card?.value === "tac" && move.kind !== "discard") {
        set({ fx: { id: fxId++, kind: "tac", player: mover, victims: [] } });
        setMood(mover, "happy", 1200);
        if (move.tacUndo) setMood(move.tacUndo.player, "angry", 1500);
        return;
      }
      if (newHome) {
        set({ fx: { id: fxId++, kind: "home", player: mover, victims: [] } });
        setMood(mover, "happy", 1200);
      }
    }, delayMs);
  };

  /** Bots kommentieren das Geschehen. */
  const react = (before: GameState, move: Move, after: GameState) => {
    const mover = before.subTurn ? before.subTurn.actor : before.current;
    celebrate(before, move, after, Math.max(0, animDuration(move) - (move.captured.length ? 450 : 0)), true);
    const capturedOwners = [...new Set(move.captured.map((id) => before.marbles[id].color))];
    for (const owner of capturedOwners) if (owner !== mover && Math.random() < 0.6) comment(owner, "gotCaptured");
    const enemyHit = capturedOwners.some((c) => teamOf(c) !== teamOf(mover));
    if (enemyHit) {
      if (!before.players[mover].isHuman && Math.random() < 0.5) comment(mover, "capturedEnemy");
      if (get().mySeats.includes(mover) && Math.random() < 0.75) comment(partnerOf(mover), "partnerGood");
    }
    const card = before.players[move.handOwner].hand.find((c) => c.id === move.cardId);
    if (card?.value === "tac" && !before.players[mover].isHuman && move.kind !== "discard" && Math.random() < 0.7) comment(mover, "tac");
    const newHome = move.board.some((m) => isHome(m.pos) && !isHome(before.marbles[m.id].pos));
    if (newHome && !before.players[mover].isHuman && Math.random() < 0.3) comment(mover, "home");
    if (after.phase === "gameOver" && after.winner !== null) {
      for (const p of [0, 1, 2, 3]) if (speaks(p)) comment(p, teamOf(p) === after.winner ? "win" : "lose");
    }
  };

  const playSounds = (before: GameState, move: Move, after: GameState) => {
    const card = before.players[move.handOwner].hand.find((c) => c.id === move.cardId);
    sfx.card();
    if (card?.value === "tac" && move.kind !== "discard") sfx.tac();
    const dur = animDuration(move) - (move.captured.length ? 450 : 0);
    if (move.kind === "swap") sfx.swap();
    else if (move.anims.length) {
      sfx.steps(Math.max(...move.anims.map((a) => a.path.length)), STEP_MS);
      sfx.land(dur);
    }
    if (move.captured.length) sfx.capture(dur);
    if (move.board.some((m) => isHome(m.pos) && !isHome(before.marbles[m.id].pos))) sfx.home(dur + 50);
    if (after.phase === "gameOver") setTimeout(() => (after.winner !== null && teamOf(me()) === after.winner ? sfx.win() : sfx.lose()), dur + 300);
  };

  const commit = (move: Move) => {
    const before = get().game;
    if (!before) return;
    const after = applyMove(before, move);
    blindPick = null;
    playSounds(before, move, after);
    react(before, move, after);
    // Meldungen der Bots nach neuem Geben
    if (after.dealNumber !== before.dealNumber) announce(after);
    set({
      game: after,
      anim: { key: ++animKey, from: move.baseBoard ?? before.marbles, anims: move.anims, captured: move.captured },
      selectedCardId: null,
      selectedMarble: null,
      seven: null,
    });
    schedule(animDuration(move));
  };

  /** Melden nach dem Geben – als Daumen-Emote über den Figuren mit Charakter. */
  const announce = (g: GameState) => {
    for (const p of [1, 2, 3]) if (g.players[p].persona && !get().mySeats.includes(p)) setTimeout(() => addEmote(p, g.announcements[p] ? "👍" : "👎"), 300 + p * 250);
  };

  const botSwaps = () => {
    let g = get().game;
    if (!g || g.phase !== "swap") return;
    for (const p of bots(g)) if (!g.swapSelections[p]) g = selectSwap(g, p, chooseSwapCard(g, p, g.players[p].difficulty, styleOf(g.players[p].persona)));
    set({ game: g });
  };

  const schedule = (afterMs = 0) => {
    if (botTimer) clearTimeout(botTimer);
    const g = get().game;
    if (!g || get().role === "guest") return;
    if (g.phase === "swap") {
      botSwaps();
      return;
    }
    if (g.phase !== "play") return;
    const d = decider(g);
    if (g.players[d].isHuman) {
      set({ thinking: false });
      if (get().mySeats.includes(d)) botTimer = setTimeout(() => sfx.turn(), afterMs);
      return;
    }
    set({ thinking: true });
    const speed = get().settings.speed || 1;
    botTimer = setTimeout(() => {
      const cur = get().game;
      if (!cur || cur !== g) return;
      const mv = chooseMove(cur, cur.players[d].difficulty, styleOf(cur.players[d].persona));
      if (mv) commit(mv);
    }, afterMs + 650 / speed);
  };

  /** Eigene Wahl beim Tauschen ausführen (lokal oder beim Gastgeber). */
  const doSwap = (seat: number, cardId: string) => {
    const g = get().game;
    if (!g || g.phase !== "swap" || g.swapSelections[seat] !== null) return;
    if (!g.players[seat].hand.some((c) => c.id === cardId)) return;
    const after = selectSwap(g, seat, cardId);
    set({ game: after, selectedCardId: null });
    if (after.phase === "play" && speaks(partnerOf(seat)) && !get().mySeats.includes(partnerOf(seat))) addChat(partnerOf(seat), tr(currentLang(), "chat.thanks"));
    schedule(300);
  };

  return {
    settings: { playerName: "Du", difficulty: "medium", master: false, speed: 1, bots: DEFAULT_BOTS, mode: "classic" },
    sound: true,
    game: null,
    anim: null,
    selectedCardId: null,
    selectedMarble: null,
    seven: null,
    chat: [],
    showRules: false,
    thinking: false,
    moods: idleMoods(),
    emotes: [],
    fx: null,
    drawerOpen: false,
    gameId: null,
    mySeats: [0],
    role: "local",
    net: null,

    start: (settings, opts = {}) => {
      sfx.card();
      const game = newGame(settings);
      const gameId = newGameId();
      // Im Orakel-Modus steuert dieses Gerät auch den Partner
      const mySeats = opts.mySeats ?? (settings.mode === "oracle" ? [0, 2] : [0]);
      chatId = 0;
      blindPick = null;
      set({
        settings,
        game,
        gameId,
        mySeats,
        role: opts.role ?? "local",
        net: opts.net ?? null,
        anim: null,
        selectedCardId: null,
        selectedMarble: null,
        seven: null,
        chat: [],
        emotes: [],
        moods: idleMoods(),
        fx: null,
      });
      // Begrüßung im Tonfall der Charaktere: erst der Partner, dann die Gegner
      const lang = currentLang();
      [partnerOf(mySeats[0]), (mySeats[0] + 1) % 4, (mySeats[0] + 3) % 4].forEach((p, i) => {
        const persona = personaById(game.players[p].persona);
        if (!persona) return;
        const greet = persona[lang].lines.greet;
        const text = greet ? pick(greet) : tr(lang, "chat.hello", { name: playerName(game.players[mySeats[0]], lang) });
        setTimeout(() => addChat(p, text), 400 + i * 1100);
      });
      announce(game);
      schedule();
      return gameId;
    },

    resume: (id, opts = {}) => {
      const save = readSave(id);
      if (!save) return false;
      blindPick = null;
      if (botTimer) clearTimeout(botTimer);
      chatId = save.chat.reduce((n, c) => Math.max(n, c.id + 1), 0);
      set({
        settings: save.settings,
        game: save.game,
        gameId: id,
        mySeats: save.mySeats ?? (save.game.mode === "oracle" ? [0, 2] : [0]),
        role: opts.role ?? "local",
        net: opts.net ?? null,
        chat: save.chat,
        anim: null,
        selectedCardId: null,
        selectedMarble: null,
        seven: null,
        emotes: [],
        moods: idleMoods(),
        fx: null,
        thinking: false,
      });
      schedule(500);
      return true;
    },

    receiveState: (game, chat, mySeats, net) => {
      const prev = get().game;
      const move = game.lastMove;
      const fresh = prev && move && game.moveCounter > prev.moveCounter;
      if (fresh) {
        playSounds(prev, move, game);
        celebrate(prev, move, game, Math.max(0, animDuration(move) - (move.captured.length ? 450 : 0)), false);
      }
      const d = game.phase === "play" ? decider(game) : -1;
      if (d >= 0 && mySeats.includes(d) && (!prev || decider(prev) !== d || fresh)) setTimeout(() => sfx.turn(), fresh ? animDuration(move) : 0);
      set({
        game,
        chat,
        mySeats,
        net,
        role: "guest",
        gameId: null,
        thinking: d >= 0 && !game.players[d].isHuman,
        ...(fresh ? { anim: { key: ++animKey, from: move.baseBoard ?? prev.marbles, anims: move.anims, captured: move.captured }, selectedCardId: null, selectedMarble: null, seven: null } : {}),
        ...(prev?.phase === "swap" && game.phase !== "swap" ? { selectedCardId: null } : {}),
      });
    },

    hostAction: (a) => {
      const g = get().game;
      if (!g || get().role !== "host" || !g.players[a.seat]?.isHuman) return;
      if (a.type === "chat") {
        addChat(a.seat, a.text.slice(0, 200));
        return;
      }
      if (a.type === "swap") {
        doSwap(a.seat, a.cardId);
        return;
      }
      if (g.phase !== "play" || decider(g) !== a.seat) return;
      const mv = legalMoves(g).find((m) => m.cardId === a.cardId && m.kind === a.kind && boardKey(m.board) === a.key);
      if (mv) commit(mv);
    },

    remoteEmote: (player, emoji) => showEmote(player, emoji),

    // Der Spielstand bleibt gespeichert – über „Weiterspielen“ geht es später weiter.
    quit: () => {
      if (botTimer) clearTimeout(botTimer);
      set({ game: null, gameId: null, anim: null, seven: null, selectedCardId: null, thinking: false, net: null, role: "local", mySeats: [0] });
    },

    selectCard: (id) => {
      const g = get().game;
      if (!g) return;
      // Eine blind gezogene Karte lässt sich nicht mehr gegen eine andere tauschen
      if (blindPick && id !== blindPick && g.players[activeHandOwner(g)].hand.some((c) => c.id === blindPick)) return;
      if (id !== null && id === blindPick && id === get().selectedCardId) return;
      if (id === null || id === get().selectedCardId) {
        set({ selectedCardId: null, selectedMarble: null, seven: null });
        return;
      }
      let seven: SevenBuilder | null = null;
      // Orakel: eine verdeckte Karte wird beim Ziehen aufgedeckt – ist sie nicht spielbar, verfällt sie
      if (g.phase === "play" && hiddenCards(g).has(id)) {
        const revealed = { ...g, oracleKnown: [...(g.oracleKnown ?? []), id] };
        blindPick = id;
        const moves = blindMoves(revealed, id);
        set({ game: revealed });
        if (moves.length && moves.every((m) => m.kind === "discard")) {
          sfx.card();
          set({ selectedCardId: id, selectedMarble: null, seven: null });
          setTimeout(() => {
            if (get().game === revealed) commit(moves[0]);
          }, 1400);
          return;
        }
        return get().selectCard(id);
      }
      if (g.phase === "play") {
        const owner = g.subTurn?.type === "devil" ? g.subTurn.target : g.current;
        const card = g.players[owner].hand.find((c) => c.id === id);
        const moves = legalMoves(g).filter((m) => m.cardId === id && m.kind === "seven");
        if (card && moves.length) {
          const base = card.value === "tac" ? tacBase(g)!.board : g.marbles;
          seven = { cardId: id, board: base, remaining: 7, segments: [], locked: [...lockedSet(base)] };
        }
      }
      sfx.card();
      haptics.tap();
      set({ selectedCardId: id, selectedMarble: null, seven });
    },

    selectMarble: (id) => {
      if (id !== null && id !== get().selectedMarble) haptics.select();
      set({ selectedMarble: id });
    },

    playMove: (move) => {
      haptics.drop();
      const { role, net, game } = get();
      if (role === "guest" && net && game) {
        // Der Gastgeber prüft und führt den Zug aus; sein neuer Stand kommt zurück
        net.send("action", { type: "move", seat: decider(game), cardId: move.cardId, kind: move.kind, key: boardKey(move.board) });
        set({ selectedCardId: null, selectedMarble: null, seven: null });
        return;
      }
      commit(move);
    },

    sevenStep: (seg) => {
      const { seven, game } = get();
      if (!seven || !game) return;
      const next: SevenBuilder = {
        ...seven,
        board: seg.board,
        remaining: seven.remaining - seg.steps,
        segments: [...seven.segments, { marbleId: seg.marbleId, path: seg.path }],
      };
      const captured = seg.board.filter((m) => m.pos === BASE && seven.board[m.id].pos !== BASE).map((m) => m.id);
      sfx.steps(seg.steps, STEP_MS);
      sfx.land(seg.steps * STEP_MS);
      if (captured.length) sfx.capture(seg.steps * STEP_MS);
      set({
        seven: next,
        selectedMarble: null,
        anim: { key: ++animKey, from: seven.board, anims: [{ marbleId: seg.marbleId, path: seg.path }], captured },
      });
      if (next.remaining === 0) {
        const key = boardKey(next.board);
        const mv = legalMoves(game).find((m) => m.cardId === seven.cardId && m.kind === "seven" && boardKey(m.board) === key);
        if (!mv) return;
        const { role, net } = get();
        if (role === "guest" && net) {
          setTimeout(() => {
            net.send("action", { type: "move", seat: decider(game), cardId: mv.cardId, kind: mv.kind, key });
          }, seg.steps * STEP_MS + 120);
          return;
        }
        // Schon animiert – Endstellung ohne erneute Animation übernehmen.
        setTimeout(() => {
          const after = applyMove(game, mv);
          blindPick = null;
          sfx.card();
          react(game, mv, after);
          set({ game: after, seven: null, selectedCardId: null, selectedMarble: null });
          schedule(150);
        }, seg.steps * STEP_MS + 120);
      }
    },

    resetSeven: () => {
      const { seven, game } = get();
      if (!seven || !game) return;
      const card = game.players[game.subTurn?.type === "devil" ? game.subTurn.target : game.current].hand.find((c) => c.id === seven.cardId);
      const base = card?.value === "tac" ? tacBase(game)!.board : game.marbles;
      set({
        seven: { ...seven, board: base, remaining: 7, segments: [] },
        selectedMarble: null,
        anim: { key: ++animKey, from: seven.board, anims: [], captured: [] },
      });
    },

    chooseSwap: (cardId) => {
      const { game: g, mySeats, role, net } = get();
      if (!g || g.phase !== "swap") return;
      const seat = swapSeat(g, mySeats);
      if (seat === null) return;
      sfx.card();
      haptics.drop();
      if (role === "guest" && net) {
        net.send("action", { type: "swap", seat, cardId });
        // Sofort als gewählt markieren, bis der Stand des Gastgebers kommt
        const swapSelections = [...g.swapSelections];
        swapSelections[seat] = cardId;
        set({ game: { ...g, swapSelections }, selectedCardId: null });
        return;
      }
      doSwap(seat, cardId);
    },

    say: (text) => {
      const { role, net, game } = get();
      const seat = me();
      if (role === "guest" && net) {
        net.send("action", { type: "chat", seat, text });
        return;
      }
      addChat(seat, text);
      const partner = partnerOf(seat);
      if (game && speaks(partner) && !get().mySeats.includes(partner)) setTimeout(() => addChat(partner, pick(LISTS[currentLang()].replies)), 900);
    },

    toggleSound: () => {
      const on = !get().sound;
      setSoundEnabled(on);
      set({ sound: on });
    },

    setShowRules: (v) => set({ showRules: v }),

    emote: (emoji) => {
      haptics.tap();
      const seat = me();
      addEmote(seat, emoji);
      const g = get().game;
      if (g && get().role !== "guest" && Math.random() < 0.45) {
        const answer: Record<string, string[]> = { "😂": ["😂", "😎"], "😡": ["😂", "🙏"], "😭": ["🙏", "😂"], "👍": ["👍"], "🔥": ["🔥", "😎"] };
        const others = [0, 1, 2, 3].filter((p) => speaks(p) && !get().mySeats.includes(p));
        if (others.length) setTimeout(() => addEmote(pick(others), pick(answer[emoji] ?? ["👍", "🤔"])), 900 + Math.random() * 800);
      }
    },

    setDrawerOpen: (v) => set({ drawerOpen: v }),
  };
});

// Spielstand automatisch speichern (nur im Browser): kurz nach jeder Änderung und beim Verlassen der Seite.
// Gäste speichern nicht – ihr Stand gehört dem Gastgeber.
if (typeof window !== "undefined") {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const save = () => {
    const { game, gameId, chat, settings, role, mySeats } = useGameStore.getState();
    if (role !== "guest") persist({ game, gameId, chat, settings, mySeats });
  };
  useGameStore.subscribe((s, prev) => {
    if (s.game === prev.game && s.chat === prev.chat && s.settings === prev.settings) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(save, 250);
  });
  window.addEventListener("pagehide", save);
}
