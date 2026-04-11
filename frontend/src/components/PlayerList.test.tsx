import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PlayerList } from "./PlayerList";

afterEach(() => {
  cleanup();
});

describe("PlayerList", () => {
  it("renders empty waiting slots up to configured capacity", () => {
    render(
      <PlayerList
        players={[
          {
            playerId: "player-1",
            name: "Alice",
            joinedAt: "2026-04-11T00:00:00.000Z",
            connected: true,
            position: null,
            stack: 200,
            currentBet: 0,
            totalContribution: 0,
            isCurrentTurn: false,
            isFolded: false,
            isAllIn: false,
            hasLeft: false,
            isEliminated: false,
          },
          {
            playerId: "player-2",
            name: "Bob",
            joinedAt: "2026-04-11T00:00:01.000Z",
            connected: true,
            position: null,
            stack: 200,
            currentBet: 0,
            totalContribution: 0,
            isCurrentTurn: false,
            isFolded: false,
            isAllIn: false,
            hasLeft: false,
            isEliminated: false,
          },
        ]}
        selfPlayerId="player-1"
        totalSlots={6}
      />,
    );

    expect(screen.getAllByText("待機中")).toHaveLength(4);
  });

  it("shows simplified betting labels in game view", () => {
    const { container } = render(
      <PlayerList
        players={[
          {
            playerId: "player-1",
            name: "Alice",
            joinedAt: "2026-04-11T00:00:00.000Z",
            connected: true,
            position: "dealer",
            stack: 199,
            currentBet: 1,
            totalContribution: 1,
            isCurrentTurn: true,
            isFolded: false,
            isAllIn: false,
            hasLeft: false,
            isEliminated: false,
          },
        ]}
        selfPlayerId="player-1"
        showBettingInfo
        compactGameView
      />,
    );

    expect(screen.getByText("持ち点 199")).toBeInTheDocument();
    expect(screen.getByText("掛け金 1")).toBeInTheDocument();
    expect(screen.getByText("接続中")).toBeInTheDocument();
    expect(container.querySelectorAll(".player-row-main")).toHaveLength(1);
    expect(screen.queryByText("stack 199")).not.toBeInTheDocument();
    expect(screen.queryByText("bet 1")).not.toBeInTheDocument();
    expect(screen.queryByText("投入 1")).not.toBeInTheDocument();
    expect(screen.queryByText("手番")).not.toBeInTheDocument();
  });
});
