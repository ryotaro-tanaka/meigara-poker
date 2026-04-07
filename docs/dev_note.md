# 開発メモ

## ゲームルール
[game_rule.md](docs/game_rule.md)

## 決まっていること
- Cloudflare Workers と D1 Database を使う
- WebSocket でゲームを進行する
- 無料で開発する
- EDINET の企業情報を使って銘柄カードを作成する
- デッキは 36 枚にする
- 基本ルールはテキサス・ホールデムをベースにする
- デッキ内容と偏りは公開情報にする
- 同じ役はドローにする

## カード仕様
- カードは企業名・絵柄・数値を持つ
- 絵柄は「売上」「資産」「安定」「人材」の 4 種にする
- 数値は 1〜9 を使う
- 数値は売上由来の先頭数字を使う

## EDINET から保存する情報
- `edinet_code`
- `company_name`
- `fiscal_year_end`
- `revenue`
- `total_assets`
- `equity_ratio`
- `employees`

## 絵柄の決定方法
- 絵柄は売上・総資産・自己資本比率・従業員数の 4 指標で決める
- 各企業について 4 指標の順位スコアを作る
- 最も順位が高い指標をその企業の絵柄にする

## DB 構成
- D1 の構成は `stocks`、`suits`、`stock_cards_view` の 3 つにする
- `stocks` は銘柄の元データを保存する永続テーブルにする
- `suits` は絵柄 4 種を管理する永続テーブルにする
- `stock_cards_view` はフロントエンドに渡す形に近い VIEW にする

## stocks テーブル
- `edinet_code` をプライマリキーにする
- `company_name`、`fiscal_year_end`、`revenue`、`total_assets`、`equity_ratio`、`employees` を持つ

## suits テーブル
- `suit_id` をプライマリキーにする
- `name` に「売上」「資産」「安定」「人材」を持つ

## stock_cards_view
- `edinet_code` を `stocks` に対する外部キーとして扱う
- `suit_id` を `suits` に対する外部キーとして扱う
- `number` は `revenue` の先頭数字を使う

## 初期実装方針
- EDINET から企業データを一度取得して D1 に保存する
- 初期保存項目は 7 項目にする
- ゲームごとに DB から候補企業を取得して 36 枚デッキを構成する
