import { Settings } from "lucide-react";

export function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Settings className="h-6 w-6 text-slate-400" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-800">
          Settings
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          This is a placeholder for the POC. In a full build, this is where
          you would configure backend URL, polling interval, retention, and
          notification preferences.
        </p>
      </div>
    </div>
  );
}
