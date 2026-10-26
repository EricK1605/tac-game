// Lässt komplette Partien Bot gegen Bot laufen, um die Engine zu prüfen.
// Aufruf: npx tsx scripts/simulate.ts [anzahl] [easy|medium|hard] [master]
import { applyMove, newGame, selectSwap } from "../lib/engine/game";
import { chooseMove, chooseSwapCard } from "../lib/ai/botEngine";
import type { Difficulty, GameState } from "../types/game";

const games = Number(process.argv[2] ?? 5);
const diffs = (process.argv[3] ?? "hard,easy").split(",") as Difficulty[];
const master = process.argv[4] === "master";

const wins = [0, 0];
let totalMoves = 0;
const t0 = Date.now();
for (let g = 0; g < games; g++) {
  let s: GameState = newGame({ playerName: "A", difficulty: "hard", master, speed: 1 });
  s.players.forEach((p, i) => (p.difficulty = diffs[i % 2] ?? diffs[0]));
  let steps = 0;
  while (s.phase !== "gameOver" && steps < 20000) {
    if (s.phase === "swap") {
      for (let p = 0; p < 4; p++) if (!s.swapSelections[p]) s = selectSwap(s, p, chooseSwapCard(s, p, s.players[p].difficulty));
      continue;
    }
    const decider = s.subTurn ? s.subTurn.actor : s.current;
    const mv = chooseMove(s, s.players[decider].difficulty);
    if (!mv) throw new Error("Keine legalen Züge! " + JSON.stringify({ cur: s.current, sub: s.subTurn, hands: s.players.map((p) => p.hand.length) }));
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
  console.log(`Partie ${g + 1}: Sieger Team ${s.winner} nach ${steps} Zügen, ${s.dealNumber} mal gegeben`);
}
console.log(`Team 0 (${diffs[0]}) ${wins[0]} : ${wins[1]} Team 1 (${diffs[1] ?? diffs[0]}) – Ø ${Math.round(totalMoves / games)} Züge, ${Date.now() - t0} ms`);
