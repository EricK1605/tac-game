"use client";

import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { initLang } from "@/lib/useI18n";
import { RulesModal } from "./RulesModal";

/** Gemeinsamer Rahmen für alle Seiten: Animationen respektieren „Bewegung reduzieren“, Regelbuch ist überall erreichbar. */
export function Providers({ children }: { children: React.ReactNode }) {
  // Gespeicherte Sprache erst im Browser setzen – der Server rendert immer Deutsch
  useEffect(() => initLang(), []);
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <RulesModal />
    </MotionConfig>
  );
}
