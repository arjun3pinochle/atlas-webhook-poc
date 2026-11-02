"""
Atlas – Universal Data Connector
Generic webhook receiver backend (FastAPI).

Receives events from multiple external platforms through a single
HTTP endpoint pattern (POST /webhooks/{source}), wraps each payload in
a common event structure, stores it in memory, and exposes a REST API
for the dashboard to consume.

NOTE: Events are stored in-memory only. They are lost when the process
restarts or redeploys.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

load_dotenv()

GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET", "").strip()

FRONTEND_URL = os.getenv("FRONTEND_URL", "").strip()

# Origins allowed through CORS. In production the FRONTEND_URL env var must be
# set to the deployed frontend URL. Local Vite/dev origins are always allowed
# for development convenience.
DEV_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
]

allowed_origins: list[str] = list(DEV_ORIGINS)
if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL.rstrip("/"))

# Sources we recognise. Anything else is still accepted (the receiver is
# generic) but is labelled "unknown" in the dashboard so operators can spot
# misconfigured senders.
KNOWN_SOURCES = {
    "github",
    "crowdstrike",
    "entra-id",
    "ninjaone",
    "tenable",
    "test",
}

# Headers (lowercased) used to derive an event type per source when present.
EVENT_TYPE_HEADERS: dict[str, str] = {
    "github": "x-github-event",
    "crowdstrike": "x-cs-event-type",
    "entra-id": "x-entra-event-type",
    "ninjaone": "x-ninjaone-event",
    "tenable": "x-tenable-event-type",
    "test": "x-test-event",
}

# --------------------------------------------------------------------------- #
# In-memory storage
# --------------------------------------------------------------------------- #

events: list[dict[str, Any]] = []

# --------------------------------------------------------------------------- #
# Models
# --------------------------------------------------------------------------- #


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    events_stored: int
    github_signature_verification: bool


class WebhookAck(BaseModel):
    status: str
    event_id: str
    source: str
    event_type: str
    received_at: str


class EventsResponse(BaseModel):
    total: int
    count: int
    events: list[dict[str, Any]]


# --------------------------------------------------------------------------- #
# App
# --------------------------------------------------------------------------- #

app = FastAPI(
    title="Atlas – Universal Data Connector",
    description="Generic webhook receiver that normalises events from many platforms into a common structure.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _detect_event_type(source: str, headers: dict[str, str]) -> str:
    header_name = EVENT_TYPE_HEADERS.get(source)
    if header_name:
        value = headers.get(header_name)
        if value:
            return value
    # Fall back to common heuristic fields present in many payloads.
    return "unknown"


def _github_signature_ok(secret: str, raw_body: bytes, provided: str | None) -> bool:
    if not provided:
        return False
    expected = "sha256=" + hmac.new(
        secret.encode("utf-8"), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, provided)


def _store_event(source: str, event_type: str, payload: Any) -> dict[str, Any]:
    event = {
        "id": secrets.token_hex(12),
        "source": source,
        "event_type": event_type,
        "received_at": _utc_now_iso(),
        "payload": {"original": payload},
    }
    events.append(event)
    return event


# --------------------------------------------------------------------------- #
# Health
# --------------------------------------------------------------------------- #


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        timestamp=_utc_now_iso(),
        events_stored=len(events),
        github_signature_verification=bool(GITHUB_WEBHOOK_SECRET),
    )


# --------------------------------------------------------------------------- #
# Generic webhook receiver
# --------------------------------------------------------------------------- #


@app.post("/webhooks/{source}", response_model=WebhookAck)
async def receive_webhook(
    source: str,
    request: Request,
    x_hub_signature_256: str | None = Header(default=None, alias="X-Hub-Signature-256"),
) -> WebhookAck:
    source = source.lower().strip()

    raw_body = await request.body()

    # Parse JSON. Reject if the body is not valid JSON — we promised to
    # preserve the original payload, so we need it to be structured.
    try:
        payload: Any = json.loads(raw_body.decode("utf-8") or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid JSON body: {exc}")

    # GitHub signature verification (only when a secret is configured).
    if source == "github" and GITHUB_WEBHOOK_SECRET:
        if not _github_signature_ok(GITHUB_WEBHOOK_SECRET, raw_body, x_hub_signature_256):
            raise HTTPException(
                status_code=401,
                detail="Invalid or missing GitHub webhook signature.",
            )

    # Normalise header keys to lowercase for lookup.
    header_map = {k.lower(): v for k, v in request.headers.items()}
    event_type = _detect_event_type(source, header_map)

    event = _store_event(source, event_type, payload)

    return WebhookAck(
        status="received",
        event_id=event["id"],
        source=event["source"],
        event_type=event["event_type"],
        received_at=event["received_at"],
    )


# --------------------------------------------------------------------------- #
# Retrieve events
# --------------------------------------------------------------------------- #


@app.get("/events", response_model=EventsResponse)
def get_events(
    source: str | None = Query(default=None),
    event_type: str | None = Query(default=None),
) -> EventsResponse:
    result = list(events)

    if source:
        source_l = source.lower().strip()
        result = [e for e in result if e["source"] == source_l]

    if event_type:
        et_l = event_type.lower().strip()
        result = [e for e in result if str(e["event_type"]).lower() == et_l]

    # Newest first.
    result.sort(key=lambda e: e["received_at"], reverse=True)

    return EventsResponse(
        total=len(events),
        count=len(result),
        events=result,
    )