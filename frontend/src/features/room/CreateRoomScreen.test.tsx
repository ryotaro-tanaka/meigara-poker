import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CreateRoomScreen } from "./CreateRoomScreen";

afterEach(() => {
  cleanup();
});

describe("CreateRoomScreen", () => {
  it("shows the updated home copy without legacy helper labels", () => {
    render(
      <CreateRoomScreen
        defaultRoomName="銘柄ポーカー部屋"
        isSubmitting={false}
        error={null}
        onJoin={vi.fn(() => true)}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "銘柄ポーカー" })).toBeInTheDocument();
    expect(screen.getByText("ポーカーは心理戦。強い手で勝つか、弱い手でも相手を降ろして勝つか。")).toBeInTheDocument();
    expect(screen.getByText("勝敗は賭け方で決まる。このゲームは数字が 0〜9 なので、役ができやすくアクションが増えます。")).toBeInTheDocument();
    expect(screen.queryByText("2〜6 人")).not.toBeInTheDocument();
    expect(screen.queryByText("手札 2 枚 + 場札 5 枚")).not.toBeInTheDocument();
    expect(screen.queryByText("SB / BB とベッティングあり")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "部屋参加" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "参加する" })).toBeInTheDocument();
  });

  it("shows join validation error when input is empty", () => {
    render(
      <CreateRoomScreen
        defaultRoomName="銘柄ポーカー部屋"
        isSubmitting={false}
        error={null}
        onJoin={vi.fn(() => false)}
        onSubmit={vi.fn()}
      />,
    );

    const joinButton = screen.getByRole("button", { name: "参加する" });
    expect(joinButton).toBeDisabled();
  });

  it("calls onJoin and shows error when join is rejected", () => {
    const onJoin = vi.fn(() => false);
    render(
      <CreateRoomScreen
        defaultRoomName="銘柄ポーカー部屋"
        isSubmitting={false}
        error={null}
        onJoin={onJoin}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("例: https://.../rooms/ABC123 または ABC123"), { target: { value: "INVALID" } });
    fireEvent.click(screen.getByRole("button", { name: "参加する" }));

    expect(onJoin).toHaveBeenCalledWith("INVALID");
    expect(screen.getByText("URLまたは部屋IDを確認してください。")).toBeInTheDocument();
  });
});
