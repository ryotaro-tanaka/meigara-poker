# Frontend Design Policy

## Goal
- この文書は、銘柄ポーカーのフロントエンド実装方針を定めるためのメモです
- `docs/dev_note.md` と `docs/game_rule.md` を前提に、責務分離、状態管理、WebSocket の境界、ファイル分割方針をそろえます
- UI の見た目よりも、実装の役割分担を明確にすることを目的にします

## Screen Goal

### PWA 方針
- フロントエンドは PWA で作る

### 画面一覧
- 部屋作成画面
- 待機画面
- ゲーム画面

### 部屋作成画面
- ゲームのトップ画面
- ホストのみが使う
- `部屋名` を入力して決定し、待機画面へ進む

### 待機画面
- 名前入力
- 名前決定ボタン
- 待機者一覧
- ゲーム開始ボタン
- 共有用 URL
- 簡単なルール説明
- 最大 6 人、2 人以上で開始できる
- 開始ボタンは誰でも押せる
- 待機者一覧や開始通知は WebSocket でリアルタイム更新する

### ゲーム画面
- 場の公開カードを必要なタイミングで表示する
- 自分の手札を表示する
- 現在のベット額を表示する
- 必要なアクションボタンを表示する
- BB / SB などの位置情報を表示する
- MVP では見た目より情報の分かりやすさを優先する

### MVP の範囲
- まずは部屋作成、待機、ゲーム進行に必要な情報表示を優先する
- ルーム参加後は待機画面から WebSocket で状態同期する
- UI の見た目の作り込みは後から行う

## Core Principle
- 表示と副作用を分ける
- ローカル状態と共有状態を分ける
- ゲーム進行の正本はサーバー側に置く
- フロントエンドは、待機画面からゲーム終了まで WebSocket 経由の更新を反映する

## Layer Policy

### View Components
- 表示専用のコンポーネントにする
- 会社名、手札、場札、デッキ情報、結果表示を担当する
- WebSocket 接続や fetch を直接持たない

### Feature Containers
- ロビー、ゲーム画面、結果画面などの画面単位で組み立てる
- 共有状態を読み、上位アクションを発火する
- View Components を組み合わせて画面を作る

### State Layer
- 共有状態を持つ
- `useReducer` ベースを基本にする
- ルーム状態、プレイヤー一覧、自分の手札、場札、進行フェーズ、接続状態を扱う
- reducer の中に JSX を書かない

### Usecase / Hook Layer
- 待機画面から使う WebSocket 接続、受信イベント処理、ゲーム開始、再接続、サーバー同期を扱う
- reducer に対して状態更新を流す
- UI の見た目や JSX は持たない

## Shared vs Local State

### Shared State
- `roomId`
- `players`
- `currentPhase`
- `hand`
- `board`
- `revealedDeckInfo`
- `connectionStatus`
- `serverError`

### Local State
- フォーム入力
- モーダル開閉
- 一時的な hover 状態
- 一時的な expand 状態

## WebSocket Boundary
- View Components は WebSocket を直接触らない
- 接続処理と受信イベントの解釈は hook / usecase 層で行う
- ルーム参加中は、待機画面からゲーム終了まで同じ WebSocket 接続を使う
- フロントエンドはサーバーが確定したゲーム状態を正とする
- reducer に流すイベント名はドメイン単位でそろえる

## Naming and Placement
- `src/components/`
  - 表示専用コンポーネント
- `src/features/game/`
  - ゲーム進行ロジック
- `src/features/room/`
  - ルーム参加・退出
- `src/state/`
  - 共有状態
- `src/hooks/`
  - WebSocket 接続やゲーム進行の hook
- `src/lib/`
  - 純粋関数、整形、役判定補助

## UI Notes
- 情報の優先順位を明確にする
- 手札、場札、進行状態、結果を見分けやすくする
- 色やビジュアルの詳細ルールはこの文書では扱わない

## Anti-Patterns
- 巨大な `App` コンポーネントを作らない
- View Components から直接 WebSocket を操作しない
- JSX と reducer と副作用を同じ場所に混在させない
- ゲーム進行ルールを複数箇所に分散させない

## Review Standard
- 振る舞いが変わらない
- 状態境界が以前より明確になっている
- WebSocket と表示が分離されている
- 新規コードが責務ごとの分割方針に従っている
