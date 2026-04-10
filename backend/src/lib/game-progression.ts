import type { DeckCard } from "./deck";
import { compareHands, type HandEvaluation } from "./hand-evaluation";

export interface PlayerState {
  playerId: string;
  name: string;
  joinedAt: string;
  connected: boolean;
}

export type FinalStandingStatus = "active" | "busted" | "left" | "disconnected";
export type GameOverReason = "player_busted" | "insufficient_players";

export interface FinalStanding {
  rank: number;
  playerId: string;
  name: string;
  finalStack: number;
  status: FinalStandingStatus;
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
  hasLeft: boolean;
  isEliminated: boolean;
}

export type RoomPhase = "waiting" | "preflop" | "flop" | "turn" | "river" | "showdown" | "between_hands";
export type PlayerActionType = "fold" | "check" | "call" | "bet" | "raise" | "all-in";

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

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface SidePotResult extends SidePot {
  winnerPlayerIds: string[];
}

export interface MainPot extends SidePot {}

export interface MainPotResult extends SidePotResult {}

export interface GameResultSummary {
  isDraw: boolean;
  winners: GameResultWinner[];
  results: GameResultEntry[];
  finalBoard: DeckCard[];
  mainPot: MainPotResult | null;
  sidePots: SidePotResult[];
}

export interface ActionState {
  playersToAct: string[];
}

export interface PlayerPositionMap {
  dealer: string | null;
  smallBlind: string | null;
  bigBlind: string | null;
}

interface HandPositions {
  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
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
  stacks: Record<string, number>;
  contributions: Record<string, number>;
  currentBets: Record<string, number>;
  pot: number;
  sidePots: SidePot[];
  foldedPlayerIds: string[];
  allInPlayerIds: string[];
  dealerIndex: number | null;
  smallBlindIndex: number | null;
  bigBlindIndex: number | null;
  currentTurnPlayerId: string | null;
  currentBet: number;
  minRaise: number;
  lastAggressorPlayerId: string | null;
  availableActions: Record<string, PlayerActionType[]>;
  actionState: ActionState;
  leftPlayerIds: string[];
  disconnectedPlayerIds: string[];
  gameEnded: boolean;
  gameOverReason: GameOverReason | null;
  finalStandings: FinalStanding[];
  readyPlayerIds: string[];
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
  mainPot: MainPot | null;
  sidePots: SidePot[];
  currentBet: number;
  currentTurnPlayerId: string | null;
  positions: PlayerPositionMap;
  gameEnded: boolean;
  gameOverReason: GameOverReason | null;
  finalStandings: FinalStanding[];
  readyPlayerIds: string[];
  requiredReadyCount: number;
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
  mainPot: MainPot | null;
  sidePots: SidePot[];
  gameEnded: boolean;
  gameOverReason: GameOverReason | null;
  finalStandings: FinalStanding[];
  readyPlayerIds: string[];
  requiredReadyCount: number;
}

export interface PlayerActionInput {
  playerId: string;
  action: PlayerActionType;
  amount?: number;
}

const HANDS_PER_PLAYER = 2;
const BOARD_CARD_COUNT = 5;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
const INITIAL_STACK = 200;
const SMALL_BLIND = 1;
const BIG_BLIND = 2;

function createEmptyMap(players: PlayerState[], initialValue: number): Record<string, number> {
  return Object.fromEntries(players.map((player) => [player.playerId, initialValue]));
}

function cloneState(state: RoomState): RoomState {
  return {
    ...state,
    players: state.players.map((player) => ({ ...player })),
    deck: [...state.deck],
    selectedIndustries: [...state.selectedIndustries],
    handsByPlayer: Object.fromEntries(
      Object.entries(state.handsByPlayer).map(([playerId, cards]) => [playerId, [...cards]]),
    ),
    board: [...state.board],
    results: state.results
      ? {
          ...state.results,
          winners: state.results.winners.map((winner) => ({ ...winner })),
          results: state.results.results.map((result) => ({ ...result, hand: [...result.hand] })),
          finalBoard: [...state.results.finalBoard],
          mainPot: state.results.mainPot
            ? {
                ...state.results.mainPot,
                eligiblePlayerIds: [...state.results.mainPot.eligiblePlayerIds],
                winnerPlayerIds: [...state.results.mainPot.winnerPlayerIds],
              }
            : null,
          sidePots: state.results.sidePots.map((pot) => ({
            ...pot,
            eligiblePlayerIds: [...pot.eligiblePlayerIds],
            winnerPlayerIds: [...pot.winnerPlayerIds],
          })),
        }
      : null,
    stacks: { ...state.stacks },
    contributions: { ...state.contributions },
    currentBets: { ...state.currentBets },
    sidePots: state.sidePots.map((pot) => ({ ...pot, eligiblePlayerIds: [...pot.eligiblePlayerIds] })),
    foldedPlayerIds: [...state.foldedPlayerIds],
    allInPlayerIds: [...state.allInPlayerIds],
    leftPlayerIds: [...state.leftPlayerIds],
    disconnectedPlayerIds: [...state.disconnectedPlayerIds],
    availableActions: Object.fromEntries(
      Object.entries(state.availableActions).map(([playerId, actions]) => [playerId, [...actions]]),
    ),
    actionState: {
      playersToAct: [...state.actionState.playersToAct],
    },
    gameEnded: state.gameEnded,
    gameOverReason: state.gameOverReason,
    finalStandings: state.finalStandings.map((standing) => ({ ...standing })),
    readyPlayerIds: [...state.readyPlayerIds],
  };
}

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
    case "between_hands":
      return 5;
  }
}

