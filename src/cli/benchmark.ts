import { performance } from "node:perf_hooks";
import { IsingModel } from "../ising/model.js";
import { parseArgs, parseFloatValue, parseInteger, parseNumberList } from "./args.js";

const args = parseArgs(process.argv.slice(2));
const Ls = parseNumberList(args.L, [8, 12, 16, 20]);
const temperature = parseFloatValue(args.temp, 2.3);
const mcs = parseInteger(args.mcs, 200);
const seed = args.seed === undefined ? undefined : parseInteger(args.seed, 0);

const beta = 1 / temperature;

console.log("L, mcs, elapsedMs, msPerSweep, nsPerSpin");

for (const L of Ls) {
  const model = new IsingModel({ L, seed: seed === undefined ? undefined : seed + L, initial: "random" });

  for (let i = 0; i < 20; i++) {
    model.sweep(beta);
  }

  const start = performance.now();
  for (let i = 0; i < mcs; i++) {
    model.sweep(beta);
  }
  const elapsed = performance.now() - start;
  const msPerSweep = elapsed / mcs;
  const nsPerSpin = (elapsed * 1e6) / (mcs * L * L);

  console.log([L, mcs, elapsed.toFixed(2), msPerSweep.toFixed(4), nsPerSpin.toFixed(2)].join(", "));
}
