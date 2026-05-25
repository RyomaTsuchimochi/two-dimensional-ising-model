import { Random, createRng } from "./rng.js";

export type InitialState = "up" | "down" | "random" | number[];

export interface IsingConfig {
  L: number;
  J?: number;
  seed?: number;
  initial?: InitialState;
}

export class IsingModel {
  readonly L: number;
  readonly N: number;
  readonly J: number;
  readonly rng: Random;
  spins: Int8Array;
  energy: number;
  magnetization: number;
  private order: Int32Array;

  constructor({ L, J = 1, seed, initial = "random" }: IsingConfig) {
    if (!Number.isInteger(L) || L <= 0) {
      throw new Error("L must be a positive integer.");
    }

    this.L = L;
    this.N = L * L;
    this.J = J;
    this.rng = createRng(seed);
    this.spins = new Int8Array(this.N);
    this.order = new Int32Array(this.N);

    for (let i = 0; i < this.N; i++) {
      this.order[i] = i;
    }

    this.initializeSpins(initial);
    this.energy = this.computeTotalEnergy();
    this.magnetization = this.computeMagnetization();
  }

  setSpins(values: number[]): void {
    if (values.length !== this.N) {
      throw new Error(`Expected ${this.N} spins, got ${values.length}.`);
    }

    for (let i = 0; i < this.N; i++) {
      const value = values[i];
      if (value !== 1 && value !== -1) {
        throw new Error("Spins must be +1 or -1.");
      }
      this.spins[i] = value;
    }

    this.energy = this.computeTotalEnergy();
    this.magnetization = this.computeMagnetization();
  }

  deltaEnergyAt(index: number): number {
    const L = this.L;
    const x = index % L;
    const y = Math.floor(index / L);

    const left = x === 0 ? index + (L - 1) : index - 1;
    const right = x === L - 1 ? index - (L - 1) : index + 1;
    const up = y === 0 ? index + L * (L - 1) : index - L;
    const down = y === L - 1 ? index - L * (L - 1) : index + L;

    const s = this.spins[index]!;
    const neighborSum =
      this.spins[left]! + this.spins[right]! + this.spins[up]! + this.spins[down]!;
    return 2 * this.J * s * neighborSum;
  }

  sweep(beta: number): number {
    this.shuffleOrder();
    for (let i = 0; i < this.N; i++) {
      const index = this.order[i]!;
      this.attemptFlip(index, beta);
    }
    return this.N;
  }

  private attemptFlip(index: number, beta: number): boolean {
    const dE = this.deltaEnergyAt(index);
    if (dE <= 0 || this.rng.next() < Math.exp(-beta * dE)) {
      const s = this.spins[index]!;
      this.spins[index] = s === 1 ? -1 : 1;
      this.energy += dE;
      this.magnetization -= 2 * s;
      return true;
    }
    return false;
  }

  private shuffleOrder(): void {
    for (let i = this.order.length - 1; i > 0; i--) {
      const j = this.rng.int(i + 1);
      const temp = this.order[i]!;
      this.order[i] = this.order[j]!;
      this.order[j] = temp;
    }
  }

  private initializeSpins(initial: InitialState): void {
    if (Array.isArray(initial)) {
      if (initial.length !== this.N) {
        throw new Error(`Expected ${this.N} spins, got ${initial.length}.`);
      }
      for (let i = 0; i < this.N; i++) {
        const value = initial[i];
        if (value !== 1 && value !== -1) {
          throw new Error("Spins must be +1 or -1.");
        }
        this.spins[i] = value;
      }
      return;
    }

    if (initial === "up" || initial === "down") {
      const value = initial === "up" ? 1 : -1;
      this.spins.fill(value);
      return;
    }

    for (let i = 0; i < this.N; i++) {
      this.spins[i] = this.rng.next() < 0.5 ? 1 : -1;
    }
  }

  private computeTotalEnergy(): number {
    let energy = 0;
    const L = this.L;

    for (let y = 0; y < L; y++) {
      const row = y * L;
      const upRow = (y === 0 ? L - 1 : y - 1) * L;

      for (let x = 0; x < L; x++) {
        const i = row + x;
        const right = row + (x === L - 1 ? 0 : x + 1);
        const up = upRow + x;
        energy += -this.J * this.spins[i]! * (this.spins[right]! + this.spins[up]!);
      }
    }

    return energy;
  }

  private computeMagnetization(): number {
    let total = 0;
    for (let i = 0; i < this.N; i++) {
      total += this.spins[i]!;
    }
    return total;
  }
}
