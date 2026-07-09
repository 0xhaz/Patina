"""Custom function tools + MCP integrations.

The agent acts on external systems through a clean tool interface:
  - registry / denied-party lookup (validation-stage screening),
  - memory search over the learned store,
  - policy lookup.
Exposed both as Qwen native function-calling tools (`definitions.py`) and as two
MCP servers (`patina/mcp/`). The Human-Gate guards all side-effectful writes.
"""
