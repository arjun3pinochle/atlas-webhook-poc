from __future__ import annotations

import hashlib
import hmac
import json
import unittest

from fastapi import HTTPException
from starlette.requests import Request

import main


def make_request(body: bytes) -> Request:
    async def receive() -> dict[str, object]:
        return {"type": "http.request", "body": body, "more_body": False}

    scope: dict[str, object] = {
        "type": "http",
        "method": "POST",
        "path": "/webhooks/github",
        "headers": [
            (b"content-type", b"application/json"),
            (b"x-github-event", b"push"),
        ],
        "query_string": b"",
        "server": ("testserver", 80),
        "client": ("testclient", 12345),
        "scheme": "http",
        "http_version": "1.1",
    }
    return Request(scope, receive)


class GitHubWebhookTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.original_secret = main.GITHUB_WEBHOOK_SECRET
        main.events.clear()

    def tearDown(self) -> None:
        main.GITHUB_WEBHOOK_SECRET = self.original_secret
        main.events.clear()

    async def test_valid_signature_accepts_and_stores_github_event(self) -> None:
        secret = "test-secret"
        body = json.dumps({"repository": {"full_name": "example/project"}}).encode()
        signature = "sha256=" + hmac.new(
            secret.encode(), body, hashlib.sha256
        ).hexdigest()
        main.GITHUB_WEBHOOK_SECRET = secret

        result = await main.receive_webhook(
            "GitHub",
            make_request(body),
            signature,
        )

        self.assertEqual(result.status, "received")
        self.assertEqual(result.source, "github")
        self.assertEqual(result.event_type, "push")
        self.assertEqual(len(main.events), 1)
        self.assertEqual(main.events[0]["payload"]["original"], json.loads(body))

    async def test_missing_or_invalid_signature_is_rejected(self) -> None:
        main.GITHUB_WEBHOOK_SECRET = "test-secret"
        body = b'{"action":"opened"}'

        for signature in (None, "sha256=invalid"):
            with self.subTest(signature=signature):
                with self.assertRaises(HTTPException) as raised:
                    await main.receive_webhook(
                        "github",
                        make_request(body),
                        signature,
                    )
                self.assertEqual(raised.exception.status_code, 401)

        self.assertEqual(main.events, [])

    async def test_invalid_json_is_rejected(self) -> None:
        with self.assertRaises(HTTPException) as raised:
            await main.receive_webhook(
                "github",
                make_request(b"{invalid json"),
            )

        self.assertEqual(raised.exception.status_code, 400)
        self.assertEqual(main.events, [])


if __name__ == "__main__":
    unittest.main()
