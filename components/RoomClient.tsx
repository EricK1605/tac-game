"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Bot, Check, Copy, Crown, MessageCircle, Play, Share2, UserPlus, Wifi, WifiOff } from "lucide-react";
import type { ChatMessage, Difficulty, GameSettings, SeatSpec } from "@/types/game";
import { useGameStore, type NetLink, type RemoteAction } from "@/store/gameStore";
import { PLAYER_COLORS } from "@/lib/engine/constants";
import { PERSONAS, lookOf, personaById } from "@/lib/personas";
import { readSettings, rememberSettings } from "@/lib/saves";
import { openRoom, type RoomChannel } from "@/lib/net/room";
import { clientId, hostedRoom, markHost, trimForWire, type RoomState, type SeatState, type StatePayload } from "@/lib/net/protocol";
import { haptics } from "@/lib/haptics";
import { useT } from "@/lib/useI18n";
import { Character } from "./Character";
import { GameScreen } from "./GameScreen";
import { LangSwitch } from "./LangSwitch";

type Status = "connecting" | "lobby" | "playing" | "missing" | "closed";

/** Raum im Freunde-Modus: Lobby, dann das Spiel – für Gastgeber und Gäste. */
export function RoomClient({ code }: { code: string }) {
  const router = useRouter();
  const { t } = useT();
  const me = useRef("");
  const roomRef = useRef<RoomChannel | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [status, setStatus] = useState<Status>("connecting");
  const [online, setOnline] = useState(true);
  const [name, setName] = useState("");
  // Aktionen je Rolle – werden beim Verbindungsaufbau gesetzt
  const hostApi = useRef<{ update: (fn: (r: RoomState) => RoomState) => void; start: () => void } | null>(null);
  const guestApi = useRef<{ claim: (seat: number, name: string) => void } | null>(null);

  // Verbindung aufbauen – einmal pro Raum
  useEffect(() => {
    me.current = clientId();
    const saved = readSettings();
    const myName = saved?.playerName && saved.playerName !== "Du" ? saved.playerName : "";
    setName(myName);
    const ch = openRoom(code);
    roomRef.current = ch;
    setOnline(ch.online);
    const store = useGameStore.getState;
    const net: NetLink = { send: (type, payload) => ch.send(type, { ...(payload as object), clientId: me.current }) };

    const hosted = hostedRoom(code);
    const host = hosted !== undefined;
    setIsHost(host);
    const offs: (() => void)[] = [];

    if (host) {
      // ---------------- Gastgeber
      let state: RoomState = hosted ?? {
        hostId: me.current,
        seats: [{ kind: "human", clientId: me.current, name: myName || "Host" }, { kind: "open" }, { kind: "open" }, { kind: "open" }],
        difficulty: saved?.difficulty ?? "medium",
        master: saved?.master ?? false,
        started: false,
      };
      state = { ...state, hostId: me.current };
      const publish = (next: RoomState) => {
        state = next;
        setRoom(next);
        markHost(code, next);
        ch.send("room", next);
      };
      hostApi.current = {
        update: (fn) => publish(fn(state)),
        start: () => {
          const seats: SeatSpec[] = state.seats.map((s) => (s.kind === "human" ? { human: true, name: s.name } : { human: false, persona: s.kind === "bot" ? s.persona : PERSONAS[0].id }));
          const mySeat = state.seats.findIndex((s) => s.kind === "human" && s.clientId === me.current);
          const settings: GameSettings = { playerName: myName || "Host", difficulty: state.difficulty, master: state.master, speed: 1, mode: "friends", seats };
          const gameId = useGameStore.getState().start(settings, { mySeats: [mySeat], role: "host", net });
          publish({ ...state, started: true, gameId });
          setStatus("playing");
        },
      };
      setRoom(state);
      setStatus(state.started ? "playing" : "lobby");
      // Nach dem Neuladen: laufendes Spiel fortsetzen
      if (state.started && state.gameId && store().gameId !== state.gameId) {
        if (!store().resume(state.gameId, { role: "host", net })) publish({ ...state, started: false, gameId: null });
      }

      offs.push(
        ch.on("hello", () => {
          ch.send("room", state);
          const g = store().game;
          if (state.started && g) ch.send("state", { game: trimForWire(g), chat: store().chat } satisfies StatePayload);
        }),
        ch.on("claim", (p) => {
          const { clientId: who, name: n, seat } = p as { clientId: string; name: string; seat: number };
          if (state.started || state.seats[seat]?.kind !== "open") return;
          const seats = state.seats.map((s) => (s.kind === "human" && s.clientId === who ? ({ kind: "open" } as SeatState) : s));
          seats[seat] = { kind: "human", clientId: who, name: (n || "?").slice(0, 14) };
          publish({ ...state, seats });
        }),
        ch.on("bye", (p) => {
          const who = (p as { clientId: string }).clientId;
          if (state.started) return;
          publish({ ...state, seats: state.seats.map((s) => (s.kind === "human" && s.clientId === who ? { kind: "open" } : s)) });
        }),
        ch.on("action", (p) => {
          const a = p as RemoteAction & { clientId: string };
          // Nur der Mensch, der auf diesem Platz sitzt, darf für ihn handeln
          const seat = state.seats[a.seat];
          if (seat?.kind !== "human" || seat.clientId !== a.clientId) return;
          store().hostAction(a);
        }),
        ch.on("emote", (p) => {
          const e = p as { player: number; emoji: string };
          store().remoteEmote(e.player, e.emoji);
        }),
        ch.on("ready", () => ch.send("room", state)),
      );

      // Jeden neuen Spielstand an alle schicken
      let pending = false;
      offs.push(
        useGameStore.subscribe((s, prev) => {
          if (!s.game || (s.game === prev.game && s.chat === prev.chat) || pending) return;
          pending = true;
          queueMicrotask(() => {
            pending = false;
            const g = store().game;
            if (g) ch.send("state", { game: trimForWire(g), chat: store().chat } satisfies StatePayload);
          });
        }),
      );
    } else {
      // ---------------- Gast
      let known: RoomState | null = null;
      const hello = () => ch.send("hello", { clientId: me.current });
      const timer = setInterval(() => {
        if (!known) hello();
      }, 1500);
      const giveUp = setTimeout(() => {
        if (!known) setStatus("missing");
      }, 8000);
      offs.push(
        () => clearInterval(timer),
        () => clearTimeout(giveUp),
        ch.on("ready", hello),
        ch.on("room", (p) => {
          known = p as RoomState;
          setRoom(known);
          setStatus((s) => (s === "playing" ? s : known!.started && mySeatIn(known!, me.current) >= 0 ? s : "lobby"));
        }),
        ch.on("state", (p) => {
          const r = known;
          if (!r) return;
          const seat = mySeatIn(r, me.current);
          if (seat < 0) return;
          const { game, chat } = p as StatePayload;
          store().receiveState(game, chat as ChatMessage[], [seat], net);
          setStatus("playing");
        }),
        ch.on("emote", (p) => {
          const e = p as { player: number; emoji: string };
          store().remoteEmote(e.player, e.emoji);
        }),
        ch.on("closed", () => {
          setStatus("closed");
          store().quit();
        }),
      );
      guestApi.current = {
        claim: (seat, n) => {
          rememberSettings({ playerName: n || "Du" });
          ch.send("claim", { clientId: me.current, name: n || "?", seat });
        },
      };
      hello();
    }

    const leave = () => ch.send(host ? "closed" : "bye", { clientId: me.current });
    window.addEventListener("pagehide", leave);
    return () => {
      offs.forEach((f) => f());
      window.removeEventListener("pagehide", leave);
      ch.close();
    };
  }, [code]);

  const leaveRoom = () => {
    roomRef.current?.send(isHost ? "closed" : "bye", { clientId: me.current });
    useGameStore.getState().quit();
    router.push("/");
  };

  if (status === "playing" && useGameStore.getState().game) return <GameScreen onLeave={leaveRoom} />;

  return (
    <div className="flex min-h-dvh items-start justify-center p-3 sm:items-center sm:p-6">
      <div className="w-full max-w-2xl rounded-[2rem] border border-amber-200/15 bg-[#1c120b]/85 p-5 shadow-2xl backdrop-blur sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button onClick={leaveRoom} className="chunky-btn chunky-dark flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm" aria-label={t("back")}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-display text-stroke text-2xl text-amber-100 sm:text-3xl">{t("lobby.title")}</h1>
          <LangSwitch />
        </div>

        {status === "connecting" && <Notice>{t("lobby.connecting")}</Notice>}
        {status === "missing" && <Notice>{t("lobby.notFound")}</Notice>}
        {status === "closed" && <Notice>{t("lobby.hostLeft")}</Notice>}

        {room && status !== "closed" && (
          <Lobby
            code={code}
            room={room}
            isHost={isHost}
            me={me.current}
            online={online}
            name={name}
            setName={setName}
            onUpdate={(fn) => hostApi.current?.update(fn)}
            onStart={() => hostApi.current?.start()}
            onClaim={(seat) => guestApi.current?.claim(seat, name.trim())}
          />
        )}
      </div>
    </div>
  );
}

