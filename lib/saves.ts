// Spielstände im localStorage – jede Partie hat ein eigenes Token (URL /spiel/<token>).
import type { ChatMessage, GameSettings, GameState } from "@/types/game";

const SAVE_PREFIX = "tac:save:";
const LAST_KEY = "tac:last";
const SETTINGS_KEY = "tac:settings";
const MAX_SAVES = 5;

export interface SaveFile {
  v: 1;
  id: string;
  settings: GameSettings;
  game: GameState;
  chat: ChatMessage[];
  savedAt: number;
}

export function newGameId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("") + Date.now().toString(36).slice(-4);
}

/** localStorage kann fehlen oder werfen (privater Modus, volle Quote) – dann eben ohne Speichern. */
function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readSave(id: string): SaveFile | null {
  try {
    const raw = storage()?.getItem(SAVE_PREFIX + id);
    if (!raw) return null;
    const save = JSON.parse(raw) as SaveFile;
    return save.v === 1 && save.game?.players?.length === 4 ? save : null;
  } catch {
    return null;
  }
}

/** Zuletzt gespielte, noch nicht beendete Partie (für „Weiterspielen“). */
export function lastOpenSave(): SaveFile | null {
  try {
    const id = storage()?.getItem(LAST_KEY);
    const save = id ? readSave(id) : null;
    return save && save.game.phase !== "gameOver" ? save : null;
  } catch {
    return null;
  }
}

export function readSettings(): GameSettings | null {
  try {
    const raw = storage()?.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as GameSettings) : null;
  } catch {
    return null;
  }
}

export function persist({ game, gameId, chat, settings }: { game: GameState | null; gameId: string | null; chat: ChatMessage[]; settings: GameSettings }) {
  const st = storage();
  if (!st) return;
  try {
    // Ohne laufendes Spiel nichts schreiben – sonst überschreiben Standardwerte beim Neuladen die gespeicherten Einstellungen
    if (!game || !gameId) return;
    st.setItem(SETTINGS_KEY, JSON.stringify(settings));
    const save: SaveFile = { v: 1, id: gameId, settings, game, chat: chat.slice(-40), savedAt: Date.now() };
    st.setItem(SAVE_PREFIX + gameId, JSON.stringify(save));
    st.setItem(LAST_KEY, gameId);
    prune(st, gameId);
  } catch {
    /* Quote voll o. Ä. – Spiel läuft trotzdem weiter */
  }
}

/** Nur die neuesten Spielstände behalten. */
function prune(st: Storage, keep: string) {
  const saves: { key: string; at: number }[] = [];
  for (let i = 0; i < st.length; i++) {
    const key = st.key(i);
    if (!key?.startsWith(SAVE_PREFIX) || key === SAVE_PREFIX + keep) continue;
    try {
      saves.push({ key, at: (JSON.parse(st.getItem(key)!) as SaveFile).savedAt ?? 0 });
    } catch {
      saves.push({ key, at: 0 });
    }
  }
  saves.sort((a, b) => b.at - a.at);
  for (const s of saves.slice(MAX_SAVES - 1)) st.removeItem(s.key);
}
