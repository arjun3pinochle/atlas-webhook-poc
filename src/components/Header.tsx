import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import type { ConnectionStatus } from "@/types";

interface HeaderProps {
  title: string;
  description: string;
  status: ConnectionStatus;
  onRefresh: () => void;
  refreshing?: boolean;
}

export function Header({
  title,
  description,
  status,
  onRefresh,
  refreshing = false,
}: HeaderProps) {
  const connected = status === "connected";
  const checking = status === "checking";

  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
            connected
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : checking
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {connected ? (
            <Wifi className="h-3.5 w-3.5" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" />
          )}
          <span>
            {connected
              ? "Backend connected"
              : checking
                ? "Checking backend…"
                : "Backend disconnected"}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>
    </header>
  );
}

export function LastUpdated({ lastUpdated }: { lastUpdated: Date | null }) {
  if (!lastUpdated) return null;
  return (
    <p className="text-xs text-slate-400">
      Updated {lastUpdated.toLocaleTimeString()}
    </p>
  );
}
