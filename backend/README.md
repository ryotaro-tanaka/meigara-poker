# backend

Cloudflare Workers 側の土台です。

## Responsibilities
- HTTP API の入口
- D1 への接続
- Durable Object によるルーム状態管理

## Current Endpoints
- `GET /health`
- `POST /rooms`
- `GET /rooms/:roomId`
- `POST /rooms/:roomId/start`
- `GET /ws?roomId=...&playerId=...`

## Notes
- `wrangler.toml` の D1 バインディングは remote 接続を前提にしています
- 開発中も Cloudflare 上の D1 を直接使います
- D1 のスキーマ適用や確認は `--remote` 付きの `wrangler d1 execute` を使います
- ルーム状態の正本は Durable Object に置きます