function getPlayerIndex(state: RoomState, playerId: string): number {
  return state.players.findIndex((player) => player.playerId === playerId);
}

function getActivePlayerIds(state: RoomState): string[] {
  return state.players
    .map((player) => player.playerId)
    .filter((playerId) => !state.foldedPlayerIds.includes(playerId) && !hasPlayerExited(state, playerId));
}

function getActiveNonAllInPlayerIds(state: RoomState): string[] {
  return getActivePlayerIds(state).filter((playerId) => !state.allInPlayerIds.includes(playerId));
}

function getOrderedActivePlayerIds(state: RoomState, startIndex: number): string[] {
  const ordered: string[] = [];

  for (let offset = 0; offset < state.players.length; offset += 1) {
    const player = state.players[(startIndex + offset) % state.players.length];

    if (
      player &&
      !state.foldedPlayerIds.includes(player.playerId) &&
      !state.allInPlayerIds.includes(player.playerId) &&
      !hasPlayerExited(state, player.playerId)
    ) {
      ordered.push(player.playerId);
    }
  }

  return ordered;
}

function getNextIndex(playerCount: number, currentIndex: number): number {
  return (currentIndex + 1) % playerCount;
}

function getNextDealerIndex(state: RoomState): number {
  if (state.phase === "waiting" || state.dealerIndex === null) {
    return 0;
  }

  return getNextIndex(state.players.length, state.dealerIndex);
}

function getHandPositions(state: RoomState): HandPositions {
  const dealerIndex = getNextDealerIndex(state);
  const smallBlindIndex = state.players.length === 2 ? dealerIndex : getNextIndex(state.players.length, dealerIndex);
  const bigBlindIndex = getNextIndex(state.players.length, smallBlindIndex);

  return {
    dealerIndex,
    smallBlindIndex,
    bigBlindIndex,
  };
}

function getPositions(state: RoomState): PlayerPositionMap {
  return {
    dealer: state.dealerIndex === null ? null : state.players[state.dealerIndex]?.playerId ?? null,
    smallBlind: state.smallBlindIndex === null ? null : state.players[state.smallBlindIndex]?.playerId ?? null,
    bigBlind: state.bigBlindIndex === null ? null : state.players[state.bigBlindIndex]?.playerId ?? null,
  };
}

function getVisibleBoard(state: RoomState): DeckCard[] {
  if (state.phase === "between_hands") {
    return state.results?.finalBoard ?? [];
  }

  return state.board.slice(0, state.boardRevealCount);
}

function getVisibleHand(state: RoomState, playerId: string): DeckCard[] {
  if (state.phase === "between_hands") {
    return state.results?.results.find((result) => result.playerId === playerId)?.hand ?? [];
  }

  return state.handsByPlayer[playerId] ?? [];
}

function hasPlayerLeft(state: RoomState, playerId: string): boolean {
  return state.leftPlayerIds.includes(playerId);
}

function hasPlayerDisconnected(state: RoomState, playerId: string): boolean {
  return state.disconnectedPlayerIds.includes(playerId);
}

function hasPlayerExited(state: RoomState, playerId: string): boolean {
  return hasPlayerLeft(state, playerId) || hasPlayerDisconnected(state, playerId);
}

function isPlayerEliminated(state: RoomState, playerId: string): boolean {
  return (state.stacks[playerId] ?? 0) <= 0;
}

function getContinuingPlayerIds(state: RoomState): string[] {
  return state.players
    .map((player) => player.playerId)
    .filter((playerId) => !hasPlayerExited(state, playerId) && (state.stacks[playerId] ?? 0) > 0);
}

