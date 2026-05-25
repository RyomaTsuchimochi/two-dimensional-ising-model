import { binderCumulant } from "./analysis.js";
import { InitialState, IsingModel } from "./model.js";

export interface SimulationParams {
  L: number;
  temperature: number;
  thermalizationSteps: number;
  samplingSteps: number;
  sampleInterval: number;
  seed?: number;
  J?: number;
  initial?: InitialState;
}

export interface Observables {
  L: number;
  temperature: number;
  samples: number;
  energy: number;
  magnetization: number;
  energyDensity: number;
  magnetizationDensity: number;
  heatCapacity: number;
  susceptibility: number;
  binderU4: number;
}

export function runSimulation(params: SimulationParams): Observables {
  const {
    L,
    J = 1,
    temperature,
    thermalizationSteps,
    samplingSteps,
    sampleInterval,
    seed,
    initial = "random",
  } = params;

  if (temperature <= 0) {
    throw new Error("Temperature must be positive.");
  }

  const beta = 1 / temperature;
  const model = new IsingModel({ L, J, seed, initial });

  for (let i = 0; i < thermalizationSteps; i++) {
    model.sweep(beta);
  }

  const interval = Math.max(1, Math.floor(sampleInterval));
  let samples = 0;
  let energySum = 0;
  let energy2Sum = 0;
  let magnetizationSum = 0;
  let magnetization2Sum = 0;
  let magnetization4Sum = 0;

  for (let step = 1; step <= samplingSteps; step++) {
    model.sweep(beta);

    if (step % interval === 0) {
      const e = model.energy;
      const m = model.magnetization;
      energySum += e;
      energy2Sum += e * e;
      magnetizationSum += m;
      magnetization2Sum += m * m;
      magnetization4Sum += m * m * m * m;
      samples += 1;
    }
  }

  if (samples === 0) {
    throw new Error("No samples collected. Increase samplingSteps or decrease sampleInterval.");
  }

  const energyAvg = energySum / samples;
  const energy2Avg = energy2Sum / samples;
  const magnetizationAvg = magnetizationSum / samples;
  const magnetization2Avg = magnetization2Sum / samples;
  const magnetization4Avg = magnetization4Sum / samples;
  const N = L * L;

  const heatCapacity = (beta * beta / N) * (energy2Avg - energyAvg * energyAvg);
  const susceptibility = (beta / N) * (magnetization2Avg - magnetizationAvg * magnetizationAvg);

  return {
    L,
    temperature,
    samples,
    energy: energyAvg,
    magnetization: magnetizationAvg,
    energyDensity: energyAvg / N,
    magnetizationDensity: magnetizationAvg / N,
    heatCapacity,
    susceptibility,
    binderU4: binderCumulant(magnetization2Avg, magnetization4Avg),
  };
}

export function simulateTemperatures(
  params: Omit<SimulationParams, "temperature"> & { temperatures: number[] },
): Observables[] {
  const { temperatures, ...base } = params;
  return temperatures.map((temperature, index) =>
    runSimulation({
      ...base,
      temperature,
      seed: base.seed === undefined ? undefined : base.seed + index,
    }),
  );
}
