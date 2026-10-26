"use client";

import { useGameStore } from "@/store/gameStore";
import { GameScreen } from "@/components/GameScreen";
import { SetupScreen } from "@/components/SetupScreen";
import { RulesModal } from "@/components/RulesModal";

export default function Home() {
  const hasGame = useGameStore((s) => s.game !== null);
  return (
    <>
      {hasGame ? <GameScreen /> : <SetupScreen />}
      <RulesModal />
    </>
  );
}
