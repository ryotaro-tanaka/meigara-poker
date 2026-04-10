import { LobbyPanel } from "../../components/LobbyPanel";
import { PlayerList } from "../../components/PlayerList";
import { SharePanel } from "../../components/SharePanel";
import { StatusBadge } from "../../components/StatusBadge";
import { WaitingRoomSummary } from "../../components/WaitingRoomSummary";
import { GameScreen } from "../game/GameScreen";
import { getRoomDescription, getWaitingRuleItems } from "../../lib/game-ui";
import type { AppState } from "../../state/app-state";
import type { PlayerActionType } from "../../lib/types";

interface RoomScreenProps {
  state: AppState;
  shareUrl: string;
  onNameSubmit: () => void;
  onNameChange: (name: string) => void;
  onStartGame: () => void;
  onPlayerAction: (action: PlayerActionType, amount?: number) => void;
  onReadyChange: (ready: boolean) => void;
  onLeaveRoom: () => void;
  onAcknowledgeGameOver: () => void;
}

export function RoomScreen({
  state,
  shareUrl,
  onNameSubmit,
  onNameChange,
  onStartGame,
  onPlayerAction,
  onReadyChange,
  onLeaveRoom,
  onAcknowledgeGameOver,
}: RoomScreenProps) {
  const phase = state.room?.phase ?? "waiting";
  const isWaiting = phase === "waiting";
  const description =
    state.gameEnded && phase === "between_hands"
      ? "最後のハンド結果と最終順位を確認中です。待機画面に戻ると次のゲームを始められます。"
      : getRoomDescription(state.room?.phase ?? "waiting");
  const canStart = Boolean(state.room && state.room.playerCount >= 2 && isWaiting);

  return (
    <main className="app-shell">
      {isWaiting ? (
        <section className="stack">
          <WaitingRoomSummary
            roomId={state.roomId}
            roomName={state.room?.roomName ?? "ルームを読み込み中..."}
            description={description}
            status={state.connectionStatus}
            playerCount={state.room?.playerCount ?? 0}
          />
          {state.serverError ? <p className="error-text">{state.serverError}</p> : null}
          <section className="waiting-layout">
            <section className="room-main stack">
              <LobbyPanel
                playerName={state.playerName}
                playerCount={state.room?.playerCount ?? 0}
                canStart={canStart}
                onNameChange={onNameChange}
                onNameSubmit={onNameSubmit}
                onStartGame={onStartGame}
              />
              <SharePanel shareUrl={shareUrl} />
              <section className="panel stack">
                <div className="section-heading">
                  <h2>待機者一覧</h2>
                  <StatusBadge status={state.connectionStatus} />
                </div>
                <PlayerList players={state.room?.players ?? []} selfPlayerId={state.playerId} />
              </section>
              <section className="panel stack">
                <div className="section-heading">
                  <h2>ルール</h2>
                </div>
                <ul className="guide-list compact-list">
                  {getWaitingRuleItems().map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </section>
          </section>
        </section>
      ) : (
        <GameScreen
          state={state}
          onPlayerAction={onPlayerAction}
          onReadyChange={onReadyChange}
          onLeaveRoom={onLeaveRoom}
          onAcknowledgeGameOver={onAcknowledgeGameOver}
        />
      )}
    </main>
  );
}
