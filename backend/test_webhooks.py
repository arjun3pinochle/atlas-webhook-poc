#!/usr/bin/env python3
"""
Atlas test sender — sends sample webhook payloads to a running Atlas backend.

Usage:
    python3 test_webhooks.py                    # send all samples to http://localhost:8000
    python3 test_webhooks.py --base http://localhost:8000
    python3 test_webhooks.py --only github
    python3 test_webhooks.py --only github,crowdstrike
    python3 test_webhooks.py --hmac mysecret     # sign GitHub payload with HMAC SHA-256

Requires the `requests` library (pip install requests). A fallback using
urllib is included for environments without requests.
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import sys
import urllib.request
import urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLES_DIR = os.path.join(HERE, "sample_payloads")

SAMPLES = {
    "github": ("github_push.json", "x-github-event", "push"),
    "crowdstrike": ("crowdstrike_detection.json", "x-cs-event-type", "DetectionSummaryEvent"),
    "entra-id": ("entra_signin.json", "x-entra-event-type", "signin"),
    "ninjaone": ("ninjaone_device.json", "x-ninjaone-event", "device_alert"),
    "tenable": ("tenable_vulnerability.json", "x-tenable-event-type", "vulnerability_found"),
}


def send(base_url: str, source: str, filename: str, header_name: str, event_type: str, secret: str | None) -> None:
    path = os.path.join(SAMPLES_DIR, filename)
    with open(path, "rb") as fh:
        raw = fh.read()

    url = f"{base_url.rstrip('/')}/webhooks/{source}"
    headers = {"Content-Type": "application/json", header_name: event_type}

    if source == "github" and secret:
        sig = "sha256=" + hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
        headers["X-Hub-Signature-256"] = sig
        print(f"  signed with X-Hub-Signature-256")
    elif source == "github":
        print(f"  WARNING: no secret provided — sending unsigned GitHub payload")

    req = urllib.request.Request(url, data=raw, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8", "replace")
            print(f"  -> {resp.status} {body}")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
        print(f"  -> ERROR {exc.code}: {body}")
    except Exception as exc:  # noqa: BLE001
        print(f"  -> ERROR: {exc}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Send sample Atlas webhook payloads.")
    parser.add_argument("--base", default="http://localhost:8000", help="Backend base URL")
    parser.add_argument("--only", default="", help="Comma-separated list of sources to send")
    parser.add_argument("--hmac", default=os.getenv("GITHUB_WEBHOOK_SECRET", ""), help="GitHub webhook secret for signing")
    args = parser.parse_args()

    if args.only:
        wanted = [s.strip() for s in args.only.split(",") if s.strip()]
        unknown = [s for s in wanted if s not in SAMPLES]
        if unknown:
            print(f"Unknown source(s): {unknown}. Available: {list(SAMPLES)}")
            return 1
        sources = wanted
    else:
        sources = list(SAMPLES)

    print(f"Atlas webhook test sender")
    print(f"Backend: {args.base}")
    print(f"Secret : {'(GitHub signing enabled)' if args.hmac else '(GitHub signing disabled)'}")
    print()

    for source in sources:
        filename, header_name, event_type = SAMPLES[source]
        print(f"[{source}] POST {args.base.rstrip('/')}/webhooks/{source}")
        send(args.base, source, filename, header_name, event_type, args.hmac or None)
        print()

    print("Done. Open the Atlas dashboard to verify the events arrived.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
