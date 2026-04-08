import type { DeckCard } from "./deck";
import { compareHands, type HandEvaluation } from "./hand-evaluation";

export interface PlayerState {
  playerId: string;
  name: string;
  joinedAt: string;
  connected: boolean;
}

export type RoomPhase = "waiting" | "preflop" | "flop" | "turn" | "river" | "showdown";

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

export interface RoomState {
  roomId: string;
  roomName: string;
  players: PlayerState[];
  phase: RoomPhase;
  deck: DeckCard[];
  selectedIndustries: string[];
  handsByPlayer: Record<string, DeckCard[]>;
  board: DeckCard[];
  boardRevealCount: number;
  results: GameResultSummary | null;
  createdAt: string;
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

const HANDS_PER_PLAYER = 2;
const BOARD_CARD_COUNT = 5;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;

function validateStartablePlayers(players: PlayerState[]): void {
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new Error("Game can start only with 2 to 6 players.");
  }
}

function dealCards(deck: DeckCard[], players: PlayerState[]): { handsByPlayer: Record<string, DeckCard[]>; board: DeckCard[] } {
  const requiredCards = players.length * HANDS_PER_PLAYER + BOARD_CARD_COUNT;

  if (deck.length < requiredCards) {
    throw new Error("Deck does not contain enough cards to start the game.");
  }

  const handsByPlayer: Record<string, DeckCard[]> = {};

  for (const player of players) {
    handsByPlayer[player.playerId] = [];
  }

  let nextCardIndex = 0;

  for (let round = 0; round < HANDS_PER_PLAYER; round += 1) {
    for (const player of players) {
      handsByPlayer[player.playerId]?.push(deck[nextCardIndex]);
      nextCardIndex += 1;
    }
  }

  return {
    handsByPlayer,
    board: deck.slice(nextCardIndex, nextCardIndex + BOARD_CARD_COUNT),
  };
}

function boardRevealCountForPhase(phase: RoomPhase): number {
  switch (phase) {
    case "waiting":
    case "preflop":
      return 0;
    case "flop":
      return 3;
    case "turn":
      return 4;
    case "river":
    case "showdown":
      return 5;
  }
}

function nextPhase(currentPhase: RoomPhase): RoomPhase {
  switch (currentPhase) {
    case "preflop":
      return "flop";
    case "flop":
      return "turn";
    case "turn":
      return "river";
    case "river":
      return "showdown";
    default:
      throw new Error(`Cannot advance from phase=${currentPhase}.`);
  }
}

export function getVisibleBoard(state: RoomState): DeckCard[] {
  return state.board.slice(0, state.boardRevealCount);
}

export function createRoomSnapshot(state: RoomState): RoomSnapshot {
  return {
    roomId: state.roomId,
    roomName: state.roomName,
    phase: state.phase,
    players: state.players,
    playerCount: state.players.length,
    selectedIndustries: state.selectedIndustries,
    deckCount: state.deck.length,
    board: getVisibleBoard(state),
    boardRevealCount: state.boardRevealCount,
    results: state.results,
    createdAt: state.createdAt,
  };
}

export function createPlayerRoomState(state: RoomState, playerId: string): PlayerRoomState {
  return {
    room: createRoomSnapshot(state),
    selfPlayerId: playerId,
    hand: state.handsByPlayer[playerId] ?? [],
    board: getVisibleBoard(state),
    results: state.results,
  };
}

export function createStartedRoomState(state: RoomState): RoomState {
  if (state.phase !== "waiting") {
    throw new Error("Game has already started.");
  }

  validateStartablePlayers(state.players);

  const { handsByPlayer, board } = dealCards(state.deck, state.players);

  return {
    ...state,
    phase: "preflop",
    handsByPlayer,
    board,
    boardRevealCount: boardRevealCountForPhase("preflop"),
    results: null,
  };
}

export function advanceRoomState(state: RoomState): RoomState {
  if (state.phase === "waiting" || state.phase === "showdown") {
    throw new Error(`Cannot advance from phase=${state.phase}.`);
  }

  const phase = nextPhase(state.phase);
  const boardRevealCount = boardRevealCountForPhase(phase);

  if (phase !== "showdown") {
    return {
      ...state,
      phase,
      boardRevealCount,
    };
  }

  const comparison = compareHands(
    state.players.map((player) => ({
      playerId: player.playerId,
      cards: [...(state.handsByPlayer[player.playerId] ?? []), ...state.board],
    })),
  );

  const handsByPlayer = state.handsByPlayer;
  const results: GameResultSummary = {
    isDraw: comparison.isDraw,
    winners: comparison.winners.map((winner) => ({
      playerId: winner.playerId,
      evaluation: winner.evaluation,
    })),
    results: comparison.results.map((result) => ({
      playerId: result.playerId,
      evaluation: result.evaluation,
      hand: handsByPlayer[result.playerId] ?? [],
    })),
    finalBoard: state.board,
  };

  return {
    ...state,
    phase,
    boardRevealCount,
    results,
  };
}
