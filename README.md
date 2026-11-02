# Atlas – Universal Data Connector (POC)

A generic webhook receiver that accepts events from multiple external
platforms through a single HTTP endpoint pattern, wraps each payload in a
common event structure, stores it in memory, and displays the received
events in a professional React dashboard.

> **This is an ingestion POC.** Events are stored in memory only and are lost
> when the backend restarts or redeploys. This is intentional.

## What this POC demonstrates

A single FastAPI receiver (`POST /webhooks/{source}`) accepts events from
GitHub (real integration with HMAC signature verification) and from
CrowdStrike, Microsoft Entra ID, NinjaOne, and Tenable (simulated for now).
Each event is normalised into a common structure and surfaced in a React
dashboard that polls the backend every 5 seconds.

## Architecture

```
External Platforms (GitHub, CrowdStrike, Entra ID, NinjaOne, Tenable)
        |  HTTP POST with JSON payload
        v
FastAPI – Generic Webhook Receiver
        |  Validate + identify source
        v
Common Event Structure
        |  Store temporarily
        v
In-Memory Event Storage
        |  GET /events
        v
React Dashboard
```

The backend and frontend are independent and communicate over REST.

## Common event structure

```json
{
  "id": "unique-event-id",
  "source": "github",
  "event_type": "push",
  "received_at": "2026-11-02T10:30:00Z",
  "payload": {
    "original": { "the original provider JSON, unchanged": true }
  }
}
```

## Project structure

```
atlas-webhook-poc/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── test_webhooks.py
│   ├── sample_payloads/
│   └── README.md
├── src/                 # React frontend (Vite root)
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── .env.example
└── README.md
```

The frontend lives at the repository root (Vite app) and the backend lives
in `backend/`. They are fully separate and run in their own processes.

## Prerequisites

- Python 3.11 or newer
- Node.js LTS and npm
- Git

## Local development (macOS)

Backend and frontend must run in **separate terminal windows**.

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # edit values as needed
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Backend: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

### 2. Frontend

```bash
cp .env.example .env        # sets VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev
```

- Frontend: `http://localhost:5173` (typical Vite URL)

### 3. Send a test event

With the backend running, in a third terminal:

```bash
cd backend
source venv/bin/activate
python3 test_webhooks.py
```

The events should appear in the dashboard within ~5 seconds (the polling
interval). You can also press the Refresh button in the header.

## API reference

| Method | Route                  | Description                                         |
|--------|-----------------------|----------------------------------------------------|
| POST   | `/webhooks/{source}`  | Generic webhook receiver                           |
| GET    | `/events`             | Retrieve events (newest first)                      |
| GET    | `/health`             | Health check + storage + verification status        |

`GET /events` supports optional `source` and `event_type` query parameters:

```
GET /events?source=github
GET /events?source=github&event_type=push
```

## Testing without GitHub

Sample payloads are in `backend/sample_payloads/`:

- `github_push.json`
- `crowdstrike_detection.json`
- `entra_signin.json`
- `ninjaone_device.json`
- `tenable_vulnerability.json`

### Test script

```bash
python3 test_webhooks.py                          # send all samples
python3 test_webhooks.py --only github            # send only GitHub
python3 test_webhooks.py --hmac YOUR_SECRET       # sign GitHub payload
```

### Automated backend tests

From the `backend` directory, run:

```bash
python3 -m unittest discover -v
```

These tests cover GitHub webhook signature acceptance/rejection, payload
storage, and invalid JSON handling.

### curl example

```bash
curl -X POST http://localhost:8000/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d @backend/sample_payloads/github_push.json
```

The dashboard starts empty and only shows events once test requests or
real webhooks arrive.

## GitHub webhook integration

1. Create or open a GitHub repository.
2. Go to **Settings → Webhooks → Add webhook**.
3. Set the Payload URL to the public backend endpoint:
   `https://your-backend.onrender.com/webhooks/github`
4. Set Content type to `application/json`.
5. Configure a webhook secret. Set the same value as `GITHUB_WEBHOOK_SECRET`
   on the backend.
6. Select the events to send (initially "Just the push event").
7. Save the webhook.
8. Push a commit to the repository.
9. Verify the delivery in GitHub's **Recent Deliveries**.
10. Confirm the event appears in the Atlas dashboard.

### Local testing with ngrok

```bash
ngrok http 8000
```

Use the ngrok URL as the Payload URL:
`https://your-ngrok-domain.ngrok-free.app/webhooks/github`

Never expose webhook secrets in the frontend or commit them to Git.

## Deployment

### Backend → Render

1. Push the project to GitHub.
2. Create a new Render **Web Service**.
3. Connect the GitHub repository.
4. Set the **root directory** to `backend`.
5. Runtime: **Python**.
6. Build command: `pip install -r requirements.txt`
7. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
8. Environment variables:
   - `GITHUB_WEBHOOK_SECRET`
   - `FRONTEND_URL` (your Vercel frontend URL)
9. Deploy, then verify `/health` and copy the Render public URL.

Render free services spin down after inactivity and take a few seconds to
wake up. Events are lost on restart/redeploy because storage is in-memory.

### Frontend → Vercel

1. Import the GitHub repository into Vercel.
2. Set the **root directory** to `.` (the repo root) since the Vite app lives
   at the root. (If you move it into `frontend/`, set the root to `frontend`.)
3. Framework: **Vite**.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Environment variable: `VITE_API_BASE_URL=https://your-backend.onrender.com`
7. Deploy, copy the Vercel URL.
8. Update `FRONTEND_URL` in Render with the Vercel URL and redeploy the
   backend so CORS allows the frontend origin.

### Production GitHub webhook

After deployment, set GitHub's Payload URL to:
`https://your-backend.onrender.com/webhooks/github`

The backend must be publicly reachable for GitHub to deliver events.

## Troubleshooting

- **Python dependency errors** — ensure the virtual environment is active and
  `pip install -r requirements.txt` completed. Re-run it after pulling
  updates.
- **Node/npm errors** — delete `node_modules` and `package-lock.json`, then
  run `npm install` again.
- **CORS errors** — confirm `FRONTEND_URL` on the backend matches the exact
  frontend origin (including `https://`). Locally, Vite origins are allowed
  automatically.
- **Port already in use** — stop the process on that port (e.g.
  `lsof -i :8000`) or use a different port (`--port 8001`).
- **Backend connection failures** — confirm the backend is running and that
  `VITE_API_BASE_URL` points at the correct URL (no trailing slash needed).
  The dashboard header shows live backend connection status.

## Notes

- The dashboard does not populate with fake events by default — it shows an
  empty state until real or test events arrive.
- Statistics are always derived from real backend data.
- Only GitHub is a real integration for this POC; the other providers are
  simulated via the test script and curl commands.checking
