const PLAYER_ID_PREFIX = "meigara-poker:playerId:";
const PLAYER_NAME_KEY = "meigara-poker:playerName";
const LAST_ROOM_ID_KEY = "meigara-poker:lastRoomId";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredPlayerId(roomId: string): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(`${PLAYER_ID_PREFIX}${roomId}`);
}

export function setStoredPlayerId(roomId: string, playerId: string): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(`${PLAYER_ID_PREFIX}${roomId}`, playerId);
  window.localStorage.setItem(LAST_ROOM_ID_KEY, roomId);
}

export function getStoredPlayerName(): string {
  if (!canUseStorage()) {
    return "";
  }

  return window.localStorage.getItem(PLAYER_NAME_KEY) ?? "";
}

export function setStoredPlayerName(name: string): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(PLAYER_NAME_KEY, name);
}

export function getLastRoomId(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(LAST_ROOM_ID_KEY);
}
