import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface JsonViewerProps {
  data: unknown;
  className?: string;
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function JsonViewer({ data, className = "" }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const text = pretty(data);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </button>
      <pre className="max-h-[60vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 pr-20 text-xs leading-relaxed text-slate-800">
        <code>{text}</code>
      </pre>
    </div>
  );
}
