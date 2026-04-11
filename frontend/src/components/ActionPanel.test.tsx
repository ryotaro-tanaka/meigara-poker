import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionPanel } from "./ActionPanel";

afterEach(() => {
  cleanup();
});

describe("ActionPanel", () => {
  it("shows only fold and bet entry in first step", () => {
    render(
      <ActionPanel
        availableActions={["fold", "call", "raise", "all-in"]}
        toCall={8}
        currentBet={8}
        myCurrentBet={0}
        mainPot={{ amount: 40, eligiblePlayerIds: ["player-1", "player-2"] }}
        isMyTurn
        currentTurnLabel="あなた"
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "降りる" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "賭ける (8)" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "All-in" })).not.toBeInTheDocument();
    expect(screen.queryByText("全員の参加額がそろうと次に進みます。")).not.toBeInTheDocument();
  });

  it("opens second step and sends selected raise amount", () => {
    const onAction = vi.fn();

    render(
      <ActionPanel
        availableActions={["fold", "call", "raise", "all-in"]}
        toCall={8}
        currentBet={8}
        myCurrentBet={0}
        mainPot={{ amount: 40, eligiblePlayerIds: ["player-1", "player-2"] }}
        isMyTurn
        currentTurnLabel="あなた"
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "賭ける (8)" }));
    fireEvent.click(screen.getByRole("button", { name: "24" }));

    expect(screen.getByRole("button", { name: "参加 8" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All-in" })).toBeInTheDocument();
    expect(onAction).toHaveBeenCalledWith("raise", 24);
  });

  it("supports bet presets based on main pot in second step", () => {
    const onAction = vi.fn();

    render(
      <ActionPanel
        availableActions={["fold", "check", "bet", "all-in"]}
        toCall={0}
        currentBet={0}
        myCurrentBet={0}
        mainPot={{ amount: 40, eligiblePlayerIds: ["player-1", "player-2"] }}
        isMyTurn
        currentTurnLabel="あなた"
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "賭ける (0)" }));
    fireEvent.click(screen.getByRole("button", { name: "20" }));

    expect(onAction).toHaveBeenCalledWith("bet", 20);
  });

  it("hides unavailable action candidates in second step", () => {
    render(
      <ActionPanel
        availableActions={["fold", "call"]}
        toCall={6}
        currentBet={6}
        myCurrentBet={0}
        mainPot={{ amount: 40, eligiblePlayerIds: ["player-1", "player-2"] }}
        isMyTurn
        currentTurnLabel="あなた"
        onAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "賭ける (6)" }));

    expect(screen.getByRole("button", { name: "参加 6" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "All-in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "12" })).not.toBeInTheDocument();
  });

  it("shows collapsed state when it is not my turn", () => {
    render(
      <ActionPanel
        availableActions={["fold", "check", "bet", "raise", "all-in"]}
        toCall={0}
        currentBet={8}
        myCurrentBet={2}
        mainPot={{ amount: 40, eligiblePlayerIds: ["player-1", "player-2"] }}
        isMyTurn={false}
        currentTurnLabel="Bob"
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByText("現在の手番: Bob")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "降りる" })).not.toBeInTheDocument();
  });
});
