import { useMemo, useState } from "react";
import { Sidebar, type PageKey } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { OverviewPage } from "@/pages/OverviewPage";
import { EventsPage } from "@/pages/EventsPage";
import { IntegrationsPage } from "@/pages/IntegrationsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { useHealth } from "@/hooks/useHealth";

const PAGE_META: Record<PageKey, { title: string; description: string }> = {
  overview: {
    title: "Overview",
    description:
      "Real-time summary of events received by the Atlas webhook receiver.",
  },
  events: {
    title: "Events",
    description: "Browse and inspect every event captured by the receiver.",
  },
  integrations: {
    title: "Integrations",
    description: "Configure webhook sources and test the receiver.",
  },
  settings: {
    title: "Settings",
    description: "Application configuration (POC placeholder).",
  },
};

function App() {
  const [page, setPage] = useState<PageKey>("overview");
  const { status, health, refresh: refreshHealth } = useHealth(10000);

  const backendBase = useMemo(() => {
    const v = import.meta.env.VITE_API_BASE_URL as string | undefined;
    return v && v.trim() ? v.replace(/\/$/, "") : "http://localhost:8000";
  }, []);

  const meta = PAGE_META[page];
  const githubSigEnabled = !!health?.github_signature_verification;

  const onRefresh = () => {
    refreshHealth();
    // The active events page listens for this event and fetches immediately.
    window.dispatchEvent(new CustomEvent("atlas:refresh"));
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar active={page} onNavigate={setPage} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={meta.title}
          description={meta.description}
          status={status}
          onRefresh={onRefresh}
          refreshing={status === "checking"}
        />
        <main className="flex-1 overflow-y-auto">
          {page === "overview" && (
            <OverviewPage
              onNavigate={setPage}
              githubSigEnabled={githubSigEnabled}
            />
          )}
          {page === "events" && <EventsPage />}
          {page === "integrations" && (
            <IntegrationsPage backendBase={backendBase} />
          )}
          {page === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
