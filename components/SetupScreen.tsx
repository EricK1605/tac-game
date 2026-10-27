"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Brain, Crown, Dices, Gauge, Play, RotateCcw, Sparkles, Swords } from "lucide-react";
import type { Difficulty } from "@/types/game";
import { useGameStore } from "@/store/gameStore";
import { PLAYER_COLORS } from "@/lib/engine/constants";
import { haptics } from "@/lib/haptics";
import { DEFAULT_BOTS, PERSONAS, lookOf, personaById } from "@/lib/personas";
import { lastOpenSave, readSettings, type SaveFile } from "@/lib/saves";
import { CardFace } from "./CardView";
import { Character } from "./Character";
import { OpponentPicker, PartnerPicker } from "./CharacterPicker";

const LEVELS: { id: Difficulty; title: string; text: string; icon: React.ReactNode }[] = [
  { id: "easy", title: "Leicht", text: "Ideal zum Lernen – die Bots spielen fast zufällig.", icon: <Sparkles className="h-5 w-5" /> },
  { id: "medium", title: "Mittel", text: "Schmeißen, eröffnen, ins Haus ziehen – solide Gegner.", icon: <Swords className="h-5 w-5" /> },
  { id: "hard", title: "Schwer", text: "Meidet Gefahren, schützt den Partner, plant voraus.", icon: <Brain className="h-5 w-5" /> },
];

/** Schritte des Assistenten nach dem Titelbildschirm. */
const STEPS = [
  { title: "Wie heißt du?", sub: "So nennen dich deine Mitspieler im Chat." },
  { title: "Wähle deinen Partner", sub: "Ihr spielt gemeinsam – Rot und Grün." },
  { title: "Wähle deine Gegner", sub: "Sie spielen Blau und Gelb." },
  { title: "Wie wollt ihr spielen?", sub: "Fast geschafft!" },
];

