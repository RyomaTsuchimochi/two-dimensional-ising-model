export type InitialState = "up" | "down" | "random";

interface Random {
  next(): number;
  int(maxExclusive: number): number;
}

class Mulberry32 implements Random {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }
}

function createRng(seed?: number): Random {
  if (seed === undefined || Number.isNaN(seed)) {
    return {
      next: () => Math.random(),
      int: (maxExclusive: number) => Math.floor(Math.random() * maxExclusive),
    };
  }
  return new Mulberry32(Math.floor(seed));
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

  constructor(L: number, initial: InitialState, seed?: number, J = 1) {
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

  sweep(beta: number): void {
    this.shuffleOrder();
    for (let i = 0; i < this.N; i++) {
      this.attemptFlip(this.order[i], beta);
    }
  }

  private attemptFlip(index: number, beta: number): void {
    const dE = this.deltaEnergyAt(index);
    if (dE <= 0 || this.rng.next() < Math.exp(-beta * dE)) {
      const s = this.spins[index];
      this.spins[index] = s === 1 ? -1 : 1;
      this.energy += dE;
      this.magnetization -= 2 * s;
    }
  }

  private deltaEnergyAt(index: number): number {
    const L = this.L;
    const x = index % L;
    const y = Math.floor(index / L);

    const left = x === 0 ? index + (L - 1) : index - 1;
    const right = x === L - 1 ? index - (L - 1) : index + 1;
    const up = y === 0 ? index + L * (L - 1) : index - L;
    const down = y === L - 1 ? index - L * (L - 1) : index + L;

    const s = this.spins[index];
    const neighborSum = this.spins[left] + this.spins[right] + this.spins[up] + this.spins[down];
    return 2 * this.J * s * neighborSum;
  }

  private shuffleOrder(): void {
    for (let i = this.order.length - 1; i > 0; i--) {
      const j = this.rng.int(i + 1);
      const temp = this.order[i];
      this.order[i] = this.order[j];
      this.order[j] = temp;
    }
  }

  private initializeSpins(initial: InitialState): void {
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
        energy += -this.J * this.spins[i] * (this.spins[right] + this.spins[up]);
      }
    }

    return energy;
  }

  private computeMagnetization(): number {
    let total = 0;
    for (let i = 0; i < this.N; i++) {
      total += this.spins[i];
    }
    return total;
  }
}
