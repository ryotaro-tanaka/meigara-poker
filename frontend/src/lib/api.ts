import type { CreateRoomResponse, RoomSnapshotResponse } from "./types";

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function createRoom(roomName: string): Promise<CreateRoomResponse> {
  const response = await fetch("/rooms", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ roomName }),
  });

  if (!response.ok) {
    const payload = await readJson<{ message?: string }>(response);
    throw new Error(payload.message ?? "Failed to create room.");
  }

  return readJson<CreateRoomResponse>(response);
}

export async function fetchRoomSnapshot(roomId: string): Promise<RoomSnapshotResponse> {
  const response = await fetch(`/rooms/${roomId}`);

  if (!response.ok) {
    const payload = await readJson<{ message?: string }>(response);
    throw new Error(payload.message ?? "Failed to fetch room.");
  }

  return readJson<RoomSnapshotResponse>(response);
}

export function createRoomWebSocket(roomId: string, playerId: string): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const socketUrl = new URL(`/ws?roomId=${roomId}&playerId=${playerId}`, `${protocol}//${window.location.host}`);
  return new WebSocket(socketUrl);
}
