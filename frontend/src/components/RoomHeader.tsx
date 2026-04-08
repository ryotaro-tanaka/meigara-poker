import type { ConnectionStatus, RoomPhase } from "../lib/types";
import { StatusBadge } from "./StatusBadge";

interface RoomHeaderProps {
  roomId: string | null;
  roomName: string;
  description: string;
  status: ConnectionStatus;
  phase: RoomPhase | null;
  playerCount: number;
  serverError: string | null;
}

export function RoomHeader({ roomId, roomName, description, status, phase, playerCount, serverError }: RoomHeaderProps) {
  return (
    <section className="hero-card compact">
      <div className="hero-topline">
        <p className="eyebrow">Room {roomId ?? "----"}</p>
        <StatusBadge status={status} />
      </div>
      <h1>{roomName}</h1>
      <p className="description">{description}</p>
      <div className="hero-stats">
        <span className="hero-stat">phase: {phase ?? "waiting"}</span>
        <span className="hero-stat">players: {playerCount}/6</span>
      </div>
      {serverError ? <p className="error-text">{serverError}</p> : null}
    </section>
  );
}
