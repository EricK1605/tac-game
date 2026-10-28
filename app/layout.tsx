import type { Metadata, Viewport } from "next";
import { Geist, Lilita_One } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/components/Providers";
import { SiteFooter } from "@/components/SiteFooter";
import { ADSENSE_CLIENT, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Wuchtige Comic-Schrift für Banner, Namen und Knöpfe
const display = Lilita_One({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1b2152",
};

const DESCRIPTION =
  "TAC Spiel online kostenlos spielen: das taktische Karten- und Brettspiel für zwei Teams direkt im Browser – ohne Anmeldung, gegen witzige Computer-Gegner, am Handy und PC.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "TAC Spiel Online kostenlos spielen – Taktik-Brettspiel im Browser", template: "%s · TAC Spiel Online" },
  description: DESCRIPTION,
  keywords: ["TAC Spiel online", "TAC Brettspiel", "TAC Regeln", "Taktikspiel im Browser", "Karten- und Brettspiel", "Brettspiel online kostenlos", "Murmelspiel"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "/",
    siteName: "TAC Spiel Online",
    title: "TAC Spiel Online kostenlos spielen",
    description: DESCRIPTION,
  },
  twitter: { card: "summary", title: "TAC Spiel Online kostenlos spielen", description: DESCRIPTION },
  robots: { index: true, follow: true },
  verification: { google: "1WkSvEa97fT_RygDv4ZhxC7Qr-ruswmK_dnFtqrDOrg" },
  appleWebApp: { capable: true, title: "TAC", statusBarStyle: "black-translucent" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${display.variable} antialiased`}>
        <Providers>
          {children}
          <SiteFooter />
        </Providers>
        {/* Google AdSense – lädt nach der Interaktivität der Seite, blockiert also das Spiel nicht */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