function getRequiredReadyCount(state: RoomState): number {
  const continuingPlayerCount = getContinuingPlayerIds(state).length;

  if (continuingPlayerCount < MIN_PLAYERS) {
    return 0;
  }

  return Math.floor(continuingPlayerCount / 2) + 1;
}

function getFinalStandingStatus(state: RoomState, playerId: string): FinalStandingStatus {
  if (hasPlayerDisconnected(state, playerId)) {
    return "disconnected";
  }

  if (hasPlayerLeft(state, playerId)) {
    return "left";
  }

  if (isPlayerEliminated(state, playerId)) {
    return "busted";
  }

  return "active";
}

function buildFinalStandings(state: RoomState): FinalStanding[] {
  return state.players
    .map((player, index) => {
      const status = getFinalStandingStatus(state, player.playerId);
      const finalStack = status === "left" || status === "disconnected" ? 0 : state.stacks[player.playerId] ?? 0;

      return {
        index,
        rank: 0,
        playerId: player.playerId,
        name: player.name,
        finalStack,
        status,
      };
    })
    .sort((left, right) => {
      if (right.finalStack !== left.finalStack) {
        return right.finalStack - left.finalStack;
      }

      return left.index - right.index;
    })
    .map((standing, index) => ({
      rank: index + 1,
      playerId: standing.playerId,
      name: standing.name,
      finalStack: standing.finalStack,
      status: standing.status,
    }));
}

function getPlayerPosition(state: RoomState, playerId: string): PublicPlayerPosition {
  if (state.dealerIndex !== null && state.players[state.dealerIndex]?.playerId === playerId) {
    return "dealer";
  }

  if (state.smallBlindIndex !== null && state.players[state.smallBlindIndex]?.playerId === playerId) {
    return "small_blind";
  }

  if (state.bigBlindIndex !== null && state.players[state.bigBlindIndex]?.playerId === playerId) {
    return "big_blind";
  }

  return null;
}

function createPublicPlayerState(state: RoomState, player: PlayerState): PublicPlayerState {
  return {
    ...player,
    stack: state.stacks[player.playerId] ?? INITIAL_STACK,
    currentBet: state.currentBets[player.playerId] ?? 0,
    totalContribution: state.contributions[player.playerId] ?? 0,
    isFolded: state.foldedPlayerIds.includes(player.playerId),
    isAllIn: state.allInPlayerIds.includes(player.playerId),
    isCurrentTurn: state.currentTurnPlayerId === player.playerId,
    position: getPlayerPosition(state, player.playerId),
    hasLeft: hasPlayerExited(state, player.playerId),
    isEliminated: isPlayerEliminated(state, player.playerId),
  };
}

function getToCall(state: RoomState, playerId: string): number {
  return Math.max(0, state.currentBet - (state.currentBets[playerId] ?? 0));
}

function recomputeSidePots(contributions: Record<string, number>, foldedPlayerIds: string[]): SidePot[] {
  const uniqueLevels = [...new Set(Object.values(contributions).filter((amount) => amount > 0))].sort((left, right) => left - right);
  const sidePots: SidePot[] = [];
  let previousLevel = 0;

  for (const level of uniqueLevels) {
    const contributors = Object.entries(contributions)
      .filter(([, amount]) => amount >= level)
      .map(([playerId]) => playerId);
    const eligiblePlayerIds = contributors.filter((playerId) => !foldedPlayerIds.includes(playerId));
    const amount = (level - previousLevel) * contributors.length;

    if (amount > 0) {
      sidePots.push({
        amount,
        eligiblePlayerIds,
      });
    }

    previousLevel = level;
  }

  return sidePots;
}

function splitMainAndSidePots<T extends SidePot>(pots: T[]): { mainPot: T | null; sidePots: T[] } {
  const [mainPot, ...sidePots] = pots;

  return {
    mainPot: mainPot ?? null,
    sidePots,
  };
}

function commitChips(state: RoomState, playerId: string, amount: number): number {
  const stack = state.stacks[playerId] ?? 0;
  const committed = Math.min(stack, amount);

  state.stacks[playerId] = stack - committed;
  state.contributions[playerId] = (state.contributions[playerId] ?? 0) + committed;
  state.currentBets[playerId] = (state.currentBets[playerId] ?? 0) + committed;
  state.pot += committed;

  if (state.stacks[playerId] === 0 && !state.allInPlayerIds.includes(playerId)) {
    state.allInPlayerIds.push(playerId);
  }

  state.sidePots = recomputeSidePots(state.contributions, state.foldedPlayerIds);
  return committed;
}

