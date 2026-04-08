import type { AppRoute } from "../lib/router";
import type {
  ConnectionStatus,
  CreateRoomResponse,
  DeckCard,
  GameResultSummary,
  PlayerActionType,
  PlayerPositionMap,
  RoomSnapshot,
  ServerEvent,
  SidePot,
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
  pot: number;
  sidePots: SidePot[];
  myStack: number;
  currentBet: number;
  toCall: number;
  positions: PlayerPositionMap;
  availableActions: PlayerActionType[];
  currentTurnPlayerId: string | null;
  lastActionMessage: string | null;
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
    pot: 0,
    sidePots: [],
    myStack: 0,
    currentBet: 0,
    toCall: 0,
    positions: {
      dealer: null,
      smallBlind: null,
      bigBlind: null,
    },
    availableActions: [],
    currentTurnPlayerId: null,
    lastActionMessage: null,
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

function getPlayerLabel(state: AppState, playerId: string): string {
  if (playerId === state.playerId) {
    return "あなた";
  }

  return state.room?.players.find((player) => player.playerId === playerId)?.name || playerId;
}

function getActionLabel(action: PlayerActionType): string {
  switch (action) {
    case "fold":
      return "fold";
    case "check":
      return "check";
    case "call":
      return "call";
    case "bet":
      return "bet";
    case "raise":
      return "raise";
    case "all-in":
      return "all-in";
  }
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
        pot: action.route.kind === "room" && state.room?.roomId === action.route.roomId ? state.pot : 0,
        sidePots: action.route.kind === "room" && state.room?.roomId === action.route.roomId ? state.sidePots : [],
        myStack: action.route.kind === "room" && state.room?.roomId === action.route.roomId ? state.myStack : 0,
        currentBet: action.route.kind === "room" && state.room?.roomId === action.route.roomId ? state.currentBet : 0,
        toCall: action.route.kind === "room" && state.room?.roomId === action.route.roomId ? state.toCall : 0,
        positions:
          action.route.kind === "room" && state.room?.roomId === action.route.roomId
            ? state.positions
            : { dealer: null, smallBlind: null, bigBlind: null },
        availableActions:
          action.route.kind === "room" && state.room?.roomId === action.route.roomId ? state.availableActions : [],
        currentTurnPlayerId:
          action.route.kind === "room" && state.room?.roomId === action.route.roomId ? state.currentTurnPlayerId : null,
        lastActionMessage: action.route.kind === "room" && state.room?.roomId === action.route.roomId ? state.lastActionMessage : null,
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
          myStack: action.event.myStack,
          currentBet: action.event.currentBet,
          toCall: action.event.toCall,
          positions: action.event.positions,
          availableActions: action.event.availableActions,
          pot: action.event.pot,
          sidePots: action.event.sidePots,
        });
      }

      if (action.event.type === "player_joined" || action.event.type === "player_updated") {
        return applyRoomState(state, action.event.room);
      }

      if (action.event.type === "game_started") {
        return {
          ...state,
          lastActionMessage: "ゲームが開始されました。",
        };
      }

      if (action.event.type === "action_applied") {
        return {
          ...applyRoomState(state, action.event.room),
          lastActionMessage: `${getPlayerLabel(state, action.event.actorPlayerId)} が ${getActionLabel(action.event.action)}${action.event.amount ? ` ${action.event.amount}` : ""} を実行しました。`,
        };
      }

      if (action.event.type === "phase_advanced") {
        return {
          ...applyRoomState(state, action.event.room, {
            board: action.event.board,
            results: action.event.room.results,
          }),
          lastActionMessage: `phase が ${action.event.phase} に進みました。`,
        };
      }

      if (action.event.type === "game_result") {
        return {
          ...applyRoomState(state, action.event.room, {
            board: action.event.board,
            results: {
              isDraw: action.event.winners.length > 1,
              winners: action.event.winners,
              results: action.event.results,
              finalBoard: action.event.board,
              sidePots: action.event.room.results?.sidePots ?? [],
            },
          }),
          lastActionMessage: "ハンドが終了しました。",
        };
      }

      return state;
    default:
      return state;
  }
}
