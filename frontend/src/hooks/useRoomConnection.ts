import { useEffect, useRef } from "react";
import type { Dispatch } from "react";
import { createRoomWebSocket, fetchRoomSnapshot } from "../lib/api";
import { getStoredPlayerId, setStoredPlayerId, setStoredPlayerName } from "../lib/storage";
import type { ClientEvent, ServerEvent } from "../lib/types";
import type { AppAction, AppState } from "../state/app-state";

interface UseRoomConnectionOptions {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

export function useRoomConnection({ state, dispatch }: UseRoomConnectionOptions): {
  sendEvent: (event: ClientEvent) => void;
} {
  const socketRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.route.kind !== "room") {
      return;
    }

    const roomId = state.route.roomId;
    const restoredPlayerId = state.playerId ?? getStoredPlayerId(roomId) ?? crypto.randomUUID();

    if (restoredPlayerId !== state.playerId) {
      dispatch({
        type: "player_restored",
        roomId,
        playerId: restoredPlayerId,
        playerName: state.playerName,
      });
    }

    dispatch({ type: "snapshot_requested" });

    void fetchRoomSnapshot(roomId)
      .then((payload) => {
        dispatch({ type: "snapshot_loaded", room: payload.room });
      })
      .catch((error: unknown) => {
        dispatch({
          type: "snapshot_failed",
          message: error instanceof Error ? error.message : "Failed to load room.",
        });
      });
  }, [dispatch, state.playerId, state.playerName, state.route]);

  useEffect(() => {
    if (state.route.kind !== "room" || !state.playerId) {
      return;
    }

    const socket = createRoomWebSocket(state.route.roomId, state.playerId);
    socketRef.current = socket;
    dispatch({ type: "ws_connecting" });

    socket.addEventListener("open", () => {
      dispatch({ type: "ws_connected" });
      socket.send(
        JSON.stringify({
          type: "join_room",
          name: state.playerName || undefined,
        } satisfies ClientEvent),
      );

      pingTimerRef.current = window.setInterval(() => {
        socket.send(JSON.stringify({ type: "ping" } satisfies ClientEvent));
      }, 15000);
    });

    socket.addEventListener("message", (message) => {
      const event = JSON.parse(String(message.data)) as ServerEvent;

      if (state.route.kind === "room" && event.type === "room_state" && event.selfPlayerId) {
        setStoredPlayerId(state.route.roomId, event.selfPlayerId);
      }

      dispatch({ type: "server_event_received", event });
    });

    socket.addEventListener("close", () => {
      dispatch({ type: "ws_disconnected" });
    });

    socket.addEventListener("error", () => {
      dispatch({
        type: "ws_failed",
        message: "WebSocket connection failed.",
      });
    });

    return () => {
      if (pingTimerRef.current) {
        window.clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }

      socket.close();
      socketRef.current = null;
    };
  }, [dispatch, state.playerId, state.playerName, state.route]);

  useEffect(() => {
    if (state.playerName) {
      setStoredPlayerName(state.playerName);
    }
  }, [state.playerName]);

  return {
    sendEvent(event: ClientEvent): void {
      const socket = socketRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        dispatch({
          type: "ws_failed",
          message: "WebSocket is not connected yet.",
        });
        return;
      }

      socket.send(JSON.stringify(event));
    },
  };
}
