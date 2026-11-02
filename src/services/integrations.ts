import type { IntegrationInfo } from "@/types";

export const INTEGRATIONS: IntegrationInfo[] = [
  {
    key: "github",
    name: "GitHub",
    category: "Source Control",
    endpoint: "POST /webhooks/github",
    type: "real",
    description:
      "Real webhook integration. Receives repository events such as push and pull requests. Signature verified with HMAC SHA-256 when a secret is configured.",
    eventHeader: "X-GitHub-Event",
  },
  {
    key: "crowdstrike",
    name: "CrowdStrike",
    category: "EDR / Security",
    endpoint: "POST /webhooks/crowdstrike",
    type: "simulated",
    description:
      "Simulated source for the POC. Sends detection summary events. Configure a CrowdStrike Falcon streaming connector to forward real detections.",
    eventHeader: "X-CS-Event-Type",
  },
  {
    key: "entra-id",
    name: "Microsoft Entra ID",
    category: "Identity",
    endpoint: "POST /webhooks/entra-id",
    type: "simulated",
    description:
      "Simulated source for the POC. Receives sign-in and audit events from Microsoft Entra ID.",
    eventHeader: "X-Entra-Event-Type",
  },
  {
    key: "ninjaone",
    name: "NinjaOne",
    category: "RMM",
    endpoint: "POST /webhooks/ninjaone",
    type: "simulated",
    description:
      "Simulated source for the POC. Receives device alerts and status events from NinjaOne.",
    eventHeader: "X-NinjaOne-Event",
  },
  {
    key: "tenable",
    name: "Tenable",
    category: "Vulnerability",
    endpoint: "POST /webhooks/tenable",
    type: "simulated",
    description:
      "Simulated source for the POC. Receives vulnerability findings from Tenable scans.",
    eventHeader: "X-Tenable-Event-Type",
  },
];

export const SOURCE_LABELS: Record<string, string> = {
  github: "GitHub",
  crowdstrike: "CrowdStrike",
  "entra-id": "Microsoft Entra ID",
  ninjaone: "NinjaOne",
  tenable: "Tenable",
  test: "Test",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

export function isToday(iso: string): boolean {
  // received_at format: 2026-11-02T10:30:00Z
  const day = iso.slice(0, 10);
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return day === `${yyyy}-${mm}-${dd}`;
}

export function shortId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

export function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}
