# backend

Cloudflare Workers 側の土台です。

## Responsibilities
- HTTP API の入口
- D1 への接続
- 将来のゲーム状態管理の入口

## Planned Endpoints
- `GET /health`
- `POST /games/start`
- `GET /games/:id`
- `GET /ws`

## Notes
- `wrangler.toml` の D1 バインディングは remote 接続を前提にしています
- 開発中も Cloudflare 上の D1 を直接使います
- D1 のスキーマ適用や確認は `--remote` 付きの `wrangler d1 execute` を使います
