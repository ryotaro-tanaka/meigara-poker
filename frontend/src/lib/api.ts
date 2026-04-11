import type { CreateRoomResponse, RoomSnapshotResponse } from "./types";

const FRONTEND_PROD_HOST = "meigara-poker.ryotaro-tanaka.workers.dev";
const BACKEND_PROD_HTTP_BASE = "https://meigara-poker-worker.ryotaro-tanaka.workers.dev";
const BACKEND_PROD_WS_BASE = "wss://meigara-poker-worker.ryotaro-tanaka.workers.dev";

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    throw new Error("Empty response body.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Response is not valid JSON.");
  }
}

function getApiBaseUrl(): string | null {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  if (base) {
    return base;
  }

  if (typeof window !== "undefined" && window.location.host === FRONTEND_PROD_HOST) {
    return BACKEND_PROD_HTTP_BASE;
  }

  return null;
}

function getWsBaseUrl(): string | null {
  const base = import.meta.env.VITE_WS_BASE_URL?.trim();
  if (base) {
    return base;
  }

  if (typeof window !== "undefined" && window.location.host === FRONTEND_PROD_HOST) {
    return BACKEND_PROD_WS_BASE;
  }

  return null;
}

function buildHttpUrl(path: string): string {
  const base = getApiBaseUrl();

  if (!base) {
    return path;
  }

  return new URL(path, base).toString();
}

function errorMessageFromStatus(status: number): string {
  if (status === 404) {
    return "API endpoint not found.";
  }

  if (status === 500) {
    return "Server error.";
  }

  return `Request failed with status ${status}.`;
}

export async function createRoom(roomName: string): Promise<CreateRoomResponse> {
  const response = await fetch(buildHttpUrl("/rooms"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ roomName }),
  });

  if (!response.ok) {
    try {
      const payload = await readJson<{ message?: string }>(response);
      throw new Error(payload.message ?? "Failed to create room.");
    } catch {
      throw new Error(errorMessageFromStatus(response.status));
    }
  }

  return readJson<CreateRoomResponse>(response);
}

export async function fetchRoomSnapshot(roomId: string): Promise<RoomSnapshotResponse> {
  const response = await fetch(buildHttpUrl(`/rooms/${roomId}`));

  if (!response.ok) {
    try {
      const payload = await readJson<{ message?: string }>(response);
      throw new Error(payload.message ?? "Failed to fetch room.");
    } catch {
      throw new Error(errorMessageFromStatus(response.status));
    }
  }

  return readJson<RoomSnapshotResponse>(response);
}

export function createRoomWebSocket(roomId: string, playerId: string): WebSocket {
  const configuredBase = getWsBaseUrl();
  const fallbackBase = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
  const socketUrl = new URL(`/ws?roomId=${roomId}&playerId=${playerId}`, configuredBase ?? fallbackBase);
  return new WebSocket(socketUrl);
}
