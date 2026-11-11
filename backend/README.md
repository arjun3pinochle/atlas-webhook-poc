# Atlas Backend – Universal Webhook Receiver

FastAPI backend that receives events from multiple platforms through a single
generic endpoint pattern and stores them in memory for the dashboard.

> **In-memory storage:** Events are kept in a Python list and are lost when the
> backend restarts or redeploys. This is intentional for the POC.

## Requirements

- Python 3.11 or newer

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # macOS / Linux
# .\venv\Scripts\activate      # Windows (PowerShell)
pip install -r requirements.txt
cp .env.example .env          # then edit values as needed
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at `http://localhost:8000`.
Swagger docs at `http://localhost:8000/docs`.

## Endpoints

| Method | Route                    | Description                                  |
|--------|-------------------------|----------------------------------------------|
| POST   | `/webhooks/{source}`    | Generic webhook receiver                     |
| GET    | `/events`               | Retrieve stored events (newest first)        |
| GET    | `/health`               | Health check + storage + verification status |

### Webhook receiver

```
POST /webhooks/github
POST /webhooks/crowdstrike
POST /webhooks/entra-id
POST /webhooks/ninjaone
POST /webhooks/tenable
POST /webhooks/test
```

- Reads the event type from a provider-specific header when available
  (e.g. `X-GitHub-Event` for GitHub).
- Returns `unknown` when no event type header is present.
- Preserves the original JSON payload inside `payload.original`.

### Events retrieval

```
GET /events
GET /events?source=github
GET /events?source=github&event_type=push
```

Returns `{ total, count, events }` with newest events first.

## GitHub signature verification

When `GITHUB_WEBHOOK_SECRET` is set, incoming GitHub webhooks must carry a valid
`X-Hub-Signature-256` header. Verification uses HMAC SHA-256 over the raw body
with a constant-time comparison. Invalid or missing signatures are rejected
with `401`.

When the secret is **not** set (local development), verification is disabled
and the `/health` endpoint reports `github_signature_verification: false`.

Never commit the real secret. Use the `.env` file, which is git-ignored.

## CORS

Allowed origins come from the `FRONTEND_URL` environment variable (for
production) plus localhost Vite dev origins (`http://localhost:5173`, etc.).

## Testing

```bash
# Automated GitHub webhook tests (no running server required)
python3 -m unittest discover -v

# Send sample payloads to a running server
python3 test_webhooks.py
python3 test_webhooks.py --only github
python3 test_webhooks.py --hmac your-github-secret
```

The automated tests cover valid and invalid GitHub signatures, event storage,
and invalid JSON handling.

Sample payloads live in `sample_payloads/`.

### curl examples

```bash
# GitHub push event
curl -X POST http://localhost:8000/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d @sample_payloads/github_push.json

# CrowdStrike detection
curl -X POST http://localhost:8000/webhooks/crowdstrike \
  -H "Content-Type: application/json" \
  -H "X-CS-Event-Type: DetectionSummaryEvent" \
  -d @sample_payloads/crowdstrike_detection.json

# Retrieve events
curl http://localhost:8000/events
```

## Deployment (Render)

1. Push the project to GitHub.
2. Create a new Render Web Service.
3. Set the root directory to `backend`.
4. Runtime: Python.
5. Build command: `pip install -r requirements.txt`
6. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Environment variables:
   - `GITHUB_WEBHOOK_SECRET`
   - `FRONTEND_URL` (your Vercel frontend URL)
8. Deploy and verify `/health`.

Render free services spin down after inactivity and take a few seconds to wake
up. Events are lost on restart/redeploy because storage is in-memory. gokul
