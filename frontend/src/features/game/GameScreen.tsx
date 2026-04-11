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
  const isMyTurn = state.currentTurnPlayerId === state.playerId;

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
            </div>
            <div className="round-track" role="list" aria-label="ラウンド進行">
              {[
                { label: "場札 0", phase: "preflop" },
                { label: "場札 3", phase: "flop" },
                { label: "場札 4", phase: "turn" },
                { label: "場札 5", phase: "river" },
              ].map((step) => (
                <span key={step.phase} role="listitem" className={`round-chip${step.phase === phaseLabel ? " round-chip-active" : ""}`}>
                  {step.label}
                </span>
              ))}
            </div>
          </section>

          <CardRow cards={state.board} hiddenCount={hiddenBoardCount} title="場札" emptyLabel="まだ公開されていません。" />
          <CardRow cards={state.hand} title="自分の手札" emptyLabel="配布待ちです。" />

          <section className="panel stack">
            <div className="section-heading">
              <h2>いま必要な情報</h2>
            </div>
            <div className="info-grid">
              <p className="meta-text">main pot: {state.mainPot?.amount ?? state.pot}</p>
              <p className="meta-text">コール必要額: {state.toCall}</p>
              <p className="meta-text">現在の手番: {currentTurnLabel}</p>
              <p className="meta-text">あなたの stack: {state.myStack}</p>
            </div>
          </section>

          <section className="panel stack">
            <div className="section-heading">
              <h2>参加者</h2>
            </div>
            <PlayerList players={state.room?.players ?? []} selfPlayerId={state.playerId} showBettingInfo compactGameView={false} />
          </section>

          {state.lastActionMessage ? <p className="hint-text">{state.lastActionMessage}</p> : null}

          <div className="game-action-sticky">
            {!isMyTurn ? <p className="meta-text">順番待ちです。手番: {currentTurnLabel}</p> : null}
            <ActionPanel
              availableActions={state.availableActions}
              toCall={state.toCall}
              currentBet={state.room?.currentBet ?? 0}
              myCurrentBet={state.currentBet}
              mainPot={state.mainPot}
              isMyTurn={isMyTurn}
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
