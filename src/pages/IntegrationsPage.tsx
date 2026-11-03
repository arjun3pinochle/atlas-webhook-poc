import { useState } from "react";
import {
  Check,
  Copy,
  FlaskConical,
  Github,
  Info,
  Plug,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { INTEGRATIONS } from "@/services/integrations";
import type { IntegrationInfo } from "@/types";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" /> Copy
        </>
      )}
    </button>
  );
}

function IntegrationCard({
  integration,
  base,
}: {
  integration: IntegrationInfo;
  base: string;
}) {
  const isReal = integration.type === "real";
  const Icon = isReal ? Github : FlaskConical;

  const fullEndpoint = `${base}${integration.endpoint.replace(/^POST /, "")}`;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              isReal ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {integration.name}
            </h3>
            <p className="text-xs text-slate-500">{integration.category}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            isReal
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {isReal ? (
            <>
              <ShieldCheck className="h-3 w-3" /> Real integration
            </>
          ) : (
            <>
              <FlaskConical className="h-3 w-3" /> Simulated
            </>
          )}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-500">{integration.description}</p>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <code className="truncate font-mono text-xs text-slate-700">
            {integration.endpoint}
          </code>
          <CopyButton text={integration.endpoint} />
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <code className="truncate font-mono text-xs text-slate-700">
            {fullEndpoint}
          </code>
          <CopyButton text={fullEndpoint} />
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400">
          Event type header:{" "}
          <code className="font-mono text-slate-600">
            {integration.eventHeader}
          </code>
        </p>
      </div>
    </div>
  );
}

interface IntegrationsPageProps {
  backendBase: string;
}

export function IntegrationsPage({ backendBase }: IntegrationsPageProps) {
  const base = backendBase || "http://localhost:8000";

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
          <div>
            <p className="text-sm font-medium text-sky-900">
              How testing works
            </p>
            <p className="mt-1 text-sm text-sky-800">
              GitHub is the real webhook integration for this POC. The other
              sources are simulated — send their sample payloads with the
              included test script or curl commands. No integrations are shown
              as "connected" until events are actually received.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {INTEGRATIONS.map((integration) => (
          <IntegrationCard
            key={integration.key}
            integration={integration}
            base={base}
          />
        ))}
      </div>

      {/* <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-800">
            Test with the backend test script
          </h3>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          From the <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">backend</code> directory, with the server running:
        </p>
        <pre className="mt-3 overflow-auto rounded-lg border border-slate-200 bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
{`# Send all sample payloads
python3 test_webhooks.py

# Send only GitHub (signed)
python3 test_webhooks.py --only github --hmac YOUR_SECRET

# Send a subset
python3 test_webhooks.py --only crowdstrike,tenable`}
        </pre>
        <p className="mt-3 text-sm text-slate-500">
          Or use curl directly against{" "}
          <code className="font-mono text-xs text-slate-700">{base}</code>.
        </p>
      </div> */}

      {/* <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-800">
            Connect a real GitHub webhook
          </h3>
        </div>
        <ol className="mt-3 space-y-2 text-sm text-slate-600">
          <li>1. Create or open a GitHub repository.</li>
          <li>2. Go to Settings → Webhooks → Add webhook.</li>
          <li>3. Set the Payload URL to <code className="font-mono text-xs">{base}/webhooks/github</code>.</li>
          <li>4. Set Content type to <code className="font-mono text-xs">application/json</code>.</li>
          <li>5. Configure a webhook secret and set the same value as <code className="font-mono text-xs">GITHUB_WEBHOOK_SECRET</code> on the backend.</li>
          <li>6. Select the events to send (initially, "Just the push event").</li>
          <li>7. Save, then push a commit to the repository.</li>
          <li>8. Confirm the delivery in GitHub's "Recent Deliveries" and in the Atlas dashboard.</li>
        </ol>
        <p className="mt-3 text-xs text-slate-400">
          For local testing, expose the backend with ngrok:
          <code className="ml-1.5 font-mono text-slate-600">ngrok http 8000</code>
          and use the ngrok URL as the Payload URL.
        </p>
      </div> */}
    </div>
  );
}
