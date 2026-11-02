import type { ReactNode } from "react";
import {
  Activity,
  Github,
  LayoutDashboard,
  Plug,
  Settings,
  ShieldCheck,
} from "lucide-react";

export type PageKey = "overview" | "events" | "integrations" | "settings";

interface SidebarProps {
  active: PageKey;
  onNavigate: (page: PageKey) => void;
}

const NAV: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "events", label: "Events", icon: Activity },
  { key: "integrations", label: "Integrations", icon: Plug },
  { key: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 shadow-md">
          <ShieldCheck className="h-5 w-5 text-slate-900" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Atlas</p>
          <p className="text-[11px] text-slate-400">Universal Data Connector</p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2.5">
          <Github className="h-4 w-4 text-slate-400" />
          <div className="leading-tight">
            <p className="text-xs font-medium text-slate-200">GitHub integration</p>
            <p className="text-[11px] text-slate-400">Real webhook enabled</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function SidebarWrapper({ children }: { children: ReactNode }) {
  return <div className="hidden md:flex">{children}</div>;
}
