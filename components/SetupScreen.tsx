"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Brain, ChevronDown, Crown, Dices, Eye, Gamepad2, Gauge, LogIn, Play, Plus, RotateCcw, Sparkles, Swords, Users } from "lucide-react";
import type { Difficulty, GameMode } from "@/types/game";
import { useGameStore } from "@/store/gameStore";
import { haptics } from "@/lib/haptics";
import { DEFAULT_BOTS, ORACLE, ORACLE_OPPONENTS, PERSONAS, lookOf, personaById } from "@/lib/personas";
import { lastOpenSave, readSettings, rememberSettings, type SaveFile } from "@/lib/saves";
import { newRoomCode, normalizeRoomCode } from "@/lib/net/room";
import { markHost } from "@/lib/net/protocol";
import { playerName, useT } from "@/lib/useI18n";
import type { Key } from "@/lib/i18n";
import { CardFace } from "./CardView";
import { Character } from "./Character";
import { OpponentPicker, PartnerPicker } from "./CharacterPicker";
import { LangSwitch } from "./LangSwitch";
import { OracleBadge } from "./GameScreen";
import { ShareGame } from "./ShareGame";

const LEVELS: { id: Difficulty; icon: React.ReactNode }[] = [
  { id: "easy", icon: <Sparkles className="h-5 w-5" /> },
  { id: "medium", icon: <Swords className="h-5 w-5" /> },
  { id: "hard", icon: <Brain className="h-5 w-5" /> },
];

type Step = "name" | "partner" | "opp" | "opts" | "oracle" | "friends";

/** Ablauf des Assistenten je Modus. */
const FLOWS: Record<GameMode, Step[]> = {
  classic: ["name", "partner", "opp", "opts"],
  oracle: ["name", "oracle"],
  friends: ["name", "friends"],
};

const STEP_TEXT: Record<Step, [Key, Key]> = {
  name: ["step.name.title", "step.name.sub"],
  partner: ["step.partner.title", "step.partner.sub"],
  opp: ["step.opp.title", "step.opp.sub"],
  opts: ["step.opts.title", "step.opts.sub"],
  oracle: ["step.oracle.title", "step.oracle.sub"],
  friends: ["mode.friends.title", "mode.friends.desc"],
};

