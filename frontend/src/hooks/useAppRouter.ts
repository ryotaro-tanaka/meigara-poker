import { useEffect, useState } from "react";
import { navigateTo, parseRoute, type AppRoute } from "../lib/router";

export function useAppRouter(): { route: AppRoute; navigate: (pathname: string) => void } {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(window.location.pathname));

  useEffect(() => {
    function handlePopState(): void {
      setRoute(parseRoute(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return {
    route,
    navigate: navigateTo,
  };
}
