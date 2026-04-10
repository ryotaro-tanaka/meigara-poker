interface LobbyPanelProps {
  playerName: string;
  playerCount: number;
  canStart: boolean;
  onNameChange: (name: string) => void;
  onNameSubmit: () => void;
  onStartGame: () => void;
}

export function LobbyPanel({
  playerName,
  playerCount,
  canStart,
  onNameChange,
  onNameSubmit,
  onStartGame,
}: LobbyPanelProps) {
  return (
    <section className="panel stack">
      <div className="section-heading">
        <h2>参加準備</h2>
      </div>
      <p className="meta-text">先に自分の名前を決めておくと、参加者一覧で分かりやすく表示されます。</p>
      <label className="field">
        <span>表示名</span>
        <input value={playerName} onChange={(event) => onNameChange(event.target.value)} placeholder="名前を入力" />
      </label>
      <div className="action-row">
        <button className="secondary-button" onClick={onNameSubmit}>
          名前を決定
        </button>
        <button className="primary-button" onClick={onStartGame} disabled={!canStart}>
          ゲーム開始
        </button>
      </div>
      <p className="meta-text">2 人以上で開始できます。現在は {playerCount} 人です。</p>
      {!canStart ? <p className="hint-text">開始ボタンは 2 人以上そろうと押せます。</p> : null}
    </section>
  );
}
