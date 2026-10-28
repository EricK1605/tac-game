"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightLeft, Ban, Eye, Flame, Hourglass, RotateCcw, SkipForward, Trash2, Undo2, Users } from "lucide-react";
import type { Card, GameState, Move } from "@/types/game";
import { swapSeat, useGameStore } from "@/store/gameStore";
import { PLAYER_COLORS, partnerOf } from "@/lib/engine/constants";
import { decider, hiddenCards } from "@/lib/engine/moves";
import { haptics } from "@/lib/haptics";
import { useGameText } from "@/lib/useI18n";
import { CardBack, CardFace } from "./CardView";
import type { useTurnControls } from "./useTurnControls";

type Controls = ReturnType<typeof useTurnControls>;

export function HandArea({ game, controls }: { game: GameState; controls: Controls }) {
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const selectCard = useGameStore((s) => s.selectCard);
  const chooseSwap = useGameStore((s) => s.chooseSwap);
  const seven = useGameStore((s) => s.seven);
  const resetSeven = useGameStore((s) => s.resetSeven);
  const playMove = useGameStore((s) => s.playMove);
  const mySeats = useGameStore((s) => s.mySeats);
  const { t, name, card } = useGameText(game);
  const me = mySeats[0] ?? 0;

  const swapPhase = game.phase === "swap";
  // Beim Tauschen: der Platz, der noch wählen muss (Orakel: erst du, dann das Orakel)
  const swapFor = swapPhase ? swapSeat(game, mySeats) : null;
  const waitingForSwap = swapPhase && swapFor === null;
  const owner = swapFor ?? (controls.humanTurn ? controls.handOwner : me);
  const hand: Card[] = game.players[owner].hand;
  const foreignHand = owner !== me;
  const hidden = hiddenCards(game);

  const isPlayable = (c: Card) => {
    if (swapPhase) return !waitingForSwap;
    if (!controls.humanTurn) return false;
    return controls.playable.has(c.id);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Anweisung und Aktions-Knöpfe teilen sich eine Zeile, damit das Brett mehr Höhe bekommt */}
      <div className="flex min-h-[2.5rem] flex-wrap items-center justify-center gap-2">
        <InstructionBar game={game} controls={controls} swapFor={swapFor} />
        {swapPhase && selectedCardId && swapFor !== null && (
          <ActionButton onClick={() => chooseSwap(selectedCardId)} icon={<ArrowRightLeft className="h-4 w-4" />} primary>
            {swapFor === me ? t("hand.swapGive", { name: name(partnerOf(me)) }) : t("hand.swapTake")}
          </ActionButton>
        )}
        {seven && (
          <>
            <span className="font-display text-stroke rounded-xl border-[3px] border-[#1b1630] bg-gradient-to-b from-red-500 to-red-800 px-3 py-1.5 text-sm text-white">
              {t("hand.seven", { n: seven.remaining, steps: t(seven.remaining === 1 ? "hand.step" : "hand.steps") })}
            </span>
            {seven.segments.length > 0 && (
              <ActionButton onClick={resetSeven} icon={<RotateCcw className="h-4 w-4" />}>
                {t("hand.reset")}
              </ActionButton>
            )}
          </>
        )}
        {controls.buttons.map((m) => (
          <MoveButton key={m.id} move={m} game={game} onClick={() => playMove(m)} />
        ))}
      </div>

      {foreignHand && (
        <div className="font-display text-stroke flex items-center gap-1 text-sm uppercase tracking-wider" style={{ color: PLAYER_COLORS[owner].light }}>
          {game.players[owner].persona === "orakel" ? <Eye className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5" />} {t("hand.cardsOf", { name: name(owner) })}
        </div>
      )}

      <div className="relative flex h-28 items-start justify-center pt-4 sm:h-32" style={{ perspective: 800 }}>
        <AnimatePresence initial={false}>
          {hand.map((c, i) => {
            const n = hand.length;
            const offset = i - (n - 1) / 2;
            const selected = c.id === selectedCardId;
            const playable = isPlayable(c);
            return (
              <motion.button
                key={c.id}
                layout
                initial={{ y: 120, opacity: 0, rotate: 0 }}
                animate={{
                  y: selected ? -20 : Math.abs(offset) * 5,
                  rotate: offset * 5,
                  opacity: 1,
                  scale: selected ? 1.06 : 1,
                }}
                exit={{ y: -220, opacity: 0, scale: 0.7, transition: { duration: 0.3 } }}
                whileHover={playable ? { y: selected ? -24 : -12, scale: 1.05 } : undefined}
                whileTap={playable ? { scale: 0.94 } : { x: [0, -4, 4, -2, 0], transition: { duration: 0.25 } }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                onClick={() => (playable ? selectCard(c.id) : haptics.tap())}
                aria-disabled={!playable}
                className={`relative -mx-1.5 origin-bottom sm:-mx-1 ${playable ? "cursor-pointer" : "cursor-not-allowed"}`}
                style={{ zIndex: selected ? 50 : i }}
                aria-label={hidden.has(c.id) ? t("hand.hidden") : t("hand.card", { card: card(c.value) })}
              >
                {hidden.has(c.id) ? (
                  <CardBack className={`h-20 w-14 rounded-lg sm:h-[5.6rem] sm:w-16 sm:rounded-xl ${selected ? "ring-4 ring-amber-300 ring-offset-2 ring-offset-transparent" : ""}`} />
                ) : (
                  <CardFace value={c.value} size="hand" dimmed={!playable && (controls.humanTurn || swapPhase)} selected={selected} />
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
        {hand.length === 0 && <div className="pb-10 text-sm italic text-amber-100/50">{t("hand.empty")}</div>}
      </div>
    </div>
  );
}

function InstructionBar({ game, controls, swapFor }: { game: GameState; controls: Controls; swapFor: number | null }) {
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const thinking = useGameStore((s) => s.thinking);
  const me = useGameStore((s) => s.mySeats[0] ?? 0);
  const { t, name, card } = useGameText(game);
  let text: string;
  let tone = "bg-black/50 text-amber-50 border-black/60";
  const owner = controls.humanTurn ? controls.handOwner : me;
  const selected = game.players[owner].hand.find((c) => c.id === selectedCardId);
  const d = game.phase === "play" ? decider(game) : me;
  const forOracle = controls.humanTurn && d !== me;

  if (game.phase === "swap") {
    text = swapFor === null ? t("ins.waitSwap") : swapFor === me ? t("ins.swap", { name: name(partnerOf(me)) }) : t("ins.swapOracle");
    tone = "bg-gradient-to-b from-emerald-500 to-emerald-800 text-white border-[#1b1630]";
  } else if (game.phase === "gameOver") {
    text = t("ins.over");
  } else if (!controls.humanTurn) {
    text = t("ins.turnOf", { name: name(d) }) + (thinking ? " …" : "");
  } else {
    tone = forOracle
      ? "bg-gradient-to-b from-purple-500 to-fuchsia-700 text-white border-[#1b1630]"
      : "bg-gradient-to-b from-amber-400 to-orange-600 text-white border-[#1b1630]";
    const hint = selected ? t(`hint.${String(selected.value)}` as Parameters<typeof t>[0]) : "";
    if (game.pendingWin !== null) text = t("ins.lastTac");
    else if (game.subTurn?.type === "devil") text = t("ins.devil", { name: name(game.subTurn.target) });
    else if (game.subTurn?.type === "jester") text = t("ins.jester");
    else if (game.skipPending) text = t("ins.skip");
    else if (controls.mustDiscard) text = t("ins.mustDiscard");
    else if (!selected) text = t(forOracle ? "ins.pickOracle" : "ins.pick");
    else if (!controls.moves.some((m) => m.cardId === selected.id)) text = t("ins.blindVoid", { card: card(selected.value) });
    else if (controls.segmentsLeft) text = t("ins.seven");
    else if (controls.selectable.size) text = t("ins.tapMarble", { card: card(selected.value), hint });
    else text = t("ins.cardHint", { card: card(selected.value), hint });
  }

  return (
    <motion.div
      key={text}
      initial={{ opacity: 0, y: 6, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 26 }}
      className={`font-display text-stroke max-w-[95vw] rounded-xl border-[3px] px-4 py-1.5 text-center text-sm shadow-[0_3px_0_rgba(0,0,0,0.4)] sm:text-[15px] ${tone}`}
    >
      {!controls.humanTurn && game.phase === "play" && <Hourglass className="mr-1.5 inline h-3.5 w-3.5 animate-spin [animation-duration:2s]" />}
      {text}
    </motion.div>
  );
}

function MoveButton({ move, game, onClick }: { move: Move; game: GameState; onClick: () => void }) {
  const { t, name, p } = useGameText(game);
  const next = name((game.current + 1) % 4);
  switch (move.kind) {
    case "skip":
      return (
        <ActionButton onClick={onClick} icon={<SkipForward className="h-4 w-4" />} primary>
          {move.tacUndo ? t("btn.tacPrefix") : ""}
          {t("btn.skip", { name: next })}
        </ActionButton>
      );
    case "discard":
      return (
        <ActionButton onClick={onClick} icon={<Trash2 className="h-4 w-4" />} danger>
          {t("btn.discard")}
        </ActionButton>
      );
    case "devil":
      return (
        <ActionButton onClick={onClick} icon={<Flame className="h-4 w-4" />} primary>
          {t("btn.devil", { name: next })}
        </ActionButton>
      );
    case "jester":
      return (
        <ActionButton onClick={onClick} icon={<Users className="h-4 w-4" />} primary>
          {t("btn.jester")}
        </ActionButton>
      );
    case "void":
      return (
        <ActionButton onClick={onClick} icon={<Ban className="h-4 w-4" />}>
          {t("btn.void")}
        </ActionButton>
      );
    default:
      return (
        <ActionButton onClick={onClick} icon={<Undo2 className="h-4 w-4" />} primary>
          {p(move.label)}
        </ActionButton>
      );
  }
}

function ActionButton({
  children,
  onClick,
  icon,
  primary,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <motion.button
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
      onClick={() => {
        haptics.tap();
        onClick();
      }}
      className={`chunky-btn flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm sm:text-base ${danger ? "chunky-red" : primary ? "chunky-green" : "chunky-dark"}`}
    >
      {icon}
      {children}
    </motion.button>
  );
}

export const colorHex = (p: number) => PLAYER_COLORS[p].hex;
