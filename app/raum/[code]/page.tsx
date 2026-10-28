"use client";

import { use } from "react";
import { RoomClient } from "@/components/RoomClient";
import { normalizeRoomCode } from "@/lib/net/room";

/** Spielraum im Freunde-Modus – erreichbar über den Einladungs-Link /raum/<code>. */
export default function RaumPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  return <RoomClient code={normalizeRoomCode(code) || code} />;
}
