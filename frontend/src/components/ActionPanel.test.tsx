import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionPanel } from "./ActionPanel";

afterEach(() => {
  cleanup();
});

describe("ActionPanel", () => {
  it("shows friendly participation controls", () => {
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
    expect(screen.getByRole("button", { name: "参加 8" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "全額" })).toBeEnabled();
    expect(screen.getByText("全員の参加額がそろうと次に進みます。")).toBeInTheDocument();
  });

  it("renders fixed raise presets from the current round bet", () => {
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

    fireEvent.click(screen.getByRole("button", { name: "上乗せ 24" }));

    expect(screen.getByText("上乗せ候補: 現在の掛け金 8 を基準にしています。")).toBeInTheDocument();
    expect(onAction).toHaveBeenCalledWith("raise", 24);
  });

  it("renders fixed bet presets from main pot", () => {
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

    fireEvent.click(screen.getByRole("button", { name: "上乗せ 20" }));

    expect(screen.getByText("上乗せ候補: main pot 40 を基準にしています。")).toBeInTheDocument();
    expect(onAction).toHaveBeenCalledWith("bet", 20);
  });

  it("prefers raise presets when current bet is active even if bet is present", () => {
    const onAction = vi.fn();

    render(
      <ActionPanel
        availableActions={["fold", "check", "bet", "raise", "all-in"]}
        toCall={0}
        currentBet={8}
        myCurrentBet={2}
        mainPot={{ amount: 40, eligiblePlayerIds: ["player-1", "player-2"] }}
        isMyTurn
        currentTurnLabel="あなた"
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "上乗せ 24" }));

    expect(screen.getByText("上乗せ候補: 現在の掛け金 8 を基準にしています。")).toBeInTheDocument();
    expect(onAction).toHaveBeenCalledWith("raise", 24);
  });
});
