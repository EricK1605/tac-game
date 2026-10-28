// Nachrichten und Raum-Zustand des Freunde-Modus.
// Der Gastgeber (Ersteller des Raums) ist die einzige Quelle der Wahrheit: Er führt das Spiel und die Bots
// und schickt nach jeder Änderung den Stand an alle. Gäste schicken nur ihre eigenen Aktionen.
import type { ChatMessage, Difficulty, GameState } from "@/types/game";

export type SeatState = { kind: "open" } | { kind: "bot"; persona: string } | { kind: "human"; clientId: string; name: string };

export interface RoomState {
  hostId: string;
  seats: SeatState[];
  difficulty: Difficulty;
  master: boolean;
  started: boolean;
  /** Spielstand-Token beim Gastgeber (zum Fortsetzen nach dem Neuladen) */
  gameId?: string | null;
}

export interface StatePayload {
  game: GameState;
  chat: ChatMessage[];
}

/** Eindeutige Kennung dieses Tabs – bleibt beim Neuladen erhalten, damit man seinen Platz behält. */
export function clientId(): string {
  try {
    let id = sessionStorage.getItem("tac:client");
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem("tac:client", id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

const hostKey = (code: string) => `tac:host:${code}`;

/** Merkt sich in diesem Tab, dass er den Raum erstellt hat. */
export function markHost(code: string, room: RoomState | null) {
  try {
    sessionStorage.setItem(hostKey(code), JSON.stringify(room ?? {}));
  } catch {
    /* ohne Speicher kein Fortsetzen nach dem Neuladen */
  }
}

export function hostedRoom(code: string): RoomState | null | undefined {
  try {
    const raw = sessionStorage.getItem(hostKey(code));
    if (raw === null) return undefined;
    const r = JSON.parse(raw) as Partial<RoomState>;
    return r.seats ? (r as RoomState) : null;
  } catch {
    return undefined;
  }
}

/**
 * Spielstand für die Übertragung verkleinern: Gäste brauchen nur die letzten Züge (für TAC),
 * die jüngsten Verlaufseinträge und keine Reihenfolge des Stapels.
 */
export function trimForWire(game: GameState): GameState {
  return {
    ...game,
    deck: [],
    history: game.history.slice(-8),
    log: game.log.slice(-60),
    discardPile: game.discardPile.slice(-6),
  };
}
