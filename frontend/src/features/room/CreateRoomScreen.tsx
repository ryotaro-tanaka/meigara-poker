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
      <section className="hero-card home-hero">
        <p className="eyebrow">Meigara Poker</p>
        <h1>銘柄ポーカー</h1>
        <p className="description">ポーカーは心理戦。強い手で勝つか、弱い手でも相手を降ろして勝つか。</p>
        <p className="description">勝敗は賭け方で決まる。このゲームは数字が 0〜9 なので、役ができやすくアクションが増えます。</p>
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
      </section>
    </main>
  );
}
