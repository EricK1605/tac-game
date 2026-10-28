"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { BookOpen, Eye, Home, PanelRightClose, PanelRightOpen, RotateCcw, Trophy, Volume2, VolumeX } from "lucide-react";
import type { GameState } from "@/types/game";
import { useGameStore } from "@/store/gameStore";
import { PLAYER_COLORS, isHome, teamOf } from "@/lib/engine/constants";
import { decider } from "@/lib/engine/moves";
import { haptics } from "@/lib/haptics";
import { relSeat, setViewSeat } from "@/lib/layout";
import { lookOf } from "@/lib/personas";
import { useGameText } from "@/lib/useI18n";
import { AdSlot } from "./AdSlot";
import { EmoteButton, FxOverlay, PlayerPlate, SidebarDrawer } from "./Arena";
import { Board } from "./Board";
import { CardFace } from "./CardView";
import { Character } from "./Character";
import { HandArea } from "./HandArea";
import { LangSwitch } from "./LangSwitch";
import { Sidebar } from "./Sidebar";
import { useTurnControls } from "./useTurnControls";

export function GameScreen({ onLeave }: { onLeave?: () => void }) {
  const game = useGameStore((s) => s.game)!;
  const anim = useGameStore((s) => s.anim);
  const sound = useGameStore((s) => s.sound);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const setShowRules = useGameStore((s) => s.setShowRules);
  const quit = useGameStore((s) => s.quit);
  const settings = useGameStore((s) => s.settings);
  const me = useGameStore((s) => s.mySeats[0] ?? 0);
  // Der eigene Platz sitzt immer unten am Brett
  setViewSeat(me);
  const controls = useTurnControls();
  const router = useRouter();
  const { t } = useGameText(game);
  // Spielverlauf und Chat lassen sich am großen Bildschirm einklappen – die Wahl bleibt gespeichert
  const [sideOpen, setSideOpen] = useState(true);
  useEffect(() => {
    try {
      setSideOpen(localStorage.getItem("tac:side") !== "0");
    } catch {}
  }, []);
  const toggleSide = () =>
    setSideOpen((o) => {
      try {
        localStorage.setItem("tac:side", o ? "0" : "1");
      } catch {}
      return !o;
    });
  // Zurück ins Menü – der Spielstand bleibt gespeichert
  const toMenu =
    onLeave ??
    (() => {
      router.push("/");
      quit();
    });

  const active = game.phase === "play" ? decider(game) : null;
  const fx = useGameStore((s) => s.fx);
  const shake = useAnimationControls();

  // Brett wackelt bei Rauswürfen und beim Spielende
  useEffect(() => {
    if (!fx || (fx.kind !== "kick" && fx.kind !== "win")) return;
    const strong = fx.kind === "win" || fx.victims.includes(me);
    const a = strong ? 12 : 7;
    shake.start({ x: [0, -a, a, -a * 0.6, a * 0.6, -a * 0.3, 0], y: [0, a * 0.4, -a * 0.4, a * 0.2, 0], transition: { duration: 0.45 } });
  }, [fx?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Kurzes Vibrieren, wenn du dran bist
  useEffect(() => {
    if (controls.humanTurn) haptics.turn();
  }, [controls.humanTurn, game.current]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-dvh select-none flex-col">
      {/* Kopfzeile */}
      <header className="flex items-center justify-between gap-2 px-3 py-2 sm:px-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-display text-stroke-lg text-2xl text-amber-200 sm:text-3xl">
            T<span className="text-red-500">A</span>C
          </span>
          {game.mode === "oracle" ? (
            <OracleBadge />
          ) : (
            <span className="font-display hidden rounded-lg border-2 border-[#1b1630] bg-black/40 px-2.5 py-1 text-xs text-amber-100/90 lg:inline">
              {t("hdr.round", { n: game.dealNumber })} · {t(`diff.${settings.difficulty}`)}
              {game.master ? ` · ${t("hdr.master")}` : ""}
            </span>
          )}
        </div>
        <TeamScore game={game} me={me} />
        <div className="flex items-center gap-1.5">
          <LangSwitch className="hidden sm:flex" />
          <IconButton onClick={() => setShowRules(true)} label={t("hdr.rules")}>
            <BookOpen className="h-4 w-4" />
            <span className="hidden 2xl:inline">{t("hdr.rules")}</span>
          </IconButton>
          <IconButton onClick={toggleSound} label={sound ? t("hdr.soundOff") : t("hdr.soundOn")}>
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </IconButton>
          <IconButton onClick={toggleSide} label={t(sideOpen ? "hdr.sideHide" : "hdr.sideShow")} className="hidden lg:flex">
            {sideOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </IconButton>
          <IconButton onClick={toMenu} label={t("hdr.menu")}>
            <Home className="h-4 w-4" />
          </IconButton>
        </div>
      </header>

      {/*
        Werbeflächen: ab 1700 px als Sidebar links und rechts vom Spiel,
        darunter wandern sie per `order` als Banner unter das Spiel.
      */}
      <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-4 px-2 pb-20 sm:px-4 lg:pb-3 min-[1700px]:max-w-[1900px] min-[1700px]:flex-row min-[1700px]:items-start">
        <AdSlot slot="spiel-links" className="order-2 min-[1700px]:order-none" />
        <main className="flex w-full min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-start lg:gap-0">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
            {/*
              Brettgröße = Bildschirmhöhe minus Kopfzeile, Handbereich und – bis xl – die Spielerkarten über und unter dem Brett.
              Ab xl sitzen die Spielerkarten links und rechts, dafür wird Breite freigehalten.
            */}
            <div className="relative my-[70px] w-full min-w-[300px] max-w-[min(98vw,calc(100dvh-380px))] md:max-w-[min(96vw,calc(100dvh-370px))] xl:my-1 xl:max-w-[min(calc(100%-340px),calc(100dvh-258px))]">
              <motion.div animate={shake}>
                <Board
                  key={me}
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
                      <FxOverlay game={game} />
                      <TurnBanner game={game} humanTurn={controls.humanTurn} me={me} />
                    </>
                  }
                />
              </motion.div>
              {[0, 1, 2, 3].map((p) => (
                <PlayerPlate key={p} game={game} player={p} active={active === p} />
              ))}
            </div>
            <HandArea game={game} controls={controls} />
          </div>

          {/* Gleitet beim Ein- und Ausklappen zur Seite, das Brett bekommt den Platz */}
          <motion.aside
            initial={false}
            animate={{ width: sideOpen ? 356 : 0, opacity: sideOpen ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="hidden shrink-0 overflow-hidden lg:sticky lg:top-2 lg:block lg:h-[calc(100dvh-80px)]"
            aria-hidden={!sideOpen}
          >
            <motion.div
              initial={false}
              animate={{ x: sideOpen ? 0 : 60 }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              className="h-full w-[356px] pl-4"
            >
              <Sidebar game={game} />
            </motion.div>
          </motion.aside>
        </main>
        <AdSlot slot="spiel-rechts" className="order-3" />
      </div>

      <EmoteButton />
      <SidebarDrawer game={game} />
      <AnimatePresence>{game.phase === "gameOver" && <GameOverModal game={game} me={me} onLeave={toMenu} />}</AnimatePresence>
    </div>
  );
}

/** Glühendes Abzeichen im Orakel-Modus. */
export function OracleBadge() {
  const { t } = useGameText(null);
  return (
    <motion.span
      animate={{ boxShadow: ["0 0 8px #a855f7", "0 0 20px #c084fc", "0 0 8px #a855f7"] }}
      transition={{ repeat: Infinity, duration: 2.2 }}
      className="font-display text-stroke flex items-center gap-1 rounded-lg border-2 border-[#1b1630] bg-gradient-to-r from-purple-600 to-fuchsia-600 px-2 py-1 text-[11px] text-white sm:text-xs"
    >
      <Eye className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{t("oracle.badge")}</span>
    </motion.span>
  );
}

function IconButton({ children, onClick, label, className = "" }: { children: React.ReactNode; onClick: () => void; label: string; className?: string }) {
  return (
    <button
      onClick={() => {
        haptics.tap();
        onClick();
      }}
      title={label}
      aria-label={label}
      className={`chunky-btn chunky-dark flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm sm:px-3 ${className}`}
    >
      {children}
    </button>
  );
}

/** Fortschritt beider Teams – eigenes Team zuerst. Auf dem Handy als kompakte Zahl, ab sm mit acht Lichtpunkten. */
function TeamScore({ game, me }: { game: GameState; me: number }) {
  const { t } = useGameText(game);
  const count = (team: number) => game.marbles.filter((m) => teamOf(m.color) === team && isHome(m.pos)).length;
  const mine = teamOf(me);
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold sm:gap-3 sm:text-sm">
      {[mine, 1 - mine].map((team) => {
        const label = team === mine ? t("score.mine") : t("score.them");
        return (
          <div
            key={team}
            className={`flex items-center gap-1.5 rounded-full px-2 py-1 sm:gap-2 sm:px-3 ${team === mine ? "bg-emerald-950/50" : "bg-blue-950/50"} ring-1 ring-amber-200/10`}
            title={label}
          >
            <span className="flex -space-x-1">
              <span className="h-3 w-3 rounded-full ring-1 ring-black/40" style={{ background: PLAYER_COLORS[team].hex }} />
              <span className="h-3 w-3 rounded-full ring-1 ring-black/40" style={{ background: PLAYER_COLORS[team + 2].hex }} />
            </span>
            <span className="hidden text-amber-100/80 md:inline">{label}</span>
            <span className="font-display text-amber-100 sm:hidden">{count(team)}/8</span>
            <span className="hidden gap-0.5 sm:flex">
              {Array.from({ length: 8 }, (_, i) => (
                <motion.span
                  key={i}
                  animate={i < count(team) ? { scale: [1.8, 1] } : { scale: 1 }}
                  className={`h-2 w-2 rounded-full ${i < count(team) ? "bg-amber-300 shadow-[0_0_6px_#fcd34d]" : "bg-white/15"}`}
                />
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Banner über dem Brett: „Runde n“ nach dem Geben und „Dein Zug!“ bzw. „Zug des Orakels!“, sobald du dran bist. */
function TurnBanner({ game, humanTurn, me }: { game: GameState; humanTurn: boolean; me: number }) {
  const { t } = useGameText(game);
  const [banner, setBanner] = useState<{ key: string; text: string; sub?: string } | null>(null);

  useEffect(() => {
    if (game.dealNumber < 1) return;
    setBanner({ key: `deal-${game.dealNumber}`, text: t("banner.round", { n: game.dealNumber }), sub: t("banner.swap") });
  }, [game.dealNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!humanTurn || game.phase !== "play") return;
    const oracle = decider(game) !== me;
    setBanner({ key: `turn-${game.moveCounter}`, text: t(oracle ? "banner.oracleTurn" : "banner.yourTurn") });
  }, [humanTurn, game.phase, game.mode === "oracle" ? game.current : 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), banner.sub ? 1600 : 1100);
    return () => clearTimeout(timer);
  }, [banner]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[17%] z-30 flex justify-center overflow-hidden">
      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner.key}
            initial={{ x: "-120%", skewX: -12 }}
            animate={{ x: 0, skewX: -12 }}
            exit={{ x: "120%", skewX: -12, transition: { duration: 0.25, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="border-y-[3px] border-[#1b1630] bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0 px-16 py-1.5 text-center"
          >
            <div style={{ transform: "skewX(12deg)" }}>
              <div className="font-display text-stroke-lg text-3xl leading-none text-white sm:text-4xl">{banner.text}</div>
              {banner.sub && <div className="font-display text-stroke mt-0.5 text-xs text-amber-50 sm:text-sm">{banner.sub}</div>}
            </div>
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

/** Ablagestapel in der Brettmitte – Karten fliegen aus der Richtung des Spielers herein. */
function CenterPile({ game }: { game: GameState }) {
  const pile = game.discardPile.slice(-4);
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[24%] w-[24%] -translate-x-1/2 -translate-y-1/2">
      <div className="relative flex h-full w-full items-center justify-center">
        <AnimatePresence>
          {pile.map((e, i) => {
            const r = relSeat(e.player);
            return (
              <motion.div
                key={e.card.id}
                initial={{ opacity: 0, scale: 1.6, y: r === 0 ? 160 : r === 2 ? -160 : 0, x: r === 1 ? -160 : r === 3 ? 160 : 0 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0, rotate: hashRot(e.card.id) }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                className="absolute"
                style={{ zIndex: i }}
              >
                <div className="scale-[0.5] sm:scale-[0.6] lg:scale-[0.72]">
                  <CardFace value={e.card.value} size="md" />
                </div>
                {i === pile.length - 1 && (
                  <span
                    className="absolute -bottom-1 left-1/2 h-2 w-8 -translate-x-1/2 rounded-full"
                    style={{ background: PLAYER_COLORS[e.player].hex, boxShadow: `0 0 10px ${PLAYER_COLORS[e.player].hex}` }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function GameOverModal({ game, me, onLeave }: { game: GameState; me: number; onLeave: () => void }) {
  const start = useGameStore((s) => s.start);
  const settings = useGameStore((s) => s.settings);
  const router = useRouter();
  const { t } = useGameText(game);
  const won = game.winner === teamOf(me);
  const team = t(game.winner === 1 ? "team.1" : "team.0");
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.6 }}
        className="w-full max-w-md rounded-3xl border border-amber-200/30 bg-gradient-to-b from-[#2a3170] to-[#171c3f] p-8 text-center shadow-2xl"
      >
        <div className="mb-4 flex items-end justify-center gap-2">
          <MoodLoop game={game} player={game.winner ?? 0} />
          <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}>
            <Trophy className={`h-16 w-16 ${won ? "text-amber-300 drop-shadow-[0_0_20px_#fcd34d]" : "text-stone-400"}`} />
          </motion.div>
          <MoodLoop game={game} player={(game.winner ?? 0) + 2} />
        </div>
        <h2 className="font-display text-stroke-lg text-5xl text-amber-200">{won ? t("over.won") : t("over.lost")}</h2>
        <p className="mt-2 text-amber-100/70">
          {t("over.text", { team })}
          {won ? t("over.teamwork") : "."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {/* Im Freunde-Modus startet der Gastgeber neu über die Lobby */}
          {game.mode !== "friends" && (
            <button onClick={() => router.replace(`/spiel/${start(settings)}`)} className="chunky-btn chunky-green flex items-center gap-2 rounded-2xl px-6 py-3 text-lg">
              <RotateCcw className="h-4 w-4" /> {t("over.again")}
            </button>
          )}
          <button onClick={onLeave} className="chunky-btn chunky-dark rounded-2xl px-6 py-3 text-lg">
            {t("over.menu")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Figur, die im Abschlussdialog immer wieder jubelt. */
function MoodLoop({ game, player }: { game: GameState; player: number }) {
  return (
    <motion.div animate={{ y: [0, -14, 0] }} transition={{ repeat: Infinity, duration: 0.9, ease: "easeOut", delay: player * 0.15 }}>
      <Character look={lookOf(game.players[player].persona)} color={player} mood="happy" size={72} />
    </motion.div>
  );
}
