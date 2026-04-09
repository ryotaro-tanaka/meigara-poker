import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoomHeader } from "./RoomHeader";

describe("RoomHeader", () => {
  it("shows connection help text for connected state", () => {
    render(
      <RoomHeader
        roomId="ROOM01"
        roomName="Test Room"
        description="room description"
        status="connected"
        phase="flop"
        playerCount={2}
        serverError={null}
      />,
    );

    expect(screen.getByText("接続済みです。操作するとそのまま部屋全体へ反映されます。")).toBeInTheDocument();
  });

  it("shows actionable help for betting errors", () => {
    render(
      <RoomHeader
        roomId="ROOM01"
        roomName="Test Room"
        description="room description"
        status="error"
        phase="turn"
        playerCount={2}
        serverError="Cannot bet after betting has already started. Use raise instead."
      />,
    );

    expect(screen.getByText("Cannot bet after betting has already started. Use raise instead.")).toBeInTheDocument();
    expect(screen.getByText("このラウンドはすでにベットが始まっているので、bet ではなく raise を使います。")).toBeInTheDocument();
  });
});
