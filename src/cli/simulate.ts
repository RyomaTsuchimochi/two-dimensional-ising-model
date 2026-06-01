import fs from "node:fs";
import path from "node:path";
import { estimateBinderCrossing } from "../ising/analysis.js";
import { runSimulation } from "../ising/simulation.js";
import { parseArgs, parseFloatValue, parseInteger, parseNumberList } from "./args.js";

const args = parseArgs(process.argv.slice(2));
const Ls = parseNumberList(args.L, [8, 12]);
const temperatures = parseNumberList(args.temps, [2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6]);
const thermalizationSteps = parseInteger(args.therm, 500);
const samplingSteps = parseInteger(args.sample, 2000);
const sampleInterval = parseInteger(args.interval, 10);
const seed = args.seed === undefined ? undefined : parseInteger(args.seed, 0);
const outputRoot = args.output ?? "output";
const J = parseFloatValue(args.J, 1);
const initial = args.initial === "up" || args.initial === "down" || args.initial === "random"
  ? args.initial
  : "random";

const resultsByL = new Map<number, ReturnType<typeof runSimulation>[]>();

for (const L of Ls) {
  const results: ReturnType<typeof runSimulation>[] = [];

  for (let tIndex = 0; tIndex < temperatures.length; tIndex++) {
    const temperature = temperatures[tIndex];
    if (temperature === undefined) {
      throw new Error("Temperature list contains an undefined value.");
    }
    const runSeed = seed === undefined ? undefined : seed + L * 1000 + tIndex;

    const observables = runSimulation({
      L,
      J,
      temperature,
      thermalizationSteps,
      samplingSteps,
      sampleInterval,
      seed: runSeed,
      initial,
    });

    results.push(observables);
  }

  resultsByL.set(L, results);

  const outputDir = path.join(outputRoot, `L${L}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const header = [
    "T",
    "energyDensity",
    "magnetizationDensity",
    "heatCapacity",
    "susceptibility",
    "binderU4",
    "energy",
    "magnetization",
    "samples",
  ].join(",");

  const rows = results.map((obs) =>
    [
      formatNumber(obs.temperature),
      formatNumber(obs.energyDensity),
      formatNumber(obs.magnetizationDensity),
      formatNumber(obs.heatCapacity),
      formatNumber(obs.susceptibility),
      formatNumber(obs.binderU4),
      formatNumber(obs.energy),
      formatNumber(obs.magnetization),
      String(obs.samples),
    ].join(","),
  );

  fs.writeFileSync(path.join(outputDir, "observables.csv"), `${header}\n${rows.join("\n")}\n`);
}

const sortedLs = [...Ls].sort((a, b) => a - b);
if (sortedLs.length >= 2) {
  const L1 = sortedLs[sortedLs.length - 2];
  const L2 = sortedLs[sortedLs.length - 1];
  if (L1 !== undefined && L2 !== undefined) {
    const results1 = resultsByL.get(L1) ?? [];
    const results2 = resultsByL.get(L2) ?? [];

    if (results1.length === results2.length && results1.length > 1) {
      const u4a = results1.map((obs) => obs.binderU4);
      const u4b = results2.map((obs) => obs.binderU4);
      const crossing = estimateBinderCrossing(temperatures, u4a, u4b);
      console.log(
        `Binder crossing L=${L1}, L=${L2}: Tc ~ ${crossing.temperature.toFixed(4)} (${crossing.method})`,
      );
    }
  }
}

console.log(`Wrote CSV output under ${outputRoot}/`);

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(6) : "NaN";
}
