// Echtzeit-Verbindung eines Spielraums (Freunde-Modus).
// Mit NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY über Supabase Realtime (Broadcast),
// sonst als Testmodus über BroadcastChannel – dann verbinden sich nur Tabs im selben Browser.
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RoomChannel {
  /** true = Supabase (geräteübergreifend), false = Testmodus im selben Browser */
  online: boolean;
  send: (type: string, payload: unknown) => void;
  on: (type: string, cb: (payload: unknown) => void) => () => void;
  close: () => void;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isOnlineConfigured = () => Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Kurzer, gut vorlesbarer Code ohne verwechselbare Zeichen (0/o, 1/l). */
export function newRoomCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return "tac-" + Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

/** Akzeptiert „tac-ab12c“, „AB12C“ oder einen ganzen Einladungs-Link. */
export function normalizeRoomCode(input: string): string {
  const raw = input.trim().toLowerCase();
  const fromUrl = raw.match(/(?:raum\/|room=)(tac-[a-z0-9]+)/)?.[1];
  const code = fromUrl ?? (raw.startsWith("tac-") ? raw : raw ? `tac-${raw}` : "");
  return /^tac-[a-z0-9]{3,12}$/.test(code) ? code : "";
}

type Handler = (payload: unknown) => void;

export function openRoom(code: string): RoomChannel {
  const handlers = new Map<string, Set<Handler>>();
  const dispatch = (type: string, payload: unknown) => handlers.get(type)?.forEach((h) => h(payload));
  const on = (type: string, cb: Handler) => {
    if (!handlers.has(type)) handlers.set(type, new Set());
    handlers.get(type)!.add(cb);
    return () => void handlers.get(type)?.delete(cb);
  };

  if (!isOnlineConfigured()) {
    const bc = new BroadcastChannel(`tac-room-${code}`);
    bc.onmessage = (e) => dispatch(e.data.type, e.data.payload);
    setTimeout(() => dispatch("ready", null), 0);
    return { online: false, on, send: (type, payload) => bc.postMessage({ type, payload }), close: () => bc.close() };
  }

  // Supabase wird erst bei Bedarf geladen – Einzelspieler bleiben schlank
  let channel: RealtimeChannel | null = null;
  let ready = false;
  const queue: [string, unknown][] = [];
  let closed = false;
  void import("@supabase/supabase-js").then(({ createClient }) => {
    if (closed) return;
    const client = createClient(SUPABASE_URL!, SUPABASE_KEY!, { auth: { persistSession: false } });
    channel = client.channel(`tac-room-${code}`, { config: { broadcast: { self: false, ack: false } } });
    channel.on("broadcast", { event: "msg" }, ({ payload }) => dispatch(payload.type, payload.payload));
    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      ready = true;
      for (const [type, payload] of queue.splice(0)) void channel!.send({ type: "broadcast", event: "msg", payload: { type, payload } });
      dispatch("ready", null);
    });
  });

  return {
    online: true,
    on,
    send: (type, payload) => {
      if (!ready || !channel) queue.push([type, payload]);
      else void channel.send({ type: "broadcast", event: "msg", payload: { type, payload } });
    },
    close: () => {
      closed = true;
      void channel?.unsubscribe();
    },
  };
}
