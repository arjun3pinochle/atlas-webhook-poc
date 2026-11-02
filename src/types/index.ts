export type SourceName =
  | "github"
  | "crowdstrike"
  | "entra-id"
  | "ninjaone"
  | "tenable"
  | "test";

export interface AtlasEvent {
  id: string;
  source: string;
  event_type: string;
  received_at: string;
  payload: {
    original: unknown;
  };
}

export interface EventsResponse {
  total: number;
  count: number;
  events: AtlasEvent[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  events_stored: number;
  github_signature_verification: boolean;
}

export type ConnectionStatus = "connected" | "disconnected" | "checking";

export type EventStatus = "verified" | "received" | "simulated";

export interface IntegrationInfo {
  key: SourceName;
  name: string;
  category: string;
  endpoint: string;
  type: "real" | "simulated";
  description: string;
  eventHeader: string;
}
