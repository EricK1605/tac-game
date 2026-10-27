"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Brain, Crown, Gauge, Play, Sparkles, Swords } from "lucide-react";
import type { Difficulty } from "@/types/game";
import { useGameStore } from "@/store/gameStore";
import { PLAYER_COLORS } from "@/lib/engine/constants";
import { DEFAULT_BOTS, personaById } from "@/lib/personas";
import { CardFace } from "./CardView";
import { CharacterPicker } from "./CharacterPicker";

const LEVELS: { id: Difficulty; title: string; text: string; icon: React.ReactNode }[] = [
  { id: "easy", title: "Leicht", text: "Die Bots ziehen zufällig – ideal zum Lernen.", icon: <Sparkles className="h-5 w-5" /> },
  { id: "medium", title: "Mittel", text: "Schmeißen, eröffnen, ins Haus ziehen – gierig, aber solide.", icon: <Swords className="h-5 w-5" /> },
  {
    id: "hard",
    title: "Schwer",
    text: "Meidet Gefahrenzonen, schützt den Partner und plant Kartenkombinationen.",
    icon: <Brain className="h-5 w-5" />,
  },
];

export function SetupScreen() {
  const start = useGameStore((s) => s.start);
  const saved = useGameStore((s) => s.settings);
  const setShowRules = useGameStore((s) => s.setShowRules);
  const [name, setName] = useState(saved.playerName === "Du" ? "" : saved.playerName);
  const [difficulty, setDifficulty] = useState<Difficulty>(saved.difficulty);
  const [master, setMaster] = useState(saved.master);
  const [speed, setSpeed] = useState(saved.speed);
  const [bots, setBots] = useState<string[]>(saved.bots ?? DEFAULT_BOTS);
  const names = bots.map((b) => personaById(b)!.name);

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl rounded-[2rem] border border-amber-200/20 bg-[#1c120b]/85 p-6 shadow-2xl backdrop-blur sm:p-10"
      >
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex items-end gap-2">
            {(["tac", 7, 4, "trickser"] as const).map((v, i) => (
              <motion.div key={i} initial={{ y: 40, rotate: 0, opacity: 0 }} animate={{ y: 0, rotate: (i - 1.5) * 9, opacity: 1 }} transition={{ delay: 0.1 * i, type: "spring" }}>
                <CardFace value={v} size="sm" />
              </motion.div>
            ))}
          </div>
          <motion.h1
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.25 }}
            className="font-display text-stroke-lg text-7xl text-amber-200 drop-shadow-[0_6px_0_rgba(0,0,0,0.35)]"
          >
            T<span className="text-red-500">A</span>C
          </motion.h1>
          <p className="max-w-md text-amber-100/70">Das taktische Karten- und Brettspiel für zwei Teams. Bring mit deinem Partner alle acht Kugeln nach Hause!</p>
          <div className="flex gap-2">
            {PLAYER_COLORS.map((c, i) => (
              <span key={i} className="h-5 w-5 rounded-full shadow-inner" style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${c.light} 20%, ${c.hex} 55%, ${c.dark})` }} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-amber-100/80">Dein Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={14}
              placeholder="Du"
              className="w-full rounded-xl bg-black/30 px-4 py-3 text-amber-50 ring-1 ring-amber-200/20 placeholder:text-amber-100/30 focus:outline-none focus:ring-2 focus:ring-amber-300/60"
            />
          </label>

          <CharacterPicker bots={bots} onChange={setBots} />

          <div>
            <span className="mb-1.5 block text-sm font-semibold text-amber-100/80">Schwierigkeit der Bots</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setDifficulty(l.id)}
                  className={`rounded-2xl p-4 text-left ring-1 transition ${
                    difficulty === l.id ? "bg-amber-300/20 ring-2 ring-amber-300" : "bg-black/20 ring-amber-200/15 hover:bg-black/30"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-amber-50">
                    {l.icon}
                    {l.title}
                  </div>
                  <p className="mt-1 text-xs text-amber-100/60">{l.text}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setMaster(!master)}
              className={`flex items-center gap-3 rounded-2xl p-4 text-left ring-1 transition ${master ? "bg-purple-500/20 ring-2 ring-purple-300" : "bg-black/20 ring-amber-200/15 hover:bg-black/30"}`}
            >
              <Crown className={`h-6 w-6 shrink-0 ${master ? "text-purple-200" : "text-amber-100/50"}`} />
              <div>
                <div className="font-bold text-amber-50">Meisterversion {master ? "an" : "aus"}</div>
                <p className="text-xs text-amber-100/60">Mit Engel, Teufel, Krieger &amp; Narr (104 Karten)</p>
              </div>
            </button>
            <label className="flex items-center gap-3 rounded-2xl bg-black/20 p-4 ring-1 ring-amber-200/15">
              <Gauge className="h-6 w-6 shrink-0 text-amber-100/50" />
              <div className="flex-1">
                <div className="flex justify-between font-bold text-amber-50">
                  Bot-Tempo <span className="text-sm text-amber-200">{speed < 0.8 ? "gemütlich" : speed > 1.4 ? "schnell" : "normal"}</span>
                </div>
                <input type="range" min={0.5} max={2} step={0.25} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="mt-1 w-full accent-amber-400" />
              </div>
            </label>
          </div>

          {/* Auf dem Handy klebt der Start-Knopf unten, damit man nicht scrollen muss */}
          <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 -mx-2 flex flex-col gap-3 rounded-2xl bg-[#1c120b]/90 p-2 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:bg-transparent sm:p-0 sm:pt-2 sm:backdrop-blur-none">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => start({ playerName: name.trim() || "Du", difficulty, master, speed, bots })}
              className="chunky-btn chunky-green flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-xl"
            >
              <Play className="h-5 w-5" /> Spiel starten
            </motion.button>
            <button
              onClick={() => setShowRules(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-black/30 px-6 py-4 font-semibold text-amber-100 ring-1 ring-amber-200/20 hover:bg-black/40"
            >
              <BookOpen className="h-5 w-5" /> Wie spiele ich TAC?
            </button>
          </div>
          <p className="text-center text-xs text-amber-100/40">Du spielst Rot – zusammen mit {names[1]} (Grün) gegen {names[0]} (Blau) &amp; {names[2]} (Gelb).</p>
        </div>
      </motion.div>
    </div>
  );
}