const mySeatIn = (r: RoomState, id: string) => r.seats.findIndex((s) => s.kind === "human" && s.clientId === id);

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center text-amber-100/80">
      <motion.div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-2.5 w-2.5 rounded-full bg-amber-300" animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
        ))}
      </motion.div>
      {children}
    </div>
  );
}

function Lobby({
  code,
  room,
  isHost,
  me,
  online,
  name,
  setName,
  onUpdate,
  onStart,
  onClaim,
}: {
  code: string;
  room: RoomState;
  isHost: boolean;
  me: string;
  online: boolean;
  name: string;
  setName: (n: string) => void;
  onUpdate: (fn: (r: RoomState) => RoomState) => void;
  onStart: () => void;
  onClaim: (seat: number) => void;
}) {
  const { t, lang } = useT();
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/raum/${code}` : `/raum/${code}`;
  const shareText = `${t("lobby.shareText", { code })} ${link}`;
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  const mySeat = mySeatIn(room, me);
  const full = room.seats.every((s) => s.kind !== "open");

  const copy = async () => {
    haptics.tap();
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      /* z. B. ohne Berechtigung – der Link steht trotzdem sichtbar da */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const share = () => {
    haptics.tap();
    navigator.share?.({ title: "TAC", text: t("lobby.shareText", { code }), url: link }).catch(() => {});
  };
  const setSeat = (seat: number, s: SeatState) => onUpdate((r) => ({ ...r, seats: r.seats.map((x, i) => (i === seat ? s : x)) }));
  const nextBot = (seat: number) =>
    onUpdate((r) => {
      const used = r.seats.flatMap((s) => (s.kind === "bot" ? [s.persona] : []));
      const cur = r.seats[seat];
      const start = cur.kind === "bot" ? PERSONAS.findIndex((p) => p.id === cur.persona) + 1 : 0;
      for (let k = 0; k < PERSONAS.length; k++) {
        const cand = PERSONAS[(start + k) % PERSONAS.length].id;
        if (!used.includes(cand) || (cur.kind === "bot" && cur.persona === cand && k > 0)) return { ...r, seats: r.seats.map((x, i) => (i === seat ? { kind: "bot", persona: cand } : x)) };
      }
      return r;
    });

  return (
    <div className="space-y-4">
      {/* Raum-Code & Teilen */}
      <div className="rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-900/20 p-4 ring-1 ring-sky-300/30">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-100/60">{t("lobby.code")}</div>
            <div className="font-display text-stroke text-3xl tracking-wider text-white">{code}</div>
          </div>
          <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${online ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"}`}>
            {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {online ? "online" : "test"}
          </span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <button onClick={copy} className="chunky-btn chunky-blue flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? t("lobby.copied") : t("lobby.copy")}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptics.tap()}
            className="chunky-btn flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#4ee07a] to-[#1fa855] py-2.5 text-sm"
          >
            <MessageCircle className="h-4 w-4" /> {t("lobby.whatsapp")}
          </a>
          {canShare && (
            <button onClick={share} className="chunky-btn chunky-dark flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm">
              <Share2 className="h-4 w-4" /> {t("lobby.share")}
            </button>
          )}
        </div>
        {!online && <p className="mt-2 text-[11px] text-amber-200/70">{t("lobby.offline")}</p>}
      </div>

      {/* Name für Gäste, bevor sie sich setzen */}
      {!isHost && mySeat < 0 && (
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-amber-100/70">{t("lobby.yourName")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={14}
            placeholder={t("you")}
            className="font-display w-full rounded-xl bg-black/30 px-3 py-2 text-lg text-amber-50 ring-2 ring-amber-200/20 focus:outline-none focus:ring-amber-300/70"
          />
        </label>
      )}

      {/* Besetzung: zwei Teams */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          [0, 2],
          [1, 3],
        ].map((team, ti) => (
          <div key={ti} className="rounded-2xl bg-black/20 p-2.5 ring-1 ring-amber-200/10">
            <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-amber-100/60">{t(ti === 0 ? "lobby.teamA" : "lobby.teamB")}</div>
            <div className="space-y-2">
              {team.map((seat) => (
                <SeatCard
                  key={seat}
                  seat={seat}
                  s={room.seats[seat]}
                  isHostSeat={room.seats[seat].kind === "human" && (room.seats[seat] as { clientId: string }).clientId === room.hostId}
                  mine={seat === mySeat}
                  lang={lang}
                  canClaim={!isHost && mySeat < 0 && room.seats[seat].kind === "open" && !room.started}
                  hostControls={isHost && !room.started && !(room.seats[seat].kind === "human" && (room.seats[seat] as { clientId: string }).clientId === me)}
                  onClaim={() => onClaim(seat)}
                  onBot={() => nextBot(seat)}
                  onOpen={() => setSeat(seat, { kind: "open" })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {isHost ? (
        <>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-xs font-bold text-amber-100/60">{t("lobby.botStrength")}:</span>
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => onUpdate((r) => ({ ...r, difficulty: d }))}
                className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${room.difficulty === d ? "bg-amber-300 text-amber-950 ring-amber-300" : "text-amber-100/70 ring-amber-200/20 hover:bg-white/5"}`}
              >
                {t(`diff.${d}`)}
              </button>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!full}
            onClick={onStart}
            className="chunky-btn chunky-green flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xl disabled:opacity-50"
          >
            <Play className="h-5 w-5" /> {t("lobby.start")}
          </motion.button>
          {!full && <p className="text-center text-xs text-amber-100/50">{t("lobby.needAll")}</p>}
        </>
      ) : (
        <p className="text-center text-sm text-amber-100/70">{mySeat < 0 ? t("lobby.pickSeat") : t("lobby.waitHost")}</p>
      )}
    </div>
  );
}

function SeatCard({
  seat,
  s,
  isHostSeat,
  mine,
  lang,
  canClaim,
  hostControls,
  onClaim,
  onBot,
  onOpen,
}: {
  seat: number;
  s: SeatState;
  isHostSeat: boolean;
  mine: boolean;
  lang: "de" | "en";
  canClaim: boolean;
  hostControls: boolean;
  onClaim: () => void;
  onBot: () => void;
  onOpen: () => void;
}) {
  const { t } = useT();
  const col = PLAYER_COLORS[seat];
  const persona = s.kind === "bot" ? personaById(s.persona) : null;
  const label = s.kind === "human" ? s.name : persona ? persona[lang].name : t("lobby.open");
  return (
    <motion.div layout className="flex items-center gap-2 rounded-xl p-2 ring-1" style={{ background: `linear-gradient(110deg, ${col.dark}cc, rgba(20,12,6,0.6))`, borderColor: col.hex, boxShadow: mine ? `0 0 0 2px #fde047` : undefined }}>
      <div className="relative shrink-0">
        <AnimatePresence mode="popLayout">
          {s.kind === "open" ? (
            <motion.div
              key="open"
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed text-xl font-black"
              style={{ borderColor: col.light, color: col.light }}
            >
              ?
            </motion.div>
          ) : (
            <motion.div key={s.kind === "bot" ? s.persona : s.clientId} initial={{ scale: 0.4 }} animate={{ scale: 1 }}>
              <Character look={s.kind === "bot" ? lookOf(s.persona) : "ritter"} color={seat} size={48} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-stroke flex items-center gap-1 truncate text-sm text-white">
          <span className="truncate">{label}</span>
          {isHostSeat && <Crown className="h-3 w-3 shrink-0 text-amber-300" aria-label={t("lobby.host")} />}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: col.light }}>
          {s.kind === "bot" ? t("lobby.bot") : s.kind === "open" ? t("lobby.waiting") : isHostSeat ? t("lobby.host") : ""} {mine ? t("lobby.you") : ""}
        </div>
      </div>
      {canClaim && (
        <button onClick={onClaim} className="chunky-btn chunky-gold flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs">
          <UserPlus className="h-3.5 w-3.5" /> {t("lobby.take")}
        </button>
      )}
      {hostControls && (
        <div className="flex shrink-0 gap-1">
          <button onClick={onBot} title={s.kind === "bot" ? t("lobby.nextBot") : t("lobby.setBot")} aria-label={s.kind === "bot" ? t("lobby.nextBot") : t("lobby.setBot")} className="chunky-btn chunky-dark rounded-lg p-1.5">
            <Bot className="h-4 w-4" />
          </button>
          {s.kind !== "open" && (
            <button onClick={onOpen} title={t("lobby.setOpen")} aria-label={t("lobby.setOpen")} className="chunky-btn chunky-dark rounded-lg p-1.5">
              <UserPlus className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

