"use client";

import type { LookId } from "@/lib/personas";
import { Buddy, type BuddyMood } from "./Buddy";

export type Mood = BuddyMood;

/** Figur eines Charakters; Accessoires in der Farbe des Sitzplatzes. */
export function Character({
  look,
  color,
  mood = "idle",
  size = 64,
  className = "",
}: {
  look: LookId;
  color: number;
  mood?: Mood;
  size?: number;
  className?: string;
}) {
  return <Buddy id={look} color={color} mood={mood} size={size} className={className} />;
}
