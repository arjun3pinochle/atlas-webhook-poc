import type { EventsResponse, HealthResponse } from "@/types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

function resolveBase(): string {
  if (BASE_URL && BASE_URL.trim().length > 0) {
    return BASE_URL.replace(/\/$/, "");
  }
  return "";
}

class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = resolveBase();
  if (!base) {
    throw new ApiError(
      "Backend URL not configured. Set VITE_API_BASE_URL in your environment.",
    );
  }
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError("Could not reach the backend. Is it running?");
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      /* ignore */
    }
    throw new ApiError(detail, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getEvents(params?: { source?: string; event_type?: string }): Promise<EventsResponse> {
    const qs = new URLSearchParams();
    if (params?.source) qs.set("source", params.source);
    if (params?.event_type) qs.set("event_type", params.event_type);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<EventsResponse>(`/events${suffix}`);
  },
  getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>(`/health`);
  },
};

export { ApiError };
