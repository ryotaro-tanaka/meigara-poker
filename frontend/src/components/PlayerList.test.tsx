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

    expect(screen.getAllByText("空き枠")).toHaveLength(4);
  });
});
