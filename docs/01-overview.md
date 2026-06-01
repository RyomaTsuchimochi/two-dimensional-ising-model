# プロジェクト概要

## 目的

2次元強磁性イジング模型の転移温度（臨界温度 Tc）を、古典モンテカルロ法（メトロポリス法）で数値的に求める。
有限サイズスケーリングを利用して、系のサイズ L → ∞ の極限における Tc を推定する。

### 課題の要件（orders/order1.md）

- 系サイズは L×L（L = 格子一辺のサイト数）
- 1モンテカルロステップ（MCS）= 全スピン L² 個への更新試行を1回ずつ
- 計算時間が L に対して O(L²) でスケールすることを確認する
- 十分小さな L に対するユニットテストを追加する
- 有限サイズスケーリングにより Tc を推定する

---

## ファイル構成

```
two-dimensional-ising-model/
├── src/
│   ├── ising/
│   │   ├── model.ts        # IsingModel クラス（コア物理）
│   │   ├── simulation.ts   # 温度走査・観測量集計
│   │   ├── analysis.ts     # Binder cumulant・交点推定
│   │   └── rng.ts          # 乱数生成（Mulberry32）
│   └── cli/
│       ├── simulate.ts     # CLI エントリーポイント（温度走査・CSV出力）
│       ├── benchmark.ts    # ベンチマーク（O(L²) 確認）
│       └── args.ts         # コマンドライン引数パーサ
├── tests/
│   └── ising.test.ts       # ユニットテスト（Node.js 組み込み test）
├── web/
│   ├── index.html          # Vite エントリー
│   ├── main.ts             # Web UI メインスクリプト（TS）
│   ├── ising.ts            # Web 向けイジングモデル（スタンドアロン版）
│   ├── style.css           # スタイル
│   ├── standalone.html     # デモ用 HTML（サーバー不要・シンプル版）
│   └── assignment.html     # 課題用 HTML（サーバー不要・フル機能版）
├── orders/
│   ├── order1.md           # 課題の指示
│   ├── order2.md           # ノート作成の方針
│   └── order3.md           # GitHub 公開の指示
├── docs/                   # このドキュメントディレクトリ
├── ising-notes.md          # 自分用の物理・実装ノート
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 技術スタック

| 項目 | 内容 |
|---|---|
| 言語 | TypeScript（Node.js + Vite） |
| テスト | Node.js 組み込み `node:test` |
| 乱数 | Mulberry32（シード固定可能） |
| Web UI | Vite（開発）/ 単一 HTML（オフライン） |
| ビルド | `tsc` → `dist/` |

---

## 厳密解（検算用）

2次元イジング模型（正方格子）の臨界温度はオンサーガー（1944年）が厳密に解いた。

```
Tc = 2J / ln(1 + √2) ≈ 2.2692 (J=1, k_B=1)
```

シミュレーションの結果がこの値に近いかどうかで結果を検証できる。
