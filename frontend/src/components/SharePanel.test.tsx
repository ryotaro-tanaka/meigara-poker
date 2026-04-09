import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SharePanel } from "./SharePanel";

const originalClipboard = navigator.clipboard;

afterEach(() => {
  cleanup();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: originalClipboard,
  });
});

describe("SharePanel", () => {
  it("shows success feedback after copying the room url", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(<SharePanel shareUrl="http://localhost:4173/rooms/ROOM01" />);

    fireEvent.click(screen.getByRole("button", { name: "URL をコピー" }));

    await waitFor(() => {
      expect(screen.getByText("URL をコピーしました。参加する人にそのまま送れます。")).toBeInTheDocument();
    });
  });

  it("shows failure feedback when clipboard write fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("copy failed")) },
    });

    render(<SharePanel shareUrl="http://localhost:4173/rooms/ROOM01" />);

    fireEvent.click(screen.getByRole("button", { name: "URL をコピー" }));

    await waitFor(() => {
      expect(screen.getByText("コピーに失敗しました。URL を手動で選択して共有してください。")).toBeInTheDocument();
    });
  });
});
