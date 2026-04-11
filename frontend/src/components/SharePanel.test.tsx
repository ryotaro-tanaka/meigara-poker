import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SharePanel } from "./SharePanel";

const originalShare = navigator.share;

afterEach(() => {
  cleanup();
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: originalShare,
  });
});

describe("SharePanel", () => {
  it("shows success feedback after invoking native share", async () => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });

    render(<SharePanel shareUrl="http://localhost:4173/rooms/ROOM01" />);

    fireEvent.click(screen.getByRole("button", { name: "共有する" }));

    await waitFor(() => {
      expect(screen.getByText("共有画面を開きました。送信先を選んで共有してください。")).toBeInTheDocument();
    });
  });

  it("shows guidance when native share is unavailable", async () => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });

    render(<SharePanel shareUrl="http://localhost:4173/rooms/ROOM01" />);

    fireEvent.click(screen.getByRole("button", { name: "共有する" }));

    await waitFor(() => {
      expect(screen.getByText("この端末では共有ボタンが使えません。URL を手動で送ってください。")).toBeInTheDocument();
    });
  });
});