function getAvailableActionsForPlayer(state: RoomState, playerId: string): PlayerActionType[] {
  if (state.phase === "waiting" || state.phase === "showdown" || state.phase === "between_hands") {
    return [];
  }

  if (state.currentTurnPlayerId !== playerId) {
    return [];
  }

  if (state.foldedPlayerIds.includes(playerId) || state.allInPlayerIds.includes(playerId)) {
    return [];
  }

  const stack = state.stacks[playerId] ?? 0;
  const toCall = getToCall(state, playerId);
  const actions: PlayerActionType[] = ["fold"];

  if (toCall === 0) {
    actions.push("check");

    if (stack > 0) {
      actions.push("bet", "all-in");
    }

    return actions;
  }

  if (stack > 0) {
    actions.push("call", "all-in");

    if (stack + (state.currentBets[playerId] ?? 0) > state.currentBet) {
      actions.push("raise");
    }
  }

  return actions;
}

function updateAvailableActions(state: RoomState): void {
  state.currentTurnPlayerId = state.actionState.playersToAct[0] ?? null;
  state.availableActions = Object.fromEntries(
    state.players.map((player) => [player.playerId, getAvailableActionsForPlayer(state, player.playerId)]),
  );
}

function createBetweenHandsState(state: RoomState): RoomState {
  const nextState = cloneState(state);

  nextState.phase = "between_hands";
  nextState.deck = [];
  nextState.selectedIndustries = [];
  nextState.handsByPlayer = {};
  nextState.board = [];
  nextState.boardRevealCount = 0;
  nextState.contributions = createEmptyMap(nextState.players, 0);
  nextState.currentBets = createEmptyMap(nextState.players, 0);
  nextState.pot = 0;
  nextState.sidePots = [];
  nextState.foldedPlayerIds = [];
  nextState.allInPlayerIds = [];
  nextState.currentTurnPlayerId = null;
  nextState.currentBet = 0;
  nextState.minRaise = BIG_BLIND;
  nextState.lastAggressorPlayerId = null;
  nextState.readyPlayerIds = [];
  nextState.availableActions = Object.fromEntries(nextState.players.map((player) => [player.playerId, []]));
  nextState.actionState = { playersToAct: [] };

  return nextState;
}

function createGameOverState(state: RoomState, reason: GameOverReason): RoomState {
  const nextState = cloneState(state);

  nextState.gameEnded = true;
  nextState.gameOverReason = reason;
  nextState.finalStandings = buildFinalStandings(nextState);

  return nextState;
}

export function maybeFinalizeGame(state: RoomState): RoomState {
  if (state.gameEnded) {
    return state;
  }

  if (state.phase === "between_hands") {
    const bustedPlayerExists = state.players.some((player) => !hasPlayerExited(state, player.playerId) && isPlayerEliminated(state, player.playerId));

    if (bustedPlayerExists) {
      return createGameOverState(state, "player_busted");
    }

    if (getContinuingPlayerIds(state).length < MIN_PLAYERS) {
      return createGameOverState(state, "insufficient_players");
    }
  }

  return state;
}

export function acknowledgeGameOver(state: RoomState): RoomState {
  const nextPlayers = state.players
    .filter((player) => !hasPlayerExited(state, player.playerId))
    .map((player) => ({
      ...player,
      connected: true,
    }));

  return {
    ...state,
    players: nextPlayers,
    phase: "waiting",
    deck: [],
    selectedIndustries: [],
    handsByPlayer: {},
    board: [],
    boardRevealCount: 0,
    results: null,
    stacks: {},
    contributions: {},
    currentBets: {},
    pot: 0,
    sidePots: [],
    foldedPlayerIds: [],
    allInPlayerIds: [],
    dealerIndex: null,
    smallBlindIndex: null,
    bigBlindIndex: null,
    currentTurnPlayerId: null,
    currentBet: 0,
    minRaise: BIG_BLIND,
    lastAggressorPlayerId: null,
    availableActions: {},
    actionState: { playersToAct: [] },
    leftPlayerIds: [],
    disconnectedPlayerIds: [],
    gameEnded: false,
    gameOverReason: null,
    finalStandings: [],
    readyPlayerIds: [],
  };
}

export function setPlayerReady(state: RoomState, playerId: string, ready: boolean): RoomState {
  if (state.phase !== "between_hands") {
    throw new Error("Ready state can only be changed between hands.");
  }

  if (state.gameEnded) {
    throw new Error("Cannot change ready state after the game has ended.");
  }

  if (!getContinuingPlayerIds(state).includes(playerId)) {
    throw new Error("Only continuing players can change ready state.");
  }

  const nextState = cloneState(state);
  nextState.readyPlayerIds = nextState.readyPlayerIds.filter((candidate) => candidate !== playerId);

  if (ready) {
    nextState.readyPlayerIds.push(playerId);
  }

  return nextState;
}

