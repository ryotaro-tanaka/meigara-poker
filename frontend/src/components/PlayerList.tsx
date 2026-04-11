import { getPlayerStatusSummary, getPositionBadgeLabel } from "../lib/game-ui";
import type { PublicPlayerState } from "../lib/types";

interface PlayerListProps {
  players: PublicPlayerState[];
  selfPlayerId: string | null;
  showBettingInfo?: boolean;
  readyPlayerIds?: string[];
  compactGameView?: boolean;
  totalSlots?: number;
  hideEliminatedStatus?: boolean;
  editableSelfName?: boolean;
  onSelfNameChange?: (name: string) => void;
}

export function PlayerList({
  players,
  selfPlayerId,
  showBettingInfo = false,
  readyPlayerIds = [],
  compactGameView = false,
  totalSlots = players.length,
  hideEliminatedStatus = false,
  editableSelfName = false,
  onSelfNameChange,
}: PlayerListProps) {
  const slots = Array.from({ length: Math.max(totalSlots, players.length) }, (_, index) => players[index] ?? null);

  return (
    <ul className="player-list">
      {slots.map((player, index) =>
        player ? (
          <li
            key={player.playerId}
            className={`player-item${player.isCurrentTurn ? " player-item-active" : ""}${player.isFolded ? " player-item-folded" : ""}`}
          >
            <div className="stack tight">
              <div className="player-title-row">
                {editableSelfName && player.playerId === selfPlayerId ? (
                  <input
                    className="player-name-inline-input"
                    value={player.name || ""}
                    onChange={(event) => onSelfNameChange?.(event.target.value)}
                    placeholder="名前を入力"
                    aria-label="自分の名前"
                  />
                ) : (
                  <strong>{player.name || "名前未設定"}</strong>
                )}
                {player.playerId === selfPlayerId ? <span className="chip">あなた</span> : null}
                {getPositionBadgeLabel(player.position) ? <span className="chip neutral">{getPositionBadgeLabel(player.position)}</span> : null}
                {readyPlayerIds.includes(player.playerId) ? <span className="chip neutral">Ready</span> : null}
              </div>
              {compactGameView ? (
                <div className="player-hole-cards" aria-label={`${player.name || "名前未設定"} の伏せカード`}>
                  <span className="mini-card" />
                  <span className="mini-card" />
                </div>
              ) : null}
              {showBettingInfo ? (
                <div className="player-meta-grid">
                  <span className="meta-text">持ち点 {player.stack}</span>
                  <span className="meta-text">掛け金 {player.currentBet}</span>
                </div>
              ) : null}
              {getPlayerStatusSummary(player) && !(hideEliminatedStatus && player.isEliminated) ? (
                <span className="meta-text">{getPlayerStatusSummary(player)}</span>
              ) : null}
            </div>
            <span className={`status-dot ${player.connected ? "online" : "offline"}${player.isCurrentTurn ? " active" : ""}`}>
              {player.connected ? "接続中" : "切断"}
            </span>
          </li>
        ) : (
          <li key={`empty-slot-${index}`} className="player-item player-item-empty">
            <div className="stack tight">
              <div className="player-title-row">
                <span className="skeleton-line skeleton-line-name" />
                <span className="chip neutral">{index + 1}/6</span>
              </div>
              <div className="player-meta-grid">
                <span className="skeleton-line" />
                <span className="skeleton-line" />
              </div>
            </div>
            <span className="status-dot">待機中</span>
          </li>
        ),
      )}
    </ul>
  );
}
