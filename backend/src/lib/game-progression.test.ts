import { describe, expect, it } from "vitest";

import type { DeckCard } from "./deck";
import {
  applyPlayerAction,
  createPlayerRoomState,
  createRoomSnapshot,
  createStartedRoomState,
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

  it("ends immediately when every other player folds", () => {
    let state = createStartedRoomState(makeWaitingState());

    state = applyPlayerAction(state, { playerId: "player-1", action: "fold" });
    state = applyPlayerAction(state, { playerId: "player-2", action: "fold" });

    expect(state.phase).toBe("showdown");
    expect(state.results?.winners[0]?.playerId).toBe("player-3");
    expect(state.results?.winners[0]?.amountWon).toBe(3);
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
    };

    const showdown = applyPlayerAction(riverState, { playerId: "player-3", action: "check" });

    expect(showdown.phase).toBe("showdown");
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
});
