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
      </div>

      {step === "initial" ? (
        <div className="button-grid action-grid">
          <button className="secondary-button" onClick={() => onAction("fold")}>
            降りる
          </button>
          <button
            className="secondary-button"
            disabled={!canBettingFlow}
            onClick={() => setStep("betting")}
          >
            {participationLabel}
          </button>
        </div>
      ) : (
        <section className="stack tight">
          <div className="button-grid action-grid">
            {canParticipate ? (
              <button className="secondary-button" onClick={() => onAction(availableActions.includes("check") ? "check" : "call")}>
                参加 {minimumParticipation}
              </button>
            ) : null}
            {canRaise
              ? raiseAmounts.map((amount) => (
                  <button key={`raise-${amount}`} className="secondary-button" onClick={() => onAction("raise", amount)}>
                    {amount}
                  </button>
                ))
              : null}
            {canBet
              ? betAmounts.map((amount) => (
                  <button key={`bet-${amount}`} className="secondary-button" onClick={() => onAction("bet", amount)}>
                    {amount}
                  </button>
                ))
              : null}
            {canAllIn ? (
              <button className="secondary-button" onClick={() => onAction("all-in")}>
                All-in
              </button>
            ) : null}
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
