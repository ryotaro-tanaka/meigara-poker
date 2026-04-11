import { useEffect, useState } from "react";
import type { MainPot, PlayerActionType } from "../lib/types";

interface ActionPanelProps {
  availableActions: PlayerActionType[];
  toCall: number;
  currentBet: number;
  myCurrentBet: number;
  mainPot: MainPot | null;
  isMyTurn: boolean;
  currentTurnLabel: string;
  onAction: (action: PlayerActionType, amount?: number) => void;
}

export function ActionPanel({
  availableActions,
  toCall,
  currentBet,
  myCurrentBet,
  mainPot,
  isMyTurn,
  currentTurnLabel,
  onAction,
}: ActionPanelProps) {
  const [step, setStep] = useState<"initial" | "betting">("initial");
  const canParticipate = availableActions.includes("check") || availableActions.includes("call");
  const canBet = availableActions.includes("bet");
  const canRaise = availableActions.includes("raise");
  const canAllIn = availableActions.includes("all-in");
  const canBettingFlow = canParticipate || canBet || canRaise || canAllIn;
  const minimumParticipation = Math.max(toCall, 0);
  const participationLabel = `賭ける (${minimumParticipation})`;
  const betBase = Math.max(mainPot?.amount ?? 0, 1);
  const minimumRaiseBase = Math.max(toCall, currentBet > 0 ? currentBet : 1);
  const betAmounts = [0.3, 0.5, 0.75].map((ratio) => Math.max(1, Math.ceil(betBase * ratio)));
  const raiseAmounts = [2, 3, 4].map((multiplier) =>
    Math.max(currentBet + 1, myCurrentBet + minimumRaiseBase * multiplier),
  );

  useEffect(() => {
    if (!isMyTurn) {
      setStep("initial");
    }
  }, [isMyTurn]);

  if (!isMyTurn) {
    return (
      <section className="panel stack action-panel-mobile action-panel-collapsed">
        <div className="stack tight">
          <div className="section-heading">
            <h2>いまの操作</h2>
          </div>
          <p className="meta-text">現在の手番: {currentTurnLabel}</p>
          <p className="hint-text">いまは順番待ちです。手番が来ると操作できます。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel stack action-panel-mobile">
      <div className="stack tight">
        <div className="section-heading">
          <h2>いまの操作</h2>
        </div>
        <p className="meta-text">現在の手番: {currentTurnLabel}</p>
        <p className="hint-text">全員の参加額がそろうと次に進みます。</p>
      </div>

      {step === "initial" ? (
        <div className="button-grid action-grid">
          <button className="secondary-button" disabled={!availableActions.includes("fold")} onClick={() => onAction("fold")}>
            降りる
          </button>
          <button
            className={`primary-button${canBettingFlow ? "" : " disabled-button"}`}
            disabled={!canBettingFlow}
            onClick={() => setStep("betting")}
          >
            {participationLabel}
          </button>
        </div>
      ) : (
        <section className="stack tight">
          <p className="meta-text">候補を選んで賭けます。最低参加費は {minimumParticipation} です。</p>
          <div className="button-grid action-grid">
            <button
              className={`primary-button${canParticipate ? "" : " disabled-button"}`}
              disabled={!canParticipate}
              onClick={() => onAction(availableActions.includes("check") ? "check" : "call")}
            >
              参加 {minimumParticipation}
            </button>
            {raiseAmounts.map((amount) => (
              <button
                key={`raise-${amount}`}
                className={`secondary-button${canRaise ? "" : " disabled-button"}`}
                disabled={!canRaise}
                onClick={() => onAction("raise", amount)}
              >
                {amount}
              </button>
            ))}
            {betAmounts.map((amount) => (
              <button
                key={`bet-${amount}`}
                className={`secondary-button${canBet ? "" : " disabled-button"}`}
                disabled={!canBet}
                onClick={() => onAction("bet", amount)}
              >
                {amount}
              </button>
            ))}
            <button className={`primary-button${canAllIn ? "" : " disabled-button"}`} disabled={!canAllIn} onClick={() => onAction("all-in")}>
              All-in
            </button>
          </div>
          <button className="ghost-button" onClick={() => setStep("initial")}>
            戻る
          </button>
          <p className="meta-text">あなたの現在の bet: {myCurrentBet}</p>
        </section>
      )}
    </section>
  );
}
