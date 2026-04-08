import { CardRow } from "../../components/CardRow";
import { InfoPanel } from "../../components/InfoPanel";
import { PhaseTimeline } from "../../components/PhaseTimeline";
import { ResultSummary } from "../../components/ResultSummary";
import type { AppState } from "../../state/app-state";

interface GameScreenProps {
  state: AppState;
}

export function GameScreen({ state }: GameScreenProps) {
  return (
    <section className="stack">
      <div className="game-layout">
        <section className="game-main stack">
          <CardRow cards={state.hand} title="自分の手札" emptyLabel="配布待ちです。" />
          <CardRow cards={state.board} title="公開済み場札" emptyLabel="まだ公開されていません。" />
          <ResultSummary results={state.results} players={state.room?.players ?? []} />
        </section>
        <aside className="game-side stack">
          <InfoPanel
            phaseLabel={state.room?.phase ?? "waiting"}
            revealedCount={state.room?.boardRevealCount ?? 0}
            selectedIndustries={state.selectedIndustries}
          />
          <PhaseTimeline phase={state.room?.phase ?? null} />
        </aside>
      </div>
    </section>
  );
}
