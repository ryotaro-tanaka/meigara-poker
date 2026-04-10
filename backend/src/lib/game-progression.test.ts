import { describe, expect, it } from "vitest";

import type { DeckCard } from "./deck";
import {
  acknowledgeGameOver,
  applyPlayerAction,
  createPlayerRoomState,
  createRoomSnapshot,
  createStartedRoomState,
  maybeFinalizeGame,
  removePlayerFromGame,
  type PlayerState,
  type RoomState,
} from "./game-progression";

function card(suit: string, number: number, name = `${suit}-${number}`): DeckCard {
  return {
    edinetCode: `${suit}-${number}-${name}`,
    name,
    suit,
    number,
  };
}

function makePlayers(count: number): PlayerState[] {
  return Array.from({ length: count }, (_, index) => ({
    playerId: `player-${index + 1}`,
    name: `Player ${index + 1}`,
    joinedAt: `2026-04-08T00:00:0${index}Z`,
    connected: true,
  }));
}

function makeDeck(): DeckCard[] {
  return [
    card("情報・通信業", 9, "p1-1"),
    card("建設業", 8, "p2-1"),
    card("小売業", 0, "p3-1"),
    card("銀行業", 9, "p1-2"),
    card("情報・通信業", 1, "p2-2"),
    card("建設業", 5, "p3-2"),
    card("小売業", 9, "board-1"),
    card("銀行業", 8, "board-2"),
    card("情報・通信業", 7, "board-3"),
    card("建設業", 6, "board-4"),
    card("小売業", 5, "board-5"),
    card("銀行業", 4, "extra-1"),
    card("情報・通信業", 3, "extra-2"),
    card("建設業", 2, "extra-3"),
  ];
}

function makeWaitingState(players = makePlayers(3)): RoomState {
  return {
    roomId: "ROOM01",
    roomName: "Test Room",
    players,
    phase: "waiting",
    deck: makeDeck(),
    selectedIndustries: ["情報・通信業", "建設業", "小売業", "銀行業"],
    handsByPlayer: {},
    board: [],
    boardRevealCount: 0,
    results: null,
    createdAt: "2026-04-08T00:00:00.000Z",
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
    minRaise: 2,
    lastAggressorPlayerId: null,
    availableActions: {},
    actionState: { playersToAct: [] },
    leftPlayerIds: [],
    disconnectedPlayerIds: [],
    gameEnded: false,
    gameOverReason: null,
    finalStandings: [],
  };
}

