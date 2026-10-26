"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, MessageCircle, Smile, X } from "lucide-react";
import type { GameState } from "@/types/game";
import { EMOTES, useGameStore, type FxEvent } from "@/store/gameStore";
import { PLAYER_COLORS, teamOf } from "@/lib/engine/constants";
import { haptics } from "@/lib/haptics";
import { CardBack } from "./CardView";
import { Character, CHARACTER_TITLE, type Mood } from "./Character";
import { Sidebar } from "./Sidebar";

/** Portrait-Plätze am Brettrand – seitlich versetzt, damit Start- und Vorfelder frei bleiben. */
const PORTRAIT_POS = [
  { left: "50%", top: "96%" },
  { left: "5%", top: "34%" },
  { left: "50%", top: "4%" },
  { left: "95%", top: "66%" },
];

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

export function PlayerPortrait({ game, player, active }: { game: GameState; player: number; active: boolean }) {
  const p = game.players[player];
  const col = PLAYER_COLORS[player];
  const mood = useMood(player, active);
  const pos = PORTRAIT_POS[player];
  const skipped = active && game.skipPending;
  const below = player === 2;

  return (
    <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: pos.left, top: pos.top }}>
      <div className={`flex items-center ${player === 0 || player === 2 ? "flex-row gap-1" : "flex-col"}`}>
        <div className="relative">
          {/* Leuchtring für den aktiven Spieler */}
          {active && (
            <motion.div
              className="absolute inset-[-6px] rounded-full"
              style={{ background: `radial-gradient(circle, ${col.hex}aa 0%, transparent 70%)` }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
          )}
          <div
            className="relative overflow-visible rounded-full border-[3px] bg-gradient-to-b from-[#5b7fd6] to-[#2b3f7a] shadow-[0_4px_0_rgba(0,0,0,0.45)]"
            style={{ borderColor: active ? "#fde047" : col.dark }}
          >
            <div className="h-11 w-11 sm:h-14 sm:w-14">
              <Character player={player} mood={mood} size={56} className="!h-full !w-full [&>svg]:h-full [&>svg]:w-full" />
            </div>
          </div>
          <EmoteBubble player={player} below={below} />
          <ChatBubble player={player} below={below} />
        </div>

        <div className="flex flex-col items-center">
          <span
            className="font-display rounded-md px-1.5 py-0.5 text-[11px] leading-none text-white text-stroke shadow-[0_2px_0_rgba(0,0,0,0.4)] sm:text-[13px]"
            style={{ background: `linear-gradient(${col.light}, ${col.hex} 45%, ${col.dark})` }}
          >
            {p.name}
            {teamOf(player) === 0 && player !== 0 && <Crown className="ml-0.5 inline h-3 w-3 text-amber-200" aria-label="Partner" />}
          </span>
          <span className="hidden text-[9px] font-bold uppercase tracking-wider text-amber-100/60 sm:block">{CHARACTER_TITLE[player]}</span>
          {player !== 0 && (
            <span className="mt-0.5 flex -space-x-1.5">
              {p.hand.map((c) => (
                <CardBack key={c.id} mini className="h-3.5 w-2.5 !rounded-[2px] ring-1 ring-black/30" />
              ))}
            </span>
          )}
          {skipped && <span className="font-display mt-0.5 rounded bg-red-600 px-1 text-[10px] text-white text-stroke">setzt aus</span>}
        </div>
      </div>
    </div>
  );
}

