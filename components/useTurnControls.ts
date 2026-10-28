"use client";

import { useMemo } from "react";
import type { Move } from "@/types/game";
import { useGameStore } from "@/store/gameStore";
import { activeHandOwner, decider, hiddenCards, legalMoves, sevenSegments, tacBase } from "@/lib/engine/moves";
import { posPoint, marblePoint } from "@/lib/layout";
import { playerName, useT } from "@/lib/useI18n";
import type { BoardTarget } from "./Board";

/** Leitet aus dem Spielzustand ab, was der menschliche Spieler gerade tun kann. */
export function useTurnControls() {
  const game = useGameStore((s) => s.game);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const selectedMarble = useGameStore((s) => s.selectedMarble);
  const seven = useGameStore((s) => s.seven);
  const playMove = useGameStore((s) => s.playMove);
  const selectMarble = useGameStore((s) => s.selectMarble);
  const sevenStep = useGameStore((s) => s.sevenStep);
  const mySeats = useGameStore((s) => s.mySeats);
  const { t, lang } = useT();

  return useMemo(() => {
    const empty = {
      humanTurn: false,
      moves: [] as Move[],
      playable: new Set<string>(),
      mustDiscard: false,
      handOwner: 0,
      displayBoard: game?.marbles ?? [],
      selectable: new Set<number>(),
      selected: null as number | null,
      targets: [] as BoardTarget[],
      buttons: [] as Move[],
      preview: null as string | null,
      segmentsLeft: 0,
      onMarbleClick: (() => {}) as (id: number) => void,
    };
    if (!game || game.phase !== "play") return empty;
    // Am Zug ist ein Platz, der an diesem Gerät gespielt wird (Orakel: auch der Partner)
    const humanTurn = mySeats.includes(decider(game));
    if (!humanTurn) return { ...empty, handOwner: 0 };

    const moves = legalMoves(game);
    const handOwner = activeHandOwner(game);
    const actor = handOwner;
    // Verdeckte Orakel-Karten dürfen immer blind gezogen werden
    const playable = new Set([...moves.map((m) => m.cardId), ...hiddenCards(game)]);
    const mustDiscard = moves.length > 0 && moves.every((m) => m.kind === "discard");
    const cardMoves = moves.filter((m) => m.cardId === selectedCardId);
    const selectedCard = game.players[handOwner].hand.find((c) => c.id === selectedCardId);

    let displayBoard = game.marbles;
    let preview: string | null = null;
    if (selectedCard?.value === "tac" && cardMoves.some((m) => m.kind !== "discard")) {
      const base = tacBase(game);
      if (base && !base.entry.discarded) {
        displayBoard = base.board;
        preview = t("board.tacPreview", { who: playerName(game.players[base.entry.player], lang) });
      }
    }
    if (seven) displayBoard = seven.board;

    const selectable = new Set<number>();
    const targets: BoardTarget[] = [];
    let selected = selectedMarble;

    if (seven) {
      const segs = sevenSegments(seven.board, actor, seven.remaining, new Set(seven.locked));
      for (const s of segs) selectable.add(s.marbleId);
      if (selected === null && selectable.size === 1) selected = [...selectable][0];
      if (selected !== null)
        for (const s of segs.filter((x) => x.marbleId === selected)) {
          const m = seven.board[s.marbleId];
          targets.push({ key: `7-${s.marbleId}-${s.to}-${s.steps}`, point: posPoint(m.color, s.to, m.id % 4), onClick: () => sevenStep(s) });
        }
      return {
        ...empty,
        humanTurn,
        moves,
        playable,
        mustDiscard,
        handOwner,
        displayBoard,
        selectable,
        selected,
        targets,
        preview,
        segmentsLeft: seven.remaining,
        onMarbleClick: (id: number) => selectMarble(id === selected ? null : id),
      };
    }

    const pointMoves = cardMoves.filter((m) => m.marbleId !== undefined && m.target !== undefined && m.kind !== "seven");
    const swapMoves = cardMoves.filter((m) => m.swap);
    for (const m of pointMoves) selectable.add(m.marbleId!);
    for (const m of swapMoves) m.swap!.forEach((id) => selectable.add(id));
    if (selected !== null && !selectable.has(selected)) selected = null;
    if (selected === null && selectable.size === 1) selected = [...selectable][0];

    if (selected !== null) {
      const seen = new Set<string>();
      for (const m of pointMoves.filter((x) => x.marbleId === selected)) {
        const mb = displayBoard[m.marbleId!];
        const key = `${m.marbleId}-${m.target}`;
        if (seen.has(key)) continue;
        seen.add(key);
        targets.push({
          key,
          point: posPoint(mb.color, m.target!, mb.id % 4),
          onClick: () => playMove(m),
          variant: m.captured.length ? "capture" : "move",
        });
      }
      for (const m of swapMoves.filter((x) => x.swap!.includes(selected!))) {
        const other = m.swap![0] === selected ? m.swap![1] : m.swap![0];
        targets.push({ key: `swap-${other}`, point: marblePoint(displayBoard[other]), onClick: () => playMove(m), variant: "swap" });
      }
    }

    const buttons = cardMoves.filter((m) => m.marbleId === undefined && !m.swap && m.kind !== "seven");

    return {
      humanTurn,
      moves,
      playable,
      mustDiscard,
      handOwner,
      displayBoard,
      selectable,
      selected,
      targets,
      buttons,
      preview,
      segmentsLeft: 0,
      onMarbleClick: (id: number) => selectMarble(id === selected ? null : id),
    };
  }, [game, selectedCardId, selectedMarble, seven, playMove, selectMarble, sevenStep, mySeats, t, lang]);
}
