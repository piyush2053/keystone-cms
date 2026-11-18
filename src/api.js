// API client for the broker, developer and owner portals. Sessions are HttpOnly cookies set
// by the backend (one pair per portal); the custom header marks requests as coming from here.
import { useCallback, useEffect, useRef, useState } from "react";

const BASE = import.meta.env.VITE_API_BASE || "/api/v1";
const HEADERS = { "X-Keystone-Request": "1" };

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function send(path, { method, body, form } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method: method || (body || form ? "POST" : "GET"),
      credentials: "include",
      headers: form ? HEADERS : { ...HEADERS, "Content-Type": "application/json" },
      body: form || (body === undefined ? undefined : JSON.stringify(body)),
    });
  } catch {
    throw new ApiError("Can’t reach Keystone. Check your connection and try again.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new ApiError(
      data.message || (res.status >= 500 ? "Something went wrong on our side. Please try again." : "The request could not be completed."),
      res.status,
    );
  return data;
}

const refreshing = {};
/** Calls the API as one portal; a 401 triggers one silent refresh before giving up. */
export async function api(kind, path, opts) {
  try {
    return await send(path, opts);
  } catch (e) {
    if (e.status !== 401 || path.startsWith("/auth/")) throw e;
    refreshing[kind] =
      refreshing[kind] ||
      send("/auth/refresh", { body: { kind } }).finally(() => {
        refreshing[kind] = null;
      });
    try {
      await refreshing[kind];
    } catch {
      window.dispatchEvent(new CustomEvent("ks:signed-out", { detail: kind }));
      throw e;
    }
    return send(path, opts);
  }
}
export const login = (kind, login_id, password) => send("/auth/login", { body: { kind, login_id, password } });
export const logout = (kind) => send("/auth/logout", { body: { kind } }).catch(() => {});

// A shared "something changed" counter per portal, bumped by the live event stream.
const listeners = new Set();
let version = 0;
export function bump() {
  version++;
  listeners.forEach((l) => l(version));
}
export function useVersion() {
  const [v, setV] = useState(version);
  useEffect(() => {
    listeners.add(setV);
    return () => listeners.delete(setV);
  }, []);
  return v;
}
/** Subscribes to live changes for a signed-in portal (other tabs, agents in the field). */
export function useLive(kind, enabled) {
  useEffect(() => {
    if (!enabled || kind === "owner" || typeof EventSource === "undefined") return;
    let es;
    let timer;
    const open = () => {
      es = new EventSource(`${BASE}/${kind}/events`, { withCredentials: true });
      es.addEventListener("update", () => {
        clearTimeout(timer);
        timer = setTimeout(bump, 400);
      });
      es.onerror = () => {
        es.close();
        timer = setTimeout(open, 8000);
      };
    };
    open();
    const poll = setInterval(bump, 60000);
    return () => {
      es?.close();
      clearTimeout(timer);
      clearInterval(poll);
    };
  }, [kind, enabled]);
}

/** Loads `path` for a portal and reloads it whenever live data changes. */
export function useApi(kind, path, deps = []) {
  const v = useVersion();
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const seq = useRef(0);
  const load = useCallback(() => {
    if (!path) return;
    const n = ++seq.current;
    setState((s) => ({ ...s, loading: true }));
    api(kind, path)
      .then((data) => n === seq.current && setState({ data, error: null, loading: false }))
      .catch((error) => n === seq.current && setState((s) => ({ data: s.data, error, loading: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, path, ...deps]);
  useEffect(() => {
    load();
  }, [load, v]);
  return { ...state, reload: load };
}
