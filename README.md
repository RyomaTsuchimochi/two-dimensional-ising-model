# Two-Dimensional Ising Model

2次元強磁性イジング模型の古典モンテカルロ法による転移温度推定に関する作業用プロジェクト。

## セットアップ
```bash
npm install
```

## 使い方
```bash
npm run simulate
```

オプション例:
```bash
npm run simulate -- --L 8,12 --temps 2.0:2.6:0.1 --therm 500 --sample 2000 --interval 10 --seed 123
```

ベンチマーク:
```bash
npm run bench -- --L 8,12,16 --mcs 500 --temp 2.3 --seed 123
```

テスト:
```bash
npm test
```

## Web UI (mobile)
サーバーレスでスマホ内だけで動かしたい場合は、assignment HTML を使います。

```text
web/assignment.html
```

このファイルをスマホにコピーしてブラウザで開くだけで動作します（サーバー不要）。

開発サーバーを起動して動かす場合はこちらです。

```bash
npm run dev:web
```

同一ネットワーク内のスマホで `http://<your-ip>:5173` を開いてください。

ビルドする場合:
```bash
npm run build:web
```

## 出力
- output/L{L}/observables.csv に温度ごとの観測量を書き出します。

## 構成
- ising-notes.md: 自分用の解説ノートと実装方針
- orders/: 指示書をまとめたディレクトリ
  - order1.md: 課題の概要と注意点
  - order2.md: ノート作成の方針
  - order3.md: 公開リポジトリ作成の指示
- src/: TypeScript 実装
- tests/: 小さな L 向けユニットテスト
- web/: モバイル向け簡易シミュレーター
- web/assignment.html: 課題クリア用の単一HTML（オフライン）
- web/standalone.html: シンプルなデモ
- web-dist/: Web UI のビルド成果物（gitignore）
- output/: 実行時に生成（gitignore）
- package.json, tsconfig.json: ビルド設定
