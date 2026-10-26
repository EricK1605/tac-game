"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightLeft, Ban, Flame, Hourglass, RotateCcw, SkipForward, Trash2, Undo2, Users } from "lucide-react";
import type { Card, GameState, Move } from "@/types/game";
import { useGameStore } from "@/store/gameStore";
import { CARD_HINT, PLAYER_COLORS, cardLabel, partnerOf } from "@/lib/engine/constants";
import { decider } from "@/lib/engine/moves";
import { CardFace } from "./CardView";
import type { useTurnControls } from "./useTurnControls";

type Controls = ReturnType<typeof useTurnControls>;

export function HandArea({ game, controls }: { game: GameState; controls: Controls }) {
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const selectCard = useGameStore((s) => s.selectCard);
  const chooseSwap = useGameStore((s) => s.chooseSwap);
  const seven = useGameStore((s) => s.seven);
  const resetSeven = useGameStore((s) => s.resetSeven);
  const playMove = useGameStore((s) => s.playMove);

  const swapPhase = game.phase === "swap";
  const waitingForSwap = swapPhase && game.swapSelections[0] !== null;
  const owner = controls.humanTurn ? controls.handOwner : 0;
  const hand: Card[] = game.players[owner].hand;
  const foreignHand = owner !== 0;

  const isPlayable = (c: Card) => {
    if (swapPhase) return !waitingForSwap;
    if (!controls.humanTurn) return false;
    return controls.playable.has(c.id);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <InstructionBar game={game} controls={controls} />

      <div className="flex min-h-[2.5rem] flex-wrap items-center justify-center gap-2">
        {swapPhase && selectedCardId && !waitingForSwap && (
          <ActionButton onClick={() => chooseSwap(selectedCardId)} icon={<ArrowRightLeft className="h-4 w-4" />} primary>
            Karte an {game.players[partnerOf(0)].name} geben
          </ActionButton>
        )}
        {seven && (
          <>
            <span className="rounded-full bg-red-900/60 px-3 py-1.5 text-sm font-bold text-amber-100 ring-1 ring-red-400/40">
              7er: noch {seven.remaining} {seven.remaining === 1 ? "Schritt" : "Schritte"}
            </span>
            {seven.segments.length > 0 && (
              <ActionButton onClick={resetSeven} icon={<RotateCcw className="h-4 w-4" />}>
                Zurücksetzen
              </ActionButton>
            )}
          </>
        )}
        {controls.buttons.map((m) => (
          <MoveButton key={m.id} move={m} game={game} onClick={() => playMove(m)} />
        ))}
      </div>

      {foreignHand && (
        <div className="text-xs font-semibold uppercase tracking-wider text-red-300">
          <Flame className="mr-1 inline h-3.5 w-3.5" /> Karten von {game.players[owner].name}
        </div>
      )}

      <div className="relative flex h-36 items-start justify-center pt-4 sm:h-40" style={{ perspective: 800 }}>
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
                  y: selected ? -26 : Math.abs(offset) * 6,
                  rotate: offset * 5,
                  opacity: 1,
                  scale: selected ? 1.06 : 1,
                }}
                exit={{ y: -220, opacity: 0, scale: 0.7, transition: { duration: 0.3 } }}
                whileHover={playable ? { y: selected ? -30 : -14, scale: 1.05 } : undefined}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                onClick={() => playable && selectCard(c.id)}
                disabled={!playable}
                className={`relative -mx-2 origin-bottom sm:-mx-1.5 ${playable ? "cursor-pointer" : "cursor-not-allowed"}`}
                style={{ zIndex: selected ? 50 : i }}
                aria-label={`Karte ${cardLabel(c.value)}`}
              >
                <CardFace value={c.value} dimmed={!playable && (controls.humanTurn || swapPhase)} selected={selected} />
              </motion.button>
            );
          })}
        </AnimatePresence>
        {hand.length === 0 && <div className="pb-10 text-sm italic text-amber-100/50">Keine Karten auf der Hand</div>}
      </div>
    </div>
  );
}