export function SetupScreen() {
  const router = useRouter();
  const start = useGameStore((s) => s.start);
  const setShowRules = useGameStore((s) => s.setShowRules);
  const defaults = useGameStore((s) => s.settings);
  const { t } = useT();

  // flow = null: Titelbildschirm mit Modus-Auswahl
  const [flow, setFlow] = useState<GameMode | null>(null);
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
    // Alte Einladungs-Links der Form /?room=tac-1234 in den Raum weiterleiten
    const room = new URLSearchParams(window.location.search).get("room");
    if (room) {
      router.replace(`/raum/${normalizeRoomCode(room)}`);
      return;
    }
    const s = readSettings();
    if (s) {
      setName(s.playerName === "Du" ? "" : s.playerName);
      setDifficulty(s.difficulty);
      setMaster(s.master);
      setSpeed(s.speed);
      if (s.bots?.length === 3 && s.bots.every((b) => personaById(b))) setBots(s.bots);
    }
    setResumable(lastOpenSave());
  }, [router]);

  const steps = flow ? FLOWS[flow] : [];
  const current = steps[step];

  const go = (to: number) => {
    haptics.tap();
    setDir(to > step ? 1 : -1);
    if (to < 0) {
      setFlow(null);
      setStep(0);
      return;
    }
    setStep(to);
  };
  const choose = (mode: GameMode) => {
    haptics.tap();
    setDir(1);
    setFlow(mode);
    setStep(0);
    if (mode === "oracle" && difficulty !== "hard") setDifficulty("hard");
  };
  const playerNameValue = name.trim() || "Du";
  const launch = () => {
    haptics.drop();
    const mode = flow ?? "classic";
    const id = start({ playerName: playerNameValue, difficulty, master, speed, bots, mode });
    router.push(`/spiel/${id}`);
  };
  const toRoom = (code: string, create: boolean) => {
    haptics.drop();
    rememberSettings({ playerName: playerNameValue, difficulty, master, speed });
    // Wer den Raum erstellt, ist der Gastgeber
    if (create) markHost(code, null);
    router.push(`/raum/${code}`);
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
            key={flow ? `${flow}-${step}` : "title"}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {!flow || !current ? (
              <TitleScreen
                resumable={resumable}
                onMode={choose}
                onResume={() => resumable && router.push(`/spiel/${resumable.id}`)}
                onRestart={() => {
                  if (!resumable) return;
                  haptics.drop();
                  router.push(`/spiel/${start(resumable.settings)}`);
                }}
                onRules={() => setShowRules(true)}
              />
            ) : (
              <Panel title={t(STEP_TEXT[current][0])} sub={t(STEP_TEXT[current][1])} step={step} total={steps.length} badge={flow === "oracle"}>
                {current === "name" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      go(step + 1);
                    }}
                    className="flex flex-col items-center gap-4"
                  >
                    <Character look="ritter" color={0} size={96} mood={name ? "happy" : "idle"} />
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={14}
                      placeholder={t("you")}
                      enterKeyHint="next"
                      className="font-display w-full max-w-xs rounded-2xl bg-black/30 px-4 py-3 text-center text-2xl text-amber-50 ring-2 ring-amber-200/20 placeholder:text-amber-100/25 focus:outline-none focus:ring-amber-300/70"
                    />
                  </form>
                )}
                {current === "partner" && <PartnerPicker bots={bots} onChange={setBots} />}
                {current === "opp" && (
                  <>
                    <OpponentPicker bots={bots} onChange={setBots} />
                    <button onClick={shuffleBots} className="mx-auto mt-2 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-amber-200 hover:bg-white/5">
                      <Dices className="h-4 w-4" /> {t("shuffle")}
                    </button>
                  </>
                )}
                {current === "opts" && (
                  <Options {...{ difficulty, setDifficulty, master, setMaster, speed, setSpeed }} lineup={[playerNameValue, ...bots]} />
                )}
                {current === "oracle" && <OracleBriefing difficulty={difficulty} setDifficulty={setDifficulty} name={playerNameValue} />}
                {current === "friends" && <FriendsEntry onRoom={toRoom} />}

                {/* Navigation – auf dem Handy unten angeheftet */}
                <div className="sticky bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-10 -mx-2 mt-5 flex gap-2 rounded-2xl bg-[#171c3f]/90 p-2 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                  <button onClick={() => go(step - 1)} className="chunky-btn chunky-dark flex items-center gap-1.5 rounded-2xl px-4 py-3" aria-label={t("back")}>
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  {current === "friends" ? null : step < steps.length - 1 ? (
                    <button onClick={() => go(step + 1)} className="chunky-btn chunky-gold flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-lg">
                      {t("next")} <ArrowRight className="h-5 w-5" />
                    </button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={launch}
                      className={`chunky-btn ${flow === "oracle" ? "bg-gradient-to-b from-fuchsia-400 via-purple-600 to-purple-800" : "chunky-green"} flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-xl`}
                    >
                      <Play className="h-5 w-5" /> {t("go")}
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

const MODES: { id: GameMode; icon: React.ReactNode; tone: string }[] = [
  { id: "classic", icon: <Gamepad2 className="h-7 w-7" />, tone: "from-amber-400/25 to-orange-600/10 ring-amber-300/40" },
  { id: "friends", icon: <Users className="h-7 w-7" />, tone: "from-sky-400/25 to-blue-700/10 ring-sky-300/40" },
  { id: "oracle", icon: <Eye className="h-7 w-7" />, tone: "from-fuchsia-500/30 to-purple-800/10 ring-fuchsia-300/50" },
];

function TitleScreen({
  resumable,
  onMode,
  onResume,
  onRestart,
  onRules,
}: {
  resumable: SaveFile | null;
  onMode: (m: GameMode) => void;
  onResume: () => void;
  onRestart: () => void;
  onRules: () => void;
}) {
  const { t, lang } = useT();
  const opponents = resumable ? [1, 3].map((p) => playerName(resumable.game.players[p], lang)).join(" & ") : "";
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center [@media(max-height:860px)]:gap-3 [@media(max-height:860px)]:py-1">
      <LangSwitch className="self-end" />
      <div className="flex items-end gap-2 [@media(max-height:780px)]:hidden">
        {(["tac", 7, 4, "trickser"] as const).map((v, i) => (
          <motion.div key={i} initial={{ y: 40, rotate: 0, opacity: 0 }} animate={{ y: 0, rotate: (i - 1.5) * 9, opacity: 1 }} transition={{ delay: 0.08 * i, type: "spring" }}>
            <CardFace value={v} size="sm" />
          </motion.div>
        ))}
      </div>
      {/* Logo – die H1 der Seite steht im Info-Bereich darunter */}
      <motion.div
        role="img"
        aria-label="TAC"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.2 }}
        className="font-display text-stroke-lg text-8xl text-amber-200 drop-shadow-[0_6px_0_rgba(0,0,0,0.35)] [@media(max-height:860px)]:text-7xl [@media(max-height:780px)]:text-6xl"
      >
        T<span className="text-red-500">A</span>C
      </motion.div>
      <p className="max-w-sm text-amber-100/70">{t("setup.tagline")}</p>

      {resumable && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex w-full max-w-sm gap-2">
          <button onClick={onResume} className="chunky-btn chunky-green flex min-w-0 flex-1 flex-col items-center rounded-2xl px-4 py-3">
            <span className="flex items-center gap-2 text-xl">
              <Play className="h-5 w-5" /> {t("setup.resume")}
            </span>
            {/* kleine Infozeile ohne den dicken Comic-Schatten des Knopfs – sonst kaum lesbar */}
            <span className="font-sans text-xs font-semibold text-white/95 [text-shadow:0_1px_1px_rgba(0,0,0,0.3)]">{t("setup.resumeInfo", { n: resumable.game.dealNumber, opp: opponents, ago: timeAgo(resumable.savedAt, t) })}</span>
          </button>
          <button onClick={onRestart} title={t("setup.restart")} className="chunky-btn chunky-dark flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-3 text-xs [text-shadow:0_1px_0_#1b1630]">
            <RotateCcw className="h-5 w-5" /> {t("setup.restart")}
          </button>
        </motion.div>
      )}

      {/* Modus-Auswahl */}
      <div className="w-full">
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-100/50">{t("setup.chooseMode")}</div>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {MODES.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onMode(m.id)}
              className={`relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-left ring-2 transition sm:flex-col sm:items-center sm:text-center ${m.tone}`}
            >
              {m.id === "oracle" && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-2xl"
                  animate={{ boxShadow: ["inset 0 0 12px #a855f7", "inset 0 0 28px #e879f9", "inset 0 0 12px #a855f7"] }}
                  transition={{ repeat: Infinity, duration: 2.4 }}
                />
              )}
              <span className="shrink-0 text-amber-100">{m.icon}</span>
              <span>
                <span className="font-display text-stroke block text-lg leading-tight text-white">{t(`mode.${m.id}.title` as Key)}</span>
                <span className="mt-0.5 block text-xs leading-snug text-amber-100/70">{t(`mode.${m.id}.desc` as Key)}</span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Regeln plus Teilen in einer Zeile – so bleibt die Startseite kompakt */}
      <div className="flex w-full max-w-sm gap-2">
        <button onClick={onRules} className="chunky-btn chunky-dark flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl py-3">
          <BookOpen className="h-5 w-5" /> {t("setup.rules")}
        </button>
        <ShareGame compact />
      </div>
      {/* Auf niedrigen Bildschirmen weichen die Figuren, damit „Mehr über TAC“ sichtbar bleibt */}
      <div className="flex -space-x-2 [@media(max-height:860px)]:hidden">
        {PERSONAS.map((p, i) => (
          <motion.div key={p.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.05 }}>
            <Character look={p.id} color={i % 4} size={36} />
          </motion.div>
        ))}
      </div>
      <a
        href="#ueber-tac"
        onClick={(e) => {
          const el = document.getElementById("ueber-tac");
          if (!el) return;
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          history.replaceState(null, "", "#ueber-tac");
        }}
        className="flex flex-col items-center text-sm font-semibold text-amber-100/70 transition-colors hover:text-amber-100"
      >
        {t("setup.more")}
        <motion.span animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}>
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </a>
    </div>
  );
}

