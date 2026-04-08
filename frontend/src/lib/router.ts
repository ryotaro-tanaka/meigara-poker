export type AppRoute = { kind: "home" } | { kind: "room"; roomId: string };

function normalizePathname(pathname: string): string {
  if (!pathname) {
    return "/";
  }

  return pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
}

export function parseRoute(pathname: string): AppRoute {
  const normalized = normalizePathname(pathname);
  const match = normalized.match(/^\/rooms\/([A-Z0-9]+)$/);

  if (match) {
    return {
      kind: "room",
      roomId: match[1],
    };
  }

  return {
    kind: "home",
  };
}

export function navigateTo(pathname: string): void {
  window.history.pushState({}, "", pathname);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
