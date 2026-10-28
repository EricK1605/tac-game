"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { GameScreen } from "@/components/GameScreen";
import { useT } from "@/lib/useI18n";

/** Spielseite mit Sitzungs-Token: lädt beim Neuladen den gespeicherten Spielstand. */
export default function SpielPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const gameId = useGameStore((s) => s.gameId);
  const hasGame = useGameStore((s) => s.game !== null);
  const resume = useGameStore((s) => s.resume);
  const [missing, setMissing] = useState(false);
  const { t } = useT();

  useEffect(() => {
    if (useGameStore.getState().gameId === id) return;
    if (!resume(id)) setMissing(true);
  }, [id, resume]);

  if (hasGame && gameId === id) return <GameScreen />;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 p-6 text-center">
      <span className="font-display text-stroke-lg text-6xl text-amber-200">
        T<span className="text-red-500">A</span>C
      </span>
      {missing ? (
        <>
          <p className="max-w-xs text-amber-100/80">{t("game.missing")}</p>
          <Link href="/" className="chunky-btn chunky-green rounded-2xl px-6 py-3 text-lg">
            {t("game.toMenu")}
          </Link>
        </>
      ) : (
        <motion.div className="flex gap-1.5" aria-label="…">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-3 w-3 rounded-full bg-amber-300"
              animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