describe("game progression", () => {
  it("deals 2 hole cards per player, assigns blinds, and starts preflop betting", () => {
    const started = createStartedRoomState(makeWaitingState(makePlayers(3)));

    expect(started.phase).toBe("preflop");
    expect(started.board).toHaveLength(5);
    expect(started.handsByPlayer["player-1"]).toHaveLength(2);
    expect(started.handsByPlayer["player-2"]).toHaveLength(2);
    expect(started.handsByPlayer["player-3"]).toHaveLength(2);
    expect(started.dealerIndex).toBe(0);
    expect(started.smallBlindIndex).toBe(1);
    expect(started.bigBlindIndex).toBe(2);
    expect(started.currentBet).toBe(2);
    expect(started.pot).toBe(3);
    expect(started.stacks["player-2"]).toBe(199);
    expect(started.stacks["player-3"]).toBe(198);
    expect(started.currentTurnPlayerId).toBe("player-1");
  });

  it("rejects game start outside the supported player count", () => {
    expect(() => createStartedRoomState(makeWaitingState(makePlayers(1)))).toThrow("Game can start only with 2 to 6 players.");
    expect(() => createStartedRoomState(makeWaitingState(makePlayers(7)))).toThrow("Game can start only with 2 to 6 players.");
  });

  it("builds a per-player room state that only exposes the caller hand and own actions", () => {
    const started = createStartedRoomState(makeWaitingState());
    const player1State = createPlayerRoomState(started, "player-1");
    const player2State = createPlayerRoomState(started, "player-2");

    expect(player1State.hand).toHaveLength(2);
    expect(player2State.hand).toHaveLength(2);
    expect(player1State.hand).not.toEqual(player2State.hand);
    expect(player1State.availableActions).toEqual(["fold", "call", "all-in", "raise"]);
    expect(player2State.availableActions).toEqual([]);
    expect(player1State.toCall).toBe(2);
  });

  it("advances betting rounds from preflop to river after actions complete", () => {
    let state = createStartedRoomState(makeWaitingState());

    state = applyPlayerAction(state, { playerId: "player-1", action: "call" });
    state = applyPlayerAction(state, { playerId: "player-2", action: "call" });
    state = applyPlayerAction(state, { playerId: "player-3", action: "check" });
    expect(state.phase).toBe("flop");
    expect(state.boardRevealCount).toBe(3);
    expect(state.currentTurnPlayerId).toBe("player-2");

    state = applyPlayerAction(state, { playerId: "player-2", action: "check" });
    state = applyPlayerAction(state, { playerId: "player-3", action: "check" });
    state = applyPlayerAction(state, { playerId: "player-1", action: "check" });
    expect(state.phase).toBe("turn");
    expect(state.boardRevealCount).toBe(4);

    state = applyPlayerAction(state, { playerId: "player-2", action: "check" });
    state = applyPlayerAction(state, { playerId: "player-3", action: "check" });
    state = applyPlayerAction(state, { playerId: "player-1", action: "check" });
    expect(state.phase).toBe("river");
    expect(state.boardRevealCount).toBe(5);
  });

  it.fails("keeps the big blind option on preflop after other players only call", () => {
    let state = createStartedRoomState(makeWaitingState());

    state = applyPlayerAction(state, { playerId: "player-1", action: "call" });
    state = applyPlayerAction(state, { playerId: "player-2", action: "call" });

    expect(state.phase).toBe("preflop");
    expect(state.currentTurnPlayerId).toBe("player-3");
    expect(state.availableActions["player-3"]).toEqual(["fold", "check", "raise", "all-in"]);
  });

  it("uses heads-up action order that matches holdem streets", () => {
    let state = createStartedRoomState(makeWaitingState(makePlayers(2)));

    expect(state.currentTurnPlayerId).toBe("player-1");

    state = applyPlayerAction(state, { playerId: "player-1", action: "call" });
    expect(state.currentTurnPlayerId).toBe("player-2");

    state = applyPlayerAction(state, { playerId: "player-2", action: "check" });
    expect(state.phase).toBe("flop");
    expect(state.currentTurnPlayerId).toBe("player-2");
  });

  it("rejects invalid turn order and invalid actions", () => {
    const started = createStartedRoomState(makeWaitingState());

    expect(() => applyPlayerAction(started, { playerId: "player-2", action: "call" })).toThrow("It is not this player's turn.");
    expect(() => applyPlayerAction(started, { playerId: "player-1", action: "check" })).toThrow(
      "Cannot check when there is an outstanding bet.",
    );
  });

  it("enforces the minimum raise size", () => {
    const started = createStartedRoomState(makeWaitingState());

    expect(() => applyPlayerAction(started, { playerId: "player-1", action: "raise", amount: 3 })).toThrow(
      "Raise must increase the bet by at least 2.",
    );
  });

  it("tracks bets, pot, turn order, and side pots after raises and all-in", () => {
    let state = createStartedRoomState(makeWaitingState());

    state = applyPlayerAction(state, { playerId: "player-1", action: "raise", amount: 6 });
    expect(state.pot).toBe(9);
    expect(state.currentBet).toBe(6);
    expect(state.currentTurnPlayerId).toBe("player-2");

    state.stacks["player-2"] = 3;
    state = applyPlayerAction(state, { playerId: "player-2", action: "all-in" });
    const snapshot = createRoomSnapshot(state);
    expect(state.sidePots).toEqual([
      { amount: 6, eligiblePlayerIds: ["player-1", "player-2", "player-3"] },
      { amount: 4, eligiblePlayerIds: ["player-1", "player-2"] },
      { amount: 2, eligiblePlayerIds: ["player-1"] },
    ]);
    expect(snapshot.mainPot).toEqual({ amount: 6, eligiblePlayerIds: ["player-1", "player-2", "player-3"] });
    expect(snapshot.sidePots).toEqual([
      { amount: 4, eligiblePlayerIds: ["player-1", "player-2"] },
      { amount: 2, eligiblePlayerIds: ["player-1"] },
    ]);
    expect(state.currentTurnPlayerId).toBe("player-3");
  });

  it.fails("does not reopen betting after a short all-in raise below the minimum raise size", () => {
    let state = createStartedRoomState(makeWaitingState());

    state = applyPlayerAction(state, { playerId: "player-1", action: "raise", amount: 6 });
    state.stacks["player-2"] = 3;
    state = applyPlayerAction(state, { playerId: "player-2", action: "all-in" });

    expect(state.currentBet).toBe(6);
    expect(state.currentTurnPlayerId).toBe("player-3");

    state = applyPlayerAction(state, { playerId: "player-3", action: "call" });

    expect(state.currentTurnPlayerId).toBe("player-1");
    expect(state.availableActions["player-1"]).toEqual(["fold", "check", "all-in"]);
  });

  it("ends immediately when every other player folds", () => {
    let state = createStartedRoomState(makeWaitingState());

    state = applyPlayerAction(state, { playerId: "player-1", action: "fold" });
    state = applyPlayerAction(state, { playerId: "player-2", action: "fold" });

    expect(state.phase).toBe("between_hands");
    expect(state.results?.winners[0]?.playerId).toBe("player-3");
    expect(state.results?.winners[0]?.amountWon).toBe(3);
    expect(state.pot).toBe(0);
    expect(state.currentBet).toBe(0);
  });

  it("splits the pot evenly on a true showdown draw", () => {
    const riverState: RoomState = {
      ...makeWaitingState(makePlayers(2)),
      phase: "river",
      handsByPlayer: {
        "player-1": [card("建設業", 2, "p1a"), card("小売業", 1, "p1b")],
        "player-2": [card("銀行業", 4, "p2a"), card("建設業", 3, "p2b")],
      },
      board: [
        card("情報・通信業", 9, "b1"),
        card("建設業", 8, "b2"),
        card("小売業", 7, "b3"),
        card("銀行業", 6, "b4"),
        card("情報・通信業", 5, "b5"),
      ],
      boardRevealCount: 5,
      stacks: {
        "player-1": 168,
        "player-2": 168,
      },
      contributions: {
        "player-1": 32,
        "player-2": 32,
      },
      currentBets: {
        "player-1": 16,
        "player-2": 16,
      },
      pot: 64,
      sidePots: [{ amount: 64, eligiblePlayerIds: ["player-1", "player-2"] }],
      foldedPlayerIds: [],
      allInPlayerIds: [],
      dealerIndex: 0,
      smallBlindIndex: 0,
      bigBlindIndex: 1,
      currentTurnPlayerId: "player-2",
      currentBet: 16,
      minRaise: 16,
      lastAggressorPlayerId: "player-1",
      availableActions: {
        "player-1": [],
        "player-2": ["check"],
      },
      actionState: { playersToAct: ["player-2"] },
      leftPlayerIds: [],
      disconnectedPlayerIds: [],
      gameEnded: false,
      gameOverReason: null,
      finalStandings: [],
    };

    const showdown = applyPlayerAction(riverState, { playerId: "player-2", action: "check" });

    expect(showdown.results?.isDraw).toBe(true);
    expect(showdown.results?.results.find((entry) => entry.playerId === "player-1")?.amountWon).toBe(32);
    expect(showdown.results?.results.find((entry) => entry.playerId === "player-2")?.amountWon).toBe(32);
  });

  it("settles showdown and distributes side pots", () => {
    const riverState: RoomState = {
      ...makeWaitingState(),
      players: makePlayers(3),
      phase: "river",
      handsByPlayer: {
        "player-1": [card("情報・通信業", 9, "p1a"), card("建設業", 9, "p1b")],
        "player-2": [card("情報・通信業", 8, "p2a"), card("建設業", 8, "p2b")],
        "player-3": [card("情報・通信業", 1, "p3a"), card("建設業", 2, "p3b")],
      },
      board: [
        card("小売業", 9, "b1"),
        card("銀行業", 8, "b2"),
        card("情報・通信業", 7, "b3"),
        card("建設業", 6, "b4"),
        card("小売業", 4, "b5"),
      ],
      boardRevealCount: 5,
      stacks: {
        "player-1": 0,
        "player-2": 0,
        "player-3": 194,
      },
      contributions: {
        "player-1": 6,
        "player-2": 4,
        "player-3": 6,
      },
      currentBets: {
        "player-1": 6,
        "player-2": 4,
        "player-3": 6,
      },
      pot: 16,
      sidePots: [
        { amount: 12, eligiblePlayerIds: ["player-1", "player-2", "player-3"] },
        { amount: 4, eligiblePlayerIds: ["player-1", "player-3"] },
      ],
      foldedPlayerIds: [],
      allInPlayerIds: ["player-1", "player-2"],
      dealerIndex: 0,
      smallBlindIndex: 1,
      bigBlindIndex: 2,
      currentTurnPlayerId: "player-3",
      currentBet: 6,
      minRaise: 2,
      lastAggressorPlayerId: "player-1",
      availableActions: {
        "player-1": [],
        "player-2": [],
        "player-3": ["check"],
      },
      actionState: { playersToAct: ["player-3"] },
      leftPlayerIds: [],
      disconnectedPlayerIds: [],
      gameEnded: false,
      gameOverReason: null,
      finalStandings: [],
    };

    const showdown = applyPlayerAction(riverState, { playerId: "player-3", action: "check" });

    expect(showdown.phase).toBe("between_hands");
    expect(showdown.results?.mainPot).toEqual({
      amount: 12,
      eligiblePlayerIds: ["player-1", "player-2", "player-3"],
      winnerPlayerIds: ["player-1"],
    });
    expect(showdown.results?.sidePots).toEqual([
      { amount: 4, eligiblePlayerIds: ["player-1", "player-3"], winnerPlayerIds: ["player-1"] },
    ]);
    expect(showdown.results?.results.find((entry) => entry.playerId === "player-1")?.amountWon).toBe(16);
    expect(showdown.results?.results.find((entry) => entry.playerId === "player-3")?.amountWon).toBe(0);
  });

  it("keeps result display while resetting hand-scoped betting state between hands", () => {
    let state = createStartedRoomState(makeWaitingState());

    state = applyPlayerAction(state, { playerId: "player-1", action: "fold" });
    state = applyPlayerAction(state, { playerId: "player-2", action: "fold" });

    const snapshot = createRoomSnapshot(state);
    const playerState = createPlayerRoomState(state, "player-3");

    expect(state.phase).toBe("between_hands");
    expect(state.results).not.toBeNull();
    expect(state.contributions).toEqual({
      "player-1": 0,
      "player-2": 0,
      "player-3": 0,
    });
    expect(state.currentBets).toEqual({
      "player-1": 0,
      "player-2": 0,
      "player-3": 0,
    });
    expect(snapshot.board).toHaveLength(5);
    expect(snapshot.boardRevealCount).toBe(5);
    expect(snapshot.currentTurnPlayerId).toBeNull();
    expect(playerState.availableActions).toEqual([]);
    expect(playerState.hand).toHaveLength(2);
    expect(playerState.board).toHaveLength(5);
  });

  it("starts a new hand from between_hands while preserving player stacks", () => {
    let state = createStartedRoomState(makeWaitingState());

    state = applyPlayerAction(state, { playerId: "player-1", action: "fold" });
    state = applyPlayerAction(state, { playerId: "player-2", action: "fold" });

    const previousStacks = { ...state.stacks };
    const nextDeck = [...makeDeck()].reverse();

    const restarted = createStartedRoomState({
      ...state,
      deck: nextDeck,
      selectedIndustries: ["銀行業", "小売業", "建設業", "情報・通信業"],
    });

    expect(restarted.phase).toBe("preflop");
    expect(restarted.results).toBeNull();
    expect(restarted.board).toHaveLength(5);
    expect(restarted.handsByPlayer["player-1"]).toHaveLength(2);
    expect(restarted.dealerIndex).toBe(1);
    expect(restarted.smallBlindIndex).toBe(2);
    expect(restarted.bigBlindIndex).toBe(0);
    expect(restarted.stacks["player-1"]).toBe(previousStacks["player-1"] - 2);
    expect(restarted.stacks["player-2"]).toBe(previousStacks["player-2"]);
    expect(restarted.stacks["player-3"]).toBe(previousStacks["player-3"] - 1);
    expect(restarted.pot).toBe(3);
  });

  it("rotates dealer, small blind, and big blind across consecutive three-player hands", () => {
    let state = createStartedRoomState(makeWaitingState(makePlayers(3)));
    expect(state.dealerIndex).toBe(0);
    expect(state.smallBlindIndex).toBe(1);
    expect(state.bigBlindIndex).toBe(2);
    expect(state.currentTurnPlayerId).toBe("player-1");

    state = applyPlayerAction(state, { playerId: "player-1", action: "fold" });
    state = applyPlayerAction(state, { playerId: "player-2", action: "fold" });
    expect(state.phase).toBe("between_hands");

    state = createStartedRoomState({
      ...state,
      deck: makeDeck(),
      selectedIndustries: ["情報・通信業", "建設業", "小売業", "銀行業"],
    });
    expect(state.dealerIndex).toBe(1);
    expect(state.smallBlindIndex).toBe(2);
    expect(state.bigBlindIndex).toBe(0);
    expect(state.currentTurnPlayerId).toBe("player-2");

    state = applyPlayerAction(state, { playerId: "player-2", action: "fold" });
    state = applyPlayerAction(state, { playerId: "player-3", action: "fold" });
    expect(state.phase).toBe("between_hands");

    state = createStartedRoomState({
      ...state,
      deck: makeDeck(),
      selectedIndustries: ["情報・通信業", "建設業", "小売業", "銀行業"],
    });
    expect(state.dealerIndex).toBe(2);
    expect(state.smallBlindIndex).toBe(0);
    expect(state.bigBlindIndex).toBe(1);
    expect(state.currentTurnPlayerId).toBe("player-3");
  });

  it("rotates heads-up dealer and big blind while keeping holdem action order", () => {
    let state = createStartedRoomState(makeWaitingState(makePlayers(2)));

    expect(state.dealerIndex).toBe(0);
    expect(state.smallBlindIndex).toBe(0);
    expect(state.bigBlindIndex).toBe(1);
    expect(state.currentTurnPlayerId).toBe("player-1");
    expect(createRoomSnapshot(state).positions).toEqual({
      dealer: "player-1",
      smallBlind: "player-1",
      bigBlind: "player-2",
    });

    state = applyPlayerAction(state, { playerId: "player-1", action: "call" });
    state = applyPlayerAction(state, { playerId: "player-2", action: "check" });
    expect(state.phase).toBe("flop");
    expect(state.currentTurnPlayerId).toBe("player-2");

    state = applyPlayerAction(state, { playerId: "player-2", action: "fold" });
    expect(state.phase).toBe("between_hands");

    state = createStartedRoomState({
      ...state,
      deck: makeDeck(),
      selectedIndustries: ["情報・通信業", "建設業", "小売業", "銀行業"],
    });

    expect(state.dealerIndex).toBe(1);
    expect(state.smallBlindIndex).toBe(1);
    expect(state.bigBlindIndex).toBe(0);
    expect(state.currentTurnPlayerId).toBe("player-2");
    expect(createRoomSnapshot(state).positions).toEqual({
      dealer: "player-2",
      smallBlind: "player-2",
      bigBlind: "player-1",
    });

    state = applyPlayerAction(state, { playerId: "player-2", action: "call" });
    state = applyPlayerAction(state, { playerId: "player-1", action: "check" });
    expect(state.phase).toBe("flop");
    expect(state.currentTurnPlayerId).toBe("player-1");
  });

  it("restores the current phase and shared betting state through room snapshot", () => {
    let state = createStartedRoomState(makeWaitingState());
    state = applyPlayerAction(state, { playerId: "player-1", action: "call" });
    state = applyPlayerAction(state, { playerId: "player-2", action: "call" });
    state = applyPlayerAction(state, { playerId: "player-3", action: "check" });

    const snapshot = createRoomSnapshot(state);

    expect(snapshot.phase).toBe("flop");
    expect(snapshot.board).toHaveLength(3);
    expect(snapshot.pot).toBe(6);
    expect(snapshot.mainPot).toEqual({ amount: 6, eligiblePlayerIds: ["player-1", "player-2", "player-3"] });
    expect(snapshot.sidePots).toEqual([]);
    expect(snapshot.currentTurnPlayerId).toBe("player-2");
  });

  it("includes public player betting info in room snapshot", () => {
    const state = createStartedRoomState(makeWaitingState(makePlayers(2)));
    const snapshot = createRoomSnapshot(state);

    expect(snapshot.players).toEqual([
      expect.objectContaining({
        playerId: "player-1",
        stack: 199,
        currentBet: 1,
        totalContribution: 1,
        isFolded: false,
        isAllIn: false,
        isCurrentTurn: true,
        position: "dealer",
      }),
      expect.objectContaining({
        playerId: "player-2",
        stack: 198,
        currentBet: 2,
        totalContribution: 2,
        isFolded: false,
        isAllIn: false,
        isCurrentTurn: false,
        position: "big_blind",
      }),
    ]);
  });

  it("ends the whole game when a non-exited player reaches zero stack between hands", () => {
    let state = createStartedRoomState(makeWaitingState(makePlayers(2)));

    state.stacks["player-1"] = 0;
    state.phase = "between_hands";
    state.results = {
      isDraw: false,
      winners: [{ playerId: "player-2", evaluation: null, amountWon: 12 }],
      results: [
        { playerId: "player-1", evaluation: null, hand: [], amountWon: 0, finalStack: 0, folded: false },
        { playerId: "player-2", evaluation: null, hand: [], amountWon: 12, finalStack: 212, folded: false },
      ],
      finalBoard: [],
      mainPot: null,
      sidePots: [],
    };

    const finalized = maybeFinalizeGame(state);

    expect(finalized.phase).toBe("waiting");
    expect(finalized.gameEnded).toBe(true);
    expect(finalized.gameOverReason).toBe("player_busted");
    expect(finalized.finalStandings).toEqual([
      expect.objectContaining({ rank: 1, playerId: "player-2", finalStack: 198, status: "active" }),
      expect.objectContaining({ rank: 2, playerId: "player-1", finalStack: 0, status: "busted" }),
    ]);
  });

  it("includes left and disconnected players in final standings at zero stack", () => {
    let state = createStartedRoomState(makeWaitingState(makePlayers(3)));
    state.phase = "between_hands";
    state.stacks = { "player-1": 120, "player-2": 80, "player-3": 60 };

    state = removePlayerFromGame(state, "player-2", "left");
    state = removePlayerFromGame(state, "player-3", "disconnected");
    const finalized = maybeFinalizeGame(state);

    expect(finalized.gameEnded).toBe(true);
    expect(finalized.gameOverReason).toBe("insufficient_players");
    expect(finalized.finalStandings).toEqual([
      expect.objectContaining({ rank: 1, playerId: "player-1", finalStack: 120, status: "active" }),
      expect.objectContaining({ rank: 2, playerId: "player-2", finalStack: 0, status: "left" }),
      expect.objectContaining({ rank: 3, playerId: "player-3", finalStack: 0, status: "disconnected" }),
    ]);
  });

  it("returns to plain waiting with remaining players after acknowledging game over", () => {
    let state = createStartedRoomState(makeWaitingState(makePlayers(3)));
    state.phase = "between_hands";
    state.stacks = { "player-1": 120, "player-2": 0, "player-3": 60 };
    state = removePlayerFromGame(state, "player-3", "left");
    state = maybeFinalizeGame(state);

    const acknowledged = acknowledgeGameOver(state);

    expect(acknowledged.phase).toBe("waiting");
    expect(acknowledged.gameEnded).toBe(false);
    expect(acknowledged.finalStandings).toEqual([]);
    expect(acknowledged.players.map((player) => player.playerId)).toEqual(["player-1", "player-2"]);
    expect(acknowledged.results).toBeNull();
  });
});
