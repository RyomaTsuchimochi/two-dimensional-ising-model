import assert from "node:assert/strict";
import test from "node:test";
import { binderCumulant } from "../src/ising/analysis.js";
import { IsingModel } from "../src/ising/model.js";

test("energy for ordered L=2", () => {
  const L = 2;
  const spins = new Array(L * L).fill(1);
  const model = new IsingModel({ L, initial: spins, seed: 1 });
  assert.equal(model.energy, -2 * L * L);
});

test("energy for checkerboard L=2", () => {
  const L = 2;
  const spins = [1, -1, -1, 1];
  const model = new IsingModel({ L, initial: spins, seed: 1 });
  assert.equal(model.energy, 2 * L * L);
});

test("delta energy for single flip L=3", () => {
  const L = 3;
  const spins = new Array(L * L).fill(1);
  const model = new IsingModel({ L, initial: spins, seed: 1 });
  assert.equal(model.deltaEnergyAt(4), 8);
});

test("sweep attempts once per spin", () => {
  const L = 4;
  const model = new IsingModel({ L, initial: "up", seed: 1 });
  assert.equal(model.sweep(0.5), L * L);
});

test("beta=0 flips all spins", () => {
  const L = 3;
  const model = new IsingModel({ L, initial: "up", seed: 1 });
  model.sweep(0);

  for (const spin of model.spins) {
    assert.equal(spin, -1);
  }
  assert.equal(model.magnetization, -L * L);
});

test("binder cumulant formula", () => {
  const u4 = binderCumulant(4, 16);
  assert.ok(Math.abs(u4 - 2 / 3) < 1e-12);
});
