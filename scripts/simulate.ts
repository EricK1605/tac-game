// Lässt komplette Partien Bot gegen Bot laufen, um Engine und KI zu prüfen.
// Aufruf: npx tsx scripts/simulate.ts [anzahl] [easy|medium|hard,…] [master] [--personas team0,team1]
import { applyMove, newGame, selectSwap } from "../lib/engine/game";
import { chooseMove, chooseSwapCard } from "../lib/ai/botEngine";
import { teamOf } from "../lib/engine/constants";
import { NEUTRAL_STYLE, styleOf } from "../lib/personas";
import type { Difficulty, GameState } from "../types/game";

const args = process.argv.slice(2);
const pIdx = args.indexOf("--personas");
const personas = pIdx >= 0 ? args.splice(pIdx, 2)[1].split(",") : [];
const games = Number(args[0] ?? 5);
const diffs = (args[1] ?? "hard,easy").split(",") as Difficulty[];
const master = args[2] === "master";
// Ohne --personas spielen alle neutral (Referenz für die Schwierigkeitsstufen).
const styleFor = (p: number) => (personas.length ? styleOf(personas[teamOf(p)] ?? personas[0]) : NEUTRAL_STYLE);

const wins = [0, 0];
const kicks = [0, 0];
const skips = [0, 0];
const tacs = [0, 0];
let totalMoves = 0;
const t0 = Date.now();
for (let g = 0; g < games; g++) {
  let s: GameState = newGame({ playerName: "A", difficulty: "hard", master, speed: 1 });
  s.players.forEach((p, i) => (p.difficulty = diffs[i % 2] ?? diffs[0]));
  let steps = 0;
  while (s.phase !== "gameOver" && steps < 20000) {
    if (s.phase === "swap") {
      for (let p = 0; p < 4; p++) if (!s.swapSelections[p]) s = selectSwap(s, p, chooseSwapCard(s, p, s.players[p].difficulty, styleFor(p)));
      continue;
    }
    const decider = s.subTurn ? s.subTurn.actor : s.current;
    const mv = chooseMove(s, s.players[decider].difficulty, styleFor(decider));
    if (!mv) throw new Error("Keine legalen Züge! " + JSON.stringify({ cur: s.current, sub: s.subTurn, hands: s.players.map((p) => p.hand.length) }));
    const team = teamOf(decider);
    kicks[team] += mv.captured.filter((id) => teamOf(s.marbles[id].color) !== team).length;
    if (mv.kind === "skip") skips[team]++;
    if (s.players[mv.handOwner].hand.find((c) => c.id === mv.cardId)?.value === "tac" && mv.kind !== "discard") tacs[team]++;
    s = applyMove(s, mv);
    // Invarianten
    const occ = new Map<string, number>();
    for (const m of s.marbles) {
      if (m.pos === -1) continue;
      const k = m.pos >= 64 ? `h${m.color}-${m.pos}` : `r${m.pos}`;
      if (occ.has(k)) throw new Error(`Doppelt belegt: ${k}`);
      occ.set(k, m.id);
    }
    const cards = s.players.map((p) => p.hand.length);
    if (s.phase === "play" && cards.every((c) => c === 0)) throw new Error("Leere Hände im Spiel");
    steps++;
  }
  totalMoves += steps;
  if (s.winner !== null) wins[s.winner]++;
  if (games <= 20) console.log(`Partie ${g + 1}: Sieger Team ${s.winner} nach ${steps} Zügen, ${s.dealNumber} mal gegeben`);
}
const label = (t: number) => `${diffs[t] ?? diffs[0]}${personas.length ? "/" + (personas[t] ?? personas[0]) : ""}`;
const per = (n: number) => (n / games).toFixed(1);
console.log(`Team 0 (${label(0)}) ${wins[0]} : ${wins[1]} Team 1 (${label(1)}) – Ø ${Math.round(totalMoves / games)} Züge, ${Date.now() - t0} ms`);
console.log(`  pro Partie – Rauswürfe ${per(kicks[0])} : ${per(kicks[1])}, Aussetzen ${per(skips[0])} : ${per(skips[1])}, TAC ${per(tacs[0])} : ${per(tacs[1])}`);
