"use client";

import { useCallback } from "react";
import { create } from "zustand";
import type { GameState, Player } from "@/types/game";
import { tr, say, cardName, type Key, type Lang, type Phrase } from "./i18n";
import { personaById } from "./personas";

const LANG_KEY = "tac:lang";

interface LangStore {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export const useLang = create<LangStore>()((set) => ({
  // Server und erster Render immer Deutsch – die gespeicherte Sprache wird nach dem Laden gesetzt (siehe initLang)
  lang: "de",
  setLang: (lang) => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ohne Speicher gilt die Wahl nur für diese Sitzung */
    }
    if (typeof document !== "undefined") document.documentElement.lang = lang;
    set({ lang });
  },
}));

/** Gespeicherte Sprache laden – beim ersten Besuch die Sprache des Geräts. */
export function initLang() {
  let lang: Lang = "de";
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "de" || saved === "en") lang = saved;
    else lang = navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
  } catch {
    /* Standard bleibt Deutsch */
  }
  document.documentElement.lang = lang;
  useLang.setState({ lang });
}

export const currentLang = () => useLang.getState().lang;

/** Anzeigename eines Spielers in der gewählten Sprache (Bot-Charaktere haben übersetzte Namen). */
export function playerName(p: Player, lang: Lang): string {
  const persona = personaById(p.persona);
  if (persona) return persona[lang].name;
  return !p.name || p.name === "Du" ? tr(lang, "you") : p.name;
}

export function useT() {
  const lang = useLang((s) => s.lang);
  const t = useCallback((key: Key, params?: Record<string, string | number>) => tr(lang, key, params), [lang]);
  return { lang, t };
}

/** Übersetzer für Texte aus einer laufenden Partie (Namen, Engine-Bausteine, Karten). */
export function useGameText(game: GameState | null) {
  const { lang, t } = useT();
  const names = game ? game.players.map((p) => playerName(p, lang)) : [];
  // Im Spielverlauf steht statt „Du“ die Farbe – sonst passt das Verb nicht („Du gibt“, „You discards“)
  const logNames = game ? game.players.map((p, i) => (!p.persona && (!p.name || p.name === "Du") ? tr(lang, `color.${i}` as Key) : names[i])) : [];
  return {
    lang,
    t,
    names,
    name: (seat: number) => names[seat] ?? "?",
    p: (phrase: Phrase) => say(phrase, lang, names),
    pLog: (phrase: Phrase) => say(phrase, lang, logNames),
    card: (v: Parameters<typeof cardName>[1]) => cardName(lang, v),
  };
}
