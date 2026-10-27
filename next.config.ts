import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Das Next.js-Symbol unten links verdeckt sonst den Emote-Knopf (Fehler-Overlay bleibt aktiv)
  devIndicators: false,
};

export default nextConfig;
