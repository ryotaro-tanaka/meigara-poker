import { PlayerList } from "../../components/PlayerList";
import { StatusBadge } from "../../components/StatusBadge";
import { GameScreen } from "../game/GameScreen";
import type { AppState } from "../../state/app-state";

interface RoomScreenProps {
  state: AppState;
  shareUrl: string;
  onNameSubmit: () => void;
  onNameChange: (name: string) => void;
  onStartGame: () => void;
}

export function RoomScreen({ state, shareUrl, onNameSubmit, onNameChange, onStartGame }: RoomScreenProps) {
  const isGameStarted = state.room?.phase !== "waiting";

  return (
    <main className="app-shell">
      <section className="hero-card compact">
        <div className="hero-topline">
          <p className="eyebrow">Room {state.roomId}</p>
          <StatusBadge status={state.connectionStatus} />
        </div>
        <h1>{state.room?.roomName ?? "ルームを読み込み中..."}</h1>
        <p className="description">
          待機画面からゲーム終了まで同じ WebSocket 接続を使い、サーバー状態をそのまま反映します。
        </p>
        {state.serverError ? <p className="error-text">{state.serverError}</p> : null}
      </section>

      <section className="content-grid">
        <section className="panel stack">
          <div className="section-heading">
            <h2>待機情報</h2>
          </div>
          <label className="field">
            <span>表示名</span>
            <input value={state.playerName} onChange={(event) => onNameChange(event.target.value)} placeholder="名前を入力" />
          </label>
          <div className="action-row">
            <button className="secondary-button" onClick={onNameSubmit}>
              名前を決定
            </button>
            <button className="primary-button" onClick={onStartGame} disabled={!state.room || state.room.playerCount < 2 || isGameStarted}>
              ゲーム開始
            </button>
          </div>
          <p className="meta-text">共有 URL: {shareUrl}</p>
          <p className="meta-text">参加人数: {state.room?.playerCount ?? 0} / 6</p>
          <p className="meta-text">現在 phase: {state.room?.phase ?? "waiting"}</p>
        </section>

        <section className="panel stack">
          <div className="section-heading">
            <h2>待機者一覧</h2>
          </div>
          <PlayerList players={state.room?.players ?? []} selfPlayerId={state.playerId} />
        </section>
      </section>

      <GameScreen state={state} />
    </main>
  );
}
