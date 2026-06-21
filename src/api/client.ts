import { clearApiKey, getApiKey } from "../auth/useApiKey";

// Docs list paths as `/v1/...` but the production gateway mounts them at
// `/api/v1/...`. Always hit the `/api` prefix.
const DEFAULT_BASE_URL = "https://flywheel.paradigma.inc/api";
const BASE_URL =
  (import.meta.env.VITE_FLYWHEEL_BASE_URL as string | undefined) ??
  DEFAULT_BASE_URL;

export class FlywheelApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(`${status}: ${detail}`);
    this.name = "FlywheelApiError";
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  const key = getApiKey();
  if (key) headers.set("Authorization", `Bearer ${key}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    clearApiKey();
    throw new FlywheelApiError(401, "Unauthorized — API key cleared.");
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail ?? body?.message ?? JSON.stringify(body);
    } catch {
      // not JSON; keep statusText
    }
    throw new FlywheelApiError(res.status, detail);
  }

  return (await res.json()) as T;
}
