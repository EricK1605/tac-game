"use client";

import { create } from "zustand";
import type { ChatMessage, GameSettings, GameState, Marble, MarbleAnim, Move } from "@/types/game";
import { applyMove, newGame, selectSwap } from "@/lib/engine/game";
import { decider, legalMoves, tacBase, type SevenSegment } from "@/lib/engine/moves";
import { boardKey, lockedSet } from "@/lib/engine/board";
import { BASE, isHome, partnerOf, teamOf } from "@/lib/engine/constants";
import { botComment, chooseMove, chooseSwapCard } from "@/lib/ai/botEngine";
import { setSoundEnabled, sfx } from "@/lib/audio";
import { haptics } from "@/lib/haptics";
import type { Mood } from "@/components/Character";

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

  start: (settings: GameSettings) => void;
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
  emote: (emoji: string, player?: number) => void;
  setDrawerOpen: (v: boolean) => void;
}

let botTimer: ReturnType<typeof setTimeout> | null = null;
let chatId = 0;
let animKey = 0;
let fxId = 0;
const idleMoods = () => [0, 1, 2, 3].map(() => ({ mood: "idle" as Mood, until: 0 }));
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function animDuration(move: Move | null): number {
  if (!move) return 0;
  const longest = Math.max(0, ...move.anims.map((a) => a.path.length));
  return longest * STEP_MS + (move.captured.length ? 450 : 0);
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

  const addEmote = (player: number, emoji: string) =>
    set((s) => ({ emotes: [...s.emotes.slice(-20), { id: chatId++, player, emoji, time: Date.now() }] }));

  /** Figuren reagieren: Jubel beim Kick, Trauer beim Rauswurf, Effekte für Haus/TAC/Sieg. */
  const celebrate = (before: GameState, move: Move, after: GameState, delayMs: number) => {
    const mover = before.subTurn ? before.subTurn.actor : before.current;
    const victims = [...new Set(move.captured.map((id) => before.marbles[id].color))];
    const enemyVictims = victims.filter((c) => teamOf(c) !== teamOf(mover));
    const card = before.players[move.handOwner].hand.find((c) => c.id === move.cardId);
    const newHome = move.board.some((m) => isHome(m.pos) && !isHome(before.marbles[m.id].pos));
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
          if (mover !== 0 && Math.random() < 0.55) addEmote(mover, pick(["😎", "😂", "🔥"]));
          for (const v of enemyVictims) if (v !== 0 && Math.random() < 0.5) setTimeout(() => addEmote(v, pick(["😭", "😡", "😱"])), 700);
          if (teamOf(mover) === 0 && mover === 0 && Math.random() < 0.6) setTimeout(() => addEmote(partnerOf(0), pick(["👏", "🔥", "👍"])), 900);
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
    celebrate(before, move, after, Math.max(0, animDuration(move) - (move.captured.length ? 450 : 0)));
    const capturedOwners = [...new Set(move.captured.map((id) => before.marbles[id].color))];
    for (const owner of capturedOwners) {
      if (owner !== 0 && owner !== mover && Math.random() < 0.6) addChat(owner, botComment("gotCaptured"));
    }
    const enemyHit = capturedOwners.some((c) => teamOf(c) !== teamOf(mover));
    if (enemyHit) {
      if (mover !== 0 && Math.random() < 0.5) addChat(mover, botComment("capturedEnemy"));
      if (mover === 0 && Math.random() < 0.75) addChat(partnerOf(0), botComment("partnerGood"));
    }
    const card = before.players[move.handOwner].hand.find((c) => c.id === move.cardId);
    if (card?.value === "tac" && mover !== 0 && move.kind !== "discard" && Math.random() < 0.7) addChat(mover, botComment("tac"));
    const newHome = move.board.some((m) => isHome(m.pos) && !isHome(before.marbles[m.id].pos));
    if (newHome && mover !== 0 && Math.random() < 0.3) addChat(mover, botComment("home"));
    if (after.phase === "gameOver" && after.winner !== null) {
      addChat(1, botComment(after.winner === 1 ? "win" : "lose"));
      addChat(2, botComment(after.winner === 0 ? "win" : "lose"));
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
    if (after.phase === "gameOver") setTimeout(() => (after.winner === 0 ? sfx.win() : sfx.lose()), dur + 300);
  };

  const commit = (move: Move) => {
    const before = get().game;
    if (!before) return;
    const after = applyMove(before, move);
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

  /** Melden nach dem Geben – als Daumen-Emote über den Figuren. */
  const announce = (g: GameState) => {
    for (const p of [1, 2, 3]) setTimeout(() => addEmote(p, g.announcements[p] ? "👍" : "👎"), 300 + p * 250);
  };

  const botSwaps = () => {
    let g = get().game;
    if (!g || g.phase !== "swap") return;
    for (const p of [1, 2, 3]) if (!g.swapSelections[p]) g = selectSwap(g, p, chooseSwapCard(g, p, g.players[p].difficulty));
    set({ game: g });
  };

  const schedule = (afterMs = 0) => {
    if (botTimer) clearTimeout(botTimer);
    const g = get().game;
    if (!g) return;
    if (g.phase === "swap") {
      botSwaps();
      return;
    }
    if (g.phase !== "play") return;
    const d = decider(g);
    if (g.players[d].isHuman) {
      set({ thinking: false });
      botTimer = setTimeout(() => sfx.turn(), afterMs);
      return;
    }
    set({ thinking: true });
    const speed = get().settings.speed || 1;
    botTimer = setTimeout(() => {
      const cur = get().game;
      if (!cur || cur !== g) return;
      const mv = chooseMove(cur, cur.players[d].difficulty);
      if (mv) commit(mv);
    }, afterMs + 650 / speed);
  };

  return {
    settings: { playerName: "Du", difficulty: "medium", master: false, speed: 1 },
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

    start: (settings) => {
      sfx.card();
      const game = newGame(settings);
      chatId = 0;
      set({ settings, game, anim: null, selectedCardId: null, selectedMarble: null, seven: null, chat: [], emotes: [], moods: idleMoods(), fx: null });
      addChat(2, `Hallo ${game.players[0].name}! Auf gute Zusammenarbeit 🤝`);
      announce(game);
      schedule();
    },

    quit: () => {
      if (botTimer) clearTimeout(botTimer);
      set({ game: null, anim: null, seven: null, selectedCardId: null });
    },

    selectCard: (id) => {
      const g = get().game;
      if (!g) return;
      if (id === null || id === get().selectedCardId) {
        set({ selectedCardId: null, selectedMarble: null, seven: null });
        return;
      }
      let seven: SevenBuilder | null = null;
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
        if (mv) {
          // Schon animiert – Endstellung ohne erneute Animation übernehmen.
          setTimeout(() => {
            const after = applyMove(game, mv);
            sfx.card();
            react(game, mv, after);
            set({ game: after, seven: null, selectedCardId: null, selectedMarble: null });
            schedule(150);
          }, seg.steps * STEP_MS + 120);
        }
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
      const g = get().game;
      if (!g || g.phase !== "swap") return;
      sfx.card();
      haptics.drop();
      const after = selectSwap(g, 0, cardId);
      set({ game: after, selectedCardId: null });
      if (after.phase === "play") addChat(2, "Danke für die Karte! 🙏");
      schedule(300);
    },

    say: (text) => {
      addChat(0, text);
      const replies = ["Verstanden! 😉", "Mach ich!", "👍", "Ich versuch's!", "Bin dabei."];
      setTimeout(() => addChat(2, replies[Math.floor(Math.random() * replies.length)]), 900);
    },

    toggleSound: () => {
      const on = !get().sound;
      setSoundEnabled(on);
      set({ sound: on });
    },

    setShowRules: (v) => set({ showRules: v }),

    emote: (emoji, player = 0) => {
      haptics.tap();
      addEmote(player, emoji);
      if (player === 0 && Math.random() < 0.45) {
        const answer: Record<string, string[]> = { "😂": ["😂", "😎"], "😡": ["😂", "🙏"], "😭": ["🙏", "😂"], "👍": ["👍"], "🔥": ["🔥", "😎"] };
        const bot = pick([1, 2, 3]);
        setTimeout(() => addEmote(bot, pick(answer[emoji] ?? ["👍", "🤔"])), 900 + Math.random() * 800);
      }
    },

    setDrawerOpen: (v) => set({ drawerOpen: v }),
  };
});
