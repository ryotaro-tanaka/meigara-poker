import { getDeckInfoLines, getPositionLines, getPotHelpText, resolvePlayerName } from "../lib/game-ui";
import type { MainPot, PlayerPositionMap, PublicPlayerState, RoomPhase, SidePot } from "../lib/types";

interface InfoPanelProps {
  phaseLabel: RoomPhase;
  revealedCount: number;
  selectedIndustries: string[];
  pot: number;
  mainPot: MainPot | null;
  sidePots: SidePot[];
  myStack: number;
  currentBet: number;
  toCall: number;
  positions: PlayerPositionMap;
  currentTurnPlayerId: string | null;
  players: PublicPlayerState[];
  selfPlayerId: string | null;
  lastActionMessage: string | null;
}

export function InfoPanel({
  phaseLabel,
  revealedCount,
  selectedIndustries,
  pot,
  mainPot,
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
        <p className="meta-text">pot 総額: {pot}</p>
        <p className="meta-text">main pot: {mainPot?.amount ?? 0}</p>
        <p className="meta-text">あなたの stack: {myStack}</p>
        <p className="meta-text">今回の bet: {currentBet}</p>
        <p className="meta-text">call に必要: {toCall}</p>
        <p className="meta-text">公開済み枚数: {revealedCount} / 5</p>
        <p className="meta-text">現在の手番: {resolvePlayerName(players, currentTurnPlayerId, selfPlayerId)}</p>
      </div>
      <div className="stack tight">
        {getPositionLines(players, positions, selfPlayerId).map((line) => (
          <p key={line.label} className="meta-text">
            {line.label}: {line.value}
          </p>
        ))}
      </div>
      <div className="stack tight">
        {getDeckInfoLines(selectedIndustries).map((line) => (
          <p key={line} className="meta-text">
            {line}
          </p>
        ))}
      </div>
      <p className="hint-text">{getPotHelpText(mainPot, sidePots)}</p>
      {sidePots.length > 0 ? <p className="meta-text">side pot: {sidePots.map((sidePot) => sidePot.amount).join(" / ")}</p> : null}
      {lastActionMessage ? <p className="hint-text">{lastActionMessage}</p> : null}
    </section>
  );
}
