# テストガイド

## テストの実行

```bash
npm test
```

TypeScript をビルドしてから `node --test` で実行する。

---

## 既存テスト一覧（tests/ising.test.ts）

| テスト名 | 確認内容 |
|---|---|
| energy for ordered L=2 | 全スピン up（L=2）の全エネルギーが −2L² |
| energy for checkerboard L=2 | チェッカーボード配置（L=2）の全エネルギーが +2L² |
| delta energy for single flip L=3 | L=3の全 up 状態で中心スピン(index=4)の dE = 8 |
| sweep attempts once per spin | 1 MCS の戻り値が L² と一致 |
| beta=0 flips all spins | β=0（T→∞）では全スピンが必ず反転する |
| binder cumulant formula | ⟨M²⟩=4, ⟨M⁴⟩=16 のとき U4 = 2/3 |

---

## テストの設計方針

### 小さな L を使う

テストは計算時間が短い L=2〜4 で行う。大きな L は統計的ゆらぎがあるためユニットテストに向かない。

### 決定論的な状態を使う

- 全 up（"up"）や全 down（"down"）などの決定論的な初期状態を使う
- seed を固定すると乱数依存のテストも再現可能

### エネルギーの整合性

L=2 全 up の例：
```
スピン: [+1, +1, +1, +1]
近接ペア数: 2×L² = 8（周期境界で各スピンが 2 ペアに寄与）
H = -J × 8 = -8 = -2 × L²  ✓
```

### dE の検証

L=3 全 up、中心スピン（インデックス 4）の場合：
```
4近傍のスピン合計 = +1 + 1 + 1 + 1 = 4
dE = 2 × J × s × 合計 = 2 × 1 × 1 × 4 = 8  ✓
```

---

## テストの追加方法

`tests/ising.test.ts` にテストを追記する。Node.js 組み込みの `node:test` と `node:assert/strict` を使う。

```typescript
import assert from "node:assert/strict";
import test from "node:test";
import { IsingModel } from "../src/ising/model.js";

test("テスト名", () => {
  const model = new IsingModel({ L: 4, initial: "up", seed: 1 });
  // ...アサーション
  assert.equal(model.energy, expected);
});
```

### テスト例のアイデア

- `setSpins` で任意の配置を設定して `energy` が正しいか確認
- `sweep` 後の `magnetization` と `spins` の整合性確認
- 低温（β が大きい）でスイープを多数回行った後の磁化が高いことを確認
- `simulateTemperatures` の結果配列の長さが温度リストと一致するか確認

---

## CI について

GitHub Actions でプッシュ時に自動で `npm test` が実行される（`.github/workflows/` を参照）。
