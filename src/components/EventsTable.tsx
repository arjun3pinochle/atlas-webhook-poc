import { useMemo } from "react";
import { AlertCircle, Inbox, Search } from "lucide-react";
import type { AtlasEvent, EventStatus } from "@/types";
import { formatTimestamp, shortId, sourceLabel } from "@/services/integrations";

interface EventsTableProps {
  events: AtlasEvent[];
  loading: boolean;
  error: string | null;
  onSelect: (event: AtlasEvent) => void;
  selectedId?: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  eventTypeFilter: string;
  onEventTypeFilterChange: (value: string) => void;
  sourceOptions: string[];
  eventTypeOptions: string[];
}

function statusFor(event: AtlasEvent): EventStatus {
  if (event.source === "github" || event.source === "test") return "verified";
  return "simulated";
}

function StatusBadge({ event }: { event: AtlasEvent }) {
  const status = statusFor(event);
  const map: Record<EventStatus, { label: string; cls: string }> = {
    verified: {
      label: "Verified",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    received: {
      label: "Received",
      cls: "bg-sky-50 text-sky-700 border-sky-200",
    },
    simulated: {
      label: "Simulated",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
  };
  const { label, cls } = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
      {sourceLabel(source)}
    </span>
  );
}

export function EventsTable({
  events,
  loading,
  error,
  onSelect,
  selectedId,
  search,
  onSearchChange,
  sourceFilter,
  onSourceFilterChange,
  eventTypeFilter,
  onEventTypeFilterChange,
  sourceOptions,
  eventTypeOptions,
}: EventsTableProps) {
  const selectCls =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

  const filters = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by event ID or source…"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <select
        value={sourceFilter}
        onChange={(e) => onSourceFilterChange(e.target.value)}
        className={selectCls}
        aria-label="Filter by source"
      >
        <option value="">All sources</option>
        {sourceOptions.map((s) => (
          <option key={s} value={s}>
            {sourceLabel(s)}
          </option>
        ))}
      </select>
      <select
        value={eventTypeFilter}
        onChange={(e) => onEventTypeFilterChange(e.target.value)}
        className={selectCls}
        aria-label="Filter by event type"
      >
        <option value="">All event types</option>
        {eventTypeOptions.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );

  const body = useMemo(() => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" />
            Loading events…
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
          <AlertCircle className="h-8 w-8 text-rose-500" />
          <p className="text-sm font-medium text-rose-600">Failed to load events</p>
          <p className="max-w-md text-sm text-slate-500">{error}</p>
        </div>
      );
    }
    if (events.length === 0) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Inbox className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">No events yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Send a test webhook or configure a real integration to see events appear here.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Event ID</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Event Type</th>
              <th className="px-4 py-3 font-medium">Received At</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((event) => {
              const isSelected = selectedId === event.id;
              return (
                <tr
                  key={event.id}
                  className={`cursor-pointer transition hover:bg-slate-50 ${
                    isSelected ? "bg-sky-50" : ""
                  }`}
                  onClick={() => onSelect(event)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {shortId(event.id)}
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge source={event.source} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{event.event_type}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatTimestamp(event.received_at)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge event={event} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(event);
                      }}
                      className="rounded-md px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-50"
                    >
                      View details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }, [events, loading, error, selectedId, onSelect]);

  return (
    <div className="space-y-4">
      {filters}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {body}
      </div>
      <p className="text-xs text-slate-400">
        Showing {events.length} event{events.length === 1 ? "" : "s"}. Auto-refreshes every 5 seconds.
      </p>
    </div>
  );
}
