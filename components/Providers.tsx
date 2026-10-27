"use client";

import { MotionConfig } from "framer-motion";
import { RulesModal } from "./RulesModal";

/** Gemeinsamer Rahmen für alle Seiten: Animationen respektieren „Bewegung reduzieren“, Regelbuch ist überall erreichbar. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <RulesModal />
    </MotionConfig>
  );
}
