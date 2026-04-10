import type { RoomPhase } from "../lib/types";

interface PhaseTimelineProps {
  phase: RoomPhase | null;
}

const PHASES: RoomPhase[] = ["waiting", "preflop", "flop", "turn", "river", "showdown", "between_hands"];

export function PhaseTimeline({ phase }: PhaseTimelineProps) {
  const activeIndex = phase ? PHASES.indexOf(phase) : 0;

  return (
    <section className="panel stack">
      <div className="section-heading">
        <h2>進行</h2>
      </div>
      <ol className="phase-timeline">
        {PHASES.map((step, index) => (
          <li
            key={step}
            className={`phase-step ${index < activeIndex ? "done" : ""} ${index === activeIndex ? "active" : ""}`}
          >
            <span className="phase-dot" />
            <div>
              <strong>{step}</strong>
              <p>{describePhase(step)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function describePhase(phase: RoomPhase): string {
  switch (phase) {
    case "waiting":
      return "参加者がそろうのを待っています。";
    case "preflop":
      return "手札が配られた状態です。";
    case "flop":
      return "場札が 3 枚公開されます。";
    case "turn":
      return "4 枚目の場札が公開されます。";
    case "river":
      return "5 枚目の場札が公開されます。";
    case "showdown":
      return "役を比較して結果を表示します。";
    case "between_hands":
      return "結果を確認しながら次のハンド開始を待っています。";
  }
}
