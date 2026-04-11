const ROOM_ID_PATTERN = /^[A-Z0-9]{6}$/;

export function resolveRoomIdFromInput(input: string): string | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.toUpperCase();
  if (ROOM_ID_PATTERN.test(normalized)) {
    return normalized;
  }

  try {
    const parsed = new URL(trimmed);
    const match = parsed.pathname.match(/^\/rooms\/([A-Z0-9]+)$/i);

    if (!match) {
      return null;
    }

    const roomId = match[1].toUpperCase();
    return ROOM_ID_PATTERN.test(roomId) ? roomId : null;
  } catch {
    return null;
  }
}
