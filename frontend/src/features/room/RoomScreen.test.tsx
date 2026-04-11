import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RoomScreen } from "./RoomScreen";
import type { AppState } from "../../state/app-state";

afterEach(() => {
  cleanup();
});

function createWaitingState(playerCount = 1): AppState {
  const players = [
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
      isParticipating: true,
    },
  ];
  if (playerCount >= 2) {
    players.push({
      playerId: "player-2",
      name: "Bob",
      joinedAt: "2026-04-11T00:00:01.000Z",
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
      isParticipating: true,
    });
  }
  return {
    route: { kind: "room", roomId: "ROOM01" },
    roomId: "ROOM01",
    playerId: "player-1",
    playerName: "Alice",
    room: {
      roomId: "ROOM01",
      roomName: "銘柄ポーカー部屋",
      phase: "waiting",
      players,
      playerCount,
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
      activeParticipantCount: playerCount,
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
    playerRoundHistory: {},
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
        onSetParticipation={vi.fn()}
        onStartGame={vi.fn()}
        onPlayerAction={vi.fn()}
        onReadyChange={vi.fn()}
        onLeaveRoom={vi.fn()}
        onAcknowledgeGameOver={vi.fn()}
      />,
    );

    expect(screen.queryByRole("heading", { name: "参加者一覧" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "招待リンク" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ルール" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "銘柄ポーカー部屋" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ゲーム開始" })).toBeInTheDocument();
  });

  it("shows start loading label after pressing game start", () => {
    const onStartGame = vi.fn();

    render(
      <RoomScreen
        state={createWaitingState(2)}
        shareUrl="http://localhost:4173/rooms/ROOM01"
        onNameChange={vi.fn()}
        onSetParticipation={vi.fn()}
        onStartGame={onStartGame}
        onPlayerAction={vi.fn()}
        onReadyChange={vi.fn()}
        onLeaveRoom={vi.fn()}
        onAcknowledgeGameOver={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "ゲーム開始" }));

    expect(onStartGame).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "開始中..." })).toBeDisabled();
  });

  it("disables participation and start actions while websocket is connecting", () => {
    const state = createWaitingState(2);
    state.connectionStatus = "connecting";

    render(
      <RoomScreen
        state={state}
        shareUrl="http://localhost:4173/rooms/ROOM01"
        onNameChange={vi.fn()}
        onSetParticipation={vi.fn()}
        onStartGame={vi.fn()}
        onPlayerAction={vi.fn()}
        onReadyChange={vi.fn()}
        onLeaveRoom={vi.fn()}
        onAcknowledgeGameOver={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "解除" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "ゲーム開始" })).toBeDisabled();
    expect(screen.getByText("接続中です。数秒後に操作できます。")).toBeInTheDocument();
  });
});