export function isReadyThresholdMet(state: RoomState): boolean {
  const requiredReadyCount = getRequiredReadyCount(state);
  return requiredReadyCount > 0 && state.readyPlayerIds.length >= requiredReadyCount;
}

export function removePlayerFromGame(state: RoomState, playerId: string, reason: "left" | "disconnected"): RoomState {
  const nextState = cloneState(state);
  nextState.readyPlayerIds = nextState.readyPlayerIds.filter((candidate) => candidate !== playerId);

  if (reason === "left" && !nextState.leftPlayerIds.includes(playerId)) {
    nextState.leftPlayerIds.push(playerId);
  }

  if (reason === "disconnected" && !nextState.disconnectedPlayerIds.includes(playerId)) {
    nextState.disconnectedPlayerIds.push(playerId);
  }

  if (nextState.phase === "waiting" || nextState.phase === "between_hands") {
    updateAvailableActions(nextState);
    return nextState;
  }

  if (!nextState.foldedPlayerIds.includes(playerId)) {
    nextState.foldedPlayerIds.push(playerId);
  }

  nextState.actionState.playersToAct = nextState.actionState.playersToAct.filter((candidate) => candidate !== playerId);

  if (getActivePlayerIds(nextState).length === 1) {
    return settleUncontestedWin(nextState, getActivePlayerIds(nextState)[0] as string);
  }

  if (nextState.actionState.playersToAct.length === 0) {
    return advanceAfterCompletedRound(nextState);
  }

  updateAvailableActions(nextState);
  return nextState;
}

function initializeBettingRound(state: RoomState, phase: Exclude<RoomPhase, "waiting" | "showdown">): RoomState {
  state.phase = phase;
  state.boardRevealCount = boardRevealCountForPhase(phase);
  state.currentBets = createEmptyMap(state.players, 0);
  state.currentBet = 0;
  state.minRaise = BIG_BLIND;
  state.lastAggressorPlayerId = null;

  const dealerIndex = state.dealerIndex ?? 0;
  const startIndex = getNextIndex(state.players.length, dealerIndex);
  state.actionState = {
    playersToAct: getOrderedActivePlayerIds(state, startIndex),
  };
  updateAvailableActions(state);
  return state;
}

function settleUncontestedWin(state: RoomState, winnerPlayerId: string): RoomState {
  const nextState = cloneState(state);
  nextState.phase = "showdown";
  nextState.boardRevealCount = 5;
  nextState.sidePots = recomputeSidePots(nextState.contributions, nextState.foldedPlayerIds);
  nextState.stacks[winnerPlayerId] = (nextState.stacks[winnerPlayerId] ?? 0) + nextState.pot;
  const potResults = nextState.sidePots.map((pot) => ({
    ...pot,
    winnerPlayerIds: [winnerPlayerId],
    eligiblePlayerIds: [...pot.eligiblePlayerIds],
  }));
  const { mainPot, sidePots } = splitMainAndSidePots(potResults);

  nextState.results = {
    isDraw: false,
    winners: [
      {
        playerId: winnerPlayerId,
        evaluation: null,
        amountWon: nextState.pot,
      },
    ],
    results: nextState.players.map((player) => ({
      playerId: player.playerId,
      evaluation: null,
      hand: nextState.handsByPlayer[player.playerId] ?? [],
      amountWon: player.playerId === winnerPlayerId ? nextState.pot : 0,
      finalStack: nextState.stacks[player.playerId] ?? 0,
      folded: nextState.foldedPlayerIds.includes(player.playerId),
    })),
    finalBoard: nextState.board,
    mainPot,
    sidePots,
  };

  return createBetweenHandsState(nextState);
}

