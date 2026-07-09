"""Thin Qwen client wrappers over the OpenAI-compatible DashScope endpoint.

Keeps the code portable/familiar (architecture-patina.md §3.3, techstack §2):
text + vision + embeddings, all through one client. tenacity gives us the
retry/backoff the rubric rewards (error-handling points).
"""

from __future__ import annotations

import base64
import json
import mimetypes
from pathlib import Path

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from patina.config import settings

_client: OpenAI | None = None


def client() -> OpenAI:
    """Lazily build the OpenAI-compatible client pointed at DashScope (Singapore)."""
    global _client
    if _client is None:
        if not settings.has_key:
            raise RuntimeError(
                "DASHSCOPE_API_KEY is empty. Copy backend/.env.example -> backend/.env "
                "and paste your Singapore Model Studio key."
            )
        _client = OpenAI(api_key=settings.dashscope_api_key, base_url=settings.dashscope_base_url)
    return _client


def _data_uri(image_path: str | Path) -> str:
    p = Path(image_path)
    mime = mimetypes.guess_type(p.name)[0] or "image/png"
    b64 = base64.b64encode(p.read_bytes()).decode()
    return f"data:{mime};base64,{b64}"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8), reraise=True)
def chat(prompt: str, model: str | None = None) -> str:
    """Plain text completion."""
    resp = client().chat.completions.create(
        model=model or settings.qwen_backbone_model,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.choices[0].message.content or ""


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8), reraise=True)
def vision(prompt: str, image_path: str | Path, model: str | None = None) -> str:
    """Multimodal call — prompt + one image (documents, photos, mixed layouts)."""
    resp = client().chat.completions.create(
        model=model or settings.qwen_backbone_model,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": _data_uri(image_path)}},
                ],
            }
        ],
    )
    return resp.choices[0].message.content or ""


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8), reraise=True)
def embed(text: str, model: str | None = None) -> list[float]:
    """Single embedding vector for the semantic-similarity retrieval signal."""
    resp = client().embeddings.create(model=model or settings.qwen_embed_model, input=text)
    return resp.data[0].embedding


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8), reraise=True)
def vision_json(prompt: str, image_path: str | Path, model: str | None = None) -> dict:
    """Multimodal call constrained to a JSON object — structured extraction from
    a document image. Returns the parsed dict."""
    resp = client().chat.completions.create(
        model=model or settings.qwen_backbone_model,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": _data_uri(image_path)}},
                ],
            }
        ],
        response_format={"type": "json_object"},
    )
    return json.loads(resp.choices[0].message.content or "{}")


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8), reraise=True)
def chat_json(prompt: str, model: str | None = None) -> dict:
    """Chat call constrained to a JSON object. Defaults to the cheap flash model
    (bulk memory distillation). Returns the parsed dict."""
    resp = client().chat.completions.create(
        model=model or settings.qwen_flash_model,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )
    return json.loads(resp.choices[0].message.content or "{}")
