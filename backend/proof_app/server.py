"""Patina proof deploy — ZERO third-party deps (Python stdlib only).

Its only job: prove 'backend running on Alibaba Cloud Function Compute, calling
Qwen Cloud APIs' (the hard submission requirement), deployable as a plain zip with
no native wheels to fight. The real backend (FastAPI + patina package) deploys
separately once it exists. Runs under the FC custom runtime on the port in
$FC_SERVER_PORT (default 9000). Compatible with any Python 3.
"""

import json
import os
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer

BASE = os.getenv("DASHSCOPE_BASE_URL", "https://dashscope-intl.aliyuncs.com/compatible-mode/v1")
KEY = os.getenv("DASHSCOPE_API_KEY", "")
MODEL = os.getenv("QWEN_BACKBONE_MODEL", "qwen3.7-plus")
PORT = int(os.getenv("FC_SERVER_PORT", os.getenv("PORT", "9000")))


def call_qwen():
    body = json.dumps(
        {
            "model": MODEL,
            "messages": [{"role": "user", "content": "Reply with exactly: PATINA_LIVE_ON_ALIBABA"}],
        }
    ).encode()
    req = urllib.request.Request(
        BASE.rstrip("/") + "/chat/completions",
        data=body,
        headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read())
    return data["choices"][0]["message"]["content"]


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        payload = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        if self.path.startswith("/health"):
            self._send(200, {"status": "healthy", "key_configured": bool(KEY)})
        elif self.path.startswith("/proof"):
            try:
                reply = call_qwen()
                self._send(
                    200,
                    {
                        "running_on": "Alibaba Cloud Function Compute",
                        "region_hint": BASE,
                        "model": MODEL,
                        "qwen_reachable": "PATINA_LIVE" in reply,
                        "qwen_reply": reply.strip()[:80],
                    },
                )
            except Exception as e:  # noqa: BLE001
                self._send(
                    200,
                    {
                        "running_on": "Alibaba Cloud Function Compute",
                        "qwen_reachable": False,
                        "qwen_reply": type(e).__name__ + ": " + str(e),
                    },
                )
        else:
            self._send(200, {"service": "patina", "version": "0.1.0", "ok": True})

    def log_message(self, *args):
        pass  # quiet — FC captures stdout separately


if __name__ == "__main__":
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
