import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionPanel } from "./ActionPanel";

afterEach(() => {
  cleanup();
});

describe("ActionPanel", () => {
  it("shows betting guidance for an unopened round", () => {
    render(
      <ActionPanel
        availableActions={["fold", "check", "bet", "all-in"]}
        toCall={0}
        currentBet={0}
        isMyTurn
        currentTurnLabel="あなた"
        amountValue="16"
        onAmountChange={vi.fn()}
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByText("今選べる操作: fold / check / bet / all-in")).toBeInTheDocument();
    expect(screen.getByText("このラウンドはまだ誰も賭けていないので、最初の攻撃的アクションは bet です。")).toBeInTheDocument();
    expect(screen.getByText("まだベットがないので raise は使えません。")).toBeInTheDocument();
  });

  it("disables actions that are not currently allowed", () => {
    render(
      <ActionPanel
        availableActions={["fold", "call", "raise", "all-in"]}
        toCall={8}
        currentBet={8}
        isMyTurn
        currentTurnLabel="あなた"
        amountValue="16"
        onAmountChange={vi.fn()}
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "bet" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "check" })).toBeDisabled();
    expect(screen.getByText("すでにベットがあるので、新しく bet する代わりに raise を使います。")).toBeInTheDocument();
  });

  it("submits bet and raise with the parsed final amount", () => {
    const onAction = vi.fn();

    render(
      <ActionPanel
        availableActions={["fold", "call", "raise", "all-in"]}
        toCall={8}
        currentBet={8}
        isMyTurn
        currentTurnLabel="あなた"
        amountValue="20"
        onAmountChange={vi.fn()}
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "raise" }));

    expect(onAction).toHaveBeenCalledWith("raise", 20);
  });
});
