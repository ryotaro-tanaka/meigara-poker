import { LobbyPanel } from "../../components/LobbyPanel";
import { PlayerList } from "../../components/PlayerList";
import { SharePanel } from "../../components/SharePanel";
import { StatusBadge } from "../../components/StatusBadge";
import { GameScreen } from "../game/GameScreen";
import { getWaitingHandRankItems, getWaitingRuleItems } from "../../lib/game-ui";
import type { AppState } from "../../state/app-state";
import type { PlayerActionType } from "../../lib/types";

interface RoomScreenProps {
  state: AppState;
  shareUrl: string;
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
  onNameChange,
  onStartGame,
  onPlayerAction,
  onReadyChange,
  onLeaveRoom,
  onAcknowledgeGameOver,
}: RoomScreenProps) {
  const phase = state.room?.phase ?? "waiting";
  const isWaiting = phase === "waiting";
  const canStart = Boolean(state.room && state.room.playerCount >= 2 && isWaiting);

  return (
    <main className="app-shell">
      {isWaiting ? (
        <section className="stack">
          {state.serverError ? <p className="error-text">{state.serverError}</p> : null}
          <section className="waiting-layout">
            <section className="room-main stack">
              <section className="panel stack">
                <div className="section-heading">
                  <h1 className="waiting-summary-title">{state.room?.roomName ?? "ルームを読み込み中..."}</h1>
                  <StatusBadge status={state.connectionStatus} />
                </div>
                <SharePanel shareUrl={shareUrl} />
              </section>
              <section className="panel stack">
                <PlayerList
                  players={state.room?.players ?? []}
                  selfPlayerId={state.playerId}
                  totalSlots={6}
                  hideEliminatedStatus
                />
                <LobbyPanel
                  playersTitle="参加者"
                  playerName={state.playerName}
                  playerCount={state.room?.playerCount ?? 0}
                  canStart={canStart}
                  onNameChange={onNameChange}
                  onStartGame={onStartGame}
                />
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
                <ul className="guide-list compact-list">
                  {getWaitingHandRankItems().map((item) => (
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
