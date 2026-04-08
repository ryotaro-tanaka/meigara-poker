export interface DeckCard {
  edinetCode: string;
  name: string;
  suit: string;
  number: number;
}

export interface PlayerState {
  playerId: string;
  name: string;
  joinedAt: string;
  connected: boolean;
}

export type RoomPhase = "waiting" | "preflop" | "flop" | "turn" | "river" | "showdown";

export interface HandEvaluation {
  rank:
    | "straight_flush"
    | "four_of_a_kind"
    | "full_house"
    | "flush"
    | "straight"
    | "three_of_a_kind"
    | "two_pair"
    | "one_pair"
    | "high_card";
  cards: DeckCard[];
}

export interface GameResultWinner {
  playerId: string;
  evaluation: HandEvaluation;
}

export interface GameResultEntry extends GameResultWinner {
  hand: DeckCard[];
}

export interface GameResultSummary {
  isDraw: boolean;
  winners: GameResultWinner[];
  results: GameResultEntry[];
  finalBoard: DeckCard[];
}

export interface RoomSnapshot {
  roomId: string;
  roomName: string;
  phase: RoomPhase;
  players: PlayerState[];
  playerCount: number;
  selectedIndustries: string[];
  deckCount: number;
  board: DeckCard[];
  boardRevealCount: number;
  results: GameResultSummary | null;
  createdAt: string;
}

export interface PlayerRoomState {
  room: RoomSnapshot;
  selfPlayerId: string;
  hand: DeckCard[];
  board: DeckCard[];
  results: GameResultSummary | null;
}

export interface CreateRoomResponse {
  ok: boolean;
  roomId: string;
  roomName: string;
  playerId: string;
  roomUrl: string;
}

export interface RoomSnapshotResponse {
  ok: boolean;
  room: RoomSnapshot;
}

interface RoomStateEvent extends PlayerRoomState {
  type: "room_state";
}

interface PlayerUpdateEvent {
  type: "player_joined" | "player_updated";
  room: RoomSnapshot;
}

interface GameStartedEvent extends PlayerRoomState {
  type: "game_started";
  roomId: string;
  phase: RoomPhase;
  selectedIndustries: string[];
  playerCount: number;
}

interface BoardRevealedEvent {
  type: "board_revealed";
  phase: RoomPhase;
  board: DeckCard[];
  revealedCount: number;
  room: RoomSnapshot;
}

interface GameResultEvent {
  type: "game_result";
  phase: RoomPhase;
  board: DeckCard[];
  winners: GameResultWinner[];
  results: GameResultEntry[];
  room: RoomSnapshot;
  hand: DeckCard[];
}

interface ErrorEventPayload {
  type: "error";
  message: string;
}

interface PongEvent {
  type: "pong";
}

export type ServerEvent =
  | RoomStateEvent
  | PlayerUpdateEvent
  | GameStartedEvent
  | BoardRevealedEvent
  | GameResultEvent
  | ErrorEventPayload
  | PongEvent;

export type ClientEvent =
  | {
      type: "join_room";
      name?: string;
    }
  | {
      type: "set_name";
      name?: string;
    }
  | {
      type: "start_game";
    }
  | {
      type: "ping";
    };

export type ConnectionStatus = "idle" | "loading" | "connecting" | "connected" | "disconnected" | "error";
