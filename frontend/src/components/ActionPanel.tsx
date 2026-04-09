import { useId } from "react";
import { getActionGuidance, getActionLabel, getActionSummary } from "../lib/game-ui";
import type { PlayerActionType } from "../lib/types";

interface ActionPanelProps {
  availableActions: PlayerActionType[];
  toCall: number;
  currentBet: number;
  isMyTurn: boolean;
  currentTurnLabel: string;
  amountValue: string;
  onAmountChange: (value: string) => void;
  onAction: (action: PlayerActionType, amount?: number) => void;
}

export function ActionPanel({
  availableActions,
  toCall,
  currentBet,
  isMyTurn,
  currentTurnLabel,
  amountValue,
  onAmountChange,
  onAction,
}: ActionPanelProps) {
  const amountId = useId();
  const parsedAmount = Number.parseInt(amountValue, 10);
  const amount = Number.isFinite(parsedAmount) ? parsedAmount : undefined;
  const needsAmount = availableActions.includes("bet") || availableActions.includes("raise");
  const guidance = getActionGuidance(availableActions, isMyTurn, currentBet, toCall);

  return (
    <section className="panel stack">
      <div className="section-heading">
        <h2>アクション</h2>
      </div>
      <p className="meta-text">現在の手番: {currentTurnLabel}</p>
      <p className="hint-text">{getActionSummary(availableActions, isMyTurn)}</p>
      {needsAmount ? (
        <label className="field" htmlFor={amountId}>
          <span>bet / raise の最終ベット額</span>
          <input id={amountId} value={amountValue} onChange={(event) => onAmountChange(event.target.value)} inputMode="numeric" />
          <span className="meta-text">現在ラウンド終了時の自分の合計 bet 額になるよう入力します。追加額ではありません。</span>
        </label>
      ) : null}
      <div className="button-grid action-grid">
        {(["fold", "check", "call", "bet", "raise", "all-in"] as PlayerActionType[]).map((action) => {
          const enabled = availableActions.includes(action);

          return (
            <button
              key={action}
              className={`${action === "fold" ? "secondary-button" : "primary-button"}${enabled ? "" : " disabled-button"}`}
              disabled={!enabled}
              onClick={() => onAction(action, action === "bet" || action === "raise" ? amount : undefined)}
            >
              {getActionLabel(action, toCall)}
            </button>
          );
        })}
      </div>
      <ul className="guide-list compact-list">
        {guidance.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
