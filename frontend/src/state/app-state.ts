import type { AppRoute } from "../lib/router";
import type {
  ConnectionStatus,
  CreateRoomResponse,
  DeckCard,
  GameResultSummary,
  RoomSnapshot,
  ServerEvent,
} from "../lib/types";

export interface AppState {
  route: AppRoute;
  roomId: string | null;
  playerId: string | null;
  playerName: string;
  room: RoomSnapshot | null;
  hand: DeckCard[];
  board: DeckCard[];
  selectedIndustries: string[];
  results: GameResultSummary | null;
  connectionStatus: ConnectionStatus;
  serverError: string | null;
  isCreatingRoom: boolean;
}

export type AppAction =
  | { type: "route_changed"; route: AppRoute }
  | { type: "player_restored"; roomId: string | null; playerId: string | null; playerName: string }
  | { type: "create_room_requested" }
  | { type: "create_room_succeeded"; payload: CreateRoomResponse }
  | { type: "create_room_failed"; message: string }
  | { type: "player_name_changed"; name: string }
  | { type: "snapshot_requested" }
  | { type: "snapshot_loaded"; room: RoomSnapshot }
  | { type: "snapshot_failed"; message: string }
  | { type: "ws_connecting" }
  | { type: "ws_connected" }
  | { type: "ws_disconnected" }
  | { type: "ws_failed"; message: string }
  | { type: "server_event_received"; event: ServerEvent };

export function createInitialState(route: AppRoute, playerName = ""): AppState {
  return {
    route,
    roomId: route.kind === "room" ? route.roomId : null,
    playerId: null,
    playerName,
    room: null,
    hand: [],
    board: [],
    selectedIndustries: [],
    results: null,
    connectionStatus: "idle",
    serverError: null,
    isCreatingRoom: false,
  };
}

function applyRoomState(
  state: AppState,
  room: RoomSnapshot,
  options?: {
    hand?: DeckCard[];
    board?: DeckCard[];
    results?: GameResultSummary | null;
  },
): AppState {
  return {
    ...state,
    roomId: room.roomId,
    room,
    board: options?.board ?? room.board,
    selectedIndustries: room.selectedIndustries,
    results: options?.results ?? room.results,
    hand: options?.hand ?? state.hand,
    serverError: null,
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "route_changed":
      return {
        ...state,
        route: action.route,
        roomId: action.route.kind === "room" ? action.route.roomId : null,
        room: action.route.kind === "room" && state.room?.roomId === action.route.roomId ? state.room : null,
        board: action.route.kind === "room" && state.room?.roomId === action.route.roomId ? state.board : [],
        hand: action.route.kind === "room" && state.room?.roomId === action.route.roomId ? state.hand : [],
        results: action.route.kind === "room" && state.room?.roomId === action.route.roomId ? state.results : null,
        selectedIndustries:
          action.route.kind === "room" && state.room?.roomId === action.route.roomId ? state.selectedIndustries : [],
        serverError: null,
      };
    case "player_restored":
      return {
        ...state,
        roomId: action.roomId ?? state.roomId,
        playerId: action.playerId,
        playerName: action.playerName,
      };
    case "create_room_requested":
      return {
        ...state,
        isCreatingRoom: true,
        serverError: null,
      };
    case "create_room_succeeded":
      return {
        ...state,
        isCreatingRoom: false,
        roomId: action.payload.roomId,
        playerId: action.payload.playerId,
        serverError: null,
      };
    case "create_room_failed":
      return {
        ...state,
        isCreatingRoom: false,
        serverError: action.message,
      };
    case "player_name_changed":
      return {
        ...state,
        playerName: action.name,
      };
    case "snapshot_requested":
      return {
        ...state,
        connectionStatus: "loading",
        serverError: null,
      };
    case "snapshot_loaded":
      return applyRoomState(state, action.room);
    case "snapshot_failed":
      return {
        ...state,
        connectionStatus: "error",
        serverError: action.message,
      };
    case "ws_connecting":
      return {
        ...state,
        connectionStatus: "connecting",
        serverError: null,
      };
    case "ws_connected":
      return {
        ...state,
        connectionStatus: "connected",
      };
    case "ws_disconnected":
      return {
        ...state,
        connectionStatus: state.room ? "disconnected" : "idle",
      };
    case "ws_failed":
      return {
        ...state,
        connectionStatus: "error",
        serverError: action.message,
      };
    case "server_event_received":
      if (action.event.type === "error") {
        return {
          ...state,
          serverError: action.event.message,
        };
      }

      if (action.event.type === "pong") {
        return state;
      }

      if (action.event.type === "room_state") {
        return applyRoomState(state, action.event.room, {
          hand: action.event.hand,
          board: action.event.board,
          results: action.event.results,
        });
      }

      if (action.event.type === "player_joined" || action.event.type === "player_updated") {
        return applyRoomState(state, action.event.room);
      }

      if (action.event.type === "game_started") {
        return applyRoomState(state, action.event.room, {
          hand: action.event.hand,
          board: action.event.board,
          results: action.event.results,
        });
      }

      if (action.event.type === "board_revealed") {
        return applyRoomState(state, action.event.room, {
          board: action.event.board,
        });
      }

      if (action.event.type === "game_result") {
        return applyRoomState(state, action.event.room, {
          hand: action.event.hand,
          board: action.event.board,
          results: {
            isDraw: action.event.winners.length > 1,
            winners: action.event.winners,
            results: action.event.results,
            finalBoard: action.event.board,
          },
        });
      }

      return state;
    default:
      return state;
  }
}
