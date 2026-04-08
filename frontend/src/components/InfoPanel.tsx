interface InfoPanelProps {
  phaseLabel: string;
  revealedCount: number;
  selectedIndustries: string[];
}

export function InfoPanel({ phaseLabel, revealedCount, selectedIndustries }: InfoPanelProps) {
  return (
    <section className="panel stack">
      <div className="section-heading">
        <h2>ゲーム情報</h2>
      </div>
      <p className="phase-label">現在 phase: {phaseLabel}</p>
      <p className="meta-text">公開済み枚数: {revealedCount} / 5</p>
      <p className="meta-text">使用業種: {selectedIndustries.join(" / ") || "ゲーム開始後に表示されます。"}</p>
    </section>
  );
}
