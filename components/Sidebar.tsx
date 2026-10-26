"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { History, MessageCircle, Send } from "lucide-react";
import type { GameState, LogEntry } from "@/types/game";
import { useGameStore } from "@/store/gameStore";
import { PLAYER_COLORS, cardLabel } from "@/lib/engine/constants";

export function Sidebar({ game }: { game: GameState }) {
  const [tab, setTab] = useState<"log" | "chat">("log");
  const chat = useGameStore((s) => s.chat);
  const [seenChat, setSeenChat] = useState(0);
  const unread = tab === "chat" ? 0 : Math.max(0, chat.length - seenChat);

  useEffect(() => {
    if (tab === "chat") setSeenChat(chat.length);
  }, [tab, chat.length]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-amber-200/15 bg-[#1c120b]/80 shadow-2xl backdrop-blur">
      <div className="flex border-b border-amber-200/10">
        <TabButton active={tab === "log"} onClick={() => setTab("log")} icon={<History className="h-4 w-4" />}>
          Spielverlauf
        </TabButton>
        <TabButton active={tab === "chat"} onClick={() => setTab("chat")} icon={<MessageCircle className="h-4 w-4" />}>
          Chat
          {unread > 0 && <span className="ml-1 rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-amber-950">{unread}</span>}
        </TabButton>
      </div>
      <div className="min-h-0 flex-1">{tab === "log" ? <ActionLog log={game.log} game={game} /> : <ChatPanel game={game} />}</div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition ${
        active ? "bg-amber-100/10 text-amber-100" : "text-amber-100/50 hover:text-amber-100/80"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function ActionLog({ log, game }: { log: LogEntry[]; game: GameState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [log.length]);
  return (
    <div ref={ref} className="h-full space-y-1 overflow-y-auto p-2 text-[13px] leading-snug">
      <AnimatePresence initial={false}>
        {log.map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${
              e.kind === "capture"
                ? "bg-red-900/30"
                : e.kind === "tac"
                  ? "bg-purple-900/30"
                  : e.kind === "deal"
                    ? "mt-2 bg-amber-200/10"
                    : e.kind === "system"
                      ? "text-amber-100/60"
                      : ""
            }`}
          >
            {e.player !== null ? (
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full shadow" style={{ background: PLAYER_COLORS[e.player].hex }} />
            ) : (
              <span className="mt-1 h-2.5 w-2.5 shrink-0" />
            )}
            {e.card !== undefined && (
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 font-serif text-[11px] font-bold ${
                  e.card === "tac" ? "bg-red-100 text-red-700" : "bg-[#f8eed8] text-[#1d1a16]"
                }`}
              >
                {cardLabel(e.card)}
              </span>
            )}
            <span className="text-amber-50/90">{e.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {game.phase === "gameOver" && <div className="p-2 text-center text-amber-200">— Ende —</div>}
    </div>
  );
}

const QUICK = ["👍", "Gut gemacht!", "Pass auf!", "Brauche eine 1 oder 13!", "😅"];

function ChatPanel({ game }: { game: GameState }) {
  const chat = useGameStore((s) => s.chat);
  const say = useGameStore((s) => s.say);
  const [text, setText] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [chat.length]);

  return (
    <div className="flex h-full flex-col">
      <div ref={ref} className="flex-1 space-y-2 overflow-y-auto p-3">
        {chat.map((m) => {
          const mine = m.player === 0;
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm shadow ${mine ? "rounded-br-sm bg-amber-200 text-amber-950" : "rounded-bl-sm bg-[#3a2616] text-amber-50"}`}
              >
                {!mine && (
                  <div className="text-[11px] font-bold" style={{ color: PLAYER_COLORS[m.player].light }}>
                    {game.players[m.player].name}
                  </div>
                )}
                {m.text}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1 border-t border-amber-200/10 p-2">
        {QUICK.map((q) => (
          <button key={q} onClick={() => say(q)} className="rounded-full bg-amber-100/10 px-2.5 py-1 text-xs text-amber-100 hover:bg-amber-100/20">
            {q}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-amber-200/10 p-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) say(text.trim());
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nachricht an dein Team…"
          className="min-w-0 flex-1 rounded-full bg-black/30 px-3 py-1.5 text-sm text-amber-50 placeholder:text-amber-100/30 focus:outline-none focus:ring-1 focus:ring-amber-300/50"
        />
        <button className="rounded-full bg-amber-400 p-2 text-amber-950 hover:bg-amber-300" aria-label="Senden">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
