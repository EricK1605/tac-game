"use client";

import { useEffect, useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { useT } from "@/lib/useI18n";

/**
 * Spiel weiterempfehlen: WhatsApp und – wo verfügbar – das Teilen-Menü des Geräts, sonst Link kopieren.
 * `compact`: nur Symbole (neben anderen Knöpfen), sonst mit Beschriftung.
 */
export function ShareGame({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const { t } = useT();
  const [url, setUrl] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  // Erst im Browser bekannt – beim ersten Render wie auf dem Server, sonst passt das HTML nicht
  useEffect(() => {
    setUrl(window.location.origin);
    setCanShare("share" in navigator);
  }, []);

  const text = t("share.text");
  const share = async () => {
    haptics.tap();
    if (canShare) {
      await navigator.share({ title: "TAC", text, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ohne Berechtigung bleibt nur der WhatsApp-Knopf */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const label = canShare ? t("share.more") : copied ? t("lobby.copied") : t("share.copy");
  const btn = `chunky-btn flex items-center justify-center gap-1.5 rounded-2xl ${compact ? "w-12 shrink-0" : "flex-1 px-4 py-2.5 text-sm"}`;

  return (
    <div className={`flex gap-2 ${className}`}>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => haptics.tap()}
        title={t("share.whatsapp")}
        aria-label={t("share.whatsapp")}
        className={`${btn} bg-gradient-to-b from-[#4ee07a] to-[#1fa855]`}
      >
        <MessageCircle className="h-5 w-5" />
        {!compact && t("share.whatsapp")}
      </a>
      <button onClick={share} title={label} aria-label={label} className={`${btn} chunky-dark`}>
        {canShare ? <Share2 className="h-5 w-5" /> : copied ? <Check className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
        {!compact && label}
      </button>
    </div>
  );
}
