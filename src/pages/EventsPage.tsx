import { useMemo, useState } from "react";
import { EventsTable } from "@/components/EventsTable";
import { EventDetailsModal } from "@/components/EventDetailsModal";
import { useEvents } from "@/hooks/useEvents";
import type { AtlasEvent } from "@/types";

export function EventsPage() {
  const [selected, setSelected] = useState<AtlasEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");

  const { events, loading, error, lastUpdated } = useEvents({}, 5000);

  // Build filter option lists from the full event set (ignoring current text search).
  const sourceOptions = useMemo(
    () => Array.from(new Set(events.map((e) => e.source))).sort(),
    [events],
  );
  const eventTypeOptions = useMemo(
    () => Array.from(new Set(events.map((e) => e.event_type))).sort(),
    [events],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (q && !e.id.toLowerCase().includes(q) && !e.source.toLowerCase().includes(q)) {
        return false;
      }
      if (sourceFilter && e.source !== sourceFilter) return false;
      if (
        eventTypeFilter &&
        e.event_type.toLowerCase() !== eventTypeFilter.toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [events, search, sourceFilter, eventTypeFilter]);

  const openEvent = (e: AtlasEvent) => {
    setSelected(e);
    setModalOpen(true);
  };

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">All received events</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Events are polled from the backend every 5 seconds.
          </p>
        </div>
        {lastUpdated && (
          <p className="text-xs text-slate-400">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      <EventsTable
        events={filtered}
        loading={loading}
        error={error}
        onSelect={openEvent}
        selectedId={selected?.id ?? null}
        search={search}
        onSearchChange={setSearch}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        eventTypeFilter={eventTypeFilter}
        onEventTypeFilterChange={setEventTypeFilter}
        sourceOptions={sourceOptions}
        eventTypeOptions={eventTypeOptions}
      />

      <EventDetailsModal
        event={selected}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