function settleShowdown(state: RoomState): RoomState {
  const nextState = cloneState(state);
  nextState.phase = "showdown";
  nextState.boardRevealCount = 5;
  nextState.sidePots = recomputeSidePots(nextState.contributions, nextState.foldedPlayerIds);

  const handEntries = nextState.players
    .filter((player) => !nextState.foldedPlayerIds.includes(player.playerId))
    .map((player) => ({
      playerId: player.playerId,
      cards: [...(nextState.handsByPlayer[player.playerId] ?? []), ...nextState.board],
    }));

  const comparisons = compareHands(handEntries);
  const evaluationByPlayerId = new Map(comparisons.results.map((result) => [result.playerId, result.evaluation]));
  const winnings = Object.fromEntries(nextState.players.map((player) => [player.playerId, 0]));
  const sidePotResults: SidePotResult[] = [];

  for (const sidePot of nextState.sidePots) {
    const eligibleEntries = handEntries.filter((entry) => sidePot.eligiblePlayerIds.includes(entry.playerId));
    const result = compareHands(eligibleEntries);
    const splitAmount = Math.floor(sidePot.amount / result.winners.length);
    let remainder = sidePot.amount % result.winners.length;

    for (const winner of result.winners) {
      winnings[winner.playerId] = (winnings[winner.playerId] ?? 0) + splitAmount;
    }

    const orderedWinners = result.winners
      .map((winner) => winner.playerId)
      .sort((left, right) => getPlayerIndex(nextState, left) - getPlayerIndex(nextState, right));

    for (const playerId of orderedWinners) {
      if (remainder === 0) {
        break;
      }

      winnings[playerId] = (winnings[playerId] ?? 0) + 1;
      remainder -= 1;
    }

    sidePotResults.push({
      amount: sidePot.amount,
      eligiblePlayerIds: [...sidePot.eligiblePlayerIds],
      winnerPlayerIds: orderedWinners,
    });
  }

  for (const player of nextState.players) {
    nextState.stacks[player.playerId] = (nextState.stacks[player.playerId] ?? 0) + (winnings[player.playerId] ?? 0);
  }

  const winnerIds = nextState.players
    .map((player) => player.playerId)
    .filter((playerId) => (winnings[playerId] ?? 0) > 0);
  const { mainPot, sidePots } = splitMainAndSidePots(sidePotResults);

  nextState.results = {
    isDraw: winnerIds.length > 1,
    winners: winnerIds.map((playerId) => ({
      playerId,
      evaluation: evaluationByPlayerId.get(playerId) ?? null,
      amountWon: winnings[playerId] ?? 0,
    })),
    results: nextState.players.map((player) => ({
      playerId: player.playerId,
      evaluation: evaluationByPlayerId.get(player.playerId) ?? null,
      hand: nextState.handsByPlayer[player.playerId] ?? [],
      amountWon: winnings[player.playerId] ?? 0,
      finalStack: nextState.stacks[player.playerId] ?? 0,
      folded: nextState.foldedPlayerIds.includes(player.playerId),
    })),
    finalBoard: nextState.board,
    mainPot,
    sidePots,
  };

  return createBetweenHandsState(nextState);
}

function advanceAfterCompletedRound(state: RoomState): RoomState {
  if (getActivePlayerIds(state).length === 1) {
    return settleUncontestedWin(state, getActivePlayerIds(state)[0] as string);
  }

  if (getActiveNonAllInPlayerIds(state).length <= 1) {
    return settleShowdown(state);
  }

  switch (state.phase) {
    case "preflop":
      return initializeBettingRound(cloneState(state), "flop");
    case "flop":
      return initializeBettingRound(cloneState(state), "turn");
    case "turn":
      return initializeBettingRound(cloneState(state), "river");
    case "river":
      return settleShowdown(state);
    default:
      throw new Error(`Cannot advance from phase=${state.phase}.`);
  }
}

function updatePlayersToActAfterPassiveAction(state: RoomState, playerId: string): void {
  state.actionState.playersToAct = state.actionState.playersToAct.filter((candidate) => candidate !== playerId);
}

function updatePlayersToActAfterAggression(state: RoomState, playerId: string): void {
  const actorIndex = getPlayerIndex(state, playerId);
  const ordered = getOrderedActivePlayerIds(state, getNextIndex(state.players.length, actorIndex));
  state.actionState.playersToAct = ordered;
}

function assertAmountProvided(amount: number | undefined, action: "bet" | "raise"): number {
  if (!Number.isInteger(amount) || (amount ?? 0) <= 0) {
    throw new Error(`${action} requires a positive integer amount.`);
  }

  return amount as number;
}

function assertPlayerTurn(state: RoomState, playerId: string): void {
  if (state.currentTurnPlayerId !== playerId) {
    throw new Error("It is not this player's turn.");
  }
}

function assertPlayerCanAct(state: RoomState, playerId: string): void {
  if (state.foldedPlayerIds.includes(playerId)) {
    throw new Error("Folded player cannot act.");
  }

  if (state.allInPlayerIds.includes(playerId)) {
    throw new Error("All-in player cannot act.");
  }
}

export function createRoomSnapshot(state: RoomState): RoomSnapshot {
  const { mainPot, sidePots } = splitMainAndSidePots(state.sidePots);
  const visibleBoard = getVisibleBoard(state);

  return {
    roomId: state.roomId,
    roomName: state.roomName,
    phase: state.phase,
    players: state.players.map((player) => createPublicPlayerState(state, player)),
    playerCount: state.players.length,
    selectedIndustries: state.selectedIndustries,
    deckCount: state.deck.length,
    board: visibleBoard,
    boardRevealCount: visibleBoard.length,
    results: state.results,
    createdAt: state.createdAt,
    pot: state.pot,
    mainPot,
    sidePots,
    currentBet: state.currentBet,
    currentTurnPlayerId: state.currentTurnPlayerId,
    positions: getPositions(state),
    gameEnded: state.gameEnded,
    gameOverReason: state.gameOverReason,
    finalStandings: state.finalStandings,
    readyPlayerIds: state.readyPlayerIds,
    requiredReadyCount: getRequiredReadyCount(state),
  };
}

