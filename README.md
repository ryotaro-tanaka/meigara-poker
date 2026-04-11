# meigara-poker
[![Deploy](https://github.com/ryotaro-tanaka/meigara-poker/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/ryotaro-tanaka/meigara-poker/actions/workflows/deploy.yml)

銘柄ポーカーのプロトタイプです。

## Project Layout
- `backend/`: Cloudflare Workers 側のコード
- `frontend/`: React + Vite のフロントエンド
- `data/`: 元データ CSV
- `docs/`: 設計メモ

## Current Status
- 設計メモは `docs/` に整理済み
- プロジェクト土台として `backend/` と `frontend/` の雛形を追加済み
- 開発中も D1 は remote 接続で使う前提にしている

## Next Steps
- `backend/` で D1 バインディングを有効化する
- `backend/migrations/` の初期スキーマを `--remote` で D1 に適用する
- `frontend/` の依存関係を入れて開発サーバーを起動する

## Local Dev
- 両方を同時に前面起動:
  - `npm run dev`
  - 停止は `Ctrl+C`
- 両方をバックグラウンド起動:
  - `npm run dev:bg`
- バックグラウンド停止:
  - `npm run dev:stop`
- バックグラウンドログ:
  - `.devlogs/backend.log`
  - `.devlogs/frontend.log`

## Deploy
- ルートから frontend + backend をまとめてデプロイ:
  - `npm run deploy`
- frontend のみ:
  - `npm run deploy:frontend`
- backend のみ:
  - `npm run deploy:backend`

補助コマンド:
- 型チェック:
  - `npm run check`
- テスト:
  - `npm run test`
