import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RoomScreen } from "./RoomScreen";
import type { AppState } from "../../state/app-state";

afterEach(() => {
  cleanup();
});

function createWaitingState(): AppState {
  return {
    route: { kind: "room", roomId: "ROOM01" },
    roomId: "ROOM01",
    playerId: "player-1",
    playerName: "Alice",
    room: {
      roomId: "ROOM01",
      roomName: "銘柄ポーカー部屋",
      phase: "waiting",
      players: [
        {
          playerId: "player-1",
          name: "Alice",
          joinedAt: "2026-04-11T00:00:00.000Z",
          connected: true,
          stack: 200,
          currentBet: 0,
          totalContribution: 0,
          isFolded: false,
          isAllIn: false,
          isCurrentTurn: false,
          position: null,
          hasLeft: false,
          isEliminated: false,
        },
      ],
      playerCount: 1,
      selectedIndustries: [],
      deckCount: 0,
      board: [],
      boardRevealCount: 0,
      results: null,
      createdAt: "2026-04-11T00:00:00.000Z",
      pot: 0,
      mainPot: null,
      sidePots: [],
      currentBet: 0,
      currentTurnPlayerId: null,
      positions: { dealer: null, smallBlind: null, bigBlind: null },
      gameEnded: false,
      gameOverReason: null,
      finalStandings: [],
      readyPlayerIds: [],
      requiredReadyCount: 0,
    },
    hand: [],
    board: [],
    selectedIndustries: [],
    results: null,
    pot: 0,
    mainPot: null,
    sidePots: [],
    myStack: 200,
    currentBet: 0,
    toCall: 0,
    positions: { dealer: null, smallBlind: null, bigBlind: null },
    availableActions: [],
    currentTurnPlayerId: null,
    gameEnded: false,
    gameOverReason: null,
    finalStandings: [],
    readyPlayerIds: [],
    requiredReadyCount: 0,
    connectionStatus: "connected",
    serverError: null,
    isCreatingRoom: false,
    lastActionMessage: null,
  };
}

describe("RoomScreen", () => {
  it("shows waiting screen in 3 sections with room name and invite section split", () => {
    render(
      <RoomScreen
        state={createWaitingState()}
        shareUrl="http://localhost:4173/rooms/ROOM01"
        onNameChange={vi.fn()}
        onStartGame={vi.fn()}
        onPlayerAction={vi.fn()}
        onReadyChange={vi.fn()}
        onLeaveRoom={vi.fn()}
        onAcknowledgeGameOver={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "参加者一覧" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "招待リンク" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ルール" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "銘柄ポーカー部屋" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ゲーム開始" })).toBeInTheDocument();
  });
});