export function createPlayerRoomState(state: RoomState, playerId: string): PlayerRoomState {
  const { mainPot, sidePots } = splitMainAndSidePots(state.sidePots);
  const visibleBoard = getVisibleBoard(state);

  return {
    room: createRoomSnapshot(state),
    selfPlayerId: playerId,
    hand: getVisibleHand(state, playerId),
    board: visibleBoard,
    results: state.results,
    myStack: state.stacks[playerId] ?? INITIAL_STACK,
    currentBet: state.currentBets[playerId] ?? 0,
    toCall: getToCall(state, playerId),
    positions: getPositions(state),
    availableActions: state.availableActions[playerId] ?? [],
    pot: state.pot,
    mainPot,
    sidePots,
    gameEnded: state.gameEnded,
    gameOverReason: state.gameOverReason,
    finalStandings: state.finalStandings,
    readyPlayerIds: state.readyPlayerIds,
    requiredReadyCount: getRequiredReadyCount(state),
  };
}

export function createStartedRoomState(state: RoomState): RoomState {
  if (state.phase !== "waiting" && state.phase !== "between_hands") {
    throw new Error("Cannot start a new hand from the current phase.");
  }

  validateStartablePlayers(state.players);

  const { handsByPlayer, board } = dealCards(state.deck, state.players);
  const stacks = Object.fromEntries(state.players.map((player) => [player.playerId, state.stacks[player.playerId] ?? INITIAL_STACK]));
  const contributions = createEmptyMap(state.players, 0);
  const currentBets = createEmptyMap(state.players, 0);
  const { dealerIndex, smallBlindIndex, bigBlindIndex } = getHandPositions(state);

  const nextState: RoomState = {
    ...state,
    phase: "preflop",
    handsByPlayer,
    board,
    boardRevealCount: 0,
    results: null,
    stacks,
    contributions,
    currentBets,
    pot: 0,
    sidePots: [],
    foldedPlayerIds: [],
    allInPlayerIds: [],
    dealerIndex,
    smallBlindIndex,
    bigBlindIndex,
    currentTurnPlayerId: null,
    currentBet: 0,
    minRaise: BIG_BLIND,
    lastAggressorPlayerId: null,
    availableActions: {},
    actionState: { playersToAct: [] },
    gameEnded: false,
    gameOverReason: null,
    finalStandings: [],
    readyPlayerIds: [],
  };

  const smallBlindPlayerId = nextState.players[smallBlindIndex]?.playerId;
  const bigBlindPlayerId = nextState.players[bigBlindIndex]?.playerId;

  if (!smallBlindPlayerId || !bigBlindPlayerId) {
    throw new Error("Failed to assign blind positions.");
  }

  commitChips(nextState, smallBlindPlayerId, SMALL_BLIND);
  commitChips(nextState, bigBlindPlayerId, BIG_BLIND);
  nextState.currentBet = nextState.currentBets[bigBlindPlayerId] ?? BIG_BLIND;
  nextState.lastAggressorPlayerId = bigBlindPlayerId;

  const firstToActIndex = getNextIndex(nextState.players.length, bigBlindIndex);
  nextState.actionState.playersToAct = getOrderedActivePlayerIds(nextState, firstToActIndex);
  updateAvailableActions(nextState);
  return nextState;
}

export function advanceRoomState(state: RoomState): RoomState {
  if (state.phase === "waiting" || state.phase === "showdown" || state.phase === "between_hands") {
    throw new Error(`Cannot advance from phase=${state.phase}.`);
  }

  if (state.actionState.playersToAct.length > 0) {
    throw new Error("Cannot advance while players still need to act.");
  }

  return advanceAfterCompletedRound(state);
}

