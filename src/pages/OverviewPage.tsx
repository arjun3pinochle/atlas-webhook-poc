import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Cpu,
  FileJson,
  FlaskConical,
  Hourglass,
  ShieldCheck,
} from "lucide-react";
import { SummaryCards } from "@/components/SummaryCards";
import { EventsTable } from "@/components/EventsTable";
import { EventDetailsModal } from "@/components/EventDetailsModal";
import { useEvents } from "@/hooks/useEvents";
import type { AtlasEvent } from "@/types";
import type { PageKey } from "@/components/Sidebar";

interface OverviewPageProps {
  onNavigate: (page: PageKey) => void;
  githubSigEnabled: boolean;
}

export function OverviewPage({ onNavigate, githubSigEnabled }: OverviewPageProps) {
  const [selected, setSelected] = useState<AtlasEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { events, total, loading, error, lastUpdated } = useEvents({}, 5000);

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
    if (!q) return events;
    return events.filter(
      (e) =>
        e.id.toLowerCase().includes(q) || e.source.toLowerCase().includes(q),
    );
  }, [events, search]);

  const recent = filtered.slice(0, 8);

  const openEvent = (e: AtlasEvent) => {
    setSelected(e);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <SummaryCards events={events} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sky-600" />
            <h3 className="text-sm font-semibold text-slate-800">
              GitHub signature verification
            </h3>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Incoming GitHub webhooks are verified with HMAC SHA-256 when a secret is configured on the backend.
          </p>
          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${
              githubSigEnabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {githubSigEnabled ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" /> Enabled
              </>
            ) : (
              <>
                <CircleAlert className="h-3.5 w-3.5" /> Disabled (dev)
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-violet-600" />
            <h3 className="text-sm font-semibold text-slate-800">Storage</h3>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            In-memory store on the backend. Events are temporary and will be lost on restart or redeploy.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <Hourglass className="h-3.5 w-3.5" />
            <span>Currently storing {total} event{total === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-800">Test the receiver</h3>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Send sample payloads from each provider without setting up a real integration.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("integrations")}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            Go to Integrations <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileJson className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-800">Recent events</h2>
          </div>
          {lastUpdated && (
            <p className="text-xs text-slate-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <EventsTable
          events={recent}
          loading={loading}
          error={error}
          onSelect={openEvent}
          selectedId={selected?.id ?? null}
          search={search}
          onSearchChange={setSearch}
          sourceFilter=""
          onSourceFilterChange={() => {}}
          eventTypeFilter=""
          onEventTypeFilterChange={() => {}}
          sourceOptions={sourceOptions}
          eventTypeOptions={eventTypeOptions}
        />
        {events.length > recent.length && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => onNavigate("events")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              View all {events.length} events <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <EventDetailsModal
        event={selected}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