/** Emote springt wie eine Sprechblase über der Figur auf. */
function EmoteBubble({ player, below }: { player: number; below: boolean }) {
  const last = useGameStore((s) => {
    for (let i = s.emotes.length - 1; i >= 0; i--) if (s.emotes[i].player === player) return s.emotes[i];
    return null;
  });
  const [shown, setShown] = useState<{ id: number; emoji: string } | null>(null);

  useEffect(() => {
    if (!last || Date.now() - last.time > 2500) return;
    setShown({ id: last.id, emoji: last.emoji });
    const t = setTimeout(() => setShown(null), 2200);
    return () => clearTimeout(t);
  }, [last?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          key={shown.id}
          initial={{ scale: 0, y: below ? -10 : 10, rotate: -20 }}
          animate={{ scale: [0, 1.35, 1], y: 0, rotate: [-20, 10, 0] }}
          exit={{ scale: 0, opacity: 0, transition: { duration: 0.18 } }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className={`absolute left-1/2 z-30 -translate-x-1/2 ${below ? "top-full mt-1" : "bottom-full mb-1"}`}
        >
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-[#1b1630] bg-white text-3xl shadow-[0_4px_0_rgba(0,0,0,0.4)] sm:h-14 sm:w-14 sm:text-4xl">
            {shown.emoji}
            <span
              className={`absolute left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-[#1b1630] bg-white ${
                below ? "-top-[8px] border-l-[3px] border-t-[3px]" : "-bottom-[8px] border-b-[3px] border-r-[3px]"
              }`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Text-Nachrichten der Bots als kleine Blase neben dem Portrait. */
function ChatBubble({ player, below }: { player: number; below: boolean }) {
  const last = useGameStore((s) => {
    for (let i = s.chat.length - 1; i >= 0; i--) if (s.chat[i].player === player) return s.chat[i];
    return null;
  });
  const [bubble, setBubble] = useState<string | null>(null);

  useEffect(() => {
    if (!last || Date.now() - last.time > 4000) return;
    setBubble(last.text);
    const t = setTimeout(() => setBubble(null), 3200);
    return () => clearTimeout(t);
  }, [last?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const side = player === 1 ? "left-full top-0 ml-2" : player === 3 ? "right-full top-0 mr-2" : below ? "left-full top-1/2 ml-2 -translate-y-1/2" : "left-full top-0 ml-2";
  return (
    <AnimatePresence>
      {bubble && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={`absolute z-20 w-max max-w-[150px] rounded-xl border-2 border-[#1b1630] bg-white px-2.5 py-1 text-[11px] font-bold text-stone-800 shadow-[0_3px_0_rgba(0,0,0,0.35)] sm:text-xs ${side}`}
        >
          {bubble}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const FX_STYLE: Record<FxEvent["kind"], { text: string; from: string; to: string; glow: string }> = {
  kick: { text: "RAUSGEWORFEN!", from: "#ff6b6b", to: "#b91c1c", glow: "#ef4444" },
  home: { text: "IM HAUS!", from: "#fff3a0", to: "#f59e0b", glow: "#fcd34d" },
  tac: { text: "TAC!", from: "#e9b5ff", to: "#7c3aed", glow: "#a855f7" },
  win: { text: "SIEG!", from: "#fff3a0", to: "#f59e0b", glow: "#fcd34d" },
};

/** Große Einblendung über dem Brett (Kick, Haus, TAC, Sieg) inklusive Partikel. */
export function FxOverlay({ game }: { game: GameState }) {
  const fx = useGameStore((s) => s.fx);
  const [shown, setShown] = useState<FxEvent | null>(null);

  useEffect(() => {
    if (!fx) return;
    setShown(fx);
    const t = setTimeout(() => setShown(null), fx.kind === "win" ? 2400 : 1300);
    return () => clearTimeout(t);
  }, [fx?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const style = shown ? FX_STYLE[shown.kind] : null;
  const text = shown?.kind === "win" ? (shown.player === 0 ? "SIEG!" : "NIEDERLAGE") : style?.text;
  const sub =
    shown?.kind === "kick"
      ? `${game.players[shown.player].name} schlägt ${shown.victims.map((v) => game.players[v].name).join(" & ")}`
      : shown?.kind === "home"
        ? `${game.players[shown.player].name} bringt eine Kugel heim`
        : shown?.kind === "tac"
          ? `${game.players[shown.player].name} nimmt den Zug zurück`
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

  const send = (e: string) => {
    if (cooldown) return;
    emote(e);
    setOpen(false);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 1800);
  };

  return (
    <div className="fixed bottom-3 left-3 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className="absolute bottom-full left-0 mb-2 grid origin-bottom-left grid-cols-5 gap-1.5 rounded-2xl border-[3px] border-[#1b1630] bg-gradient-to-b from-[#5a76c9] to-[#2c3d78] p-2 shadow-[0_5px_0_rgba(0,0,0,0.45)]"
          >
            {EMOTES.map((e, i) => (
              <motion.button
                key={e}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.02, type: "spring", stiffness: 500, damping: 18 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => send(e)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#1b1630] bg-white text-2xl shadow-[0_3px_0_rgba(0,0,0,0.35)] active:translate-y-0.5 active:shadow-none"
                aria-label={`Emote ${e}`}
              >
                {e}
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
        aria-label="Emotes"
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
        className="chunky-btn chunky-gold fixed bottom-3 right-3 z-40 flex h-14 w-14 items-center justify-center rounded-2xl"
        aria-label="Spielverlauf und Chat"
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
              className="fixed inset-x-0 bottom-0 z-50 flex h-[72dvh] flex-col rounded-t-3xl border-t-[3px] border-[#1b1630] bg-[#1c120b] p-2 pt-1 shadow-2xl"
            >
              <div className="mx-auto my-2 h-1.5 w-12 shrink-0 rounded-full bg-amber-100/30" />
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
