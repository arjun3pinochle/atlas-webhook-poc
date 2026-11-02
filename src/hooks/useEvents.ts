import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/services/api";
import type { AtlasEvent } from "@/types";

interface UseEventsResult {
  events: AtlasEvent[];
  total: number;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useEvents(
  filters: { source?: string; event_type?: string } = {},
  pollMs = 5000,
): UseEventsResult {
  const [events, setEvents] = useState<AtlasEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.getEvents(filtersRef.current);
      setEvents(res.events);
      setTotal(res.total);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unexpected error while loading events.");
      }
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
    const id = window.setInterval(fetchEvents, pollMs);
    window.addEventListener("atlas:refresh", fetchEvents);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("atlas:refresh", fetchEvents);
    };
  }, [fetchEvents, pollMs, filters.source, filters.event_type]);

  return { events, total, loading, error, lastUpdated, refresh: fetchEvents };
}
