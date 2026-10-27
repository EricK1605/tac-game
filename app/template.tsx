"use client";

import { motion } from "framer-motion";

/** Sanftes Einblenden bei jedem Seitenwechsel (Startbildschirm ↔ Spiel). */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