function InstructionBar({ game, controls }: { game: GameState; controls: Controls }) {
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const thinking = useGameStore((s) => s.thinking);
  let text: string;
  let tone = "bg-black/40 text-amber-50";
  const owner = controls.humanTurn ? controls.handOwner : 0;
  const card = game.players[owner].hand.find((c) => c.id === selectedCardId);

  if (game.phase === "swap") {
    text = game.swapSelections[0]
      ? "Warte auf die anderen Spieler…"
      : `Tauschen: Wähle eine Karte für deinen Partner ${game.players[partnerOf(0)].name}`;
    tone = "bg-emerald-900/60 text-emerald-50 ring-1 ring-emerald-400/40";
  } else if (game.phase === "gameOver") {
    text = "Spiel beendet";
  } else if (!controls.humanTurn) {
    const d = decider(game);
    text = `${game.players[d].name} ist am Zug${thinking ? " …" : ""}`;
  } else {
    tone = "bg-amber-500/25 text-amber-50 ring-1 ring-amber-300/50";
    if (game.pendingWin !== null) text = "Das gegnerische Team ist fertig – nur dein TAC kann den Sieg noch verhindern!";
    else if (game.subTurn?.type === "devil") text = `Teufel: Spiele eine Karte von ${game.players[game.subTurn.target].name} für ${game.players[game.subTurn.target].name}`;
    else if (game.subTurn?.type === "jester") text = "Narr: Spiele sofort eine deiner neuen Karten";
    else if (game.skipPending) text = "Du musst aussetzen (8): Lege eine Karte ab – oder kontere mit TAC";
    else if (controls.mustDiscard) text = "Kein Zug möglich – wähle eine Karte und lege sie ab";
    else if (!card) text = "Du bist dran – wähle eine Karte";
    else if (controls.segmentsLeft) text = "Wähle eine Kugel und ein Ziel – die 7 kann beliebig aufgeteilt werden";
    else if (controls.selectable.size) text = `${cardLabel(card.value)}: ${CARD_HINT[String(card.value)]} – klicke eine leuchtende Kugel, dann das Ziel`;
    else text = `${cardLabel(card.value)}: ${CARD_HINT[String(card.value)]}`;
  }

  return (
    <motion.div
      key={text}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-[95vw] rounded-full px-4 py-1.5 text-center text-sm font-medium shadow-lg backdrop-blur ${tone}`}
    >
      {!controls.humanTurn && game.phase === "play" && <Hourglass className="mr-1.5 inline h-3.5 w-3.5 animate-spin [animation-duration:2s]" />}
      {text}
    </motion.div>
  );
}

function MoveButton({ move, game, onClick }: { move: Move; game: GameState; onClick: () => void }) {
  const next = game.players[(game.current + 1) % 4];
  switch (move.kind) {
    case "skip":
      return (
        <ActionButton onClick={onClick} icon={<SkipForward className="h-4 w-4" />} primary>
          {move.tacUndo ? "TAC: " : ""}
          {next.name} aussetzen lassen
        </ActionButton>
      );
    case "discard":
      return (
        <ActionButton onClick={onClick} icon={<Trash2 className="h-4 w-4" />} danger>
          Karte ablegen
        </ActionButton>
      );
    case "devil":
      return (
        <ActionButton onClick={onClick} icon={<Flame className="h-4 w-4" />} primary>
          Teufel gegen {next.name} spielen
        </ActionButton>
      );
    case "jester":
      return (
        <ActionButton onClick={onClick} icon={<Users className="h-4 w-4" />} primary>
          Narr: Karten weitergeben
        </ActionButton>
      );
    case "void":
      return (
        <ActionButton onClick={onClick} icon={<Ban className="h-4 w-4" />}>
          Karte ohne Wirkung spielen
        </ActionButton>
      );
    default:
      return (
        <ActionButton onClick={onClick} icon={<Undo2 className="h-4 w-4" />} primary>
          {move.label}
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
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ring-1 transition ${
        danger
          ? "bg-red-800/80 text-red-50 ring-red-400/50 hover:bg-red-700"
          : primary
            ? "bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 ring-amber-200 hover:from-amber-200"
            : "bg-[#3b2414]/80 text-amber-100 ring-amber-200/30 hover:bg-[#4a2e19]"
      }`}
    >
      {icon}
      {children}
    </motion.button>
  );
}

export const colorHex = (p: number) => PLAYER_COLORS[p].hex;
