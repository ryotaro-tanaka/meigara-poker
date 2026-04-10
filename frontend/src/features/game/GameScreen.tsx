import { GameOverSummary } from "../../components/GameOverSummary";
import { ActionPanel } from "../../components/ActionPanel";
import { CardRow } from "../../components/CardRow";
import { ResultSummary } from "../../components/ResultSummary";
import { PlayerList } from "../../components/PlayerList";
import { getCurrentTurnLabel } from "../../lib/game-ui";
import type { PlayerActionType } from "../../lib/types";
import type { AppState } from "../../state/app-state";

interface GameScreenProps {
  state: AppState;
  onPlayerAction: (action: PlayerActionType, amount?: number) => void;
  onReadyChange: (ready: boolean) => void;
  onLeaveRoom: () => void;
  onAcknowledgeGameOver: () => void;
}

export function GameScreen({ state, onPlayerAction, onReadyChange, onLeaveRoom, onAcknowledgeGameOver }: GameScreenProps) {
  const isBetweenHands = state.room?.phase === "between_hands";
  const isGameOver = Boolean(state.gameEnded);
  const isReady = Boolean(state.playerId && state.readyPlayerIds.includes(state.playerId));
  const readyCount = state.readyPlayerIds.length;
  const hiddenBoardCount = Math.max(0, 5 - state.board.length);
  const currentTurnLabel = getCurrentTurnLabel(state);
  const phaseLabel = state.room?.phase ?? "waiting";

  return (
    <section className="stack game-screen-mobile">
      {isBetweenHands ? (
        <>
          {isGameOver ? (
            <GameOverSummary standings={state.finalStandings} reason={state.gameOverReason} onAcknowledge={onAcknowledgeGameOver} />
          ) : (
            <section className="panel stack">
              <div className="section-heading">
                <h2>次ハンド待ち</h2>
              </div>
              <>
                <p className="hint-text">前のハンド結果を確認できます。継続プレイヤーの過半数が準備完了になると次のハンドが自動で始まります。</p>
                <p className="meta-text">
                  ready {readyCount} / {state.requiredReadyCount}
                </p>
                <div className="action-row">
                  <button className="primary-button" onClick={() => onReadyChange(!isReady)}>
                    {isReady ? "準備を解除" : "準備完了"}
                  </button>
                  <button className="ghost-button" onClick={onLeaveRoom}>
                    退出する
                  </button>
                </div>
              </>
            </section>
          )}
          <ResultSummary results={state.results} players={state.room?.players ?? []} />
        </>
      ) : (
        <>
          <section className="panel stack game-round-summary">
            <div className="hero-topline">
              <p className="eyebrow">Round</p>
              <p className="meta-text">現在の手番: {currentTurnLabel}</p>
            </div>
            <div className="hero-stats">
              <span className="hero-stat">round: {phaseLabel}</span>
              <span className="hero-stat">pot: {state.pot}</span>
              <span className="hero-stat">あなたの stack: {state.myStack}</span>
              <span className="hero-stat">あなたの bet: {state.currentBet}</span>
              <span className="hero-stat">call: {state.toCall}</span>
            </div>
          </section>

          <CardRow cards={state.hand} title="自分の手札" emptyLabel="配布待ちです。" />
          <CardRow cards={state.board} hiddenCount={hiddenBoardCount} title="場札" emptyLabel="まだ公開されていません。" />

          <section className="panel stack">
            <div className="section-heading">
              <h2>参加者</h2>
            </div>
            <PlayerList players={state.room?.players ?? []} selfPlayerId={state.playerId} showBettingInfo compactGameView />
          </section>

          {state.lastActionMessage ? <p className="hint-text">{state.lastActionMessage}</p> : null}

          <div className="game-action-sticky">
            <ActionPanel
              availableActions={state.availableActions}
              toCall={state.toCall}
              currentBet={state.room?.currentBet ?? 0}
              myCurrentBet={state.currentBet}
              mainPot={state.mainPot}
              isMyTurn={state.currentTurnPlayerId === state.playerId}
              currentTurnLabel={currentTurnLabel}
              onAction={onPlayerAction}
            />
            <button className="ghost-button" onClick={onLeaveRoom}>
              退出する
            </button>
          </div>
        </>
      )}
    </section>
  );
}
