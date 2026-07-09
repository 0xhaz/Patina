"""Novel-exception adjudication via Qwen native function-calling.

Gated by difficulty (only genuinely novel exceptions, used sparingly — a cost-
engineering point): Qwen is given the custom tools and decides which to call
(registry, sanctions, memory, policy), gathers evidence, then returns a structured
recommendation. Demonstrates sophisticated use of the Qwen function-calling API.
"""

from __future__ import annotations

import json
import re

from patina.config import settings
from patina.llm import client
from patina.tools.definitions import DISPATCH, TOOLS

_SYSTEM = (
    "You adjudicate a NOVEL vendor-onboarding exception that memory could not resolve. "
    "Use the available tools to gather evidence — verify the entity in the registry, "
    "screen for sanctions, search memory for near-precedents, and check policy. "
    "Then STOP calling tools and reply with a JSON object: "
    '{"recommendation": "approve"|"reject"|"escalate", "rationale": "...", '
    '"evidence": ["..."]}. Keep the rationale to one or two sentences.'
)


def adjudicate(exception_summary: str, max_steps: int = 5) -> dict:
    """Run the tool-using adjudication loop. Returns {decision, tool_calls}."""
    messages = [
        {"role": "system", "content": _SYSTEM},
        {"role": "user", "content": exception_summary},
    ]
    called: list[str] = []
    for _ in range(max_steps):
        resp = client().chat.completions.create(
            model=settings.qwen_backbone_model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
        )
        msg = resp.choices[0].message
        if not msg.tool_calls:
            return {"decision": _parse(msg.content), "tool_calls": called}
        messages.append({
            "role": "assistant",
            "content": msg.content or "",
            "tool_calls": [tc.model_dump() for tc in msg.tool_calls],
        })
        for tc in msg.tool_calls:
            name = tc.function.name
            called.append(name)
            try:
                args = json.loads(tc.function.arguments or "{}")
                result = DISPATCH[name](**args)
            except Exception as e:  # noqa: BLE001 — surface tool errors to the model
                result = {"error": f"{type(e).__name__}: {e}"}
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result, ensure_ascii=False),
            })
    return {"decision": {"recommendation": "escalate", "rationale": "tool budget exhausted"},
            "tool_calls": called}


def _parse(text: str | None) -> dict:
    raw = (text or "").strip()
    # Extract the first {...} block (models often wrap JSON in ```json fences + prose).
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return {"recommendation": "escalate", "rationale": raw[:200]}
