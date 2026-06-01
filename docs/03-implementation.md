# 実装の詳細

## ソースコード構成

```
src/
├── ising/
│   ├── model.ts       IsingModel クラス（コア）
│   ├── simulation.ts  温度走査・観測量集計
│   ├── analysis.ts    Binder cumulant 計算・交点推定
│   └── rng.ts         Mulberry32 乱数生成
└── cli/
    ├── simulate.ts    温度走査 CLI
    ├── benchmark.ts   O(L²) ベンチマーク CLI
    └── args.ts        引数パーサ
```

---

## src/ising/rng.ts

乱数生成器の定義。

```
interface Random {
  next(): number          // [0, 1) の一様乱数
  int(max: number): number  // [0, max) の整数
}
```

- `Mulberry32`：32ビット PRNG。シード固定でテストの再現性を保証。
- `createRng(seed?)`：seed が undefined または NaN の場合は `Math.random()` を使うフォールバック実装を返す。

---

## src/ising/model.ts

### IsingModel クラス

| プロパティ | 型 | 説明 |
|---|---|---|
| L | number | 格子一辺のサイズ |
| N | number | 全スピン数（= L²） |
| J | number | 結合定数（デフォルト 1） |
| spins | Int8Array | スピン配列（±1） |
| energy | number | 現在のトータルエネルギー |
| magnetization | number | 現在の全磁化 |

### 主なメソッド

#### `sweep(beta)` → number

1 MCS を実行。内部でスピン走査順をランダムにシャッフルしてから全スピンを1回ずつ更新。戻り値は更新試行回数（= N）。

```typescript
sweep(beta: number): number {
  this.shuffleOrder();
  for (let i = 0; i < this.N; i++) {
    this.attemptFlip(this.order[i], beta);
  }
  return this.N;
}
```

#### `deltaEnergyAt(index)` → number

スピン index を反転したときのエネルギー差。

```
dE = 2 * J * s_i * (s_left + s_right + s_up + s_down)
```

近傍インデックスは周期境界条件を直接 if 文で処理（mod 演算より高速）。

#### エネルギーの増分更新

フリップを受理するとき、エネルギーと磁化を再計算せずに差分だけ加算。これにより各更新が O(1)。

```typescript
this.energy += dE;
this.magnetization -= 2 * s;
```

#### `setSpins(values)` → void

テスト用：外部からスピン状態を直接設定し、エネルギーと磁化を再計算。

---

## src/ising/simulation.ts

### `runSimulation(params)` → Observables

単一温度でのモンテカルロシミュレーションを実行し、観測量を返す。

| パラメータ | 説明 |
|---|---|
| L | 格子サイズ |
| temperature | 温度 T |
| thermalizationSteps | 熱化 MCS 数 |
| samplingSteps | サンプリング MCS 数 |
| sampleInterval | 何 MCS ごとにサンプルするか |

熱化フェーズ後、`sampleInterval` ごとにエネルギー・磁化を記録。
記録した値から平均・分散を計算して、比熱・磁化率・Binder cumulant を算出。

### `simulateTemperatures(params)` → Observables[]

温度リストを走査して `runSimulation` を繰り返す。seed が指定されている場合、温度インデックスごとに seed をずらして相関を避ける。

---

## src/ising/analysis.ts

### `binderCumulant(m2, m4)` → number

```
U4 = 1 - m4 / (3 * m2²)
```

### `estimateBinderCrossing(temperatures, u4a, u4b)` → BinderCrossing

2 サイズの Binder cumulant 曲線の交点を推定。

1. 隣接温度点の差分が符号反転した区間を探す（線形補間で交点を求める）
2. 符号反転がなければ差分絶対値最小の点を返す

---

## src/cli/args.ts

`--key value` 形式のコマンドライン引数をパースして `Record<string, string>` に変換。

| 関数 | 説明 |
|---|---|
| `parseArgs(argv)` | 引数文字列を Record に変換 |
| `parseNumberList(value, fallback)` | "8,12,16" または "2.0:2.6:0.1" の形式をパース |
| `parseInteger(value, fallback)` | 整数をパース |
| `parseFloatValue(value, fallback)` | 浮動小数をパース |

---

## 計算量の設計

| 処理 | 計算量 |
|---|---|
| 1 MCS | O(L²)（全スピンを1回ずつ） |
| dE 計算 | O(1)（近傍4点のみ） |
| エネルギー・磁化の更新 | O(1)（差分加算） |
| 温度走査全体 | O(L² × MCS数 × 温度点数) |

`npm run bench` で実際の L² スケーリングを測定できる。

---

## 乱数とシード管理

- テスト再現性のため、`IsingModel` は seed を受け取り `Mulberry32` を使用する。
- seed が未指定のときは `Math.random()` にフォールバック（Web UI や本番実行向け）。
- CLI の `simulate.ts` では `seed + L * 1000 + tIndex` として各 (L, T) 組み合わせに異なる seed を割り当てる。

---

## Web UI との関係

`web/ising.ts` は `src/ising/model.ts` を参考にした**独立したコピー**（Vite でブラウザ向けにバンドルするため）。  
`web/standalone.html` と `web/assignment.html` は JS をインライン化した単一 HTML ファイルで、サーバー不要で動作する。
