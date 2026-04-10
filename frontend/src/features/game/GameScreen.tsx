import { useState } from "react";
import { ActionPanel } from "../../components/ActionPanel";
import { CardRow } from "../../components/CardRow";
import { InfoPanel } from "../../components/InfoPanel";
import { PhaseTimeline } from "../../components/PhaseTimeline";
import { ResultSummary } from "../../components/ResultSummary";
import { getCurrentTurnLabel } from "../../lib/game-ui";
import type { PlayerActionType } from "../../lib/types";
import type { AppState } from "../../state/app-state";

interface GameScreenProps {
  state: AppState;
  onPlayerAction: (action: PlayerActionType, amount?: number) => void;
  onStartGame: () => void;
}

export function GameScreen({ state, onPlayerAction, onStartGame }: GameScreenProps) {
  const [amountValue, setAmountValue] = useState("4");
  const isBetweenHands = state.room?.phase === "between_hands";

  return (
    <section className="stack">
      <div className="game-layout">
        <section className="game-main stack">
          <CardRow cards={state.hand} title="自分の手札" emptyLabel="配布待ちです。" />
          <CardRow cards={state.board} title="公開済み場札" emptyLabel="まだ公開されていません。" />
          {isBetweenHands ? (
            <section className="panel stack">
              <div className="section-heading">
                <h2>次ハンド待ち</h2>
              </div>
              <p className="hint-text">前のハンド結果を確認できます。準備ができたら次のハンドを開始してください。</p>
              <div className="action-row">
                <button className="primary-button" onClick={onStartGame}>
                  次のハンドを開始
                </button>
              </div>
            </section>
          ) : (
            <ActionPanel
              availableActions={state.availableActions}
              toCall={state.toCall}
              currentBet={state.room?.currentBet ?? 0}
              isMyTurn={state.currentTurnPlayerId === state.playerId}
              currentTurnLabel={getCurrentTurnLabel(state)}
              amountValue={amountValue}
              onAmountChange={setAmountValue}
              onAction={onPlayerAction}
            />
          )}
          <ResultSummary results={state.results} players={state.room?.players ?? []} />
        </section>
        <aside className="game-side stack">
          <InfoPanel
            phaseLabel={state.room?.phase ?? "waiting"}
            revealedCount={state.room?.boardRevealCount ?? 0}
            selectedIndustries={state.selectedIndustries}
            pot={state.pot}
            mainPot={state.mainPot}
            sidePots={state.sidePots}
            myStack={state.myStack}
            currentBet={state.currentBet}
            toCall={state.toCall}
            positions={state.positions}
            currentTurnPlayerId={state.currentTurnPlayerId}
            players={state.room?.players ?? []}
            selfPlayerId={state.playerId}
            lastActionMessage={state.lastActionMessage}
          />
          <PhaseTimeline phase={state.room?.phase ?? null} />
        </aside>
      </div>
    </section>
  );
}
