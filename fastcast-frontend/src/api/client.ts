import axios, { AxiosError } from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"; 

// ──────────────────────────────────────────────────────────────
// Backend health probe
// Called once on app startup. Cached for the session.
// Services call shouldUseMocks() instead of USE_MOCKS directly.
// ──────────────────────────────────────────────────────────────
let _probeResult: boolean | null = null;      // null = not probed yet
let _probePromise: Promise<boolean> | null = null;

/** Returns true if the backend is reachable */
export async function checkBackendReachable(): Promise<boolean> {
  if (_probeResult !== null) return _probeResult;

  // Force-mock via env — skip probe entirely
  if ((import.meta.env.VITE_USE_MOCKS ?? "false") !== "false") {
    _probeResult = false;
    return false;
  }

  if (_probePromise) return _probePromise;

  _probePromise = axios
    .get(`${baseURL.replace("/api/v1", "")}/actuator/health`, { timeout: 3000 })
    .then(() => true)
    .catch(() => false)
    .then((ok) => {
      _probeResult = ok;
      _probePromise = null;
      return ok;
    });

  return _probePromise;
}

export function resetBackendStatus() {
  _probeResult = null;
  _probePromise = null;
}

export function isBackendReachable() {
  return _probeResult;
}

/**
 * shouldUseMocks()
 *
 * Async – waits for the health probe to resolve.
 * Services call this instead of USE_MOCKS so the decision is
 * made at request time, not at module load time.
 *
 * Usage in any service:
 *   if (await shouldUseMocks()) return mockDelay(mockData);
 */
export async function shouldUseMocks(): Promise<boolean> {
  const reachable = await checkBackendReachable();
  return !reachable;
}

// ──────────────────────────────────────────────────────────────
// Axios instance
// ──────────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL,
  timeout: 600000,
  withCredentials: true,
});

const TOKEN_KEY = "fastcast.token";
const REFRESH_KEY = "fastcast.refresh";

export const tokenStorage = {
  get: () => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null),
  getRefresh: () => (typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null),
  set: (t: string, r: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(REFRESH_KEY, r);
  },
  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

api.interceptors.request.use((cfg) => {
  const t = tokenStorage.get();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  const refresh = tokenStorage.getRefresh();
  if (!refresh) throw new Error("No refresh token");
  refreshPromise = axios
    .post(`${baseURL}/auth/refresh`, undefined, {
      headers: { "X-Refresh-Token": refresh },
      withCredentials: true,
    })
    .then((r) => {
      const d = r.data?.data ?? r.data;
      tokenStorage.set(d.token, d.refreshToken ?? refresh);
      return d.token as string;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const original = err.config as (typeof err.config & { _retry?: boolean }) | undefined;
    if (err.response?.status === 401 && original && !original._retry && tokenStorage.getRefresh()) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        tokenStorage.clear();
        if (typeof window !== "undefined") window.location.href = "/auth/login";
      }
    }
    return Promise.reject(err);
  },
);

// Kept for backward compat (static flag, false by default)
export const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? "false") !== "false";
