import type { ConnectionStatus } from "../lib/types";
import { StatusBadge } from "./StatusBadge";

interface WaitingRoomSummaryProps {
  roomId: string | null;
  roomName: string;
  playerCount: number;
  status: ConnectionStatus;
  description: string;
}

export function WaitingRoomSummary({ roomId, roomName, playerCount, status, description }: WaitingRoomSummaryProps) {
  return (
    <section className="panel stack waiting-summary">
      <div className="hero-topline">
        <p className="eyebrow">Room {roomId ?? "----"}</p>
        <StatusBadge status={status} />
      </div>
      <div className="stack tight">
        <h1 className="waiting-summary-title">{roomName}</h1>
        <p className="description">{description}</p>
      </div>
      <div className="hero-stats">
        <span className="hero-stat">players: {playerCount}/6</span>
        <span className="hero-stat">2 人以上で開始</span>
      </div>
    </section>
  );
}
