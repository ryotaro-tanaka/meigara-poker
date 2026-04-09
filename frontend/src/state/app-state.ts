import type { AppRoute } from "../lib/router";
import { getActionLabel, resolvePlayerName } from "../lib/game-ui";
import type {
  ConnectionStatus,
  CreateRoomResponse,
  DeckCard,
  GameResultSummary,
  MainPot,
  PlayerActionType,
  PlayerPositionMap,
  RoomSnapshot,
  ServerEvent,
  SidePot,
} from "../lib/types";

interface RoomSyncState {
  room: RoomSnapshot | null;
  hand: DeckCard[];
  board: DeckCard[];
  selectedIndustries: string[];
  results: GameResultSummary | null;
  pot: number;
  mainPot: MainPot | null;
  sidePots: SidePot[];
  myStack: number;
  currentBet: number;
  toCall: number;
  positions: PlayerPositionMap;
  availableActions: PlayerActionType[];
  currentTurnPlayerId: string | null;
}

interface UiState {
  connectionStatus: ConnectionStatus;
  serverError: string | null;
  isCreatingRoom: boolean;
  lastActionMessage: string | null;
}

export interface AppState extends RoomSyncState, UiState {
  route: AppRoute;
  roomId: string | null;
  playerId: string | null;
  playerName: string;
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

const EMPTY_POSITIONS: PlayerPositionMap = {
  dealer: null,
  smallBlind: null,
  bigBlind: null,
};

function createInitialRoomSyncState(): RoomSyncState {
  return {
    room: null,
    hand: [],
    board: [],
    selectedIndustries: [],
    results: null,
    pot: 0,
    mainPot: null,
    sidePots: [],
    myStack: 0,
    currentBet: 0,
    toCall: 0,
    positions: EMPTY_POSITIONS,
    availableActions: [],
    currentTurnPlayerId: null,
  };
}

function createInitialUiState(): UiState {
  return {
    connectionStatus: "idle",
    serverError: null,
    isCreatingRoom: false,
    lastActionMessage: null,
  };
}

export function createInitialState(route: AppRoute, playerName = ""): AppState {
  return {
    route,
    roomId: route.kind === "room" ? route.roomId : null,
    playerId: null,
    playerName,
    ...createInitialRoomSyncState(),
    ...createInitialUiState(),
  };
}

function applyRoomState(
  state: AppState,
  room: RoomSnapshot,
  options?: {
    hand?: DeckCard[];
    board?: DeckCard[];
    results?: GameResultSummary | null;
    myStack?: number;
    currentBet?: number;
    toCall?: number;
    positions?: PlayerPositionMap;
    availableActions?: PlayerActionType[];
    pot?: number;
    mainPot?: MainPot | null;
    sidePots?: SidePot[];
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
    pot: options?.pot ?? room.pot,
    mainPot: options?.mainPot ?? room.mainPot,
    sidePots: options?.sidePots ?? room.sidePots,
    myStack: options?.myStack ?? state.myStack,
    currentBet: options?.currentBet ?? state.currentBet,
    toCall: options?.toCall ?? state.toCall,
    positions: options?.positions ?? room.positions,
    availableActions: options?.availableActions ?? state.availableActions,
    currentTurnPlayerId: room.currentTurnPlayerId,
    serverError: null,
  };
}

function resetRoomScopedState(state: AppState, keepRoom: boolean): AppState {
  const roomSyncState = keepRoom
    ? {
        room: state.room,
        hand: state.hand,
        board: state.board,
        selectedIndustries: state.selectedIndustries,
        results: state.results,
        pot: state.pot,
        mainPot: state.mainPot,
        sidePots: state.sidePots,
        myStack: state.myStack,
        currentBet: state.currentBet,
        toCall: state.toCall,
        positions: state.positions,
        availableActions: state.availableActions,
        currentTurnPlayerId: state.currentTurnPlayerId,
      }
    : createInitialRoomSyncState();

  return {
    ...state,
    ...roomSyncState,
    lastActionMessage: keepRoom ? state.lastActionMessage : null,
    serverError: null,
  };
}

function applyConnectionState(state: AppState, connectionStatus: ConnectionStatus, serverError: string | null = null): AppState {
  return {
    ...state,
    connectionStatus,
    serverError,
  };
}

function applyRoomEvent(state: AppState, event: Extract<ServerEvent, { type: "room_state" }>): AppState {
  return applyRoomState(state, event.room, {
    hand: event.hand,
    board: event.board,
    results: event.results,
    myStack: event.myStack,
    currentBet: event.currentBet,
    toCall: event.toCall,
    positions: event.positions,
    availableActions: event.availableActions,
    pot: event.pot,
    mainPot: event.mainPot,
    sidePots: event.sidePots,
  });
}

function applyActionMessage(state: AppState, actorPlayerId: string, action: PlayerActionType, amount: number | null): string {
  const actorLabel = resolvePlayerName(state.room?.players ?? [], actorPlayerId, state.playerId);
  return `${actorLabel} が ${getActionLabel(action)}${amount ? ` ${amount}` : ""} を実行しました。`;
}

function applyServerEvent(state: AppState, event: ServerEvent): AppState {
  if (event.type === "error") {
    return {
      ...state,
      serverError: event.message,
    };
  }

  if (event.type === "pong") {
    return state;
  }

  if (event.type === "room_state") {
    return applyRoomEvent(state, event);
  }

  if (event.type === "player_joined" || event.type === "player_updated") {
    return applyRoomState(state, event.room);
  }

  if (event.type === "game_started") {
    return {
      ...state,
      lastActionMessage: "ゲームが開始されました。",
    };
  }

  if (event.type === "action_applied") {
    return {
      ...applyRoomState(state, event.room),
      lastActionMessage: applyActionMessage(state, event.actorPlayerId, event.action, event.amount),
    };
  }

  if (event.type === "phase_advanced") {
    return {
      ...applyRoomState(state, event.room, {
        board: event.board,
        results: event.room.results,
      }),
      lastActionMessage: `phase が ${event.phase} に進みました。`,
    };
  }

  if (event.type === "game_result") {
    return {
      ...applyRoomState(state, event.room, {
        board: event.board,
        results: {
          isDraw: event.winners.length > 1,
          winners: event.winners,
          results: event.results,
          finalBoard: event.board,
          mainPot: event.room.results?.mainPot ?? null,
          sidePots: event.room.results?.sidePots ?? [],
        },
      }),
      lastActionMessage: "ハンドが終了しました。",
    };
  }

  return state;
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "route_changed": {
      const keepRoom = action.route.kind === "room" && state.room?.roomId === action.route.roomId;

      return {
        ...resetRoomScopedState(state, keepRoom),
        route: action.route,
        roomId: action.route.kind === "room" ? action.route.roomId : null,
      };
    }
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
      return applyConnectionState(state, "loading");
    case "snapshot_loaded":
      return applyRoomState(state, action.room);
    case "snapshot_failed":
      return applyConnectionState(state, "error", action.message);
    case "ws_connecting":
      return applyConnectionState(state, "connecting");
    case "ws_connected":
      return applyConnectionState(state, "connected");
    case "ws_disconnected":
      return applyConnectionState(state, state.room ? "disconnected" : "idle");
    case "ws_failed":
      return applyConnectionState(state, "error", action.message);
    case "server_event_received":
      return applyServerEvent(state, action.event);
    default:
      return state;
  }
}
