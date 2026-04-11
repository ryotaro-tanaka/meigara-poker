import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CreateRoomScreen } from "./CreateRoomScreen";

afterEach(() => {
  cleanup();
});

describe("CreateRoomScreen", () => {
  it("shows the updated home copy without legacy helper labels", () => {
    render(<CreateRoomScreen defaultRoomName="銘柄ポーカー部屋" isSubmitting={false} error={null} onSubmit={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "銘柄ポーカー" })).toBeInTheDocument();
    expect(screen.getByText("ポーカーは心理戦。強い手で勝つか、弱い手でも相手を降ろして勝つか。")).toBeInTheDocument();
    expect(screen.getByText("勝敗は賭け方で決まる。このゲームは数字が 0〜9 なので、役ができやすくアクションが増えます。")).toBeInTheDocument();
    expect(screen.queryByText("2〜6 人")).not.toBeInTheDocument();
    expect(screen.queryByText("手札 2 枚 + 場札 5 枚")).not.toBeInTheDocument();
    expect(screen.queryByText("SB / BB とベッティングあり")).not.toBeInTheDocument();
  });
});