export function SetupScreen() {
  const router = useRouter();
  const start = useGameStore((s) => s.start);
  const setShowRules = useGameStore((s) => s.setShowRules);
  const defaults = useGameStore((s) => s.settings);

  // Schritt 0 = Titelbildschirm, 1–4 = Assistent
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>(defaults.difficulty);
  const [master, setMaster] = useState(defaults.master);
  const [speed, setSpeed] = useState(defaults.speed);
  const [bots, setBots] = useState<string[]>(defaults.bots ?? DEFAULT_BOTS);
  const [resumable, setResumable] = useState<SaveFile | null>(null);

  // Gespeicherte Einstellungen und offene Partie erst im Browser lesen (sonst Hydration-Unterschied)
  useEffect(() => {
    const s = readSettings();
    if (s) {
      setName(s.playerName === "Du" ? "" : s.playerName);
      setDifficulty(s.difficulty);
      setMaster(s.master);
      setSpeed(s.speed);
      if (s.bots?.length === 3 && s.bots.every((b) => personaById(b))) setBots(s.bots);
    }
    setResumable(lastOpenSave());
  }, []);

  const go = (to: number) => {
    haptics.tap();
    setDir(to > step ? 1 : -1);
    setStep(to);
  };
  const launch = () => {
    haptics.drop();
    const id = start({ playerName: name.trim() || "Du", difficulty, master, speed, bots });
    router.push(`/spiel/${id}`);
  };
  const shuffleBots = () => {
    haptics.tap();
    setBots(PERSONAS.map((p) => p.id).sort(() => Math.random() - 0.5).slice(0, 3));
  };

  return (
    <div className="flex min-h-dvh items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-xl">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {step === 0 ? (
              <TitleScreen
                resumable={resumable}
                onNew={() => go(1)}
                onResume={() => resumable && router.push(`/spiel/${resumable.id}`)}
                onRules={() => setShowRules(true)}
              />
            ) : (
              <Panel step={step}>
                {step === 1 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      go(2);
                    }}
                    className="flex flex-col items-center gap-4"
                  >
                    <Character look="ritter" color={0} size={96} mood={name ? "happy" : "idle"} />
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={14}
                      placeholder="Du"
                      enterKeyHint="next"
                      className="font-display w-full max-w-xs rounded-2xl bg-black/30 px-4 py-3 text-center text-2xl text-amber-50 ring-2 ring-amber-200/20 placeholder:text-amber-100/25 focus:outline-none focus:ring-amber-300/70"
                    />
                  </form>
                )}
                {step === 2 && <PartnerPicker bots={bots} onChange={setBots} />}
                {step === 3 && (
                  <>
                    <OpponentPicker bots={bots} onChange={setBots} />
                    <button onClick={shuffleBots} className="mx-auto mt-2 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-amber-200 hover:bg-white/5">
                      <Dices className="h-4 w-4" /> Alle zufällig wählen
                    </button>
                  </>
                )}
                {step === 4 && (
                  <Options
                    difficulty={difficulty}
                    setDifficulty={setDifficulty}
                    master={master}
                    setMaster={setMaster}
                    speed={speed}
                    setSpeed={setSpeed}
                    bots={bots}
                    name={name.trim() || "Du"}
                  />
                )}

                {/* Navigation – auf dem Handy unten angeheftet */}
                <div className="sticky bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-10 -mx-2 mt-5 flex gap-2 rounded-2xl bg-[#1c120b]/90 p-2 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                  <button onClick={() => go(step - 1)} className="chunky-btn chunky-dark flex items-center gap-1.5 rounded-2xl px-4 py-3" aria-label="Zurück">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  {step < 4 ? (
                    <button onClick={() => go(step + 1)} className="chunky-btn chunky-gold flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-lg">
                      Weiter <ArrowRight className="h-5 w-5" />
                    </button>
                  ) : (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={launch} className="chunky-btn chunky-green flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-xl">
                      <Play className="h-5 w-5" /> Los geht&apos;s!
                    </motion.button>
                  )}
                </div>
              </Panel>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function TitleScreen({ resumable, onNew, onResume, onRules }: { resumable: SaveFile | null; onNew: () => void; onResume: () => void; onRules: () => void }) {
  const opponents = resumable ? [1, 3].map((p) => resumable.game.players[p].name).join(" & ") : "";
  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="flex items-end gap-2">
        {(["tac", 7, 4, "trickser"] as const).map((v, i) => (
          <motion.div key={i} initial={{ y: 40, rotate: 0, opacity: 0 }} animate={{ y: 0, rotate: (i - 1.5) * 9, opacity: 1 }} transition={{ delay: 0.08 * i, type: "spring" }}>
            <CardFace value={v} size="sm" />
          </motion.div>
        ))}
      </div>
      <motion.h1
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.2 }}
        className="font-display text-stroke-lg text-8xl text-amber-200 drop-shadow-[0_6px_0_rgba(0,0,0,0.35)]"
      >
        T<span className="text-red-500">A</span>C
      </motion.h1>
      <p className="max-w-sm text-amber-100/70">Das taktische Karten- und Brettspiel für zwei Teams. Bring mit deinem Partner alle acht Kugeln nach Hause!</p>
      <div className="flex -space-x-2">
        {PERSONAS.map((p, i) => (
          <motion.div key={p.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 + i * 0.05 }}>
            <Character look={p.id} color={i % 4} size={40} />
          </motion.div>
        ))}
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {resumable && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onResume}
            className="chunky-btn chunky-green flex flex-col items-center rounded-2xl px-4 py-3"
          >
            <span className="flex items-center gap-2 text-xl">
              <RotateCcw className="h-5 w-5" /> Weiterspielen
            </span>
            <span className="text-xs opacity-90">
              Runde {resumable.game.dealNumber} gegen {opponents} · {timeAgo(resumable.savedAt)}
            </span>
          </motion.button>
        )}
        <button onClick={onNew} className={`chunky-btn ${resumable ? "chunky-blue" : "chunky-green"} flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xl`}>
          <Play className="h-5 w-5" /> Neues Spiel
        </button>
        <button onClick={onRules} className="chunky-btn chunky-dark flex items-center justify-center gap-2 rounded-2xl py-3">
          <BookOpen className="h-5 w-5" /> Wie spiele ich TAC?
        </button>
      </div>
    </div>
  );
}

