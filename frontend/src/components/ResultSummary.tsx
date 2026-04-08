import type { GameResultSummary, PlayerState } from "../lib/types";

interface ResultSummaryProps {
  results: GameResultSummary | null;
  players: PlayerState[];
}

function resolvePlayerName(players: PlayerState[], playerId: string): string {
  return players.find((player) => player.playerId === playerId)?.name || playerId;
}

export function ResultSummary({ results, players }: ResultSummaryProps) {
  if (!results) {
    return (
      <section className="stack">
        <div className="section-heading">
          <h2>結果</h2>
        </div>
        <p className="empty-state">結果は showdown 後に表示されます。</p>
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
          ? `引き分け: ${results.winners.map((winner) => resolvePlayerName(players, winner.playerId)).join(", ")}`
          : `勝者: ${resolvePlayerName(players, results.winners[0]?.playerId ?? "")}`}
      </p>
      <ul className="result-list">
        {results.results.map((result) => (
          <li key={result.playerId}>
            <strong>{resolvePlayerName(players, result.playerId)}</strong>
            <span>{result.evaluation.rank}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
