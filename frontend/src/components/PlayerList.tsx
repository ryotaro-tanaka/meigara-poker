import { getPlayerStatusSummary, getPositionBadgeLabel } from "../lib/game-ui";
import type { PublicPlayerState } from "../lib/types";

interface PlayerListProps {
  players: PublicPlayerState[];
  selfPlayerId: string | null;
  showBettingInfo?: boolean;
  readyPlayerIds?: string[];
}

export function PlayerList({ players, selfPlayerId, showBettingInfo = false, readyPlayerIds = [] }: PlayerListProps) {
  return (
    <ul className="player-list">
      {players.map((player) => (
        <li
          key={player.playerId}
          className={`player-item${player.isCurrentTurn ? " player-item-active" : ""}${player.isFolded ? " player-item-folded" : ""}`}
        >
          <div className="stack tight">
            <div className="player-title-row">
              <strong>{player.name || "名前未設定"}</strong>
              {player.playerId === selfPlayerId ? <span className="chip">あなた</span> : null}
              {getPositionBadgeLabel(player.position) ? <span className="chip neutral">{getPositionBadgeLabel(player.position)}</span> : null}
              {readyPlayerIds.includes(player.playerId) ? <span className="chip neutral">Ready</span> : null}
            </div>
            {showBettingInfo ? (
              <div className="player-meta-grid">
                <span className="meta-text">stack {player.stack}</span>
                <span className="meta-text">bet {player.currentBet}</span>
                <span className="meta-text">投入 {player.totalContribution}</span>
              </div>
            ) : null}
            {getPlayerStatusSummary(player) ? (
              <span className="meta-text">{getPlayerStatusSummary(player)}</span>
            ) : null}
          </div>
          <span className={`status-dot ${player.connected ? "online" : "offline"}${player.isCurrentTurn ? " active" : ""}`}>
            {player.connected ? "接続中" : "切断"}
          </span>
        </li>
      ))}
    </ul>
  );
}