function Panel({ step, children }: { step: number; children: React.ReactNode }) {
  const s = STEPS[step - 1];
  return (
    <div className="rounded-[2rem] border border-amber-200/15 bg-[#1c120b]/85 p-5 shadow-2xl backdrop-blur sm:p-8">
      {/* Fortschritt */}
      <div className="mb-4 flex justify-center gap-1.5" aria-label={`Schritt ${step} von ${STEPS.length}`}>
        {STEPS.map((_, i) => (
          <motion.span
            key={i}
            animate={{ width: i + 1 === step ? 28 : 8, opacity: i + 1 <= step ? 1 : 0.3 }}
            className="h-2 rounded-full bg-amber-300"
          />
        ))}
      </div>
      <h2 className="font-display text-stroke text-center text-3xl text-amber-100">{s.title}</h2>
      <p className="mb-5 text-center text-sm text-amber-100/60">{s.sub}</p>
      {children}
    </div>
  );
}

function Options({
  difficulty,
  setDifficulty,
  master,
  setMaster,
  speed,
  setSpeed,
  bots,
  name,
}: {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  master: boolean;
  setMaster: (m: boolean) => void;
  speed: number;
  setSpeed: (s: number) => void;
  bots: string[];
  name: string;
}) {
  return (
    <div className="space-y-4">
      {/* Aufstellung */}
      <div className="flex items-center justify-around rounded-2xl bg-black/25 p-3 ring-1 ring-amber-200/10">
        {[
          [0, 2],
          [1, 3],
        ].map((team, t) => (
          <div key={t} className="flex flex-col items-center">
            <div className="flex -space-x-2">
              {team.map((seat) => (
                <Character key={seat} look={seat === 0 ? "ritter" : lookOf(bots[seat - 1])} color={seat} size={52} />
              ))}
            </div>
            <span className="mt-1 text-xs font-bold text-amber-100/80">
              {team.map((seat) => (seat === 0 ? name : personaById(bots[seat - 1])!.name)).join(" & ")}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => setDifficulty(l.id)}
            className={`rounded-2xl p-3 text-left ring-1 transition ${difficulty === l.id ? "bg-amber-300/20 ring-2 ring-amber-300" : "bg-black/20 ring-amber-200/15 hover:bg-black/30"}`}
          >
            <div className="flex items-center gap-2 font-bold text-amber-50">
              {l.icon}
              {l.title}
            </div>
            <p className="mt-0.5 text-xs text-amber-100/60">{l.text}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          onClick={() => setMaster(!master)}
          className={`flex items-center gap-3 rounded-2xl p-3 text-left ring-1 transition ${master ? "bg-purple-500/20 ring-2 ring-purple-300" : "bg-black/20 ring-amber-200/15 hover:bg-black/30"}`}
        >
          <Crown className={`h-6 w-6 shrink-0 ${master ? "text-purple-200" : "text-amber-100/50"}`} />
          <div>
            <div className="font-bold text-amber-50">Meisterversion {master ? "an" : "aus"}</div>
            <p className="text-xs text-amber-100/60">Engel, Teufel, Krieger &amp; Narr</p>
          </div>
        </button>
        <label className="flex items-center gap-3 rounded-2xl bg-black/20 p-3 ring-1 ring-amber-200/15">
          <Gauge className="h-6 w-6 shrink-0 text-amber-100/50" />
          <div className="flex-1">
            <div className="flex justify-between font-bold text-amber-50">
              Tempo <span className="text-sm text-amber-200">{speed < 0.8 ? "gemütlich" : speed > 1.4 ? "schnell" : "normal"}</span>
            </div>
            <input type="range" min={0.5} max={2} step={0.25} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="mt-1 w-full accent-amber-400" />
          </div>
        </label>
      </div>
      <div className="flex justify-center gap-1.5" aria-hidden>
        {PLAYER_COLORS.map((c, i) => (
          <span key={i} className="h-3 w-3 rounded-full" style={{ background: c.hex }} />
        ))}
      </div>
    </div>
  );
}

function timeAgo(ts: number): string {
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.round(min / 60);
  return h < 24 ? `vor ${h} Std.` : `vor ${Math.round(h / 24)} Tagen`;
}
