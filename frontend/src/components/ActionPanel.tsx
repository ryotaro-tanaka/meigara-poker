import { useId } from "react";
import { getActionLabel } from "../lib/game-ui";
import type { PlayerActionType } from "../lib/types";

interface ActionPanelProps {
  availableActions: PlayerActionType[];
  toCall: number;
  currentTurnLabel: string;
  amountValue: string;
  onAmountChange: (value: string) => void;
  onAction: (action: PlayerActionType, amount?: number) => void;
}

export function ActionPanel({ availableActions, toCall, currentTurnLabel, amountValue, onAmountChange, onAction }: ActionPanelProps) {
  const amountId = useId();
  const parsedAmount = Number.parseInt(amountValue, 10);
  const amount = Number.isFinite(parsedAmount) ? parsedAmount : undefined;
  const needsAmount = availableActions.includes("bet") || availableActions.includes("raise");

  return (
    <section className="panel stack">
      <div className="section-heading">
        <h2>アクション</h2>
      </div>
      <p className="meta-text">現在の手番: {currentTurnLabel}</p>
      {needsAmount ? (
        <label className="field" htmlFor={amountId}>
          <span>bet / raise の最終ベット額</span>
          <input id={amountId} value={amountValue} onChange={(event) => onAmountChange(event.target.value)} inputMode="numeric" />
          <span className="meta-text">現在ラウンド終了時の自分の合計 bet 額になるよう入力します。</span>
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
      {availableActions.length === 0 ? <p className="hint-text">あなたの手番になると有効な操作が表示されます。</p> : null}
    </section>
  );
}
