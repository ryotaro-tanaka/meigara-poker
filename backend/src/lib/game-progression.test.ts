import { describe, expect, it } from "vitest";

import type { DeckCard } from "./deck";
import {
  advanceRoomState,
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
  const suits = ["情報・通信業", "建設業", "小売業", "銀行業"];
  const deck: DeckCard[] = [];

  for (const suit of suits) {
    for (let number = 0; number <= 9; number += 1) {
      deck.push(card(suit, number, `${suit}-${number}-${deck.length}`));
    }
  }

  return deck;
}

function makeWaitingState(players = makePlayers(2)): RoomState {
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
  };
}

describe("game progression", () => {
  it("deals 2 hole cards per player and reserves 5 board cards at game start", () => {
    const started = createStartedRoomState(makeWaitingState(makePlayers(3)));

    expect(started.phase).toBe("preflop");
    expect(started.boardRevealCount).toBe(0);
    expect(started.board).toHaveLength(5);
    expect(started.handsByPlayer["player-1"]).toHaveLength(2);
    expect(started.handsByPlayer["player-2"]).toHaveLength(2);
    expect(started.handsByPlayer["player-3"]).toHaveLength(2);
  });

  it("rejects game start outside the supported player count", () => {
    expect(() => createStartedRoomState(makeWaitingState(makePlayers(1)))).toThrow("Game can start only with 2 to 6 players.");
    expect(() => createStartedRoomState(makeWaitingState(makePlayers(7)))).toThrow("Game can start only with 2 to 6 players.");
  });

  it("reveals the board as 3 + 1 + 1 through the phase sequence", () => {
    const preflop = createStartedRoomState(makeWaitingState());
    const flop = advanceRoomState(preflop);
    const turn = advanceRoomState(flop);
    const river = advanceRoomState(turn);

    expect(flop.phase).toBe("flop");
    expect(flop.boardRevealCount).toBe(3);
    expect(flop.board).toHaveLength(5);
    expect(turn.phase).toBe("turn");
    expect(turn.boardRevealCount).toBe(4);
    expect(river.phase).toBe("river");
    expect(river.boardRevealCount).toBe(5);
  });

  it("builds a per-player room state that only exposes the caller hand", () => {
    const started = createStartedRoomState(makeWaitingState());
    const player1State = createPlayerRoomState(started, "player-1");
    const player2State = createPlayerRoomState(started, "player-2");

    expect(player1State.hand).toHaveLength(2);
    expect(player2State.hand).toHaveLength(2);
    expect(player1State.hand).not.toEqual(player2State.hand);
    expect(player1State.board).toHaveLength(0);
    expect(player1State.room.phase).toBe("preflop");
  });

  it("restores the current phase and revealed board through room snapshot", () => {
    const preflop = createStartedRoomState(makeWaitingState());
    const flop = advanceRoomState(preflop);
    const turn = advanceRoomState(flop);
    const snapshot = createRoomSnapshot(turn);

    expect(snapshot.phase).toBe("turn");
    expect(snapshot.board).toHaveLength(4);
    expect(snapshot.boardRevealCount).toBe(4);
  });

  it("computes showdown winners from player hands and the full board", () => {
    const riverState: RoomState = {
      roomId: "ROOM01",
      roomName: "Showdown",
      players: makePlayers(2),
      phase: "river",
      deck: makeDeck(),
      selectedIndustries: ["情報・通信業", "建設業", "小売業", "銀行業"],
      handsByPlayer: {
        "player-1": [card("情報・通信業", 0), card("情報・通信業", 1)],
        "player-2": [card("銀行業", 7), card("建設業", 7)],
      },
      board: [
        card("情報・通信業", 2),
        card("情報・通信業", 3),
        card("情報・通信業", 4),
        card("小売業", 8),
        card("銀行業", 9),
      ],
      boardRevealCount: 5,
      results: null,
      createdAt: "2026-04-08T00:00:00.000Z",
    };

    const showdown = advanceRoomState(riverState);

    expect(showdown.phase).toBe("showdown");
    expect(showdown.results?.isDraw).toBe(false);
    expect(showdown.results?.winners).toHaveLength(1);
    expect(showdown.results?.winners[0]?.playerId).toBe("player-1");
    expect(showdown.results?.results).toHaveLength(2);
  });

  it("keeps multiple winners when showdown ends in a draw", () => {
    const riverState: RoomState = {
      roomId: "ROOM01",
      roomName: "Draw",
      players: makePlayers(2),
      phase: "river",
      deck: makeDeck(),
      selectedIndustries: ["情報・通信業", "建設業", "小売業", "銀行業"],
      handsByPlayer: {
        "player-1": [card("情報・通信業", 2), card("建設業", 2)],
        "player-2": [card("銀行業", 3), card("建設業", 3)],
      },
      board: [
        card("小売業", 0),
        card("銀行業", 5),
        card("小売業", 7),
        card("建設業", 8),
        card("銀行業", 9),
      ],
      boardRevealCount: 5,
      results: null,
      createdAt: "2026-04-08T00:00:00.000Z",
    };

    const showdown = advanceRoomState(riverState);

    expect(showdown.results?.isDraw).toBe(true);
    expect(showdown.results?.winners.map((winner) => winner.playerId)).toEqual(["player-1", "player-2"]);
  });

  it("rejects invalid phase transitions", () => {
    expect(() => advanceRoomState(makeWaitingState())).toThrow("Cannot advance from phase=waiting.");

    expect(() =>
      advanceRoomState({
        ...makeWaitingState(),
        phase: "showdown",
      }),
    ).toThrow("Cannot advance from phase=showdown.");
  });
});
