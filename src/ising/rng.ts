export interface Random {
  next(): number;
  int(maxExclusive: number): number;
}

export class Mulberry32 implements Random {
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

export function createRng(seed?: number): Random {
  if (seed === undefined || Number.isNaN(seed)) {
    return {
      next: () => Math.random(),
      int: (maxExclusive: number) => Math.floor(Math.random() * maxExclusive),
    };
  }
  return new Mulberry32(Math.floor(seed));
}
