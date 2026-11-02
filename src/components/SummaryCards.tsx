import type { LucideIcon } from "lucide-react";
import { Activity, CalendarDays, Github, Plug } from "lucide-react";
import type { AtlasEvent } from "@/types";
import { isToday } from "@/services/integrations";

interface SummaryCardsProps {
  events: AtlasEvent[];
}

interface CardData {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
}

export function SummaryCards({ events }: SummaryCardsProps) {
  const total = events.length;
  const activeSources = new Set(events.map((e) => e.source)).size;
  const githubEvents = events.filter((e) => e.source === "github").length;
  const today = events.filter((e) => isToday(e.received_at)).length;

  const cards: CardData[] = [
    {
      label: "Total Events Received",
      value: total,
      icon: Activity,
      accent: "text-sky-700",
      iconBg: "bg-sky-50",
    },
    {
      label: "Active Sources",
      value: activeSources,
      icon: Plug,
      accent: "text-violet-700",
      iconBg: "bg-violet-50",
    },
    {
      label: "GitHub Events",
      value: githubEvents,
      icon: Github,
      accent: "text-slate-800",
      iconBg: "bg-slate-100",
    },
    {
      label: "Events Received Today",
      value: today,
      icon: CalendarDays,
      accent: "text-emerald-700",
      iconBg: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, accent, iconBg }) => (
        <div
          key={label}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {value}
              </p>
            </div>
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBg}`}
            >
              <Icon className={`h-5 w-5 ${accent}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
