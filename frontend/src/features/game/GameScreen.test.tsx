import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GameScreen } from "./GameScreen";
import type { AppState } from "../../state/app-state";

afterEach(() => {
  cleanup();
});

function createBaseState(): AppState {
  return {
    route: { kind: "room", roomId: "ROOM01" },
    roomId: "ROOM01",
    playerId: "player-1",
    playerName: "Alice",
    room: {
      roomId: "ROOM01",
      roomName: "Test Room",
      phase: "flop",
      players: [
        {
          playerId: "player-1",
          name: "Alice",
          joinedAt: "2026-04-10T00:00:00.000Z",
          connected: true,
          stack: 180,
          currentBet: 10,
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
          joinedAt: "2026-04-10T00:00:01.000Z",
          connected: true,
          stack: 180,
          currentBet: 10,
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
      selectedIndustries: [],
      deckCount: 0,
      board: [],
      boardRevealCount: 3,
      results: null,
      createdAt: "2026-04-10T00:00:00.000Z",
      pot: 40,
      mainPot: { amount: 40, eligiblePlayerIds: ["player-1", "player-2"] },
      sidePots: [],
      currentBet: 10,
      currentTurnPlayerId: "player-1",
      positions: { dealer: "player-1", smallBlind: "player-1", bigBlind: "player-2" },
      gameEnded: false,
      gameOverReason: null,
      finalStandings: [],
      readyPlayerIds: [],
      requiredReadyCount: 0,
    },
    hand: [
      { edinetCode: "a", name: "A社", suit: "情報・通信業", number: 7 },
      { edinetCode: "b", name: "B社", suit: "建設業", number: 2 },
    ],
    board: [
      { edinetCode: "c", name: "C社", suit: "小売業", number: 9 },
      { edinetCode: "d", name: "D社", suit: "銀行業", number: 4 },
      { edinetCode: "e", name: "E社", suit: "建設業", number: 1 },
    ],
    selectedIndustries: [],
    results: null,
    pot: 40,
    mainPot: { amount: 40, eligiblePlayerIds: ["player-1", "player-2"] },
    sidePots: [],
    myStack: 180,
    currentBet: 10,
    toCall: 0,
    positions: { dealer: "player-1", smallBlind: "player-1", bigBlind: "player-2" },
    availableActions: ["fold", "check", "bet", "all-in"],
    currentTurnPlayerId: "player-1",
    gameEnded: false,
    gameOverReason: null,
    finalStandings: [],
    readyPlayerIds: [],
    requiredReadyCount: 0,
    playerRoundHistory: {},
    connectionStatus: "connected",
    serverError: null,
    isCreatingRoom: false,
    lastActionMessage: "Alice が bet 10 を実行しました。",
  };
}

describe("GameScreen", () => {
  it("shows compact in-hand layout with round header and core betting info", () => {
    const { container } = render(
      <GameScreen
        state={createBaseState()}
        onPlayerAction={vi.fn()}
        onReadyChange={vi.fn()}
        onLeaveRoom={vi.fn()}
        onAcknowledgeGameOver={vi.fn()}
      />,
    );

    expect(screen.getByText("場札3枚")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "テーブル" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ハンド" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "プレイヤー" })).toBeInTheDocument();
    expect(screen.getByText("ヒント")).toBeInTheDocument();
    expect(screen.getByText("ポット")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("（勝者が獲得）")).toBeInTheDocument();
    expect(screen.queryByText("ラウンドの最低参加費: 0")).not.toBeInTheDocument();
    expect(screen.queryByText("持ち点: 180")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".card-item-info")).toHaveLength(1);
    expect(screen.queryByText("必要コスト: 0")).not.toBeInTheDocument();
    expect(screen.queryByText("Alice が bet 10 を実行しました。")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "退出する" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "結果" })).not.toBeInTheDocument();
  });

  it("shows pot amount as main + side total", () => {
    const state = createBaseState();
    state.pot = 60;
    state.mainPot = { amount: 40, eligiblePlayerIds: ["player-1", "player-2"] };
    state.sidePots = [{ amount: 20, eligiblePlayerIds: ["player-1"] }];
    state.room = state.room
      ? {
          ...state.room,
          pot: 60,
          mainPot: { amount: 40, eligiblePlayerIds: ["player-1", "player-2"] },
          sidePots: [{ amount: 20, eligiblePlayerIds: ["player-1"] }],
        }
      : null;

    render(
      <GameScreen
        state={state}
        onPlayerAction={vi.fn()}
        onReadyChange={vi.fn()}
        onLeaveRoom={vi.fn()}
        onAcknowledgeGameOver={vi.fn()}
      />,
    );

    expect(screen.getByText("ポット")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
  });

  it("shows collapsed footer message when it is not my turn", () => {
    const state = createBaseState();
    state.currentTurnPlayerId = "player-2";

    render(
      <GameScreen
        state={state}
        onPlayerAction={vi.fn()}
        onReadyChange={vi.fn()}
        onLeaveRoom={vi.fn()}
        onAcknowledgeGameOver={vi.fn()}
      />,
    );

    expect(screen.getAllByText("現在の手番: Bob").length).toBeGreaterThan(0);
    expect(screen.queryByText("順番待ちです。手番: Bob")).not.toBeInTheDocument();
  });

  it("toggles per-player round betting history in player section", () => {
    const state = createBaseState();
    state.playerRoundHistory = {
      "player-1": { preflop: 2, flop: 4 },
    };

    render(
      <GameScreen
        state={state}
        onPlayerAction={vi.fn()}
        onReadyChange={vi.fn()}
        onLeaveRoom={vi.fn()}
        onAcknowledgeGameOver={vi.fn()}
      />,
    );

    expect(screen.queryByText("ラウンド別のベット")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Alice/ }));

    const historyPanel = screen.getByText("ラウンド別のベット").closest("section");
    expect(historyPanel).not.toBeNull();
    if (!historyPanel) {
      throw new Error("history panel is missing");
    }
    expect(within(historyPanel).getByText("手札")).toBeInTheDocument();
    expect(within(historyPanel).getByText("場札4枚目")).toBeInTheDocument();
  });

  it("shows between-hands result and ready controls", () => {
    const state = createBaseState();
    const room = state.room!;
    state.room = {
      ...room,
      phase: "between_hands",
      results: {
        isDraw: false,
        winners: [{ playerId: "player-1", evaluation: null, amountWon: 40 }],
        results: [
          { playerId: "player-1", evaluation: null, hand: [], amountWon: 40, finalStack: 220, folded: false },
          { playerId: "player-2", evaluation: null, hand: [], amountWon: 0, finalStack: 180, folded: true },
        ],
        finalBoard: [],
        mainPot: null,
        sidePots: [],
      },
      readyPlayerIds: ["player-1"],
      requiredReadyCount: 2,
    };
    state.results = state.room.results;
    state.readyPlayerIds = ["player-1"];
    state.requiredReadyCount = 2;

    render(
      <GameScreen
        state={state}
        onPlayerAction={vi.fn()}
        onReadyChange={vi.fn()}
        onLeaveRoom={vi.fn()}
        onAcknowledgeGameOver={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "次ハンド待ち" })).toBeInTheDocument();
    expect(screen.getByText("ready 1 / 2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "前ハンド結果" })).toBeInTheDocument();
  });

  it("shows final standings as a between-hands game-over state", () => {
    const state = createBaseState();
    const room = state.room!;
    state.room = {
      ...room,
      phase: "between_hands",
      gameEnded: true,
      gameOverReason: "player_busted",
      finalStandings: [
        { rank: 1, playerId: "player-1", name: "Alice", finalStack: 220, status: "active" },
        { rank: 2, playerId: "player-2", name: "Bob", finalStack: 0, status: "busted" },
      ],
      results: null,
    };
    state.gameEnded = true;
    state.gameOverReason = "player_busted";
    state.finalStandings = state.room!.finalStandings;
    state.results = null;

    render(
      <GameScreen
        state={state}
        onPlayerAction={vi.fn()}
        onReadyChange={vi.fn()}
        onLeaveRoom={vi.fn()}
        onAcknowledgeGameOver={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "ゲーム終了" })).toBeInTheDocument();
    expect(screen.getByText("待機画面へ戻る")).toBeInTheDocument();
    expect(screen.getByText("1. Alice")).toBeInTheDocument();
  });
});
