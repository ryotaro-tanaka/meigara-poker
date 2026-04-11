import { useEffect, useState } from "react";
import { PlayerList } from "../../components/PlayerList";
import { SharePanel } from "../../components/SharePanel";
import { StatusBadge } from "../../components/StatusBadge";
import { GameScreen } from "../game/GameScreen";
import { getWaitingFlowItems, getWaitingHandRankItems, getWaitingRuleItems } from "../../lib/game-ui";
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
  const [isStartingGame, setIsStartingGame] = useState(false);
  const players = (state.room?.players ?? []).map((player) =>
    player.playerId === state.playerId ? { ...player, name: state.playerName || player.name } : player,
  );

  useEffect(() => {
    if (phase !== "waiting") {
      setIsStartingGame(false);
    }
  }, [phase]);

  useEffect(() => {
    if (state.serverError) {
      setIsStartingGame(false);
    }
  }, [state.serverError]);

  function handleStartGame(): void {
    if (!canStart || isStartingGame) {
      return;
    }
    setIsStartingGame(true);
    onStartGame();
  }

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
                <PlayerList
                  players={players}
                  selfPlayerId={state.playerId}
                  totalSlots={6}
                  hideEliminatedStatus
                  editableSelfName
                  onSelfNameChange={onNameChange}
                />
                <div className="action-row">
                  <button className="primary-button" onClick={handleStartGame} disabled={!canStart || isStartingGame}>
                    {isStartingGame ? "開始中..." : "ゲーム開始"}
                  </button>
                </div>
                <p className="meta-text">2 人以上で開始できます。現在 {state.room?.playerCount ?? 0}/6 人。</p>
                {!canStart ? <p className="hint-text">開始ボタンは 2 人以上そろうと押せます。</p> : null}
              </section>
              <section className="panel stack">
                <div className="section-heading">
                  <h2>招待リンク</h2>
                </div>
                <SharePanel shareUrl={shareUrl} />
              </section>
              <section className="panel stack">
                <div className="section-heading">
                  <h2>ルール</h2>
                </div>
                <p className="rule-lead">{getWaitingRuleItems()[0]}</p>
                <p className="meta-text">{getWaitingRuleItems()[1]}</p>
                <section className="stack tight">
                  <p className="rule-flow-label">流れ</p>
                  <ol className="rule-flow-chips" aria-label="ゲームの流れ">
                    {getWaitingFlowItems().map((step) => (
                      <li key={step} className="rule-flow-chip-item">
                        <span className="rule-flow-chip">{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>
                <section className="stack tight">
                  <p className="rule-group-title">上位役</p>
                  <section className="rule-card-grid">
                    {getWaitingHandRankItems()
                      .slice(0, 5)
                      .map((item) => {
                        const [name, example] = item.split(":");
                        return (
                          <article key={item} className="rule-card">
                            <strong>{name}</strong>
                            <p className="meta-text">{example?.trim() ?? ""}</p>
                          </article>
                        );
                      })}
                  </section>
                </section>
                <section className="stack tight">
                  <p className="rule-group-title">基本役</p>
                  <section className="rule-card-grid">
                    {getWaitingHandRankItems()
                      .slice(5)
                      .map((item) => {
                        const [name, example] = item.split(":");
                        return (
                          <article key={item} className="rule-card">
                            <strong>{name}</strong>
                            <p className="meta-text">{example?.trim() ?? ""}</p>
                          </article>
                        );
                      })}
                  </section>
                </section>
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
