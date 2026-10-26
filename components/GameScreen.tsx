"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { BookOpen, Home, RotateCcw, Trophy, Volume2, VolumeX } from "lucide-react";
import type { GameState } from "@/types/game";
import { useGameStore } from "@/store/gameStore";
import { PLAYER_COLORS, TEAM_NAMES, isHome, teamOf } from "@/lib/engine/constants";
import { decider } from "@/lib/engine/moves";
import { haptics } from "@/lib/haptics";
import { EmoteButton, FxOverlay, PlayerPortrait, SidebarDrawer } from "./Arena";
import { Board } from "./Board";
import { CardFace } from "./CardView";
import { Character } from "./Character";
import { HandArea } from "./HandArea";
import { Sidebar } from "./Sidebar";
import { useTurnControls } from "./useTurnControls";

const DIFF_LABEL = { easy: "Leicht", medium: "Mittel", hard: "Schwer" } as const;

export function GameScreen() {
  const game = useGameStore((s) => s.game)!;
  const anim = useGameStore((s) => s.anim);
  const sound = useGameStore((s) => s.sound);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const setShowRules = useGameStore((s) => s.setShowRules);
  const quit = useGameStore((s) => s.quit);
  const settings = useGameStore((s) => s.settings);
  const controls = useTurnControls();

  const active = game.phase === "play" ? decider(game) : null;
  const fx = useGameStore((s) => s.fx);
  const shake = useAnimationControls();

  // Brett wackelt bei Rauswürfen und beim Spielende
  useEffect(() => {
    if (!fx || (fx.kind !== "kick" && fx.kind !== "win")) return;
    const strong = fx.kind === "win" || fx.victims.includes(0);
    const a = strong ? 12 : 7;
    shake.start({ x: [0, -a, a, -a * 0.6, a * 0.6, -a * 0.3, 0], y: [0, a * 0.4, -a * 0.4, a * 0.2, 0], transition: { duration: 0.45 } });
  }, [fx?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Kurzes Vibrieren, wenn du dran bist
  useEffect(() => {
    if (controls.humanTurn) haptics.turn();
  }, [controls.humanTurn, game.current]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Kopfzeile */}
      <header className="flex items-center justify-between gap-2 px-3 py-2 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="font-display text-stroke-lg text-3xl text-amber-200">
            T<span className="text-red-500">A</span>C
          </span>
          <span className="font-display hidden rounded-lg border-2 border-[#1b1630] bg-black/40 px-2.5 py-1 text-xs text-amber-100/90 sm:inline">
            Runde {game.dealNumber} · {DIFF_LABEL[settings.difficulty]}
            {game.master ? " · Meisterversion" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <IconButton onClick={() => setShowRules(true)} label="Regeln">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Wie spiele ich TAC?</span>
          </IconButton>
          <IconButton onClick={toggleSound} label={sound ? "Ton aus" : "Ton an"}>
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </IconButton>
          <IconButton onClick={quit} label="Hauptmenü">
            <Home className="h-4 w-4" />
          </IconButton>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1500px] flex-1 grid-cols-1 gap-4 px-2 pb-20 sm:px-4 lg:grid-cols-[1fr_340px] lg:pb-3">
        <div className="flex min-w-0 flex-col items-center gap-2">
          <TeamScore game={game} />
          <motion.div animate={shake} className="relative w-full max-w-[min(92vw,calc(100dvh-370px))] min-w-[300px]">
            <Board
              marbles={controls.displayBoard}
              anim={anim}
              selectable={controls.selectable}
              selected={controls.selected}
              targets={controls.targets}
              onMarbleClick={controls.onMarbleClick}
              activeColor={active}
              preview={controls.preview}
              overlay={
                <>
                  <CenterPile game={game} />
                  {[0, 1, 2, 3].map((p) => (
                    <PlayerPortrait key={p} game={game} player={p} active={active === p} />
                  ))}
                  <FxOverlay game={game} />
                </>
              }
            />
          </motion.div>
          <HandArea game={game} controls={controls} />
        </div>

        <aside className="hidden lg:sticky lg:top-2 lg:block lg:h-[calc(100dvh-80px)]">
          <Sidebar game={game} />
        </aside>
      </main>

      <EmoteButton />
      <SidebarDrawer game={game} />
      <AnimatePresence>{game.phase === "gameOver" && <GameOverModal game={game} />}</AnimatePresence>
    </div>
  );
}

function IconButton({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={() => {
        haptics.tap();
        onClick();
      }}
      title={label}
      aria-label={label}
      className="chunky-btn chunky-dark flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm"
    >
      {children}
    </button>
  );
}

function TeamScore({ game }: { game: GameState }) {
  const count = (team: number) => game.marbles.filter((m) => teamOf(m.color) === team && isHome(m.pos)).length;
  return (
    <div className="flex items-center gap-3 text-xs font-semibold sm:text-sm">
      {[0, 1].map((t) => (
        <div key={t} className={`flex items-center gap-2 rounded-full px-3 py-1 ${t === 0 ? "bg-emerald-950/40" : "bg-blue-950/40"} ring-1 ring-amber-200/10`}>
          <span className="flex -space-x-1">
            <span className="h-3 w-3 rounded-full ring-1 ring-black/40" style={{ background: PLAYER_COLORS[t].hex }} />
            <span className="h-3 w-3 rounded-full ring-1 ring-black/40" style={{ background: PLAYER_COLORS[t + 2].hex }} />
          </span>
          <span className="text-amber-100/80">{t === 0 ? "Dein Team" : "Gegner"}</span>
          <span className="flex gap-0.5">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i < count(t) ? "bg-amber-300 shadow-[0_0_6px_#fcd34d]" : "bg-white/15"}`} />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function hashRot(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return (h % 24) - 12;
}

function CenterPile({ game }: { game: GameState }) {
  const pile = game.discardPile.slice(-4);
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[24%] w-[24%] -translate-x-1/2 -translate-y-1/2">
      <div className="relative flex h-full w-full items-center justify-center">
        <AnimatePresence>
          {pile.map((e, i) => (
            <motion.div
              key={e.card.id}
              initial={{ opacity: 0, scale: 1.6, y: e.player === 0 ? 160 : e.player === 2 ? -160 : 0, x: e.player === 1 ? -160 : e.player === 3 ? 160 : 0 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0, rotate: hashRot(e.card.id) }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="absolute"
              style={{ zIndex: i }}
            >
              <div className="scale-[0.6] sm:scale-75 lg:scale-90">
                <CardFace value={e.card.value} size="md" />
              </div>
              {i === pile.length - 1 && (
                <span
                  className="absolute -bottom-1 left-1/2 h-2 w-8 -translate-x-1/2 rounded-full"
                  style={{ background: PLAYER_COLORS[e.player].hex, boxShadow: `0 0 10px ${PLAYER_COLORS[e.player].hex}` }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function GameOverModal({ game }: { game: GameState }) {
  const start = useGameStore((s) => s.start);
  const settings = useGameStore((s) => s.settings);
  const quit = useGameStore((s) => s.quit);
  const won = game.winner === 0;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.6 }}
        className="w-full max-w-md rounded-3xl border border-amber-200/30 bg-gradient-to-b from-[#3b2414] to-[#1c120b] p-8 text-center shadow-2xl"
      >
        <div className="mb-4 flex items-end justify-center gap-2">
          <MoodLoop player={game.winner ?? 0} won />
          <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}>
            <Trophy className={`h-16 w-16 ${won ? "text-amber-300 drop-shadow-[0_0_20px_#fcd34d]" : "text-stone-400"}`} />
          </motion.div>
          <MoodLoop player={(game.winner ?? 0) + 2} won />
        </div>
        <h2 className="font-display text-stroke-lg text-5xl text-amber-200">{won ? "Gewonnen!" : "Verloren"}</h2>
        <p className="mt-2 text-amber-100/70">
          {TEAM_NAMES[game.winner ?? 0]} hat alle acht Kugeln nach Hause gebracht{won ? " – starkes Teamspiel!" : "."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => start(settings)} className="chunky-btn chunky-green flex items-center gap-2 rounded-2xl px-6 py-3 text-lg">
            <RotateCcw className="h-4 w-4" /> Nochmal
          </button>
          <button onClick={quit} className="chunky-btn chunky-dark rounded-2xl px-6 py-3 text-lg">
            Hauptmenü
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Figur, die im Abschlussdialog immer wieder jubelt. */
function MoodLoop({ player, won }: { player: number; won: boolean }) {
  return (
    <motion.div animate={{ y: [0, -14, 0] }} transition={{ repeat: Infinity, duration: 0.9, ease: "easeOut", delay: player * 0.15 }}>
      <Character player={player} mood={won ? "happy" : "sad"} size={72} />
    </motion.div>
  );
}
