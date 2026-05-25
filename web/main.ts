import "./style.css";
import { InitialState, IsingModel } from "./ising";

const sizeInput = document.querySelector<HTMLInputElement>("#size");
const temperatureInput = document.querySelector<HTMLInputElement>("#temperature");
const speedInput = document.querySelector<HTMLInputElement>("#speed");
const initialSelect = document.querySelector<HTMLSelectElement>("#initial");
const toggleButton = document.querySelector<HTMLButtonElement>("#toggle");
const stepButton = document.querySelector<HTMLButtonElement>("#step");
const resetButton = document.querySelector<HTMLButtonElement>("#reset");
const sizeValue = document.querySelector<HTMLSpanElement>("#sizeValue");
const temperatureValue = document.querySelector<HTMLSpanElement>("#temperatureValue");
const speedValue = document.querySelector<HTMLSpanElement>("#speedValue");
const sweepsValue = document.querySelector<HTMLSpanElement>("#sweeps");
const samplesValue = document.querySelector<HTMLSpanElement>("#samples");
const energyValue = document.querySelector<HTMLSpanElement>("#energy");
const magnetizationValue = document.querySelector<HTMLSpanElement>("#magnetization");
const heatCapacityValue = document.querySelector<HTMLSpanElement>("#heatCapacity");
const susceptibilityValue = document.querySelector<HTMLSpanElement>("#susceptibility");
const binderValue = document.querySelector<HTMLSpanElement>("#binder");
const canvas = document.querySelector<HTMLCanvasElement>("#lattice");
const canvasWrap = document.querySelector<HTMLDivElement>(".canvas-wrap");

if (
  !sizeInput ||
  !temperatureInput ||
  !speedInput ||
  !initialSelect ||
  !toggleButton ||
  !stepButton ||
  !resetButton ||
  !sizeValue ||
  !temperatureValue ||
  !speedValue ||
  !sweepsValue ||
  !samplesValue ||
  !energyValue ||
  !magnetizationValue ||
  !heatCapacityValue ||
  !susceptibilityValue ||
  !binderValue ||
  !canvas ||
  !canvasWrap
) {
  throw new Error("Missing UI elements.");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Canvas context not available.");
}

const colors = {
  up: "#f6efe5",
  down: "#1c6f64",
  background: "#0d1a16",
};

class StatsAccumulator {
  samples = 0;
  energySum = 0;
  energy2Sum = 0;
  magnetizationSum = 0;
  magnetization2Sum = 0;
  magnetization4Sum = 0;

  reset(): void {
    this.samples = 0;
    this.energySum = 0;
    this.energy2Sum = 0;
    this.magnetizationSum = 0;
    this.magnetization2Sum = 0;
    this.magnetization4Sum = 0;
  }

  addSample(energy: number, magnetization: number): void {
    this.samples += 1;
    this.energySum += energy;
    this.energy2Sum += energy * energy;
    this.magnetizationSum += magnetization;
    this.magnetization2Sum += magnetization * magnetization;
    this.magnetization4Sum += magnetization * magnetization * magnetization * magnetization;
  }

  getObservables(beta: number, N: number): Observables {
    if (this.samples === 0) {
      return {
        energyDensity: Number.NaN,
        magnetizationDensity: Number.NaN,
        heatCapacity: Number.NaN,
        susceptibility: Number.NaN,
        binderU4: Number.NaN,
      };
    }

    const energyAvg = this.energySum / this.samples;
    const energy2Avg = this.energy2Sum / this.samples;
    const magnetizationAvg = this.magnetizationSum / this.samples;
    const magnetization2Avg = this.magnetization2Sum / this.samples;
    const magnetization4Avg = this.magnetization4Sum / this.samples;

    const heatCapacity = (beta * beta / N) * (energy2Avg - energyAvg * energyAvg);
    const susceptibility = (beta / N) * (magnetization2Avg - magnetizationAvg * magnetizationAvg);
    const binderU4 = magnetization2Avg === 0
      ? 0
      : 1 - magnetization4Avg / (3 * magnetization2Avg * magnetization2Avg);

    return {
      energyDensity: energyAvg / N,
      magnetizationDensity: magnetizationAvg / N,
      heatCapacity,
      susceptibility,
      binderU4,
    };
  }
}

