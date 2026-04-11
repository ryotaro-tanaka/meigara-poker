import { describe, expect, it } from "vitest";

import { resolveRoomIdFromInput } from "./room-link";

describe("resolveRoomIdFromInput", () => {
  it("accepts direct room id", () => {
    expect(resolveRoomIdFromInput("ABC123")).toBe("ABC123");
  });

  it("normalizes lowercase room id", () => {
    expect(resolveRoomIdFromInput("abc123")).toBe("ABC123");
  });

  it("extracts room id from shared URL", () => {
    expect(resolveRoomIdFromInput("https://example.com/rooms/abc123")).toBe("ABC123");
  });

  it("returns null for invalid input", () => {
    expect(resolveRoomIdFromInput("")).toBeNull();
    expect(resolveRoomIdFromInput("https://example.com/home")).toBeNull();
    expect(resolveRoomIdFromInput("ABCDE")).toBeNull();
  });
});