export function applyPlayerAction(state: RoomState, input: PlayerActionInput): RoomState {
  if (state.phase === "waiting" || state.phase === "showdown" || state.phase === "between_hands") {
    throw new Error("Player actions are only allowed during an active hand.");
  }

  const nextState = cloneState(state);
  const { playerId, action } = input;
  const playerExists = nextState.players.some((player) => player.playerId === playerId);

  if (!playerExists) {
    throw new Error("Player is not part of this room.");
  }

  assertPlayerTurn(nextState, playerId);
  assertPlayerCanAct(nextState, playerId);

  const stack = nextState.stacks[playerId] ?? 0;
  const playerBet = nextState.currentBets[playerId] ?? 0;
  const toCall = getToCall(nextState, playerId);

  switch (action) {
    case "fold":
      nextState.foldedPlayerIds.push(playerId);
      updatePlayersToActAfterPassiveAction(nextState, playerId);
      break;
    case "check":
      if (toCall !== 0) {
        throw new Error("Cannot check when there is an outstanding bet.");
      }

      updatePlayersToActAfterPassiveAction(nextState, playerId);
      break;
    case "call": {
      if (toCall <= 0) {
        throw new Error("Cannot call when there is nothing to call.");
      }

      commitChips(nextState, playerId, toCall);
      updatePlayersToActAfterPassiveAction(nextState, playerId);
      break;
    }
    case "bet": {
      if (nextState.currentBet !== 0) {
        throw new Error("Cannot bet after betting has already started. Use raise instead.");
      }

      const amount = assertAmountProvided(input.amount, "bet");

      if (amount < BIG_BLIND) {
        throw new Error(`Bet must be at least ${BIG_BLIND}.`);
      }

      if (amount >= stack) {
        commitChips(nextState, playerId, stack);
        nextState.currentBet = (nextState.currentBets[playerId] ?? 0);
      } else {
        commitChips(nextState, playerId, amount);
        nextState.currentBet = amount;
        nextState.minRaise = amount;
      }

      nextState.lastAggressorPlayerId = playerId;
      updatePlayersToActAfterAggression(nextState, playerId);
      break;
    }
    case "raise": {
      if (toCall <= 0) {
        throw new Error("Cannot raise when there is nothing to call.");
      }

      const targetBet = assertAmountProvided(input.amount, "raise");

      if (targetBet <= nextState.currentBet) {
        throw new Error("Raise amount must exceed the current bet.");
      }

      const requiredCommit = targetBet - playerBet;

      if (requiredCommit >= stack) {
        const committed = commitChips(nextState, playerId, stack);
        const newBet = playerBet + committed;
        const raiseSize = newBet - nextState.currentBet;

        if (newBet <= nextState.currentBet) {
          throw new Error("All-in raise must exceed the current bet.");
        }

        if (raiseSize >= nextState.minRaise) {
          nextState.minRaise = raiseSize;
          nextState.currentBet = newBet;
          nextState.lastAggressorPlayerId = playerId;
          updatePlayersToActAfterAggression(nextState, playerId);
        } else {
          nextState.currentBet = newBet;
          updatePlayersToActAfterPassiveAction(nextState, playerId);
        }
      } else {
        const raiseSize = targetBet - nextState.currentBet;

        if (raiseSize < nextState.minRaise) {
          throw new Error(`Raise must increase the bet by at least ${nextState.minRaise}.`);
        }

        commitChips(nextState, playerId, requiredCommit);
        nextState.currentBet = targetBet;
        nextState.minRaise = raiseSize;
        nextState.lastAggressorPlayerId = playerId;
        updatePlayersToActAfterAggression(nextState, playerId);
      }

      break;
    }
    case "all-in": {
      if (stack <= 0) {
        throw new Error("Player has no chips left.");
      }

      const committed = commitChips(nextState, playerId, stack);
      const newBet = playerBet + committed;

      if (nextState.currentBet === 0) {
        if (newBet > 0) {
          const raiseSize = newBet;

          if (raiseSize >= BIG_BLIND) {
            nextState.currentBet = newBet;
            nextState.minRaise = raiseSize;
            nextState.lastAggressorPlayerId = playerId;
            updatePlayersToActAfterAggression(nextState, playerId);
          } else {
            updatePlayersToActAfterPassiveAction(nextState, playerId);
          }
        }
      } else if (newBet > nextState.currentBet) {
        const raiseSize = newBet - nextState.currentBet;
        nextState.currentBet = newBet;

        if (raiseSize >= nextState.minRaise) {
          nextState.minRaise = raiseSize;
          nextState.lastAggressorPlayerId = playerId;
          updatePlayersToActAfterAggression(nextState, playerId);
        } else {
          updatePlayersToActAfterPassiveAction(nextState, playerId);
        }
      } else {
        updatePlayersToActAfterPassiveAction(nextState, playerId);
      }

      break;
    }
  }

  if (getActivePlayerIds(nextState).length === 1) {
    return settleUncontestedWin(nextState, getActivePlayerIds(nextState)[0] as string);
  }

  if (nextState.actionState.playersToAct.length === 0) {
    return advanceAfterCompletedRound(nextState);
  }

  updateAvailableActions(nextState);
  return nextState;
}
