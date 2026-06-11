// Thin API client around the Express backend. Handles the CRM response
// envelope ({ message, data } | { items, pagination } | { message }) and
// surfaces a structured ApiError so `useActionError` can show human messages
// right next to the button (PRD §9.1/9.2).

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5002/api";
const TOKEN_KEY = "ill_cts_token";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

export async function api<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(BASE + path);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }

  const token = getToken();
  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    // 401 → session gone; bounce to login.
    if (res.status === 401 && typeof window !== "undefined") {
      clearToken();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    throw new ApiError(res.status, payload?.message ?? "Request failed", payload?.details);
  }

  return payload as T;
}

// Convenience wrappers matching the envelope shapes.
export const apiData = async <T>(path: string, opts?: RequestOptions): Promise<T> =>
  (await api<{ data: T }>(path, opts)).data;

export const apiList = <T>(path: string, opts?: RequestOptions): Promise<{ items: T[]; pagination: any }> =>
  api(path, opts);

export { BASE };
