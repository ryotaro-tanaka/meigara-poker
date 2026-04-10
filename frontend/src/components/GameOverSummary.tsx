import { getGameOverReasonLabel, getStandingStatusLabel } from "../lib/game-ui";
import type { FinalStanding, GameOverReason } from "../lib/types";

interface GameOverSummaryProps {
  standings: FinalStanding[];
  reason: GameOverReason | null;
  onAcknowledge: () => void;
}

export function GameOverSummary({ standings, reason, onAcknowledge }: GameOverSummaryProps) {
  return (
    <section className="panel stack">
      <div className="section-heading">
        <h2>ゲーム終了</h2>
      </div>
      <p className="hint-text">{getGameOverReasonLabel(reason)}</p>
      <ol className="standing-list">
        {standings.map((standing) => (
          <li key={standing.playerId} className="standing-item">
            <div className="stack tight">
              <strong>
                {standing.rank}. {standing.name || "名前未設定"}
              </strong>
              <span className="meta-text">
                stack {standing.finalStack} / {getStandingStatusLabel(standing.status)}
              </span>
            </div>
          </li>
        ))}
      </ol>
      <div className="action-row">
        <button className="primary-button" onClick={onAcknowledge}>
          待機画面へ戻る
        </button>
      </div>
    </section>
  );
}
