# 使い方

## セットアップ

```bash
npm install
```

---

## CLI：温度走査シミュレーション

### 基本実行

```bash
npm run simulate
```

デフォルト設定（L=8,12、T=2.0〜2.6）で走査し、CSV を出力する。

### オプション一覧

| オプション | 説明 | デフォルト |
|---|---|---|
| `--L` | サイズリスト（カンマ区切り or start:end:step） | 8,12 |
| `--temps` | 温度リスト（カンマ区切り or start:end:step） | 2.0,2.1,...,2.6 |
| `--therm` | 熱化 MCS 数 | 500 |
| `--sample` | サンプリング MCS 数 | 2000 |
| `--interval` | サンプル間隔（MCS） | 10 |
| `--seed` | 乱数シード（省略可） | なし |
| `--output` | 出力ディレクトリ | output |
| `--J` | 結合定数 | 1 |
| `--initial` | 初期状態（random / up / down） | random |

### 使用例

```bash
# 細かい温度刻みで L=8,16,32 を走査
npm run simulate -- --L 8,16,32 --temps 2.0:2.6:0.05 --therm 1000 --sample 5000

# シード固定・all-up 初期状態
npm run simulate -- --L 8,12 --seed 42 --initial up
```

### 出力

`output/L{L}/observables.csv`（デフォルト）に以下の列を書き出す。

```
T, energyDensity, magnetizationDensity, heatCapacity, susceptibility, binderU4, energy, magnetization, samples
```

標準出力には Binder 交点（Tc 推定値）が表示される。

---

## CLI：ベンチマーク

O(L²) スケーリングを確認するためのタイミング測定。

```bash
npm run bench
```

### オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--L` | サイズリスト | 8,12,16,20 |
| `--mcs` | 計測 MCS 数 | 200 |
| `--temp` | 計測温度 | 2.3 |
| `--seed` | 乱数シード | なし |

### 出力例

```
L, mcs, elapsedMs, msPerSweep, nsPerSpin
8, 200, 1.23, 0.0062, 0.10
12, 200, 2.78, 0.0139, 0.10
16, 200, 4.94, 0.0247, 0.10
20, 200, 7.72, 0.0386, 0.10
```

`nsPerSpin` がほぼ一定であれば、1 MCS が O(L²) でスケールしていることを確認できる。

---

## テスト

```bash
npm test
```

TypeScript をビルドしてから `node:test` でテストを実行する。テストは `tests/ising.test.ts` にある。

---

## Web UI

### 開発サーバー（Vite）

```bash
npm run dev:web
```

`http://localhost:5173` でブラウザシミュレーターが開く。  
同一 LAN 内のスマホからは `http://<PC の IP>:5173` でアクセス可能。

### ビルド

```bash
npm run build:web
```

`web-dist/` に静的ファイルを出力する（GitHub Pages 用）。

### オフライン用 HTML（推奨）

サーバー不要でスマホでも動く単一 HTML ファイルが 2 種類ある。

| ファイル | 内容 |
|---|---|
| `web/standalone.html` | シンプルなリアルタイムシミュレーター |
| `web/assignment.html` | フル機能版（バッチ走査・Binder グラフ・パフォーマンスチェック） |

どちらもファイルをブラウザで直接開くだけで動作する。スマホにコピーしてオフラインでも使える。

### assignment.html の機能

- L リスト・温度範囲を指定してバッチ走査
- リアルタイムで格子をビジュアライズ
- Binder U4 vs T グラフ・比熱グラフを自動描画
- Tc 推定値（Binder 交点）をリアルタイム表示
- O(L²) タイミングチェックグラフ

---

## GitHub Pages

`main` ブランチへのマージ後、GitHub Actions が自動的に `web/assignment.html` をデプロイする。

公開 URL：
```
https://ryomatsuchimochi.github.io/two-dimensional-ising-model/
```
