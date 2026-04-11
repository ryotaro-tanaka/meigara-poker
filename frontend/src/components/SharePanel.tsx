import { useState } from "react";

interface SharePanelProps {
  shareUrl: string;
}

export function SharePanel({ shareUrl }: SharePanelProps) {
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  async function handleShare(): Promise<void> {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      setShareMessage("この端末では共有ボタンが使えません。URL を手動で送ってください。");
      return;
    }

    try {
      await navigator.share({
        title: "銘柄ポーカーの部屋に参加",
        text: "この URL から同じ部屋に参加できます。",
        url: shareUrl,
      });
      setShareMessage("共有画面を開きました。送信先を選んで共有してください。");
    } catch {
      setShareMessage("共有に失敗しました。URL を手動で送ってください。");
    }
  }

  return (
    <section className="panel stack">
      <div className="section-heading">
        <h2>招待リンク</h2>
      </div>
      <p className="meta-text">この URL を送ると、同じ部屋に参加できます。</p>
      <div className="share-box">{shareUrl}</div>
      <div className="action-row action-row-start">
        <button className="primary-button" onClick={() => void handleShare()}>
          共有する
        </button>
      </div>
      {shareMessage ? <p className="hint-text">{shareMessage}</p> : <p className="meta-text">再参加するときも同じ URL を使います。</p>}
    </section>
  );
}
