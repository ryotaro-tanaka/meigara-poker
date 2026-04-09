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

export type PublicPlayerPosition = "dealer" | "small_blind" | "big_blind" | null;

export interface PublicPlayerState extends PlayerState {
  stack: number;
  currentBet: number;
  totalContribution: number;
  isFolded: boolean;
  isAllIn: boolean;
  isCurrentTurn: boolean;
  position: PublicPlayerPosition;
}

export type RoomPhase = "waiting" | "preflop" | "flop" | "turn" | "river" | "showdown";
export type PlayerActionType = "fold" | "check" | "call" | "bet" | "raise" | "all-in";

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
  comparisonValues: number[];
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface SidePotResult extends SidePot {
  winnerPlayerIds: string[];
}

export interface GameResultWinner {
  playerId: string;
  evaluation: HandEvaluation | null;
  amountWon: number;
}

export interface GameResultEntry {
  playerId: string;
  evaluation: HandEvaluation | null;
  hand: DeckCard[];
  amountWon: number;
  finalStack: number;
  folded: boolean;
}

export interface GameResultSummary {
  isDraw: boolean;
  winners: GameResultWinner[];
  results: GameResultEntry[];
  finalBoard: DeckCard[];
  sidePots: SidePotResult[];
}

export interface PlayerPositionMap {
  dealer: string | null;
  smallBlind: string | null;
  bigBlind: string | null;
}

export interface RoomSnapshot {
  roomId: string;
  roomName: string;
  phase: RoomPhase;
  players: PublicPlayerState[];
  playerCount: number;
  selectedIndustries: string[];
  deckCount: number;
  board: DeckCard[];
  boardRevealCount: number;
  results: GameResultSummary | null;
  createdAt: string;
  pot: number;
  sidePots: SidePot[];
  currentBet: number;
  currentTurnPlayerId: string | null;
  positions: PlayerPositionMap;
}

export interface PlayerRoomState {
  room: RoomSnapshot;
  selfPlayerId: string;
  hand: DeckCard[];
  board: DeckCard[];
  results: GameResultSummary | null;
  myStack: number;
  currentBet: number;
  toCall: number;
  positions: PlayerPositionMap;
  availableActions: PlayerActionType[];
  pot: number;
  sidePots: SidePot[];
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

interface GameStartedEvent {
  type: "game_started";
  roomId: string;
  phase: RoomPhase;
  selectedIndustries: string[];
  playerCount: number;
}

interface ActionAppliedEvent {
  type: "action_applied";
  actorPlayerId: string;
  action: PlayerActionType;
  amount: number | null;
  phase: RoomPhase;
  room: RoomSnapshot;
}

interface PhaseAdvancedEvent {
  type: "phase_advanced";
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
  | ActionAppliedEvent
  | PhaseAdvancedEvent
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
      type: "player_action";
      action: PlayerActionType;
      amount?: number;
    }
  | {
      type: "ping";
    };

export type ConnectionStatus = "idle" | "loading" | "connecting" | "connected" | "disconnected" | "error";
