import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "@/lib/api";

const ANON_ID_KEY = "edusphere:visitor-id";

function getOrCreateAnonymousId(): string {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

function detectDevice(): "DESKTOP" | "MOBILE" | "TABLET" | "OTHER" {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return "TABLET";
  if (/mobile|android|iphone/i.test(ua)) return "MOBILE";
  if (/win|mac|linux/i.test(ua)) return "DESKTOP";
  return "OTHER";
}

/**
 * Anonymous, cookie-free visitor session tracking for the public landing/explore
 * pages only. Never runs for authenticated app routes, never touches protected data.
 */
export function useVisitorTracking() {
  const location = useLocation();

  useEffect(() => {
    const anonymousId = getOrCreateAnonymousId();
    const started = sessionStorage.getItem("edusphere:visitor-session-started");
    if (!started) {
      sessionStorage.setItem("edusphere:visitor-session-started", "1");
      api
        .post("/visitor/session", { anonymousId, entryPage: location.pathname, deviceCategory: detectDevice() })
        .catch(() => undefined);
      window.addEventListener("beforeunload", () => {
        navigator.sendBeacon?.(
          "/api/v1/visitor/session/end",
          new Blob([JSON.stringify({ anonymousId, exitPage: location.pathname })], { type: "application/json" })
        );
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const anonymousId = getOrCreateAnonymousId();
    api.post("/visitor/pageview", { anonymousId, path: location.pathname }).catch(() => undefined);
  }, [location.pathname]);
}
