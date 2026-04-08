import { CardRow } from "../../components/CardRow";
import { ResultSummary } from "../../components/ResultSummary";
import type { AppState } from "../../state/app-state";

interface GameScreenProps {
  state: AppState;
}

export function GameScreen({ state }: GameScreenProps) {
  return (
    <section className="content-grid">
      <CardRow cards={state.hand} title="自分の手札" emptyLabel="配布待ちです。" />
      <CardRow cards={state.board} title="公開済み場札" emptyLabel="まだ公開されていません。" />
      <section className="panel stack">
        <div className="section-heading">
          <h2>進行状況</h2>
        </div>
        <p className="phase-label">現在 phase: {state.room?.phase ?? "waiting"}</p>
        <p className="meta-text">公開済み枚数: {state.room?.boardRevealCount ?? 0} / 5</p>
        <p className="meta-text">使用業種: {state.selectedIndustries.join(" / ") || "ゲーム開始後に表示されます。"}</p>
      </section>
      <ResultSummary results={state.results} players={state.room?.players ?? []} />
    </section>
  );
}
