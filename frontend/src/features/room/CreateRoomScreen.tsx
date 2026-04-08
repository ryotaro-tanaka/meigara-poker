import { useState } from "react";

interface CreateRoomScreenProps {
  defaultRoomName: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (roomName: string) => void;
}

export function CreateRoomScreen({ defaultRoomName, isSubmitting, error, onSubmit }: CreateRoomScreenProps) {
  const [roomName, setRoomName] = useState(defaultRoomName);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Meigara Poker</p>
        <h1>部屋を作成して、そのまま待機画面からゲームを始めます。</h1>
        <p className="description">
          Cloudflare Workers の room state を正として、待機から showdown まで WebSocket で同期します。
        </p>
        <div className="hero-stats">
          <span className="hero-stat">2〜6 人</span>
          <span className="hero-stat">手札 2 枚 + 場札 5 枚</span>
          <span className="hero-stat">同役は引き分け</span>
        </div>
      </section>

      <section className="content-grid">
        <section className="panel stack">
          <div className="section-heading">
            <h2>部屋作成</h2>
          </div>
          <label className="field">
            <span>部屋名</span>
            <input
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="例: お昼ポーカー"
            />
          </label>
          <button className="primary-button" disabled={isSubmitting || !roomName.trim()} onClick={() => onSubmit(roomName)}>
            {isSubmitting ? "作成中..." : "部屋を作成"}
          </button>
          {error ? <p className="error-text">{error}</p> : null}
        </section>

        <section className="panel stack">
          <div className="section-heading">
            <h2>最初の流れ</h2>
          </div>
          <ol className="guide-list">
            <li>部屋名を入力して作成します。</li>
            <li>待機画面で自分の名前を決めます。</li>
            <li>共有 URL から他の人が参加します。</li>
            <li>2 人以上そろったらゲームを開始します。</li>
          </ol>
        </section>
      </section>
    </main>
  );
}