function Panel({ title, sub, step, total, badge, children }: { title: string; sub: string; step: number; total: number; badge?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#171c3f]/85 p-5 shadow-2xl backdrop-blur sm:p-8">
      <div className="mb-4 flex items-center justify-between">
        {/* Fortschritt */}
        <div className="flex gap-1.5" aria-label={`${step + 1} / ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <motion.span key={i} animate={{ width: i === step ? 28 : 8, opacity: i <= step ? 1 : 0.3 }} className="h-2 rounded-full bg-amber-300" />
          ))}
        </div>
        {badge && <OracleBadge />}
      </div>
      <h2 className="font-display text-stroke text-center text-3xl text-amber-100">{title}</h2>
      <p className="mb-5 text-center text-sm text-amber-100/60">{sub}</p>
      {children}
    </div>
  );
}

function DifficultyPicker({ difficulty, setDifficulty }: { difficulty: Difficulty; setDifficulty: (d: Difficulty) => void }) {
  const { t } = useT();
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {LEVELS.map((l) => (
        <button
          key={l.id}
          onClick={() => setDifficulty(l.id)}
          className={`rounded-2xl p-3 text-left ring-1 transition ${difficulty === l.id ? "bg-amber-300/20 ring-2 ring-amber-300" : "bg-black/20 ring-amber-200/15 hover:bg-black/30"}`}
        >
          <div className="flex items-center gap-2 font-bold text-amber-50">
            {l.icon}
            {t(`diff.${l.id}`)}
          </div>
          <p className="mt-0.5 text-xs text-amber-100/60">{t(`lvl.${l.id}`)}</p>
        </button>
      ))}
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
  lineup,
}: {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  master: boolean;
  setMaster: (m: boolean) => void;
  speed: number;
  setSpeed: (s: number) => void;
  /** Name des Spielers, dann die Charaktere auf Platz 1–3 */
  lineup: string[];
}) {
  const { t, lang } = useT();
  const label = (seat: number) => (seat === 0 ? lineup[0] : personaById(lineup[seat])![lang].name);
  return (
    <div className="space-y-4">
      {/* Aufstellung */}
      <div className="flex items-center justify-around rounded-2xl bg-black/25 p-3 ring-1 ring-amber-200/10">
        {[
          [0, 2],
          [1, 3],
        ].map((team, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="flex -space-x-2">
              {team.map((seat) => (
                <Character key={seat} look={seat === 0 ? "ritter" : lookOf(lineup[seat])} color={seat} size={52} />
              ))}
            </div>
            <span className="mt-1 text-xs font-bold text-amber-100/80">{team.map(label).join(" & ")}</span>
          </div>
        ))}
      </div>

      <DifficultyPicker difficulty={difficulty} setDifficulty={setDifficulty} />

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          onClick={() => setMaster(!master)}
          className={`flex items-center gap-3 rounded-2xl p-3 text-left ring-1 transition ${master ? "bg-purple-500/20 ring-2 ring-purple-300" : "bg-black/20 ring-amber-200/15 hover:bg-black/30"}`}
        >
          <Crown className={`h-6 w-6 shrink-0 ${master ? "text-purple-200" : "text-amber-100/50"}`} />
          <div>
            <div className="font-bold text-amber-50">{t(master ? "opt.masterOn" : "opt.masterOff")}</div>
            <p className="text-xs text-amber-100/60">{t("opt.masterDesc")}</p>
          </div>
        </button>
        <label className="flex items-center gap-3 rounded-2xl bg-black/20 p-3 ring-1 ring-amber-200/15">
          <Gauge className="h-6 w-6 shrink-0 text-amber-100/50" />
          <div className="flex-1">
            <div className="flex justify-between font-bold text-amber-50">
              {t("opt.tempo")} <span className="text-sm text-amber-200">{t(speed < 0.8 ? "tempo.slow" : speed > 1.4 ? "tempo.fast" : "tempo.normal")}</span>
            </div>
            <input type="range" min={0.5} max={2} step={0.25} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="mt-1 w-full accent-amber-400" />
          </div>
        </label>
      </div>
    </div>
  );
}

/** Einweisung für „Das blinde Orakel“. */
function OracleBriefing({ difficulty, setDifficulty, name }: { difficulty: Difficulty; setDifficulty: (d: Difficulty) => void; name: string }) {
  const { t, lang } = useT();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-around rounded-2xl bg-gradient-to-br from-purple-900/50 to-black/30 p-3 ring-1 ring-fuchsia-300/30">
        <div className="flex flex-col items-center">
          <div className="flex -space-x-2">
            <Character look="ritter" color={0} size={52} />
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.2 }}>
              <Character look={ORACLE.id} color={2} size={52} />
            </motion.div>
          </div>
          <span className="mt-1 text-xs font-bold text-amber-100/80">
            {name} & {ORACLE[lang].name}
          </span>
        </div>
        <span className="font-display text-stroke text-2xl text-fuchsia-200">VS</span>
        <div className="flex flex-col items-center">
          <div className="flex -space-x-2">
            <Character look={ORACLE_OPPONENTS[0]} color={1} size={52} />
            <Character look={ORACLE_OPPONENTS[1]} color={3} size={52} />
          </div>
          <span className="mt-1 text-xs font-bold text-amber-100/80">{ORACLE_OPPONENTS.map((id) => personaById(id)![lang].name).join(" & ")}</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm text-amber-50/85">
        {(["oracle.p1", "oracle.p2", "oracle.p3", "oracle.p4"] as const).map((k, i) => (
          <motion.li key={k} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }} className="flex gap-2">
            <Eye className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" />
            {t(k)}
          </motion.li>
        ))}
      </ul>
      <DifficultyPicker difficulty={difficulty} setDifficulty={setDifficulty} />
    </div>
  );
}

/** Raum erstellen oder mit Code beitreten. */
function FriendsEntry({ onRoom }: { onRoom: (code: string, create: boolean) => void }) {
  const { t } = useT();
  const [code, setCode] = useState("");
  return (
    <div className="space-y-4">
      <button onClick={() => onRoom(newRoomCode(), true)} className="chunky-btn chunky-blue flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xl">
        <Plus className="h-5 w-5" /> {t("lobby.create")}
      </button>
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-amber-100/40">
        <span className="h-px flex-1 bg-amber-100/15" /> {t("lobby.or")} <span className="h-px flex-1 bg-amber-100/15" />
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const c = normalizeRoomCode(code);
          if (c) onRoom(c, false);
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("lobby.enterCode")}
          autoCapitalize="none"
          className="font-display min-w-0 flex-1 rounded-2xl bg-black/30 px-4 py-3 text-lg text-amber-50 ring-2 ring-amber-200/20 placeholder:text-amber-100/25 focus:outline-none focus:ring-amber-300/70"
        />
        <button className="chunky-btn chunky-green flex items-center gap-1.5 rounded-2xl px-4" disabled={!normalizeRoomCode(code)}>
          <LogIn className="h-5 w-5" /> {t("lobby.join")}
        </button>
      </form>
    </div>
  );
}

function timeAgo(ts: number, t: ReturnType<typeof useT>["t"]): string {
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return t("ago.now");
  if (min < 60) return t("ago.min", { n: min });
  const h = Math.round(min / 60);
  return h < 24 ? t("ago.h", { n: h }) : t("ago.d", { n: Math.round(h / 24) });
}
