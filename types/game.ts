// Zentrale Typen für TAC – angelehnt an die offizielle TACtik (TAC Verlag, 2024).

export type NumberValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 13;
export type SpecialValue = "trickser" | "tac";
export type MasterValue = "engel" | "teufel" | "krieger" | "narr";
export type CardValue = NumberValue | SpecialValue | MasterValue;

export interface Card {
  id: string;
  value: CardValue;
}

/**
 * Position einer Kugel:
 *  -1        = Vorfeld (Startbereich mit den 4 Kugeln)
 *  0 … 63    = Spielkreis (Startfeld von Farbe c ist c * 16)
 *  64 … 67   = Haus (Zielfelder 0 … 3 der eigenen Farbe)
 */
export interface Marble {
  id: number; // 0 … 15, id = farbe * 4 + i
  color: number; // 0 … 3 (= Spieler-Index)
  pos: number;
  /** Frisch aus dem Vorfeld aufs Startfeld gesetzt – darf noch nicht direkt ins Haus. */
  fresh: boolean;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  difficulty: Difficulty;
  hand: Card[];
}

export type MoveKind =
  | "enter" // Kugel vom Vorfeld aufs Startfeld (1, 13, Engel)
  | "steps" // normale Vorwärts-/Rückwärtszüge
  | "seven" // aufgeteilte 7
  | "swap" // Trickser
  | "skip" // 8: nächster Spieler setzt aus
  | "warrior" // Krieger
  | "devil" // Teufel – löst Teufels-Zug aus
  | "jester" // Narr – Karten nach rechts weitergeben
  | "void" // Karte verfällt (z. B. Teufel als letzte Karte)
  | "discard"; // Karte ungenutzt ablegen

export interface MarbleAnim {
  marbleId: number;
  path: number[]; // Folge von Positionen
}

export interface Move {
  id: string;
  kind: MoveKind;
  /** Gespielte Karte (bei TAC die TAC-Karte selbst). */
  cardId: string;
  /** Wirksame Kartenfunktion (bei TAC die übernommene Karte). */
  effect: CardValue | null;
  /** Spieler, aus dessen Hand die Karte stammt. */
  handOwner: number;
  /** Brett nach dem Zug. */
  board: Marble[];
  anims: MarbleAnim[];
  captured: number[];
  label: string;
  /** Für Klick-Steuerung: Hauptkugel und Zielposition. */
  marbleId?: number;
  target?: number;
  swap?: [number, number];
  /** TAC: Stellung nach dem Zurücknehmen (Ausgangspunkt der Animation). */
  baseBoard?: Marble[];
  /** TAC: der zurückgenommene Zug. */
  tacUndo?: { player: number; effect: CardValue | null };
}

export interface HistoryEntry {
  player: number;
  card: Card;
  effect: CardValue | null;
  boardBefore: Marble[];
  discarded: boolean;
  /** Narr/Teufel selbst – TAC greift auf den Zug davor bzw. danach zu. */
  transparent: boolean;
}

export type LogKind = "play" | "discard" | "system" | "tac" | "capture" | "deal";

export interface LogEntry {
  id: number;
  player: number | null;
  card?: CardValue;
  text: string;
  kind: LogKind;
}

export interface ChatMessage {
  id: number;
  player: number;
  text: string;
  time: number;
}

export type Phase = "swap" | "play" | "gameOver";

export type SubTurn =
  | null
  | { type: "devil"; actor: number; target: number }
  | { type: "jester"; actor: number };

export interface GameState {
  phase: Phase;
  players: Player[];
  marbles: Marble[];
  deck: Card[];
  discardPile: { card: Card; player: number }[];
  dealer: number;
  dealNumber: number;
  current: number;
  history: HistoryEntry[];
  /** Der aktuelle Spieler muss wegen einer 8 aussetzen. */
  skipPending: boolean;
  subTurn: SubTurn;
  swapSelections: (string | null)[];
  /** Ein Team hat gewonnen, der nächste Spieler darf (muss) noch per TAC kontern. */
  pendingWin: number | null;
  /** Nach einem Sieg-verhindernden TAC darf kein weiteres TAC folgen. */
  noTacThisTurn: boolean;
  winner: number | null;
  master: boolean;
  log: LogEntry[];
  logCounter: number;
  lastMove: Move | null;
  moveCounter: number;
  /** Meldung nach dem Geben: kann eröffnen? */
  announcements: (boolean | null)[];
}

export interface GameSettings {
  playerName: string;
  difficulty: Difficulty;
  master: boolean;
  speed: number; // 0.5 … 2 (Bot-Geschwindigkeit)
}
