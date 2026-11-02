import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/services/api";
import type { ConnectionStatus, HealthResponse } from "@/types";

interface UseHealthResult {
  status: ConnectionStatus;
  health: HealthResponse | null;
  error: string | null;
  refresh: () => void;
}

export function useHealth(pollMs = 10000): UseHealthResult {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await api.getHealth();
      setHealth(res);
      setStatus(res.status === "ok" ? "connected" : "disconnected");
      setError(null);
    } catch (err) {
      setStatus("disconnected");
      setHealth(null);
      if (err instanceof ApiError) setError(err.message);
      else setError("Cannot reach the backend.");
    }
  }, []);

  useEffect(() => {
    check();
    const id = window.setInterval(check, pollMs);
    return () => window.clearInterval(id);
  }, [check, pollMs]);

  return { status, health, error, refresh: check };
}
