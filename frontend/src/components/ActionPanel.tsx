import { useEffect, useState } from "react";
import type { MainPot, PlayerActionType } from "../lib/types";

interface ActionPanelProps {
  availableActions: PlayerActionType[];
  toCall: number;
  currentBet: number;
  myCurrentBet: number;
  myStack: number;
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
  myStack,
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
  const betBase = Math.max(mainPot?.amount ?? 0, 1);
  const minimumRaiseBase = Math.max(toCall, currentBet > 0 ? currentBet : 1);
  const betAmounts = [0.3, 0.5, 0.75].map((ratio) => Math.max(1, Math.ceil(betBase * ratio)));
  const raiseAmounts = [2, 3, 4].map((multiplier) =>
    Math.max(currentBet + 1, myCurrentBet + minimumRaiseBase * multiplier),
  );
  const continueAction = availableActions.includes("check") ? "check" : "call";
  const continueAdditionalAmount = continueAction === "check" ? 0 : Math.max(0, toCall);
  const allInAdditionalAmount = Math.max(0, myStack);

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
            <h2>アクション</h2>
            <span className="meta-text action-turn-label">現在の手番: {currentTurnLabel}</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel stack action-panel-mobile">
      <div className="stack tight">
        <div className="section-heading">
          <h2>アクション</h2>
          <span className="meta-text action-turn-label">現在の手番: {currentTurnLabel}</span>
        </div>
      </div>

      {step === "initial" ? (
        <section className="stack tight">
          <p className="meta-text">続けるかを選択</p>
          <div className="button-grid action-grid">
            <button className="secondary-button" onClick={() => onAction("fold")}>
              フォールド
            </button>
            <button
              className="secondary-button"
              disabled={!canBettingFlow}
              onClick={() => setStep("betting")}
            >
              プレイ
            </button>
          </div>
        </section>
      ) : (
        <section className="stack tight">
          <p className="meta-text">行動と追加支払い額を選択</p>
          <div className="button-grid action-grid">
            {canParticipate ? (
              <button className="secondary-button" onClick={() => onAction(continueAction)}>
                {continueAction === "check" ? "チェック" : "コール"} +{continueAdditionalAmount}
              </button>
            ) : null}
            {canRaise
              ? raiseAmounts.map((amount) => (
                  <button key={`raise-${amount}`} className="secondary-button" onClick={() => onAction("raise", amount)}>
                    レイズ +{Math.max(0, amount - myCurrentBet)}
                  </button>
                ))
              : null}
            {canBet
              ? betAmounts.map((amount) => (
                  <button key={`bet-${amount}`} className="secondary-button" onClick={() => onAction("bet", amount)}>
                    ベット +{Math.max(0, amount - myCurrentBet)}
                  </button>
                ))
              : null}
            {canAllIn ? (
              <button className="secondary-button" onClick={() => onAction("all-in")}>
                オールイン +{allInAdditionalAmount}
              </button>
            ) : null}
          </div>
          <button className="ghost-button" onClick={() => setStep("initial")}>
            戻る
          </button>
        </section>
      )}
    </section>
  );
}
