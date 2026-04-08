import { buildDeck, type DeckCard } from "./lib/deck";

interface PlayerState {
  playerId: string;
  name: string;
  joinedAt: string;
  connected: boolean;
}

type RoomPhase = "waiting" | "started";

interface RoomState {
  roomId: string;
  roomName: string;
  players: PlayerState[];
  phase: RoomPhase;
  deck: DeckCard[];
  selectedIndustries: string[];
  createdAt: string;
}

interface RoomSnapshot {
  roomId: string;
  roomName: string;
  phase: RoomPhase;
  players: PlayerState[];
  playerCount: number;
  selectedIndustries: string[];
  deckCount: number;
  createdAt: string;
}

interface RoomCreateRequest {
  roomName: string;
}

interface ClientEvent {
  type: "join_room" | "set_name" | "start_game" | "ping";
  name?: string;
}

interface Env {
  DB: D1Database;
  APP_NAME: string;
  ROOMS: DurableObjectNamespace;
}

const ROOM_ID_LENGTH = 6;
const ROOM_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    ...init,
  });
}

function errorJson(message: string, status = 400): Response {
  return json(
    {
      ok: false,
      message,
    },
    { status },
  );
}

function normalizePlayer(state: RoomState, playerId: string, name = ""): { state: RoomState; player: PlayerState; created: boolean } {
  const existing = state.players.find((player) => player.playerId === playerId);

  if (existing) {
    existing.connected = true;
    return { state, player: existing, created: false };
  }

  const player: PlayerState = {
    playerId,
    name,
    joinedAt: new Date().toISOString(),
    connected: true,
  };

  state.players.push(player);
  return { state, player, created: true };
}

function makeSnapshot(state: RoomState): RoomSnapshot {
  return {
    roomId: state.roomId,
    roomName: state.roomName,
    phase: state.phase,
    players: state.players,
    playerCount: state.players.length,
    selectedIndustries: state.selectedIndustries,
    deckCount: state.deck.length,
    createdAt: state.createdAt,
  };
}

function makeRoomId(): string {
  let roomId = "";

  for (let i = 0; i < ROOM_ID_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * ROOM_ID_CHARS.length);
    roomId += ROOM_ID_CHARS[index];
  }

  return roomId;
}

async function readJson<T>(request: Request): Promise<T | null> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return null;
  }

  return (await request.json()) as T;
}

function getRoomStub(env: Env, roomId: string) {
  const id = env.ROOMS.idFromName(roomId);
  return env.ROOMS.get(id);
}

async function handleHealth(env: Env): Promise<Response> {
  const result = await env.DB.prepare("SELECT COUNT(*) AS count FROM stocks").first<{ count: number }>();

  return json({
    ok: true,
    app: env.APP_NAME,
    stocksCount: result?.count ?? 0,
  });
}

async function handleRoomCreate(request: Request, env: Env): Promise<Response> {
  const body = await readJson<RoomCreateRequest>(request);
  const roomName = body?.roomName?.trim();

  if (!roomName) {
    return errorJson("roomName is required.");
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const roomId = makeRoomId();
    const playerId = crypto.randomUUID();
    const stub = getRoomStub(env, roomId);
    const initResponse = await stub.fetch("https://room/init", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ roomId, roomName, playerId }),
    });

    if (initResponse.status === 409) {
      continue;
    }

    if (!initResponse.ok) {
      const payload = (await initResponse.json()) as { message?: string };
      return errorJson(payload.message ?? "Failed to create room.", initResponse.status);
    }

    return json({
      ok: true,
      roomId,
      roomName,
      playerId,
      roomUrl: `${new URL(request.url).origin}/rooms/${roomId}`,
    });
  }

  return errorJson("Failed to allocate roomId.", 500);
}

async function handleRoomSnapshot(request: Request, env: Env, roomId: string): Promise<Response> {
  const stub = getRoomStub(env, roomId);
  return stub.fetch(new Request(`https://room/rooms/${roomId}`, request));
}

async function handleRoomStart(request: Request, env: Env, roomId: string): Promise<Response> {
  const stub = getRoomStub(env, roomId);
  return stub.fetch(
    new Request(`https://room/rooms/${roomId}/start`, {
      method: "POST",
      headers: request.headers,
      body: request.body,
    }),
  );
}

async function handleRoomWebSocket(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId")?.trim();
  const playerId = url.searchParams.get("playerId")?.trim();

  if (!roomId || !playerId) {
    return errorJson("roomId and playerId are required.", 400);
  }

  const stub = getRoomStub(env, roomId);
  return stub.fetch(new Request(`https://room/ws?roomId=${roomId}&playerId=${playerId}`, request));
}

export class RoomDurableObject {
  private ctx: DurableObjectState;
  private env: Env;
  private sessions = new Map<string, WebSocket>();

  constructor(ctx: DurableObjectState, env: Env) {
    this.ctx = ctx;
    this.env = env;
  }

  private async loadState(): Promise<RoomState | null> {
    return (await this.ctx.storage.get<RoomState>("roomState")) ?? null;
  }

  private async saveState(state: RoomState): Promise<void> {
    await this.ctx.storage.put("roomState", state);
  }

  private send(socket: WebSocket, payload: unknown): void {
    socket.send(JSON.stringify(payload));
  }

  private broadcast(payload: unknown): void {
    const message = JSON.stringify(payload);

    for (const socket of this.sessions.values()) {
      socket.send(message);
    }
  }

