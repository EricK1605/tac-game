import type { Metadata } from "next";

// Spielräume sind privat und kurzlebig – nicht in Suchmaschinen aufnehmen.
export const metadata: Metadata = {
  title: "Spielraum",
  robots: { index: false, follow: false },
};

export default function RaumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