interface Observables {
  energyDensity: number;
  magnetizationDensity: number;
  heatCapacity: number;
  susceptibility: number;
  binderU4: number;
}

let model = createModel();
let stats = new StatsAccumulator();
let sweeps = 0;
let running = false;
let frameId: number | null = null;

function createModel(): IsingModel {
  const L = parseInt(sizeInput.value, 10);
  const initial = initialSelect.value as InitialState;
  return new IsingModel(L, initial);
}

function resetModel(): void {
  model = createModel();
  stats.reset();
  sweeps = 0;
  updateStats();
  drawLattice();
}

function getBeta(): number {
  const temperature = parseFloat(temperatureInput.value);
  return 1 / temperature;
}

function runSweeps(count: number): void {
  const beta = getBeta();
  for (let i = 0; i < count; i++) {
    model.sweep(beta);
    stats.addSample(model.energy, model.magnetization);
    sweeps += 1;
  }
}

function updateLabels(): void {
  sizeValue.textContent = sizeInput.value;
  temperatureValue.textContent = parseFloat(temperatureInput.value).toFixed(2);
  speedValue.textContent = speedInput.value;
}

function updateStats(): void {
  const observables = stats.getObservables(getBeta(), model.N);
  sweepsValue.textContent = String(sweeps);
  samplesValue.textContent = String(stats.samples);
  energyValue.textContent = formatNumber(observables.energyDensity, 5);
  magnetizationValue.textContent = formatNumber(observables.magnetizationDensity, 5);
  heatCapacityValue.textContent = formatNumber(observables.heatCapacity, 5);
  susceptibilityValue.textContent = formatNumber(observables.susceptibility, 5);
  binderValue.textContent = formatNumber(observables.binderU4, 5);
}

function formatNumber(value: number, digits = 4): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "--";
}

function drawLattice(): void {
  const containerSize = Math.floor(canvasWrap.clientWidth);
  const cellSize = Math.max(1, Math.floor(containerSize / model.L));
  const canvasSize = cellSize * model.L;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.floor(canvasSize * dpr);
  canvas.height = Math.floor(canvasSize * dpr);
  canvas.style.width = `${canvasSize}px`;
  canvas.style.height = `${canvasSize}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  for (let y = 0; y < model.L; y++) {
    for (let x = 0; x < model.L; x++) {
      const index = y * model.L + x;
      ctx.fillStyle = model.spins[index] === 1 ? colors.up : colors.down;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}

function stopLoop(): void {
  running = false;
  toggleButton.textContent = "Start";
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
    frameId = null;
  }
}

function startLoop(): void {
  if (running) {
    return;
  }
  running = true;
  toggleButton.textContent = "Stop";
  frameId = requestAnimationFrame(loop);
}

function loop(): void {
  if (!running) {
    return;
  }

  const sweepsPerFrame = parseInt(speedInput.value, 10);
  runSweeps(sweepsPerFrame);
  drawLattice();
  updateStats();
  frameId = requestAnimationFrame(loop);
}

sizeInput.addEventListener("input", () => {
  updateLabels();
  resetModel();
});

temperatureInput.addEventListener("input", () => {
  updateLabels();
  updateStats();
});

speedInput.addEventListener("input", updateLabels);

initialSelect.addEventListener("change", () => {
  resetModel();
});

toggleButton.addEventListener("click", () => {
  if (running) {
    stopLoop();
  } else {
    startLoop();
  }
});

stepButton.addEventListener("click", () => {
  runSweeps(1);
  drawLattice();
  updateStats();
});

resetButton.addEventListener("click", () => {
  resetModel();
});

new ResizeObserver(() => {
  drawLattice();
}).observe(canvasWrap);

updateLabels();
resetModel();
