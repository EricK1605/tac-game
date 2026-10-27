import type { Metadata, Viewport } from "next";
import { Geist, Lilita_One } from "next/font/google";
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
  themeColor: "#1a0e06",
};

export const metadata: Metadata = {
  title: "TAC – Das Strategiespiel",
  description: "TAC online gegen KI-Gegner: Karten- und Brettspiel für zwei Teams",
  appleWebApp: { capable: true, title: "TAC", statusBarStyle: "black-translucent" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${display.variable} antialiased`}>{children}</body>
    </html>
  );
}
