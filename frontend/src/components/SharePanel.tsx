import { useState } from "react";

interface SharePanelProps {
  shareUrl: string;
}

export function SharePanel({ shareUrl }: SharePanelProps) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyMessage("URL をコピーしました。参加する人にそのまま送れます。");
    } catch {
      setCopyMessage("コピーに失敗しました。URL を手動で選択して共有してください。");
    }
  }

  return (
    <section className="panel stack">
      <div className="section-heading">
        <h2>共有</h2>
      </div>
      <p className="meta-text">この URL を共有すると、別のブラウザや別端末から同じ部屋に参加できます。</p>
      <div className="share-box">{shareUrl}</div>
      <div className="action-row">
        <button className="secondary-button" onClick={() => void handleCopy()}>
          URL をコピー
        </button>
        <p className="meta-text">部屋に入り直すときも同じ URL を使います。</p>
      </div>
      {copyMessage ? <p className="hint-text">{copyMessage}</p> : null}
    </section>
  );
}
