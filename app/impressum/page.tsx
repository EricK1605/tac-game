import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Impressum", robots: { index: false, follow: true } };

export default function Impressum() {
  return (
    <LegalPage title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        Eric Kleinkoenen
        <br />
        Griegstraße 15
        <br />
        80807 München
        <br />
        Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: wohnungssucheeric-TacGame@yahoo.com
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        Eric Kleinkoenen
        <br />
        Griegstraße 15, 80807 München
      </p>

      <h2>Hinweis zur Unabhängigkeit</h2>
      <p>
        Diese Web-App ist eine inoffizielle, unabhängige Fan-Implementierung und steht in keiner geschäftlichen Verbindung mit dem offiziellen TACverlag. TAC® ist eine
        eingetragene Marke der entsprechenden Rechteinhaber. Alle Spielgrafiken, Figuren und Texte dieser Seite sind eigene Gestaltungen.
      </p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Die Inhalte dieser Seite wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als
        Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder
        gespeicherte fremde Informationen zu überwachen. Sobald uns eine Rechtsverletzung bekannt wird, entfernen wir den betreffenden Inhalt umgehend.
      </p>

      <h2>Haftung für Links</h2>
      <p>
        Diese Seite enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für diese fremden Inhalte ist stets der jeweilige Anbieter oder Betreiber
        verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entfernen wir derartige Links umgehend.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die durch den Seitenbetreiber erstellten Inhalte und Werke auf dieser Seite unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede
        Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des Erstellers. Sollten Sie auf eine Urheberrechts- oder
        Markenrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis an die oben genannte E-Mail-Adresse.
      </p>
    </LegalPage>
  );
}
