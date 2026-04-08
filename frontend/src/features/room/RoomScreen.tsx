import { LobbyPanel } from "../../components/LobbyPanel";
import { PlayerList } from "../../components/PlayerList";
import { RoomHeader } from "../../components/RoomHeader";
import { SharePanel } from "../../components/SharePanel";
import { StatusBadge } from "../../components/StatusBadge";
import { GameScreen } from "../game/GameScreen";
import type { AppState } from "../../state/app-state";

interface RoomScreenProps {
  state: AppState;
  shareUrl: string;
  onNameSubmit: () => void;
  onNameChange: (name: string) => void;
  onStartGame: () => void;
}

export function RoomScreen({ state, shareUrl, onNameSubmit, onNameChange, onStartGame }: RoomScreenProps) {
  const phase = state.room?.phase ?? "waiting";
  const isWaiting = phase === "waiting";
  const canStart = Boolean(state.room && state.room.playerCount >= 2 && isWaiting);

  return (
    <main className="app-shell">
      <RoomHeader
        roomId={state.roomId}
        roomName={state.room?.roomName ?? "ルームを読み込み中..."}
        description={
          isWaiting
            ? "名前を決めて参加者を待ちます。2 人以上そろうとゲームを開始できます。"
            : "公開される場札と自分の手札を見ながら、showdown までの進行を確認します。"
        }
        status={state.connectionStatus}
        phase={state.room?.phase ?? null}
        playerCount={state.room?.playerCount ?? 0}
        serverError={state.serverError}
      />

      {isWaiting ? (
        <section className="room-layout">
          <section className="room-main stack">
            <LobbyPanel
              playerName={state.playerName}
              playerCount={state.room?.playerCount ?? 0}
              canStart={canStart}
              onNameChange={onNameChange}
              onNameSubmit={onNameSubmit}
              onStartGame={onStartGame}
            />
            <SharePanel shareUrl={shareUrl} />
          </section>
          <aside className="room-side stack">
            <section className="panel stack">
              <div className="section-heading">
                <h2>待機者一覧</h2>
                <StatusBadge status={state.connectionStatus} />
              </div>
              <PlayerList players={state.room?.players ?? []} selfPlayerId={state.playerId} />
            </section>
            <section className="panel stack">
              <div className="section-heading">
                <h2>ルール</h2>
              </div>
              <ul className="guide-list">
                <li>手札 2 枚と場札 5 枚で最強の 5 枚役を作ります。</li>
                <li>場札は 3 枚 → 1 枚 → 1 枚の順で公開されます。</li>
                <li>同じ役になった場合はそのまま引き分けです。</li>
              </ul>
            </section>
          </aside>
        </section>
      ) : (
        <section className="room-layout game-mode">
          <section className="room-main stack">
            <GameScreen state={state} />
          </section>
          <aside className="room-side stack">
            <section className="panel stack">
              <div className="section-heading">
                <h2>参加者一覧</h2>
                <StatusBadge status={state.connectionStatus} />
              </div>
              <PlayerList players={state.room?.players ?? []} selfPlayerId={state.playerId} />
            </section>
            <SharePanel shareUrl={shareUrl} />
          </aside>
        </section>
      )}
    </main>
  );
}
