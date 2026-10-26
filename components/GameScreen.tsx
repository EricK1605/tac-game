"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Crown, Home, RotateCcw, Trophy, Volume2, VolumeX } from "lucide-react";
import type { GameState } from "@/types/game";
import { useGameStore } from "@/store/gameStore";
import { PLAYER_COLORS, TEAM_NAMES, isHome, teamOf } from "@/lib/engine/constants";
import { decider } from "@/lib/engine/moves";
import { SEAT_POS } from "@/lib/layout";
import { Board } from "./Board";
import { CardBack, CardFace } from "./CardView";
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

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Kopfzeile */}
      <header className="flex items-center justify-between gap-2 px-3 py-2 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="font-serif text-2xl font-black tracking-tight text-amber-100 drop-shadow">
            T<span className="text-red-500">A</span>C
          </span>
          <span className="hidden rounded-full bg-black/30 px-2.5 py-1 text-xs text-amber-100/70 sm:inline">
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

      <main className="mx-auto grid w-full max-w-[1500px] flex-1 grid-cols-1 gap-4 px-2 pb-3 sm:px-4 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col items-center gap-2">
          <TeamScore game={game} />
          <div className="w-full max-w-[min(92vw,calc(100dvh-370px))] min-w-[300px]">
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
                    <SeatBadge key={p} game={game} player={p} active={active === p} />
                  ))}
                </>
              }
            />
          </div>
          <HandArea game={game} controls={controls} />
        </div>

        <aside className="h-[420px] lg:h-[calc(100dvh-80px)] lg:sticky lg:top-2">
          <Sidebar game={game} />
        </aside>
      </main>

      <AnimatePresence>{game.phase === "gameOver" && <GameOverModal game={game} />}</AnimatePresence>
    </div>
  );
}

function IconButton({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-2 text-sm font-medium text-amber-100 ring-1 ring-amber-200/15 transition hover:bg-black/50"
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

function SeatBadge({ game, player, active }: { game: GameState; player: number; active: boolean }) {
  const p = game.players[player];
  const col = PLAYER_COLORS[player];
  const chat = useGameStore((s) => s.chat);
  const last = [...chat].reverse().find((m) => m.player === player);
  const [bubble, setBubble] = useState<string | null>(null);

  useEffect(() => {
    if (!last || Date.now() - last.time > 4000) return;
    setBubble(last.text);
    const t = setTimeout(() => setBubble(null), 3200);
    return () => clearTimeout(t);
  }, [last?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const pos = SEAT_POS[player];
  const vertical = player === 1 || player === 3;
  const skipped = active && game.skipPending;
  return (
    <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pos.left, top: pos.top }}>
      <motion.div
        animate={active ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={active ? { repeat: Infinity, duration: 1.6 } : {}}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold shadow-lg ring-2 backdrop-blur sm:text-xs ${
          active ? "bg-amber-100 text-amber-950" : "bg-black/60 text-amber-50"
        } ${vertical ? "flex-col rounded-2xl px-1.5 py-2" : ""}`}
        style={{ boxShadow: active ? `0 0 18px ${col.hex}` : undefined, borderColor: col.hex, ["--tw-ring-color" as string]: col.hex }}
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.hex }} />
        <span className={vertical ? "[writing-mode:vertical-rl] rotate-180" : ""}>{p.name}</span>
        {teamOf(player) === 0 && player !== 0 && <Crown className="h-3 w-3 text-emerald-500" aria-label="Partner" />}
        {player !== 0 && (
          <span className={`flex ${vertical ? "flex-col -space-y-3" : "-space-x-2"}`}>
            {p.hand.map((c) => (
              <CardBack key={c.id} mini className="h-4 w-3 !rounded-[2px] ring-1 ring-black/30" />
            ))}
          </span>
        )}
        {skipped && <span className="rounded bg-red-600 px-1 text-[10px] text-white">setzt aus</span>}
      </motion.div>
      <AnimatePresence>
        {bubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute z-20 w-max max-w-[160px] rounded-2xl bg-white px-3 py-1.5 text-xs font-medium text-stone-800 shadow-xl ${
              player === 0 ? "bottom-full left-1/2 mb-2 -translate-x-1/2" : player === 2 ? "left-1/2 top-full mt-2 -translate-x-1/2" : player === 1 ? "left-full top-1/2 ml-2 -translate-y-1/2" : "right-full top-1/2 mr-2 -translate-y-1/2"
            }`}
          >
            {bubble}
          </motion.div>
        )}
      </AnimatePresence>
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
        <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 2.4 }} className="mx-auto mb-4 w-fit">
          <Trophy className={`h-16 w-16 ${won ? "text-amber-300 drop-shadow-[0_0_20px_#fcd34d]" : "text-stone-400"}`} />
        </motion.div>
        <h2 className="font-serif text-3xl font-black text-amber-50">{won ? "Gewonnen!" : "Verloren"}</h2>
        <p className="mt-2 text-amber-100/70">
          {TEAM_NAMES[game.winner ?? 0]} hat alle acht Kugeln nach Hause gebracht{won ? " – starkes Teamspiel!" : "."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => start(settings)} className="flex items-center gap-2 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-2.5 font-bold text-amber-950 shadow-lg hover:from-amber-200">
            <RotateCcw className="h-4 w-4" /> Nochmal
          </button>
          <button onClick={quit} className="rounded-full bg-black/30 px-5 py-2.5 font-semibold text-amber-100 ring-1 ring-amber-200/20 hover:bg-black/50">
            Hauptmenü
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
