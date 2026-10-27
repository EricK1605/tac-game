import type { Metadata } from "next";
import { SeoSection } from "@/components/SeoSection";

// Spielsitzungen sind persönlich und kurzlebig – nicht in Suchmaschinen aufnehmen.
export const metadata: Metadata = {
  title: "Laufende Partie",
  robots: { index: false, follow: true },
};

export default function SpielLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SeoSection />
    </>
  );
}
