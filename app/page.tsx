"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { GameScreen } from "@/components/GameScreen";
import { SetupScreen } from "@/components/SetupScreen";
import { RulesModal } from "@/components/RulesModal";

export default function Home() {
  const hasGame = useGameStore((s) => s.game !== null);
  return (
    // Animationen respektieren die Systemeinstellung „Bewegung reduzieren“
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <motion.div
          key={hasGame ? "game" : "setup"}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {hasGame ? <GameScreen /> : <SetupScreen />}
        </motion.div>
      </AnimatePresence>
      <RulesModal />
    </MotionConfig>
  );
}
