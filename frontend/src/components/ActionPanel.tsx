import { useId } from "react";
import type { PlayerActionType } from "../lib/types";

interface ActionPanelProps {
  availableActions: PlayerActionType[];
  toCall: number;
  currentTurnLabel: string;
  amountValue: string;
  onAmountChange: (value: string) => void;
  onAction: (action: PlayerActionType, amount?: number) => void;
}

function labelForAction(action: PlayerActionType, toCall: number): string {
  switch (action) {
    case "fold":
      return "fold";
    case "check":
      return "check";
    case "call":
      return `call (${toCall})`;
    case "bet":
      return "bet";
    case "raise":
      return "raise";
    case "all-in":
      return "all-in";
  }
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
          <span>bet / raise 金額</span>
          <input id={amountId} value={amountValue} onChange={(event) => onAmountChange(event.target.value)} inputMode="numeric" />
        </label>
      ) : null}
      <div className="button-grid">
        {(["fold", "check", "call", "bet", "raise", "all-in"] as PlayerActionType[]).map((action) => {
          const enabled = availableActions.includes(action);

          return (
            <button
              key={action}
              className={action === "fold" ? "secondary-button" : "primary-button"}
              disabled={!enabled}
              onClick={() => onAction(action, action === "bet" || action === "raise" ? amount : undefined)}
            >
              {labelForAction(action, toCall)}
            </button>
          );
        })}
      </div>
      {availableActions.length === 0 ? <p className="hint-text">あなたの手番になると有効な操作が表示されます。</p> : null}
    </section>
  );
}
