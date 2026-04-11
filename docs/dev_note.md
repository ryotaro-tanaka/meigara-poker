# 開発メモ

## ゲームルール
[game_rule.md](game_rule.md)

## 決まっていること
- Cloudflare Workers と D1 Database を使う
- WebSocket でゲームを進行する
- 無料で開発する
- 元データは `listed_domestic_complete_corpnum_industries_utf8.csv` を使う
- この CSV は、ゲームに使える業種だけに絞り込み済みとする
- カードは `name`、`suit`、`number` を持つ
- `suit` は `提出者業種` を使う
- `number` は `提出者法人番号` の末尾 `0〜9` を使う
- デッキは 40 枚にする
- 進行ルールは通常のテキサスホールデムに極力寄せる
- 固定スタック制を採用する
- `Dealer / SB / BB` を導入する
- `fold / check / call / bet / raise / all-in` を採用する
- `all-in` と `side pot` を MVP に含める
- 同役時は通常のホールデム通りに比較する

## DB 方針
今回はシンプルさを優先して、**テーブルは `stocks` のみ**にする。

`cards_view` は不要とする。  
理由は、カードに必要な情報が `stocks` にそのまま入るため。

## stocks テーブル
保存するカラムは次の5つ。

- `edinet_code`
- `name`
- `industry`
- `corporate_number`
- `corporate_number_last_digit`

## カード項目との対応
- `name` → カードの会社名
- `industry` → カードの `suit`
- `corporate_number_last_digit` → カードの `number`

## デッキ生成
バックエンドでは、ゲーム開始時に次の流れでデッキを作る。

1. `stocks` から業種をランダムに4つ選ぶ
2. 各業種について、`corporate_number_last_digit` が `0〜9` になるように1枚ずつ選ぶ
3. 4業種 × 10枚で40枚デッキを作る
4. 生成したデッキをゲーム用に使う

## 補足
- 同じ業種・同じ数字の候補が複数ある場合は、その中からランダムに1枚選ぶ
- 会社名や業種の中身は毎回ランダムに変わるが、ゲーム上は `suit` と `number` だけが影響する
- そのため、デッキ内容を別テーブルで固定保存しなくても最初はよい

## 現時点の結論
- `stocks` テーブルだけで始める
- `corporate_number_last_digit` は保存する
- `cards_view` は作らない
- デッキは毎回バックエンドで直接生成する
- カード体系は銘柄ポーカー独自、進行ルールはホールデム寄りで設計する
