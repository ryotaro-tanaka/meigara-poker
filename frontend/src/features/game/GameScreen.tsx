import { useEffect, useState } from "react";
import { GameOverSummary } from "../../components/GameOverSummary";
import { ActionPanel } from "../../components/ActionPanel";
import { CardRow } from "../../components/CardRow";
import { ResultSummary } from "../../components/ResultSummary";
import { PlayerList } from "../../components/PlayerList";
import { getCurrentTurnLabel, getWaitingHandRankItems } from "../../lib/game-ui";
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
  const roundFlowSteps = [
    { label: "手札", phase: "preflop" },
    { label: "場札3枚", phase: "flop" },
    { label: "場札4枚目", phase: "turn" },
    { label: "場札5枚目", phase: "river" },
  ] as const;
  const currentRoundIndex = roundFlowSteps.findIndex((step) => step.phase === phaseLabel);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const layeredPotTotal =
    (state.mainPot?.amount ?? 0) + state.sidePots.reduce((sum, sidePot) => sum + sidePot.amount, 0);
  const displayPotAmount = layeredPotTotal > 0 ? layeredPotTotal : state.pot;

  useEffect(() => {
    if (isBetweenHands) {
      setExpandedPlayerId(null);
    }
  }, [isBetweenHands]);

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
          <section className="panel stack">
            <p className="rule-flow-label">流れ</p>
            <ol className="rule-flow-chips game-round-flow" aria-label="ラウンド進行">
              {roundFlowSteps.map((step, index) => {
                const isActive = index === currentRoundIndex;
                const isDone = currentRoundIndex > -1 && index < currentRoundIndex;
                return (
                  <li key={step.phase} className="rule-flow-chip-item">
                    <span className={`rule-flow-chip${isActive ? " rule-flow-chip-active" : ""}${isDone ? " rule-flow-chip-done" : ""}`}>
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="panel stack">
            <CardRow
              cards={state.board}
              hiddenCount={hiddenBoardCount}
              title="テーブル"
              emptyLabel="まだ公開されていません。"
              trailingInfoCard={
                <>
                  <p className="pot-tile-label">ポット</p>
                  <p className="pot-tile-amount">{displayPotAmount}</p>
                  <p className="pot-tile-note">（勝者が獲得）</p>
                </>
              }
            />
          </section>

          <section className="panel stack">
            <CardRow
              cards={state.hand}
              title="ハンド"
              emptyLabel="配布待ちです。"
            />
          </section>

          <section className="panel stack">
            <div className="section-heading">
              <h2>プレイヤー</h2>
            </div>
            <PlayerList
              players={state.room?.players ?? []}
              selfPlayerId={state.playerId}
              showBettingInfo
              compactGameView
              roundHistoryByPlayer={state.playerRoundHistory}
              expandedPlayerId={expandedPlayerId}
              onTogglePlayerHistory={(playerId) => {
                setExpandedPlayerId((current) => (current === playerId ? null : playerId));
              }}
            />
          </section>

          <section className="panel stack">
            <details className="hint-accordion">
              <summary className="hint-accordion-summary">ヒント</summary>
              <section className="stack tight hint-accordion-content">
                <p className="meta-text">全員のベット額がそろうと、次のラウンドへ進みます。</p>
                <p className="meta-text">手札 2 枚と場札 5 枚で最強の 5 枚役を作ります。</p>
                <p className="rule-group-title">役（強い順）</p>
                <ul className="guide-list compact-list">
                  {getWaitingHandRankItems().map((item) => {
                    const [name, example] = item.split(":");
                    return (
                      <li key={item}>
                        <strong>{name}</strong>: {example?.trim() ?? ""}
                      </li>
                    );
                  })}
                </ul>
              </section>
            </details>
          </section>

          <div className="game-action-sticky">
            <ActionPanel
              availableActions={state.availableActions}
              toCall={state.toCall}
              currentBet={state.room?.currentBet ?? 0}
              myCurrentBet={state.currentBet}
              myStack={state.myStack}
              mainPot={state.mainPot}
              isMyTurn={isMyTurn}
              currentTurnLabel={currentTurnLabel}
              onAction={onPlayerAction}
            />
          </div>
        </>
      )}
    </section>
  );
}
