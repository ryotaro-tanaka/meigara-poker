import { useEffect, useReducer } from "react";
import { createRoom } from "./lib/api";
import { getStoredPlayerName, setStoredPlayerId } from "./lib/storage";
import { useAppRouter } from "./hooks/useAppRouter";
import { useRoomConnection } from "./hooks/useRoomConnection";
import { CreateRoomScreen } from "./features/room/CreateRoomScreen";
import { RoomScreen } from "./features/room/RoomScreen";
import { appReducer, createInitialState } from "./state/app-state";

export function App() {
  const { route, navigate } = useAppRouter();
  const [state, dispatch] = useReducer(appReducer, createInitialState(route, getStoredPlayerName()));
  const { sendEvent } = useRoomConnection({ state, dispatch });

  useEffect(() => {
    dispatch({ type: "route_changed", route });
  }, [route]);

  async function handleCreateRoom(roomName: string): Promise<void> {
    dispatch({ type: "create_room_requested" });

    try {
      const payload = await createRoom(roomName.trim());
      setStoredPlayerId(payload.roomId, payload.playerId);
      dispatch({ type: "create_room_succeeded", payload });
      navigate(`/rooms/${payload.roomId}`);
    } catch (error) {
      dispatch({
        type: "create_room_failed",
        message: error instanceof Error ? error.message : "Failed to create room.",
      });
    }
  }

  if (state.route.kind === "home") {
    return (
      <CreateRoomScreen
        defaultRoomName="銘柄ポーカー部屋"
        isSubmitting={state.isCreatingRoom}
        error={state.serverError}
        onSubmit={handleCreateRoom}
      />
    );
  }

  return (
    <RoomScreen
      state={state}
      shareUrl={window.location.href}
      onNameChange={(name) => dispatch({ type: "player_name_changed", name })}
      onNameSubmit={() => sendEvent({ type: "set_name", name: state.playerName })}
      onStartGame={() => sendEvent({ type: "start_game" })}
    />
  );
}
