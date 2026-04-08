import type { PlayerPositionMap, PlayerState, RoomPhase, SidePot } from "../lib/types";

interface InfoPanelProps {
  phaseLabel: RoomPhase;
  revealedCount: number;
  selectedIndustries: string[];
  pot: number;
  sidePots: SidePot[];
  myStack: number;
  currentBet: number;
  toCall: number;
  positions: PlayerPositionMap;
  currentTurnPlayerId: string | null;
  players: PlayerState[];
  selfPlayerId: string | null;
  lastActionMessage: string | null;
}

function resolvePlayerName(players: PlayerState[], playerId: string | null, selfPlayerId: string | null): string {
  if (!playerId) {
    return "未設定";
  }

  if (playerId === selfPlayerId) {
    return "あなた";
  }

  return players.find((player) => player.playerId === playerId)?.name || playerId;
}

export function InfoPanel({
  phaseLabel,
  revealedCount,
  selectedIndustries,
  pot,
  sidePots,
  myStack,
  currentBet,
  toCall,
  positions,
  currentTurnPlayerId,
  players,
  selfPlayerId,
  lastActionMessage,
}: InfoPanelProps) {
  return (
    <section className="panel stack">
      <div className="section-heading">
        <h2>ゲーム情報</h2>
      </div>
      <p className="phase-label">現在 phase: {phaseLabel}</p>
      <div className="info-grid">
        <p className="meta-text">pot: {pot}</p>
        <p className="meta-text">あなたの stack: {myStack}</p>
        <p className="meta-text">今回の bet: {currentBet}</p>
        <p className="meta-text">call に必要: {toCall}</p>
        <p className="meta-text">公開済み枚数: {revealedCount} / 5</p>
        <p className="meta-text">現在の手番: {resolvePlayerName(players, currentTurnPlayerId, selfPlayerId)}</p>
      </div>
      <div className="stack tight">
        <p className="meta-text">Dealer: {resolvePlayerName(players, positions.dealer, selfPlayerId)}</p>
        <p className="meta-text">SB: {resolvePlayerName(players, positions.smallBlind, selfPlayerId)}</p>
        <p className="meta-text">BB: {resolvePlayerName(players, positions.bigBlind, selfPlayerId)}</p>
      </div>
      <p className="meta-text">使用業種: {selectedIndustries.join(" / ") || "ゲーム開始後に表示されます。"}</p>
      <p className="meta-text">
        side pot:{" "}
        {sidePots.length > 0 ? sidePots.map((sidePot) => sidePot.amount).join(" / ") : "まだありません。"}
      </p>
      {lastActionMessage ? <p className="hint-text">{lastActionMessage}</p> : null}
    </section>
  );
}
