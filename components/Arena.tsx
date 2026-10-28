"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown, Flag, MessageCircle, Smile, X } from "lucide-react";
import type { GameState } from "@/types/game";
import { EMOTES, useGameStore, type EmoteId, type FxEvent } from "@/store/gameStore";
import { PLAYER_COLORS, nextPlayer, teamOf } from "@/lib/engine/constants";
import { haptics } from "@/lib/haptics";
import { relSeat } from "@/lib/layout";
import { lookOf, personaById } from "@/lib/personas";
import { useGameText, useT } from "@/lib/useI18n";
import { LangSwitch } from "./LangSwitch";
import { CardBack } from "./CardView";
import { Character, type Mood } from "./Character";
import { Sidebar } from "./Sidebar";

/**
 * Spielerkarten sitzen außerhalb des Bretts an der Ecke ihres Vorfelds:
 * schmal (Handy, Tablet) über bzw. unter dem Brett, breit (xl) links bzw. rechts daneben.
 * Schlüssel = Platz aus Sicht des Betrachters (0 = unten, 1 = links, 2 = oben, 3 = rechts).
 */
const PLATE_POS: Record<number, string> = {
  2: "bottom-full left-0 mb-2 xl:bottom-auto xl:top-0 xl:left-auto xl:right-full xl:mb-0 xl:mr-5",
  3: "bottom-full right-0 mb-2 xl:bottom-auto xl:top-0 xl:right-auto xl:left-full xl:mb-0 xl:ml-5",
  1: "top-full left-0 mt-2 xl:top-auto xl:bottom-0 xl:left-auto xl:right-full xl:mt-0 xl:mr-5",
  0: "top-full right-0 mt-2 xl:top-auto xl:bottom-0 xl:right-auto xl:left-full xl:mt-0 xl:ml-5",
};

/** Liegt die Spielerkarte oberhalb des Bretts? Dann zeigen Blasen nach unten (zum Brett hin). */
const isTopSeat = (p: number) => relSeat(p) === 2 || relSeat(p) === 3;
/** Rechte Spielerkarten werden gespiegelt, damit der Avatar außen sitzt. */
const isRightSeat = (p: number) => relSeat(p) === 0 || relSeat(p) === 3;

/** Aktuelle Stimmung einer Figur – läuft nach `until` automatisch zurück auf idle bzw. „denkt nach“. */
function useMood(player: number, active: boolean): Mood {
  const entry = useGameStore((s) => s.moods[player]);
  const thinking = useGameStore((s) => s.thinking);
  const [, tick] = useState(0);
  const remaining = entry.until - Date.now();
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => tick((n) => n + 1), remaining + 20);
    return () => clearTimeout(t);
  }, [entry, remaining]);
  if (remaining > 0) return entry.mood;
  return active && thinking && player !== 0 ? "think" : "idle";
}

