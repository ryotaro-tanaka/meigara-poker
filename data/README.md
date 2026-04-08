# data

## `EdinetcodeDlInfo.csv`
- EDINET の EDINETコードリストから取得した元データ
- 取得元: https://disclosure2.edinet-fsa.go.jp/weee0010.aspx
- ダウンロード時点の文字コードは UTF-8 ではなく、そのままの配布ファイルを保存している
- このファイルには上場・非上場を含む元の一覧が入っている

## `listed_domestic_complete_corpnum_industries_utf8.csv`
- `EdinetcodeDlInfo.csv` から作成した加工済みデータ
- UTF-8 に変換している
- 次の条件で絞り込んでいる
  - `提出者種別 = 内国法人・組合`
  - `上場区分 = 上場`
  - `提出者法人番号` の末尾 `0〜9` がすべてそろっている `提出者業種` のみを採用
- 出力列は次の 4 列
  - `ＥＤＩＮＥＴコード`
  - `提出者名`
  - `提出者業種`
  - `提出者法人番号`
- 銘柄ポーカーの元データとして使う
