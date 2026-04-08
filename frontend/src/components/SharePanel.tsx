interface SharePanelProps {
  shareUrl: string;
}

export function SharePanel({ shareUrl }: SharePanelProps) {
  return (
    <section className="panel stack">
      <div className="section-heading">
        <h2>共有</h2>
      </div>
      <p className="meta-text">この URL を共有すると同じ部屋に参加できます。</p>
      <div className="share-box">{shareUrl}</div>
    </section>
  );
}
