export interface Env {
  DB: D1Database;
  APP_NAME: string;
}

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    ...init,
  });
}

async function handleHealth(env: Env): Promise<Response> {
  const result = await env.DB.prepare("SELECT COUNT(*) AS count FROM stocks").first<{ count: number }>();

  return json({
    ok: true,
    app: env.APP_NAME,
    stocksCount: result?.count ?? 0,
  });
}

async function handleGameStart(): Promise<Response> {
  return json(
    {
      ok: false,
      message: "Game start is not implemented yet.",
    },
    { status: 501 },
  );
}

async function handleGameState(): Promise<Response> {
  return json(
    {
      ok: false,
      message: "Game state fetch is not implemented yet.",
    },
    { status: 501 },
  );
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return handleHealth(env);
    }

    if (request.method === "POST" && url.pathname === "/games/start") {
      return handleGameStart();
    }

    if (request.method === "GET" && url.pathname.startsWith("/games/")) {
      return handleGameState();
    }

    if (request.method === "GET" && url.pathname === "/ws") {
      return json(
        {
          ok: false,
          message: "WebSocket entry is not implemented yet.",
        },
        { status: 501 },
      );
    }

    return json(
      {
        ok: false,
        message: "Not found.",
      },
      { status: 404 },
    );
  },
} satisfies ExportedHandler<Env>;