  private async startGame(state: RoomState): Promise<RoomState> {
    if (state.phase !== "waiting") {
      throw new Error("Game has already started.");
    }

    if (state.players.length < 2 || state.players.length > 6) {
      throw new Error("Game can start only with 2 to 6 players.");
    }

    const { deck, selectedIndustries } = await buildDeck(this.env.DB);
    state.phase = "started";
    state.deck = deck;
    state.selectedIndustries = selectedIndustries;
    await this.saveState(state);
    return state;
  }

  private async handleClientEvent(playerId: string, payload: ClientEvent): Promise<void> {
    const state = await this.loadState();

    if (!state) {
      return;
    }

    if (payload.type === "ping") {
      const socket = this.sessions.get(playerId);
      if (socket) {
        this.send(socket, { type: "pong" });
      }
      return;
    }

    if (payload.type === "join_room") {
      const { created } = normalizePlayer(state, playerId, payload.name?.trim() ?? "");
      await this.saveState(state);
      this.broadcast({
        type: created ? "player_joined" : "player_updated",
        room: makeSnapshot(state),
      });
      return;
    }

    if (payload.type === "set_name") {
      const player = state.players.find((item) => item.playerId === playerId);
      if (!player) {
        const socket = this.sessions.get(playerId);
        if (socket) {
          this.send(socket, { type: "error", message: "Player has not joined the room yet." });
        }
        return;
      }
      player.name = payload.name?.trim() ?? "";
      await this.saveState(state);
      this.broadcast({
        type: "player_updated",
        room: makeSnapshot(state),
      });
      return;
    }

    if (payload.type === "start_game") {
      try {
        const nextState = await this.startGame(state);
        this.broadcast({
          type: "game_started",
          roomId: nextState.roomId,
          phase: nextState.phase,
          selectedIndustries: nextState.selectedIndustries,
          deckCount: nextState.deck.length,
        });
      } catch (error) {
        const socket = this.sessions.get(playerId);
        if (socket) {
          this.send(socket, {
            type: "error",
            message: error instanceof Error ? error.message : "Failed to start game.",
          });
        }
      }
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/init") {
      const body = (await readJson<{ roomId: string; roomName: string; playerId: string }>(request)) ?? null;

      if (!body?.roomId || !body.roomName || !body.playerId) {
        return errorJson("roomId, roomName and playerId are required.");
      }

      const existing = await this.loadState();
      if (existing) {
        return errorJson("Room already exists.", 409);
      }

      const state: RoomState = {
        roomId: body.roomId,
        roomName: body.roomName,
        players: [],
        phase: "waiting",
        deck: [],
        selectedIndustries: [],
        createdAt: new Date().toISOString(),
      };

      await this.saveState(state);
      return json({
        ok: true,
        roomId: state.roomId,
      });
    }

    const state = await this.loadState();
    if (!state) {
      return errorJson("Room not found.", 404);
    }

    if (request.method === "GET" && url.pathname.startsWith("/rooms/")) {
      return json({
        ok: true,
        room: makeSnapshot(state),
      });
    }

    if (request.method === "POST" && url.pathname.endsWith("/start")) {
      try {
        const nextState = await this.startGame(state);
        this.broadcast({
          type: "game_started",
          roomId: nextState.roomId,
          phase: nextState.phase,
          selectedIndustries: nextState.selectedIndustries,
          deckCount: nextState.deck.length,
        });

        return json({
          ok: true,
          roomId: nextState.roomId,
          phase: nextState.phase,
          selectedIndustries: nextState.selectedIndustries,
          deckCount: nextState.deck.length,
        });
      } catch (error) {
        return errorJson(error instanceof Error ? error.message : "Failed to start game.", 400);
      }
    }

    if (request.method === "GET" && url.pathname === "/ws") {
      const playerId = url.searchParams.get("playerId")?.trim();

      if (!playerId) {
        return errorJson("playerId is required.", 400);
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      this.sessions.set(playerId, server);

      const { state: nextState } = normalizePlayer(state, playerId);
      await this.saveState(nextState);

      server.addEventListener("message", (event) => {
        void this.handleClientEvent(playerId, JSON.parse(String(event.data)) as ClientEvent);
      });

      server.addEventListener("close", () => {
        this.sessions.delete(playerId);
        void (async () => {
          const current = await this.loadState();
          if (!current) {
            return;
          }
          const player = current.players.find((item) => item.playerId === playerId);
          if (player) {
            player.connected = false;
            await this.saveState(current);
            this.broadcast({
              type: "player_updated",
              room: makeSnapshot(current),
            });
          }
        })();
      });

      this.send(server, {
        type: "room_state",
        room: makeSnapshot(nextState),
      });

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return errorJson("Not found.", 404);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return handleHealth(env);
    }

    if (request.method === "POST" && url.pathname === "/rooms") {
      return handleRoomCreate(request, env);
    }

    const roomMatch = url.pathname.match(/^\/rooms\/([A-Z0-9]+)$/);
    if (request.method === "GET" && roomMatch) {
      return handleRoomSnapshot(request, env, roomMatch[1]);
    }

    const startMatch = url.pathname.match(/^\/rooms\/([A-Z0-9]+)\/start$/);
    if (request.method === "POST" && startMatch) {
      return handleRoomStart(request, env, startMatch[1]);
    }

    if (request.method === "GET" && url.pathname === "/ws") {
      return handleRoomWebSocket(request, env);
    }

    return errorJson("Not found.", 404);
  },
} satisfies ExportedHandler<Env>;
