import { buildDeck } from "./lib/deck";
import {
  applyPlayerAction,
  createPlayerRoomState,
  createRoomSnapshot,
  createStartedRoomState,
  type PlayerActionType,
  type PlayerState,
  type RoomState,
} from "./lib/game-progression";

interface RoomCreateRequest {
  roomName: string;
}

interface ClientEventBase {
  type: "join_room" | "set_name" | "start_game" | "player_action" | "ping";
}

interface JoinRoomEvent extends ClientEventBase {
  type: "join_room";
  name?: string;
}

interface SetNameEvent extends ClientEventBase {
  type: "set_name";
  name?: string;
}

interface StartGameEvent extends ClientEventBase {
  type: "start_game";
}

interface PlayerActionEvent extends ClientEventBase {
  type: "player_action";
  action: PlayerActionType;
  amount?: number;
}

interface PingEvent extends ClientEventBase {
  type: "ping";
}

type ClientEvent = JoinRoomEvent | SetNameEvent | StartGameEvent | PlayerActionEvent | PingEvent;

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
    if (name) {
      existing.name = name;
    }

    return { state, player: existing, created: false };
  }

  if (state.phase !== "waiting") {
    throw new Error("Cannot join after the game has started.");
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

  private sendToPlayer(playerId: string, payload: unknown): void {
    const socket = this.sessions.get(playerId);

    if (socket) {
      this.send(socket, payload);
    }
  }

  private sendRoomState(state: RoomState, playerId: string): void {
    this.sendToPlayer(playerId, {
      type: "room_state",
      ...createPlayerRoomState(state, playerId),
    });
  }

  private broadcastRoomState(state: RoomState): void {
    for (const player of state.players) {
      this.sendRoomState(state, player.playerId);
    }
  }

  private broadcastSharedSnapshot(eventType: "player_joined" | "player_updated", state: RoomState): void {
    const room = createRoomSnapshot(state);

    for (const socket of this.sessions.values()) {
      this.send(socket, {
        type: eventType,
        room,
      });
    }
  }

  private broadcastGameStarted(state: RoomState): void {
    for (const player of state.players) {
      this.sendToPlayer(player.playerId, {
        type: "game_started",
        roomId: state.roomId,
        phase: state.phase,
        selectedIndustries: state.selectedIndustries,
        playerCount: state.players.length,
      });
    }

    this.broadcastRoomState(state);
  }

  private broadcastActionApplied(state: RoomState, actorPlayerId: string, action: PlayerActionType, amount?: number): void {
    const room = createRoomSnapshot(state);

    for (const socket of this.sessions.values()) {
      this.send(socket, {
        type: "action_applied",
        actorPlayerId,
        action,
        amount: amount ?? null,
        phase: state.phase,
        room,
      });
    }

    this.broadcastRoomState(state);
  }

  private broadcastPhaseAdvanced(state: RoomState): void {
    const room = createRoomSnapshot(state);

    for (const socket of this.sessions.values()) {
      this.send(socket, {
        type: "phase_advanced",
        phase: state.phase,
        board: room.board,
        revealedCount: room.boardRevealCount,
        room,
      });
    }

    this.broadcastRoomState(state);
  }

  private broadcastGameResult(state: RoomState): void {
    const room = createRoomSnapshot(state);
    const winners = state.results?.winners ?? [];
    const results = state.results?.results ?? [];

    for (const player of state.players) {
      this.sendToPlayer(player.playerId, {
        type: "game_result",
        phase: state.phase,
        board: room.board,
        winners,
        results,
        room,
      });
    }

    this.broadcastRoomState(state);
  }

  private async startGame(state: RoomState): Promise<RoomState> {
    const { deck, selectedIndustries } = await buildDeck(this.env.DB);
    const nextState = createStartedRoomState({
      ...state,
      deck,
      selectedIndustries,
    });

    await this.saveState(nextState);
    this.broadcastGameStarted(nextState);
    return nextState;
  }

  private async handlePlayerAction(state: RoomState, payload: PlayerActionEvent, playerId: string): Promise<void> {
    const previousPhase = state.phase;
    const nextState = applyPlayerAction(state, {
      playerId,
      action: payload.action,
      amount: payload.amount,
    });

    await this.saveState(nextState);
    this.broadcastActionApplied(nextState, playerId, payload.action, payload.amount);

    if (nextState.phase !== previousPhase && nextState.phase !== "showdown") {
      this.broadcastPhaseAdvanced(nextState);
    }

    if (nextState.phase === "showdown") {
      this.broadcastGameResult(nextState);
    }
  }

  private async handleClientEvent(playerId: string, payload: ClientEvent): Promise<void> {
    const state = await this.loadState();

    if (!state) {
      return;
    }

    if (payload.type === "ping") {
      this.sendToPlayer(playerId, { type: "pong" });
      return;
    }

    if (payload.type === "join_room") {
      try {
        const { created } = normalizePlayer(state, playerId, payload.name?.trim() ?? "");
        await this.saveState(state);
        this.broadcastSharedSnapshot(created ? "player_joined" : "player_updated", state);
        this.broadcastRoomState(state);
      } catch (error) {
        this.sendToPlayer(playerId, {
          type: "error",
          message: error instanceof Error ? error.message : "Failed to join the room.",
        });
      }
      return;
    }

    if (payload.type === "set_name") {
      const player = state.players.find((item) => item.playerId === playerId);

      if (!player) {
        this.sendToPlayer(playerId, { type: "error", message: "Player has not joined the room yet." });
        return;
      }

      player.name = payload.name?.trim() ?? "";
      await this.saveState(state);
      this.broadcastSharedSnapshot("player_updated", state);
      this.broadcastRoomState(state);
      return;
    }

    if (payload.type === "start_game") {
      try {
        await this.startGame(state);
      } catch (error) {
        this.sendToPlayer(playerId, {
          type: "error",
          message: error instanceof Error ? error.message : "Failed to start game.",
        });
      }

      return;
    }

    if (payload.type === "player_action") {
      try {
        await this.handlePlayerAction(state, payload, playerId);
      } catch (error) {
        this.sendToPlayer(playerId, {
          type: "error",
          message: error instanceof Error ? error.message : "Failed to apply action.",
        });
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
        handsByPlayer: {},
        board: [],
        boardRevealCount: 0,
        results: null,
        createdAt: new Date().toISOString(),
        stacks: {},
        contributions: {},
        currentBets: {},
        pot: 0,
        sidePots: [],
        foldedPlayerIds: [],
        allInPlayerIds: [],
        dealerIndex: null,
        smallBlindIndex: null,
        bigBlindIndex: null,
        currentTurnPlayerId: null,
        currentBet: 0,
        minRaise: 2,
        lastAggressorPlayerId: null,
        availableActions: {},
        actionState: { playersToAct: [] },
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
        room: createRoomSnapshot(state),
      });
    }

    if (request.method === "POST" && url.pathname.endsWith("/start")) {
      try {
        const nextState = await this.startGame(state);

        return json({
          ok: true,
          roomId: nextState.roomId,
          phase: nextState.phase,
          selectedIndustries: nextState.selectedIndustries,
          playerCount: nextState.players.length,
          boardRevealCount: nextState.boardRevealCount,
          positions: createRoomSnapshot(nextState).positions,
          pot: nextState.pot,
          currentBet: nextState.currentBet,
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

      const existingPlayer = state.players.find((player) => player.playerId === playerId);

      if (!existingPlayer && state.phase !== "waiting") {
        return errorJson("Cannot join after the game has started.", 400);
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      this.sessions.set(playerId, server);

      let nextState = state;

      try {
        const normalized = normalizePlayer(state, playerId);
        nextState = normalized.state;
        await this.saveState(nextState);

        if (normalized.created) {
          this.broadcastSharedSnapshot("player_joined", nextState);
        }
      } catch (error) {
        this.sessions.delete(playerId);
        server.close(1011, error instanceof Error ? error.message : "Failed to join room.");
        return errorJson(error instanceof Error ? error.message : "Failed to join room.", 400);
      }

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
            this.broadcastSharedSnapshot("player_updated", current);
            this.broadcastRoomState(current);
          }
        })();
      });

      this.sendRoomState(nextState, playerId);

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
