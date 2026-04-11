import { resolvePlayerName } from "../lib/game-ui";
import type { GameResultSummary, PublicPlayerState } from "../lib/types";

interface ResultSummaryProps {
  results: GameResultSummary | null;
  players: PublicPlayerState[];
}

export function ResultSummary({ results, players }: ResultSummaryProps) {
  if (!results) {
    return null;
  }

  return (
    <section className="panel stack">
      <div className="section-heading">
        <h2>前ハンド結果</h2>
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
          {results.mainPot ? (
            <li key={`main-${results.mainPot.amount}`}>
              <strong>main pot</strong>
              <span>
                {results.mainPot.amount} / {results.mainPot.winnerPlayerIds.map((playerId) => resolvePlayerName(players, playerId)).join(", ")}
              </span>
            </li>
          ) : null}
          {results.sidePots.map((sidePot, index) => (
            <li key={`${sidePot.amount}-${index}`}>
              <strong>side pot {index + 1}</strong>
              <span>
                {sidePot.amount} / {sidePot.winnerPlayerIds.map((playerId) => resolvePlayerName(players, playerId)).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      ) : results.mainPot ? (
        <ul className="result-list">
          <li>
            <strong>main pot</strong>
            <span>
              {results.mainPot.amount} / {results.mainPot.winnerPlayerIds.map((playerId) => resolvePlayerName(players, playerId)).join(", ")}
            </span>
          </li>
        </ul>
      ) : null}
    </section>
  );
}
