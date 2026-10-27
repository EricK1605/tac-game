import { SetupScreen } from "@/components/SetupScreen";
import { SeoSection } from "@/components/SeoSection";

// Server-Komponente: Der Info-Bereich unter dem Startbildschirm wird als fertiges HTML ausgeliefert (gut für Suchmaschinen).
export default function Home() {
  return (
    <>
      <SetupScreen />
      <SeoSection withSchema />
    </>
  );
}
