import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Datenschutzerklärung", robots: { index: false, follow: true } };

export default function Datenschutz() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <h2>1. Verantwortlicher</h2>
      <p>
        Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
        <br />
        Eric Kleinkoenen, Griegstraße 15, 80807 München, Deutschland
        <br />
        E-Mail: wohnungssucheeric-TacGame@yahoo.com
      </p>

      <h2>2. Überblick</h2>
      <p>
        Diese Website ist ein kostenloses Browserspiel. Du kannst ohne Anmeldung und ohne Konto spielen. Wir verarbeiten personenbezogene Daten nur, soweit dies für den Betrieb der
        Website, für den Mehrspieler-Modus oder – mit deiner Einwilligung – für die Anzeige von Werbung erforderlich ist. Rechtsgrundlagen sind insbesondere Art. 6 Abs. 1 lit. a
        DSGVO (Einwilligung), lit. b (Vertrag bzw. Nutzung des Angebots) und lit. f (berechtigtes Interesse) sowie § 25 TDDDG für den Zugriff auf Informationen in deinem
        Endgerät.
      </p>

      <h2>3. Hosting und Server-Logfiles</h2>
      <p>
        Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA gehostet. Beim Aufruf der Seite erfasst der Server automatisch Informationen, die dein
        Browser übermittelt (Server-Logfiles):
      </p>
      <ul>
        <li>IP-Adresse</li>
        <li>Datum und Uhrzeit der Anfrage</li>
        <li>aufgerufene Seite bzw. Datei und übertragene Datenmenge</li>
        <li>Referrer-URL (die zuvor besuchte Seite)</li>
        <li>Browsertyp, Browserversion und Betriebssystem</li>
      </ul>
      <p>
        Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in der sicheren, stabilen und fehlerfreien Auslieferung der
        Website. Die Logfiles werden von Vercel nur für einen begrenzten Zeitraum gespeichert und anschließend gelöscht. Eine Übermittlung in die USA ist möglich; Vercel ist unter
        dem EU-US Data Privacy Framework zertifiziert, ergänzend gelten die EU-Standardvertragsklauseln. Weitere Informationen:{" "}
        <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
          vercel.com/legal/privacy-policy
        </a>
        .
      </p>
      <p>Die Schriftarten dieser Seite werden direkt von unserem Server ausgeliefert. Beim Laden der Schriften wird keine Verbindung zu Google-Servern hergestellt.</p>

      <h2>4. Speicherung im Browser (Local Storage)</h2>
      <p>
        Damit du eine Partie später fortsetzen kannst, speichern wir Spielstände sowie deine Einstellungen (z. B. Spielername, Schwierigkeit, Sprache und Ansicht) im lokalen
        Speicher deines Browsers. Diese Daten verlassen dein Gerät nicht und werden nicht an uns übertragen. Die Speicherung ist für die von dir gewünschte Funktion unbedingt
        erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Du kannst die Daten jederzeit über die Einstellungen deines Browsers löschen.
      </p>

      <h2>5. Mehrspieler-Modus „Mit Freunden spielen“</h2>
      <p>
        Wenn du einen Spielraum erstellst oder einem Raum beitrittst, werden die Spielzüge in Echtzeit zwischen den Geräten der Mitspielenden übertragen. Dafür nutzen wir den Dienst
        Supabase Realtime des Anbieters Supabase Inc. Verarbeitet werden dabei der Raumcode, der von dir gewählte Spielername, deine Spielaktionen, Emotes und Chat-Nachrichten
        sowie technisch bedingt deine IP-Adresse. Die Daten werden nur für die Dauer der Verbindung übertragen und nicht dauerhaft in einer Datenbank gespeichert. Eine
        Übermittlung in Drittländer wie die USA ist dabei nicht ausgeschlossen; sie erfolgt auf Grundlage der EU-Standardvertragsklauseln.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, da die Verarbeitung für das von dir gewählte gemeinsame Spiel erforderlich ist. Weitere Informationen:{" "}
        <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
          supabase.com/privacy
        </a>
        . Der Einzelspieler-Modus und das Spiel gegen Computer-Gegner laufen vollständig in deinem Browser.
      </p>

      <h2>6. Google AdSense</h2>
      <p>
        Diese Website nutzt Google AdSense, einen Dienst zur Einbindung von Werbeanzeigen der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland („Google“).
        Google AdSense verwendet Cookies und ähnliche Technologien (z. B. Web-Beacons bzw. Zählpixel), um Anzeigen auszuliefern, deren Reichweite zu messen und Missbrauch zu
        verhindern. Dabei können insbesondere deine IP-Adresse, Geräte- und Browserinformationen, die aufgerufene Seite sowie Informationen über deine Interaktion mit Anzeigen
        verarbeitet und an Server von Google – auch in den USA – übertragen werden.
      </p>
      <p>
        Cookies und vergleichbare Technologien, die für die Werbung nicht unbedingt erforderlich sind – insbesondere für personalisierte Anzeigen – setzen wir nur mit deiner
        Einwilligung ein (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Deine Einwilligung kannst du jederzeit mit Wirkung für die Zukunft über die Cookie-Einstellungen auf
        dieser Website widerrufen. Ohne Einwilligung können nicht personalisierte Anzeigen ausgespielt werden, die nur auf dem Kontext der Seite beruhen.
      </p>
      <p>
        Google ist unter dem EU-US Data Privacy Framework zertifiziert. Personalisierte Werbung kannst du außerdem unter{" "}
        <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
          adssettings.google.com
        </a>{" "}
        deaktivieren. Mehr dazu, wie Google Daten verwendet:{" "}
        <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
          policies.google.com/technologies/ads
        </a>{" "}
        und{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          policies.google.com/privacy
        </a>
        .
      </p>

      <h2>7. Kontaktaufnahme</h2>
      <p>
        Wenn du uns per E-Mail kontaktierst, verarbeiten wir deine Angaben (z. B. E-Mail-Adresse, Name und Inhalt der Nachricht), um deine Anfrage zu beantworten. Rechtsgrundlage
        ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse liegt in der Beantwortung deines Anliegens. Zielt die Anfrage auf einen Vertrag ab, ist Art. 6 Abs. 1 lit. b
        DSGVO die Grundlage. Wir löschen die Daten, sobald deine Anfrage abschließend bearbeitet ist und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
      </p>

      <h2>8. Deine Rechte</h2>
      <p>Du hast jederzeit das Recht auf:</p>
      <ul>
        <li>Auskunft über die zu deiner Person gespeicherten Daten (Art. 15 DSGVO)</li>
        <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
        <li>Löschung (Art. 17 DSGVO) und Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
        <li>Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO)</li>
        <li>Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)</li>
        <li>Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO), z. B. bei der Behörde deines Wohnorts oder des Sitzes des Verantwortlichen</li>
      </ul>
      <p>Wende dich dazu einfach an die oben genannte E-Mail-Adresse.</p>

      <h2>9. Aktualität</h2>
      <p>Stand: Oktober 2026. Wir passen diese Datenschutzerklärung an, sobald sich die Website oder die rechtlichen Vorgaben ändern.</p>
    </LegalPage>
  );
}
