import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LobbyPanel } from "./LobbyPanel";

afterEach(() => {
  cleanup();
});

describe("LobbyPanel", () => {
  it("shows name input and start condition for waiting screen", () => {
    render(
      <LobbyPanel
        playerName=""
        playerCount={1}
        canStart={false}
        onNameChange={vi.fn()}
        onStartGame={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "待機者" })).toBeInTheDocument();
    expect(screen.getByText("2 人以上で開始できます。現在 1/6 人。")).toBeInTheDocument();
    expect(screen.getByText("開始ボタンは 2 人以上そろうと押せます。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ゲーム開始" })).toBeDisabled();
  });

  it("submits updated player name", () => {
    const onNameChange = vi.fn();

    render(
      <LobbyPanel
        playerName=""
        playerCount={2}
        canStart
        onNameChange={onNameChange}
        onStartGame={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("名前を入力"), { target: { value: "Taro" } });

    expect(onNameChange).toHaveBeenCalledWith("Taro");
  });
});