export function PlayerPlate({ game, player, active }: { game: GameState; player: number; active: boolean }) {
  const p = game.players[player];
  const col = PLAYER_COLORS[player];
  const mood = useMood(player, active);
  const thinking = useGameStore((s) => s.thinking) && active && player !== 0;
  const skipped = active && game.skipPending;
  const right = isRightSeat(player);
  const { t, lang, name } = useGameText(game);
  const me = useGameStore((s) => s.mySeats[0] ?? 0);
  const title = personaById(p.persona)?.[lang].title ?? t("plate.ritter");
  // Wer diese Runde beginnt und wer laut Meldung rauskommen kann
  const starter = game.phase !== "gameOver" && nextPlayer(game.dealer) === player;
  const canOpen = game.phase === "gameOver" ? null : game.announcements[player];

  return (
    <div className={`pointer-events-none absolute z-20 max-w-[49%] xl:w-36 xl:max-w-none ${PLATE_POS[relSeat(player)]}`}>
      <motion.div
        animate={{ scale: active ? 1.04 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`relative flex items-center gap-2 rounded-2xl border-2 p-1.5 pr-3 shadow-[0_6px_18px_rgba(0,0,0,0.45)] backdrop-blur-md xl:flex-col xl:gap-1 xl:p-2.5 xl:text-center ${
          right ? "flex-row-reverse pl-3 pr-1.5 text-right" : ""
        }`}
        style={{
          borderColor: active ? "#fde047" : `${col.hex}88`,
          background: `linear-gradient(${right ? "250deg" : "110deg"}, ${col.dark}ee, rgba(16,18,42,0.88) 70%)`,
          boxShadow: active ? `0 0 0 3px ${col.hex}55, 0 0 22px ${col.hex}aa, 0 6px 18px rgba(0,0,0,0.45)` : undefined,
        }}
      >
        <div className="relative shrink-0">
          {active && (
            <motion.div
              className="absolute -inset-1.5 rounded-full"
              style={{ background: `radial-gradient(circle, ${col.hex}cc 0%, transparent 70%)` }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
          )}
          <div
            className="pointer-events-auto relative h-11 w-11 overflow-hidden rounded-full border-[3px] bg-gradient-to-b from-[#5b7fd6] to-[#2b3f7a] xl:h-16 xl:w-16"
            style={{ borderColor: active ? "#fde047" : col.hex }}
          >
            {/* Brustbild: Figur größer und unten angeschnitten, damit Gesicht und Hut gut zu sehen sind */}
            <Character
              look={lookOf(p.persona)}
              color={player}
              mood={mood}
              size={64}
              className="!absolute left-1/2 top-[-5%] !h-[130%] !w-[110%] -translate-x-1/2 [&>svg]:h-full [&>svg]:w-full"
            />
          </div>
          {starter && (
            <span
              title={t("plate.starts")}
              aria-label={t("plate.starts")}
              className={`absolute -bottom-1 grid h-5 w-5 place-items-center rounded-full border-2 border-[#1b1630] bg-amber-300 text-[#1b1630] shadow ${right ? "-right-1" : "-left-1"}`}
            >
              <Flag className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
          )}
          <EmotePulse player={player} color={col.hex} />
        </div>

        <div className={`flex min-w-0 flex-col ${right ? "items-end" : "items-start"} xl:items-center`}>
          {/* max-w-full: lange Namen/Titel werden gekürzt statt aus der Karte zu ragen */}
          <span className="font-display text-stroke flex max-w-full items-center gap-1 text-[13px] leading-tight text-white sm:text-sm">
            <span className="truncate">{name(player)}</span>
            {teamOf(player) === teamOf(me) && player !== me && <Crown className="h-3 w-3 shrink-0 text-amber-300" aria-label={t("plate.partner")} />}
          </span>
          <span className="block max-w-full truncate text-[9px] font-bold uppercase leading-tight tracking-wider" style={{ color: col.light }}>
            {title}
          </span>
          <div className={`mt-0.5 flex h-4 items-center gap-1 ${right ? "flex-row-reverse" : ""}`}>
            {canOpen !== null && (
              <span
                title={t(canOpen ? "plate.canOpen" : "plate.cannotOpen")}
                aria-label={t(canOpen ? "plate.canOpen" : "plate.cannotOpen")}
                className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full ${canOpen ? "bg-emerald-500 text-white" : "bg-black/50 text-red-300"}`}
              >
                {canOpen ? <Check className="h-2.5 w-2.5" strokeWidth={3.5} /> : <X className="h-2.5 w-2.5" strokeWidth={3.5} />}
              </span>
            )}
            <AnimatePresence mode="wait" initial={false}>
              {skipped ? (
                <Status key="skip" className="bg-red-600">{t("plate.skip")}</Status>
              ) : thinking ? (
                <Status key="think" className="bg-black/40">
                  <ThinkingDots />
                </Status>
              ) : (
                <motion.span key="cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex -space-x-1.5">
                  {p.hand.map((c) => (
                    <CardBack key={c.id} mini className="h-3.5 w-2.5 !rounded-[2px] ring-1 ring-black/30" />
                  ))}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <ChatBubble player={player} />
      </motion.div>
    </div>
  );
}

function Status({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      className={`font-display text-stroke rounded px-1.5 text-[10px] leading-4 text-white ${className}`}
    >
      {children}
    </motion.span>
  );
}

function ThinkingDots() {
  return (
    <span className="flex items-center gap-0.5 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-amber-200"
          animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

/**
 * Emote: Die Figur im Avatar spielt es selbst – dazu nur ein kurzer Ring, der vom Avatar wegpulsiert.
 * Eine zweite Figur in einer Blase wäre doppelt und würde am Handy aufs Brett ragen.
 */
function EmotePulse({ player, color }: { player: number; color: string }) {
  const last = useGameStore((s) => {
    for (let i = s.emotes.length - 1; i >= 0; i--) if (s.emotes[i].player === player) return s.emotes[i];
    return null;
  });
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    if (!last || Date.now() - last.time > 2500) return;
    setShown(last.id);
    const t = setTimeout(() => setShown(null), 1300);
    return () => clearTimeout(t);
  }, [last?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {shown !== null &&
        [0, 0.35].map((delay) => (
          <motion.span
            key={`${shown}-${delay}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border-[3px]"
            style={{ borderColor: color }}
            initial={{ scale: 1, opacity: 0.9 }}
            animate={{ scale: 1.7, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, delay, ease: "easeOut" }}
          />
        ))}
    </AnimatePresence>
  );
}

/**
 * Text-Nachrichten als Sprechblase. Am Handy liegt sie in der Spielerkarte über Name und Titel – so ragt sie nicht aufs Brett.
 * Breit (Karten neben dem Brett) sitzt sie unter bzw. über der Karte.
 */
function ChatBubble({ player }: { player: number }) {
  const last = useGameStore((s) => {
    for (let i = s.chat.length - 1; i >= 0; i--) if (s.chat[i].player === player) return s.chat[i];
    return null;
  });
  const [bubble, setBubble] = useState<{ id: number; text: string } | null>(null);
  const down = isTopSeat(player);
  const right = isRightSeat(player);

  useEffect(() => {
    if (!last || Date.now() - last.time > 4000) return;
    setBubble({ id: last.id, text: last.text });
    const t = setTimeout(() => setBubble(null), 3000);
    return () => clearTimeout(t);
  }, [last?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {bubble && (
        <motion.div
          key={bubble.id}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className={`absolute z-30 flex items-center rounded-xl border-2 border-[#1b1630] bg-white px-2 py-0.5 text-[10.5px] font-bold leading-[1.15] text-stone-800 shadow-[0_3px_0_rgba(0,0,0,0.3)] ${
            right ? "left-1 right-[3.3rem] origin-right" : "left-[3.3rem] right-1 origin-left"
          } inset-y-1 xl:inset-y-auto xl:left-1/2 xl:right-auto xl:w-max xl:max-w-[170px] xl:-translate-x-1/2 xl:rounded-2xl xl:px-3 xl:py-1.5 xl:text-xs xl:leading-snug ${
            down ? "xl:top-full xl:mt-2" : "xl:bottom-full xl:mb-2"
          }`}
        >
          <span className="line-clamp-3 xl:line-clamp-none">{bubble.text}</span>
          {/* Spitze: am Handy zum Avatar, breit zur Karte */}
          <span
            className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-[#1b1630] bg-white xl:hidden ${
              right ? "-right-[7px] border-r-2 border-t-2" : "-left-[7px] border-b-2 border-l-2"
            }`}
          />
          <span
            className={`absolute left-1/2 hidden h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-[#1b1630] bg-white xl:block ${
              down ? "-top-[7px] border-l-2 border-t-2" : "-bottom-[7px] border-b-2 border-r-2"
            }`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const FX_STYLE: Record<FxEvent["kind"], { from: string; to: string; glow: string }> = {
  kick: { from: "#ff6b6b", to: "#b91c1c", glow: "#ef4444" },
  home: { from: "#fff3a0", to: "#f59e0b", glow: "#fcd34d" },
  tac: { from: "#e9b5ff", to: "#7c3aed", glow: "#a855f7" },
  win: { from: "#fff3a0", to: "#f59e0b", glow: "#fcd34d" },
};

/** Große Einblendung über dem Brett (Kick, Haus, TAC, Sieg) inklusive Partikel. */
export function FxOverlay({ game }: { game: GameState }) {
  const fx = useGameStore((s) => s.fx);
  const me = useGameStore((s) => s.mySeats[0] ?? 0);
  const { t, name } = useGameText(game);
  const [shown, setShown] = useState<FxEvent | null>(null);

  useEffect(() => {
    if (!fx) return;
    setShown(fx);
    const timer = setTimeout(() => setShown(null), fx.kind === "win" ? 2400 : 1300);
    return () => clearTimeout(timer);
  }, [fx?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const style = shown ? FX_STYLE[shown.kind] : null;
  // Beim Sieg ist shown.player das Siegerteam
  const text = !shown ? "" : shown.kind === "win" ? t(shown.player === teamOf(me) ? "fx.win" : "fx.lose") : t(`fx.${shown.kind}`);
  const sub =
    shown?.kind === "kick"
      ? t("fx.kickSub", { who: name(shown.player), victims: shown.victims.map(name).join(" & ") })
      : shown?.kind === "home"
        ? t("fx.homeSub", { who: name(shown.player) })
        : shown?.kind === "tac"
          ? t("fx.tacSub", { who: name(shown.player) })
          : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-visible">
      <AnimatePresence>
        {shown && style && (
          <motion.div key={shown.id} className="relative flex flex-col items-center" exit={{ opacity: 0, scale: 1.3, transition: { duration: 0.25 } }}>
            {/* Lichtblitz */}
            <motion.div
              className="absolute h-64 w-64 rounded-full"
              style={{ background: `radial-gradient(circle, ${style.glow}cc 0%, transparent 65%)` }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
            <Burst color={style.glow} count={shown.kind === "win" ? 28 : 14} />
            <motion.div
              initial={{ scale: 3, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: -4 }}
              transition={{ type: "spring", stiffness: 500, damping: 14 }}
              className="font-display text-stroke-lg whitespace-nowrap text-5xl sm:text-7xl"
              style={{
                backgroundImage: `linear-gradient(${style.from}, ${style.to})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: `drop-shadow(0 5px 0 rgba(0,0,0,0.55)) drop-shadow(0 0 18px ${style.glow})`,
              }}
            >
              {text}
            </motion.div>
            {sub && (
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="font-display text-stroke mt-1 rounded-full bg-black/55 px-3 py-0.5 text-sm text-white sm:text-base"
              >
                {sub}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Burst({ color, count }: { color: string; count: number }) {
  const [parts] = useState(() =>
    Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const d = 90 + Math.random() * 110;
      return { x: Math.cos(a) * d, y: Math.sin(a) * d, s: 6 + Math.random() * 10, star: i % 3 === 0 };
    }),
  );
  return (
    <>
      {parts.map((p, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y + 30, scale: [0, 1.2, 0.6], opacity: [1, 1, 0], rotate: 180 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{
            width: p.s,
            height: p.s,
            background: p.star ? "#fff7c2" : color,
            borderRadius: p.star ? 2 : "50%",
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      ))}
    </>
  );
}

/** Emote-Knopf unten links mit aufklappendem Raster – wie im Arena-Kampf. */
export function EmoteButton() {
  const [open, setOpen] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const emote = useGameStore((s) => s.emote);
  const me = useGameStore((s) => s.mySeats[0] ?? 0);
  const look = useGameStore((s) => lookOf(s.game?.players[s.mySeats[0] ?? 0].persona));
  const { t } = useT();

  const send = (e: EmoteId) => {
    if (cooldown) return;
    emote(e);
    setOpen(false);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 1800);
  };

  return (
    <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            // w-max: sonst übernimmt das Raster die Breite des kleinen Knopfs und die Emojis liegen übereinander
            className="absolute bottom-full left-0 mb-2 grid w-max origin-bottom-left grid-cols-3 gap-1.5 rounded-2xl border-[3px] border-[#1b1630] bg-gradient-to-b from-[#5a76c9] to-[#2c3d78] p-2 shadow-[0_5px_0_rgba(0,0,0,0.45)]"
          >
            {EMOTES.map((e, i) => (
              <motion.button
                key={e}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.02, type: "spring", stiffness: 500, damping: 18 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => send(e)}
                className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-[#1b1630] bg-white shadow-[0_3px_0_rgba(0,0,0,0.35)] active:translate-y-0.5 active:shadow-none"
                aria-label={t(`emote.${e}`)}
                title={t(`emote.${e}`)}
              >
                <Character look={look} color={me} mood={e} size={40} className="-mt-1" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => {
          haptics.tap();
          setOpen((o) => !o);
        }}
        className={`chunky-btn chunky-blue relative flex h-14 w-14 items-center justify-center rounded-2xl ${cooldown ? "opacity-60" : ""}`}
        aria-label={t("aria.emotes")}
      >
        {open ? <X className="h-7 w-7" strokeWidth={3} /> : <Smile className="h-7 w-7" strokeWidth={2.6} />}
      </motion.button>
    </div>
  );
}

/** Auf kleinen Bildschirmen liegt Spielverlauf + Chat in einer Schublade. */
export function SidebarDrawer({ game }: { game: GameState }) {
  const open = useGameStore((s) => s.drawerOpen);
  const setOpen = useGameStore((s) => s.setDrawerOpen);
  const { t } = useT();
  const chatLen = useGameStore((s) => s.chat.length);
  const [seen, setSeen] = useState(chatLen);
  const unread = open ? 0 : Math.max(0, chatLen - seen);

  useEffect(() => {
    if (open) setSeen(chatLen);
  }, [open, chatLen]);

  return (
    <div className="lg:hidden">
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => {
          haptics.tap();
          setOpen(true);
        }}
        className="chunky-btn chunky-gold fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-40 flex h-14 w-14 items-center justify-center rounded-2xl"
        aria-label={t("aria.drawer")}
      >
        <MessageCircle className="h-7 w-7" strokeWidth={2.6} />
        {unread > 0 && (
          <motion.span
            key={unread}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="font-display text-stroke absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#1b1630] bg-red-500 px-1 text-xs text-white"
          >
            {unread}
          </motion.span>
        )}
      </motion.button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) setOpen(false);
              }}
              className="fixed inset-x-0 bottom-0 z-50 flex h-[72dvh] flex-col rounded-t-3xl border-t-[3px] border-[#1b1630] bg-[#171c3f] p-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl"
            >
              <div className="mx-auto my-2 h-1.5 w-12 shrink-0 rounded-full bg-amber-100/30" />
              {/* Auf dem Handy ist im Kopf kein Platz – hier lässt sich die Sprache wechseln */}
              <LangSwitch className="mx-auto mb-2 w-max" />
              <div className="min-h-0 flex-1">
                <Sidebar game={game} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
