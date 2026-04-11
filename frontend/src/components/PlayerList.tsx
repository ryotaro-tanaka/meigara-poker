import { getPlayerStatusSummary, getPositionBadgeLabel } from "../lib/game-ui";
import type { PublicPlayerState } from "../lib/types";
import type { PlayerRoundHistoryByPlayer } from "../state/app-state";

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
  showParticipationToggle?: boolean;
  isSelfParticipating?: boolean;
  canParticipate?: boolean;
  onSetParticipation?: (participating: boolean) => void;
  roundHistoryByPlayer?: PlayerRoundHistoryByPlayer;
  expandedPlayerId?: string | null;
  onTogglePlayerHistory?: (playerId: string) => void;
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
  showParticipationToggle = false,
  isSelfParticipating = false,
  canParticipate = false,
  onSetParticipation,
  roundHistoryByPlayer,
  expandedPlayerId = null,
  onTogglePlayerHistory,
}: PlayerListProps) {
  const slots = Array.from({ length: Math.max(totalSlots, players.length) }, (_, index) => players[index] ?? null);
  const listClassName = compactGameView ? "player-list player-list-compact" : "player-list";
  const historyRows = [
    { key: "preflop", label: "手札" },
    { key: "flop", label: "場札3枚" },
    { key: "turn", label: "場札4枚目" },
    { key: "river", label: "場札5枚目" },
  ] as const;

  return (
    <ul className={listClassName}>
      {slots.map((player, index) =>
        player ? (
          <li
            key={player.playerId}
            className={`player-item${player.isCurrentTurn ? " player-item-active" : ""}${player.isFolded ? " player-item-folded" : ""}`}
          >
            {compactGameView ? (
              <div className="player-row-main">
                <button
                  type="button"
                  className="player-row-toggle"
                  onClick={() => onTogglePlayerHistory?.(player.playerId)}
                  aria-expanded={expandedPlayerId === player.playerId}
                  aria-controls={`player-history-${player.playerId}`}
                >
                  <div className="player-row-top">
                    <div className="player-title-row">
                      <strong>{player.name || "名前未設定"}</strong>
                      {player.playerId === selfPlayerId ? <span className="chip">あなた</span> : null}
                      {getPositionBadgeLabel(player.position) ? <span className="chip neutral">{getPositionBadgeLabel(player.position)}</span> : null}
                      {readyPlayerIds.includes(player.playerId) ? <span className="chip neutral">Ready</span> : null}
                    </div>
                    <span className={`status-dot ${player.connected ? "online" : "offline"}${player.isCurrentTurn ? " active" : ""}`}>
                      {player.connected ? "接続中" : "切断"}
                    </span>
                  </div>
                  {showBettingInfo ? (
                    <div className="player-meta-grid player-meta-grid-compact">
                      <span className="meta-text">持ち点 {player.stack}</span>
                      <span className="meta-text">ベット {player.currentBet}</span>
                      {getPlayerStatusSummary(player) ? <span className="meta-text">{getPlayerStatusSummary(player)}</span> : null}
                    </div>
                  ) : null}
                </button>
                {expandedPlayerId === player.playerId ? (
                  <section className="player-history-panel" id={`player-history-${player.playerId}`}>
                    <p className="meta-text player-history-title">ラウンド別のベット</p>
                    <ul className="player-history-list">
                      {historyRows.map((entry) => (
                        <li key={entry.key}>
                          <span>{entry.label}</span>
                          <strong>{roundHistoryByPlayer?.[player.playerId]?.[entry.key] ?? "-"}</strong>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : (
              <>
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
                  {showBettingInfo ? (
                    <div className="player-meta-grid">
                      <span className="meta-text">持ち点 {player.stack}</span>
                      <span className="meta-text">ベット {player.currentBet}</span>
                    </div>
                  ) : null}
                  {getPlayerStatusSummary(player) && !(hideEliminatedStatus && player.isEliminated) ? (
                    <span className="meta-text">{getPlayerStatusSummary(player)}</span>
                  ) : null}
                  {showParticipationToggle && player.playerId === selfPlayerId ? (
                    <div className="action-row">
                      <button
                        type="button"
                        className={isSelfParticipating ? "ghost-button" : "secondary-button"}
                        onClick={() => onSetParticipation?.(!isSelfParticipating)}
                        disabled={!isSelfParticipating && !canParticipate}
                      >
                        {isSelfParticipating ? "解除" : "参加"}
                      </button>
                    </div>
                  ) : null}
                </div>
                <span className={`status-dot ${player.connected ? "online" : "offline"}${player.isCurrentTurn ? " active" : ""}`}>
                  {player.connected ? "接続中" : "切断"}
                </span>
              </>
            )}
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
