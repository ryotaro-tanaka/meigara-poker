import { resolvePlayerName } from "../lib/game-ui";
import type { GameResultSummary, PlayerState } from "../lib/types";

interface ResultSummaryProps {
  results: GameResultSummary | null;
  players: PlayerState[];
}

export function ResultSummary({ results, players }: ResultSummaryProps) {
  if (!results) {
    return (
      <section className="stack">
        <div className="section-heading">
          <h2>結果</h2>
        </div>
        <p className="empty-state">結果はハンド終了後に表示されます。</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="section-heading">
        <h2>結果</h2>
      </div>
      <p className="result-headline">
        {results.isDraw
          ? `分配: ${results.winners.map((winner) => resolvePlayerName(players, winner.playerId)).join(", ")}`
          : `勝者: ${resolvePlayerName(players, results.winners[0]?.playerId ?? "")}`}
      </p>
      <ul className="result-list">
        {results.results.map((result) => (
          <li key={result.playerId}>
            <div className="stack tight">
              <strong>{resolvePlayerName(players, result.playerId)}</strong>
              <span className="meta-text">
                {result.evaluation?.rank ?? (result.folded ? "fold" : "showdown なし")} / 獲得 {result.amountWon}
              </span>
            </div>
            <span>stack {result.finalStack}</span>
          </li>
        ))}
      </ul>
      {results.sidePots.length > 0 ? (
        <ul className="result-list">
          {results.sidePots.map((sidePot, index) => (
            <li key={`${sidePot.amount}-${index}`}>
              <strong>pot {index + 1}</strong>
              <span>
                {sidePot.amount} / {sidePot.winnerPlayerIds.map((playerId) => resolvePlayerName(players, playerId)).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
