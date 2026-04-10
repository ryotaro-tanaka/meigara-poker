import { describe, expect, it } from "vitest";

import { appReducer, createInitialState } from "./app-state";
import type { RoomSnapshot, ServerEvent } from "../lib/types";

function createRoomSnapshot(): RoomSnapshot {
  return {
    roomId: "ROOM01",
    roomName: "Test Room",
    phase: "flop",
    players: [
      {
        playerId: "player-1",
        name: "Alice",
        joinedAt: "2026-04-09T00:00:00.000Z",
        connected: true,
        stack: 180,
        currentBet: 20,
        totalContribution: 20,
        isFolded: false,
        isAllIn: false,
        isCurrentTurn: true,
        position: "dealer",
        hasLeft: false,
        isEliminated: false,
      },
      {
        playerId: "player-2",
        name: "Bob",
        joinedAt: "2026-04-09T00:00:01.000Z",
        connected: true,
        stack: 180,
        currentBet: 20,
        totalContribution: 20,
        isFolded: false,
        isAllIn: false,
        isCurrentTurn: false,
        position: "big_blind",
        hasLeft: false,
        isEliminated: false,
      },
    ],
    playerCount: 2,
    selectedIndustries: ["情報・通信業", "建設業", "小売業", "銀行業"],
    deckCount: 33,
    board: [
      { edinetCode: "b1", name: "B1", suit: "情報・通信業", number: 1 },
      { edinetCode: "b2", name: "B2", suit: "建設業", number: 2 },
      { edinetCode: "b3", name: "B3", suit: "小売業", number: 3 },
    ],
    boardRevealCount: 3,
    results: null,
    createdAt: "2026-04-09T00:00:00.000Z",
    pot: 40,
    mainPot: { amount: 40, eligiblePlayerIds: ["player-1", "player-2"] },
    sidePots: [],
    currentBet: 20,
    currentTurnPlayerId: "player-1",
    positions: {
      dealer: "player-1",
      smallBlind: "player-1",
      bigBlind: "player-2",
    },
    gameEnded: false,
    gameOverReason: null,
    finalStandings: [],
  };
}

describe("appReducer", () => {
  it("applies room_state as the source of truth", () => {
    const room = createRoomSnapshot();
    const state = {
      ...createInitialState({ kind: "room", roomId: "ROOM01" }),
      playerId: "player-1",
    };
    const event: Extract<ServerEvent, { type: "room_state" }> = {
      type: "room_state",
      room,
      selfPlayerId: "player-1",
      hand: [
        { edinetCode: "h1", name: "H1", suit: "情報・通信業", number: 7 },
        { edinetCode: "h2", name: "H2", suit: "建設業", number: 8 },
      ],
      board: room.board,
      results: null,
      myStack: 180,
      currentBet: 20,
      toCall: 0,
      positions: room.positions,
      availableActions: ["check", "bet", "all-in"],
      pot: 40,
      mainPot: room.mainPot,
      sidePots: room.sidePots,
      gameEnded: room.gameEnded,
      gameOverReason: room.gameOverReason,
      finalStandings: room.finalStandings,
    };

    const next = appReducer(state, { type: "server_event_received", event });

    expect(next.room?.roomId).toBe("ROOM01");
    expect(next.hand).toHaveLength(2);
    expect(next.board).toHaveLength(3);
    expect(next.mainPot?.amount).toBe(40);
    expect(next.availableActions).toEqual(["check", "bet", "all-in"]);
  });

  it("stores action feedback from action_applied", () => {
    const room = createRoomSnapshot();
    const state = {
      ...createInitialState({ kind: "room", roomId: "ROOM01" }),
      room,
      playerId: "player-1",
    };
    const event: Extract<ServerEvent, { type: "action_applied" }> = {
      type: "action_applied",
      actorPlayerId: "player-2",
      action: "call",
      amount: null,
      phase: "flop",
      room,
    };

    const next = appReducer(state, { type: "server_event_received", event });

    expect(next.lastActionMessage).toContain("Bob");
    expect(next.lastActionMessage).toContain("call");
  });

  it("stores server errors without losing room state", () => {
    const room = createRoomSnapshot();
    const state = {
      ...createInitialState({ kind: "room", roomId: "ROOM01" }),
      room,
    };

    const next = appReducer(state, {
      type: "server_event_received",
      event: { type: "error", message: "Cannot bet after betting has already started. Use raise instead." },
    });

    expect(next.serverError).toContain("Cannot bet");
    expect(next.room?.roomId).toBe("ROOM01");
  });

  it("keeps main pot and side pots in game_result", () => {
    const room = createRoomSnapshot();
    const event: Extract<ServerEvent, { type: "game_result" }> = {
      type: "game_result",
      phase: "showdown",
      board: [
        ...room.board,
        { edinetCode: "b4", name: "B4", suit: "銀行業", number: 4 },
        { edinetCode: "b5", name: "B5", suit: "情報・通信業", number: 5 },
      ],
      winners: [{ playerId: "player-1", evaluation: null, amountWon: 60 }],
      results: [
        {
          playerId: "player-1",
          evaluation: null,
          hand: [],
          amountWon: 60,
          finalStack: 220,
          folded: false,
        },
        {
          playerId: "player-2",
          evaluation: null,
          hand: [],
          amountWon: 0,
          finalStack: 140,
          folded: false,
        },
      ],
      room: {
        ...room,
        phase: "showdown",
        results: {
          isDraw: false,
          winners: [{ playerId: "player-1", evaluation: null, amountWon: 60 }],
          results: [
            {
              playerId: "player-1",
              evaluation: null,
              hand: [],
              amountWon: 60,
              finalStack: 220,
              folded: false,
            },
            {
              playerId: "player-2",
              evaluation: null,
              hand: [],
              amountWon: 0,
              finalStack: 140,
              folded: false,
            },
          ],
          finalBoard: [],
          mainPot: { amount: 40, eligiblePlayerIds: ["player-1", "player-2"], winnerPlayerIds: ["player-1"] },
          sidePots: [{ amount: 20, eligiblePlayerIds: ["player-1"], winnerPlayerIds: ["player-1"] }],
        },
      },
    };

    const next = appReducer(createInitialState({ kind: "room", roomId: "ROOM01" }), {
      type: "server_event_received",
      event,
    });

    expect(next.results?.mainPot?.amount).toBe(40);
    expect(next.results?.sidePots).toHaveLength(1);
    expect(next.lastActionMessage).toBe("ハンドが終了しました。");
  });
});
