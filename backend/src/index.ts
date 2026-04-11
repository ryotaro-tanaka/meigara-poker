import { buildDeck } from "./lib/deck";
import {
  acknowledgeGameOver,
  applyPlayerAction,
  createPlayerRoomState,
  createRoomSnapshot,
  createStartedRoomState,
  isReadyThresholdMet,
  maybeFinalizeGame,
  removePlayerFromGame,
  setPlayerReady,
  type PlayerActionType,
  type PlayerState,
  type RoomState,
} from "./lib/game-progression";

interface RoomCreateRequest {
  roomName: string;
}

interface ClientEventBase {
  type: "join_room" | "set_name" | "set_participation" | "start_game" | "player_action" | "leave_room" | "acknowledge_game_over" | "set_ready" | "ping";
}

interface JoinRoomEvent extends ClientEventBase {
  type: "join_room";
  name?: string;
}

interface SetNameEvent extends ClientEventBase {
  type: "set_name";
  name?: string;
}

interface SetParticipationEvent extends ClientEventBase {
  type: "set_participation";
  participating: boolean;
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

interface LeaveRoomEvent extends ClientEventBase {
  type: "leave_room";
}

interface AcknowledgeGameOverEvent extends ClientEventBase {
  type: "acknowledge_game_over";
}

interface SetReadyEvent extends ClientEventBase {
  type: "set_ready";
  ready: boolean;
}

type ClientEvent =
  | JoinRoomEvent
  | SetNameEvent
  | SetParticipationEvent
  | StartGameEvent
  | PlayerActionEvent
  | LeaveRoomEvent
  | AcknowledgeGameOverEvent
  | SetReadyEvent
  | PingEvent;

interface Env {
  DB: D1Database;
  APP_NAME: string;
  FRONTEND_ORIGIN?: string;
  ROOMS: DurableObjectNamespace;
}

const ROOM_ID_LENGTH = 6;
const ROOM_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CORS_ALLOWED_METHODS = "GET,POST,OPTIONS";
const CORS_ALLOWED_HEADERS = "content-type";

type LogLevel = "info" | "warn" | "error";

interface RoomLogContext {
  roomId?: string;
  playerId?: string;
  phase?: string;
  action?: string;
  amount?: number | null;
  pot?: number;
  mainPot?: { amount: number; winnerPlayerIds?: string[] } | null;
  currentBet?: number;
  currentTurnPlayerId?: string | null;
  reason?: string;
  transition?: string;
  winners?: string[];
  payouts?: Array<{ playerId: string; amountWon: number }>;
  sidePots?: Array<{ amount: number; winnerPlayerIds?: string[] }>;
  positions?: {
    dealer: string | null;
    smallBlind: string | null;
    bigBlind: string | null;
  };
}

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

function isCorsRoute(pathname: string): boolean {
  if (pathname === "/health" || pathname === "/rooms") {
    return true;
  }

  if (/^\/rooms\/[A-Z0-9]+$/.test(pathname)) {
    return true;
  }

  if (/^\/rooms\/[A-Z0-9]+\/start$/.test(pathname)) {
    return true;
  }

  return false;
}

function getAllowedOrigin(request: Request, env: Env): string {
  const configuredOrigin = env.FRONTEND_ORIGIN?.trim();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  return request.headers.get("origin") ?? "*";
}

function withCors(response: Response, request: Request, env: Env): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", getAllowedOrigin(request, env));
  headers.set("Access-Control-Allow-Methods", CORS_ALLOWED_METHODS);
  headers.set("Access-Control-Allow-Headers", CORS_ALLOWED_HEADERS);
  headers.set("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function toLogContext(state?: RoomState | null, extra?: RoomLogContext): RoomLogContext {
  return {
    roomId: extra?.roomId ?? state?.roomId,
    playerId: extra?.playerId,
    phase: extra?.phase ?? state?.phase,
    action: extra?.action,
    amount: extra?.amount,
    pot: extra?.pot ?? state?.pot,
    mainPot: extra?.mainPot,
    currentBet: extra?.currentBet ?? state?.currentBet,
    currentTurnPlayerId: extra?.currentTurnPlayerId ?? state?.currentTurnPlayerId,
    reason: extra?.reason,
    transition: extra?.transition,
    winners: extra?.winners,
    payouts: extra?.payouts,
    sidePots: extra?.sidePots,
  };
}

function normalizePlayer(state: RoomState, playerId: string, name = ""): { state: RoomState; player: PlayerState; created: boolean } {
  const existing = state.players.find((player) => player.playerId === playerId);

  if (existing) {
    existing.connected = true;
    state.disconnectedPlayerIds = state.disconnectedPlayerIds.filter((candidate) => candidate !== playerId);
    if (state.phase === "waiting") {
      state.leftPlayerIds = state.leftPlayerIds.filter((candidate) => candidate !== playerId);
    }
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
  state.participatingPlayerIds = state.participatingPlayerIds.filter((candidate) => candidate !== playerId);
  return { state, player, created: true };
}

function getActiveParticipatingPlayerIds(state: RoomState): string[] {
  return state.players
    .filter(
      (player) =>
        player.connected &&
        state.participatingPlayerIds.includes(player.playerId) &&
        !state.leftPlayerIds.includes(player.playerId) &&
        !state.disconnectedPlayerIds.includes(player.playerId),
    )
    .map((player) => player.playerId);
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

  private log(level: LogLevel, event: string, context?: RoomLogContext): void {
    const payload = {
      scope: "room",
      event,
      level,
      timestamp: new Date().toISOString(),
      ...context,
    };

    const line = JSON.stringify(payload);

    if (level === "error") {
      console.error(line);
      return;
    }

    if (level === "warn") {
      console.warn(line);
      return;
    }

    console.log(line);
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
    if (state.phase !== "waiting") {
      throw new Error("start_game is only available from the waiting room.");
    }

    if (state.gameEnded) {
      throw new Error("Return to the waiting room before starting a new game.");
    }

    const activeParticipantPlayerIds = getActiveParticipatingPlayerIds(state);
    if (activeParticipantPlayerIds.length < 2 || activeParticipantPlayerIds.length > 6) {
      throw new Error("Game can start only with 2 to 6 participating players.");
    }

    const { deck, selectedIndustries } = await buildDeck(this.env.DB);
    const participatingPlayers = state.players.filter((player) => activeParticipantPlayerIds.includes(player.playerId));
    const nextState = createStartedRoomState({
      ...state,
      players: participatingPlayers,
      deck,
      selectedIndustries,
      participatingPlayerIds: activeParticipantPlayerIds,
      leftPlayerIds: state.leftPlayerIds.filter((playerId) => activeParticipantPlayerIds.includes(playerId)),
      disconnectedPlayerIds: state.disconnectedPlayerIds.filter((playerId) => activeParticipantPlayerIds.includes(playerId)),
    });

    await this.saveState(nextState);
    const room = createRoomSnapshot(nextState);
    this.log("info", "game_started", {
      ...toLogContext(nextState),
      mainPot: room.mainPot ? { amount: room.mainPot.amount } : null,
      sidePots: room.sidePots.map((sidePot) => ({ amount: sidePot.amount })),
      positions: room.positions,
    });
    this.broadcastGameStarted(nextState);
    return nextState;
  }

  private async maybeStartReadyHand(state: RoomState): Promise<RoomState | null> {
    if (state.phase !== "between_hands" || state.gameEnded || !isReadyThresholdMet(state)) {
      return null;
    }

    const { deck, selectedIndustries } = await buildDeck(this.env.DB);
    const nextState = createStartedRoomState({
      ...state,
      deck,
      selectedIndustries,
    });

    await this.saveState(nextState);
    const room = createRoomSnapshot(nextState);
    this.log("info", "game_started", {
      ...toLogContext(nextState),
      reason: "majority_ready",
      mainPot: room.mainPot ? { amount: room.mainPot.amount } : null,
      sidePots: room.sidePots.map((sidePot) => ({ amount: sidePot.amount })),
      positions: room.positions,
    });
    this.broadcastGameStarted(nextState);
    return nextState;
  }

  private async handlePlayerAction(state: RoomState, payload: PlayerActionEvent, playerId: string): Promise<void> {
    this.log("info", "player_action_received", toLogContext(state, {
      playerId,
      action: payload.action,
      amount: payload.amount ?? null,
    }));

    const previousPhase = state.phase;
    const nextState = applyPlayerAction(state, {
      playerId,
      action: payload.action,
      amount: payload.amount,
    });
    const finalState = maybeFinalizeGame(nextState);

    await this.saveState(finalState);
    this.log("info", "player_action_applied", toLogContext(finalState, {
      playerId,
      action: payload.action,
      amount: payload.amount ?? null,
    }));
    this.broadcastActionApplied(finalState, playerId, payload.action, payload.amount);

    const handFinished = finalState.phase === "between_hands" && finalState.results !== null;

    if (finalState.phase !== previousPhase && !handFinished && finalState.phase !== "showdown" && finalState.phase !== "between_hands") {
      this.log("info", "phase_advanced", toLogContext(finalState, {
        transition: `${previousPhase} -> ${finalState.phase}`,
      }));
      this.broadcastPhaseAdvanced(finalState);
    }

    if (handFinished) {
      this.log("info", "hand_finished", toLogContext(finalState, {
        transition: `${previousPhase} -> between_hands`,
        reason: finalState.gameOverReason ?? undefined,
        winners: finalState.results?.winners.map((winner) => winner.playerId) ?? [],
        payouts:
          finalState.results?.results.map((result) => ({
            playerId: result.playerId,
            amountWon: result.amountWon,
          })) ?? [],
        mainPot: finalState.results?.mainPot
          ? {
              amount: finalState.results.mainPot.amount,
              winnerPlayerIds: finalState.results.mainPot.winnerPlayerIds,
            }
          : null,
        sidePots:
          finalState.results?.sidePots.map((sidePot) => ({
            amount: sidePot.amount,
            winnerPlayerIds: sidePot.winnerPlayerIds,
          })) ?? [],
      }));
      this.broadcastGameResult(finalState);
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
        this.log("info", created ? "player_joined" : "player_updated", toLogContext(state, { playerId }));
        this.broadcastSharedSnapshot(created ? "player_joined" : "player_updated", state);
        this.broadcastRoomState(state);
      } catch (error) {
        this.log("warn", "player_join_rejected", toLogContext(state, {
          playerId,
          reason: error instanceof Error ? error.message : "Failed to join the room.",
        }));
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
      this.log("info", "player_updated", toLogContext(state, { playerId }));
      this.broadcastSharedSnapshot("player_updated", state);
      this.broadcastRoomState(state);
      return;
    }

    if (payload.type === "set_participation") {
      const player = state.players.find((item) => item.playerId === playerId);

      if (!player) {
        this.sendToPlayer(playerId, { type: "error", message: "Player has not joined the room yet." });
        return;
      }

      if (state.phase !== "waiting") {
        this.sendToPlayer(playerId, { type: "error", message: "Participation can only be changed in the waiting room." });
        return;
      }

      if (payload.participating) {
        if (!player.name.trim()) {
          this.sendToPlayer(playerId, { type: "error", message: "名前を入力してから参加してください。" });
          return;
        }

        if (!state.participatingPlayerIds.includes(playerId)) {
          state.participatingPlayerIds.push(playerId);
        }
      } else {
        state.participatingPlayerIds = state.participatingPlayerIds.filter((candidate) => candidate !== playerId);
      }

      await this.saveState(state);
      this.log("info", "player_updated", toLogContext(state, { playerId, reason: payload.participating ? "participating" : "not_participating" }));
      this.broadcastSharedSnapshot("player_updated", state);
      this.broadcastRoomState(state);
      return;
    }

    if (payload.type === "start_game") {
      if (state.phase !== "waiting") {
        this.sendToPlayer(playerId, {
          type: "error",
          message: "Use ready between hands. start_game is only available from the waiting room.",
        });
        return;
      }

      if (!state.participatingPlayerIds.includes(playerId)) {
        this.sendToPlayer(playerId, {
          type: "error",
          message: "本参加プレイヤーのみゲーム開始できます。",
        });
        return;
      }

      try {
        await this.startGame(state);
      } catch (error) {
        this.log("warn", "game_start_rejected", toLogContext(state, {
          playerId,
          reason: error instanceof Error ? error.message : "Failed to start game.",
        }));
        this.sendToPlayer(playerId, {
          type: "error",
          message: error instanceof Error ? error.message : "Failed to start game.",
        });
      }

      return;
    }

    if (payload.type === "set_ready") {
      try {
        const nextState = setPlayerReady(state, playerId, payload.ready);
        const startedState = await this.maybeStartReadyHand(nextState);

        if (!startedState) {
          await this.saveState(nextState);
          this.log("info", "player_ready_updated", toLogContext(nextState, {
            playerId,
            reason: payload.ready ? "ready" : "not_ready",
          }));
          this.broadcastRoomState(nextState);
        }
      } catch (error) {
        this.sendToPlayer(playerId, {
          type: "error",
          message: error instanceof Error ? error.message : "Failed to update ready state.",
        });
      }
      return;
    }

    if (payload.type === "leave_room") {
      const player = state.players.find((item) => item.playerId === playerId);

      if (!player) {
        this.sendToPlayer(playerId, { type: "error", message: "Player has not joined the room yet." });
        return;
      }

      player.connected = false;
      if (state.phase === "waiting" && !state.gameEnded) {
        state.participatingPlayerIds = state.participatingPlayerIds.filter((candidate) => candidate !== playerId);
      }
      const nextState = state.phase === "waiting" && !state.gameEnded ? state : maybeFinalizeGame(removePlayerFromGame(state, playerId, "left"));
      const startedState = await this.maybeStartReadyHand(nextState);

      if (startedState) {
        return;
      }

      await this.saveState(nextState);
      this.log("info", "player_left", toLogContext(nextState, { playerId }));
      this.broadcastSharedSnapshot("player_updated", nextState);
      this.broadcastRoomState(nextState);
      if (nextState.gameEnded) {
        this.broadcastGameResult(nextState);
      }
      return;
    }

    if (payload.type === "acknowledge_game_over") {
      if (!state.gameEnded) {
        this.sendToPlayer(playerId, { type: "error", message: "The game is not over yet." });
        return;
      }

      const nextState = acknowledgeGameOver(state);
      await this.saveState(nextState);
      this.log("info", "game_over_acknowledged", toLogContext(nextState, { playerId }));
      this.broadcastSharedSnapshot("player_updated", nextState);
      this.broadcastRoomState(nextState);
      return;
    }

    if (payload.type === "player_action") {
      try {
        await this.handlePlayerAction(state, payload, playerId);
      } catch (error) {
        this.log("warn", "player_action_rejected", toLogContext(state, {
          playerId,
          action: payload.action,
          amount: payload.amount ?? null,
          reason: error instanceof Error ? error.message : "Failed to apply action.",
        }));
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
        this.log("warn", "room_init_rejected", {
          roomId: body.roomId,
          playerId: body.playerId,
          reason: "Room already exists.",
        });
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
        leftPlayerIds: [],
        disconnectedPlayerIds: [],
        gameEnded: false,
        gameOverReason: null,
        finalStandings: [],
        readyPlayerIds: [],
        participatingPlayerIds: [],
      };

      await this.saveState(state);
      this.log("info", "room_created", {
        roomId: state.roomId,
        playerId: body.playerId,
        phase: state.phase,
      });
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
        this.log("warn", "player_join_rejected", toLogContext(state, {
          playerId,
          reason: "Cannot join after the game has started.",
        }));
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
          this.log("info", "player_joined", toLogContext(nextState, { playerId }));
          this.broadcastSharedSnapshot("player_joined", nextState);
        }
      } catch (error) {
        this.sessions.delete(playerId);
        this.log("warn", "player_join_rejected", toLogContext(state, {
          playerId,
          reason: error instanceof Error ? error.message : "Failed to join room.",
        }));
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
            let nextState = current;

            if (current.phase !== "waiting" || current.gameEnded) {
              nextState = maybeFinalizeGame(removePlayerFromGame(current, playerId, "disconnected"));
            }

            const startedState = await this.maybeStartReadyHand(nextState);

            if (startedState) {
              return;
            }

            await this.saveState(nextState);
            this.log("info", "player_disconnected", toLogContext(nextState, { playerId }));
            this.broadcastSharedSnapshot("player_updated", nextState);
            this.broadcastRoomState(nextState);
            if (nextState.gameEnded) {
              this.broadcastGameResult(nextState);
            }
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
    const respond = (response: Response): Response => withCors(response, request, env);

    if (request.method === "OPTIONS" && isCorsRoute(url.pathname)) {
      return respond(new Response(null, { status: 204 }));
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return respond(await handleHealth(env));
    }

    if (request.method === "POST" && url.pathname === "/rooms") {
      return respond(await handleRoomCreate(request, env));
    }

    const roomMatch = url.pathname.match(/^\/rooms\/([A-Z0-9]+)$/);

    if (request.method === "GET" && roomMatch) {
      return respond(await handleRoomSnapshot(request, env, roomMatch[1]));
    }

    const startMatch = url.pathname.match(/^\/rooms\/([A-Z0-9]+)\/start$/);

    if (request.method === "POST" && startMatch) {
      return respond(await handleRoomStart(request, env, startMatch[1]));
    }

    if (request.method === "GET" && url.pathname === "/ws") {
      return handleRoomWebSocket(request, env);
    }

    return respond(errorJson("Not found.", 404));
  },
} satisfies ExportedHandler<Env>;
