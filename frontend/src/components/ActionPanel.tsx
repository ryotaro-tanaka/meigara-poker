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
  const canParticipate = availableActions.includes("check") || availableActions.includes("call");
  const canBet = availableActions.includes("bet");
  const canRaise = availableActions.includes("raise");
  const canAllIn = availableActions.includes("all-in");
  const shouldPreferRaise = currentBet > 0 && canRaise;
  const participationLabel = toCall > 0 ? `参加 ${toCall}` : "参加";
  const raiseBase = currentBet > 0 ? currentBet : Math.max(2, toCall);
  const betBase = Math.max(mainPot?.amount ?? 0, 1);
  const betAmounts = [0.3, 0.5, 0.75].map((ratio) => Math.max(1, Math.ceil(betBase * ratio)));
  const raiseAmounts = [2, 3, 4].map((multiplier) => Math.max(currentBet + 1, raiseBase * multiplier));
  const presetAction: PlayerActionType | null = shouldPreferRaise ? "raise" : canBet ? "bet" : canRaise ? "raise" : null;
  const presetAmounts = presetAction === "bet" ? betAmounts : presetAction === "raise" ? raiseAmounts : [];

  return (
    <section className="panel stack action-panel-mobile">
      <div className="stack tight">
        <div className="section-heading">
          <h2>いまの操作</h2>
        </div>
        <p className="meta-text">現在の手番: {currentTurnLabel}</p>
        <p className="hint-text">
          {isMyTurn ? "全員の参加額がそろうと次に進みます。" : "いまは順番待ちです。手番が来ると操作できます。"}
        </p>
      </div>

      <div className="button-grid action-grid">
        <button className="secondary-button" disabled={!availableActions.includes("fold")} onClick={() => onAction("fold")}>
          降りる
        </button>
        <button
          className={`primary-button${canParticipate ? "" : " disabled-button"}`}
          disabled={!canParticipate}
          onClick={() => onAction(availableActions.includes("check") ? "check" : "call")}
        >
          {participationLabel}
        </button>
        <button className={`primary-button${canAllIn ? "" : " disabled-button"}`} disabled={!canAllIn} onClick={() => onAction("all-in")}>
          全額
        </button>
      </div>

      {presetAction ? (
        <section className="stack tight">
          <p className="meta-text">
            {presetAction === "bet"
              ? `上乗せ候補: main pot ${mainPot?.amount ?? 0} を基準にしています。`
              : `上乗せ候補: 現在の掛け金 ${raiseBase} を基準にしています。`}
          </p>
          <div className="button-grid action-grid">
            {presetAmounts.map((amount) => (
              <button key={`${presetAction}-${amount}`} className="primary-button" onClick={() => onAction(presetAction, amount)}>
                上乗せ {amount}
              </button>
            ))}
          </div>
          <p className="meta-text">あなたの現在の bet: {myCurrentBet}</p>
        </section>
      ) : null}
    </section>
  );
}
