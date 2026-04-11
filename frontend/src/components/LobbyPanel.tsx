interface LobbyPanelProps {
  playersTitle?: string;
  playerName: string;
  playerCount: number;
  canStart: boolean;
  onNameChange: (name: string) => void;
  onStartGame: () => void;
}

export function LobbyPanel({
  playersTitle = "待機者",
  playerName,
  playerCount,
  canStart,
  onNameChange,
  onStartGame,
}: LobbyPanelProps) {
  return (
    <section className="panel stack">
      <div className="section-heading">
        <h2>{playersTitle}</h2>
      </div>
      <label className="field">
        <span>自分の名前</span>
        <input value={playerName} onChange={(event) => onNameChange(event.target.value)} placeholder="名前を入力" />
      </label>
      <div className="action-row">
        <button className="primary-button" onClick={onStartGame} disabled={!canStart}>
          ゲーム開始
        </button>
      </div>
      <p className="meta-text">2 人以上で開始できます。現在 {playerCount}/6 人。</p>
      {!canStart ? <p className="hint-text">開始ボタンは 2 人以上そろうと押せます。</p> : null}
    </section>
  );
}
