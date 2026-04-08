import type { PlayerState } from "../lib/types";

interface PlayerListProps {
  players: PlayerState[];
  selfPlayerId: string | null;
}

export function PlayerList({ players, selfPlayerId }: PlayerListProps) {
  return (
    <ul className="player-list">
      {players.map((player) => (
        <li key={player.playerId} className="player-item">
          <div>
            <strong>{player.name || "名前未設定"}</strong>
            {player.playerId === selfPlayerId ? <span className="chip">あなた</span> : null}
          </div>
          <span className={`status-dot ${player.connected ? "online" : "offline"}`}>
            {player.connected ? "接続中" : "切断"}
          </span>
        </li>
      ))}
    </ul>
  );
}
