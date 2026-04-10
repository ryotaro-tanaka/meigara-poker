import { GameOverSummary } from "../../components/GameOverSummary";
import { LobbyPanel } from "../../components/LobbyPanel";
import { PlayerList } from "../../components/PlayerList";
import { RoomHeader } from "../../components/RoomHeader";
import { SharePanel } from "../../components/SharePanel";
import { StatusBadge } from "../../components/StatusBadge";
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
  onLeaveRoom,
  onAcknowledgeGameOver,
}: RoomScreenProps) {
  const phase = state.room?.phase ?? "waiting";
  const isWaiting = phase === "waiting";
  const isGameOver = Boolean(state.gameEnded);
  const canStart = Boolean(state.room && state.room.playerCount >= 2 && isWaiting);

  return (
    <main className="app-shell">
      <RoomHeader
        roomId={state.roomId}
        roomName={state.room?.roomName ?? "ルームを読み込み中..."}
        description={getRoomDescription(state.room?.phase ?? "waiting")}
        status={state.connectionStatus}
        phase={state.room?.phase ?? null}
        playerCount={state.room?.playerCount ?? 0}
        serverError={state.serverError}
      />

      {isWaiting ? (
        <section className="room-layout">
          <section className="room-main stack">
            {isGameOver ? (
              <GameOverSummary standings={state.finalStandings} reason={state.gameOverReason} onAcknowledge={onAcknowledgeGameOver} />
            ) : (
              <LobbyPanel
                playerName={state.playerName}
                playerCount={state.room?.playerCount ?? 0}
                canStart={canStart}
                onNameChange={onNameChange}
                onNameSubmit={onNameSubmit}
                onStartGame={onStartGame}
              />
            )}
            <SharePanel shareUrl={shareUrl} />
          </section>
          <aside className="room-side stack">
            <section className="panel stack">
              <div className="section-heading">
                <h2>待機者一覧</h2>
                <StatusBadge status={state.connectionStatus} />
              </div>
              <PlayerList players={state.room?.players ?? []} selfPlayerId={state.playerId} />
            </section>
            <section className="panel stack">
              <div className="section-heading">
                <h2>{isGameOver ? "最終順位" : "ルール"}</h2>
              </div>
              {isGameOver ? (
                <ol className="guide-list">
                  {state.finalStandings.map((standing) => (
                    <li key={standing.playerId}>
                      {standing.rank}. {standing.name || "名前未設定"} / stack {standing.finalStack}
                    </li>
                  ))}
                </ol>
              ) : (
                <ul className="guide-list">
                  {getWaitingRuleItems().map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </section>
      ) : (
        <section className="room-layout game-mode">
          <section className="room-main stack">
            <GameScreen state={state} onPlayerAction={onPlayerAction} onStartGame={onStartGame} onLeaveRoom={onLeaveRoom} />
          </section>
          <aside className="room-side stack">
            <section className="panel stack">
              <div className="section-heading">
                <h2>参加者一覧</h2>
                <StatusBadge status={state.connectionStatus} />
              </div>
              <PlayerList players={state.room?.players ?? []} selfPlayerId={state.playerId} showBettingInfo />
            </section>
            <SharePanel shareUrl={shareUrl} />
          </aside>
        </section>
      )}
    </main>
  );
}
