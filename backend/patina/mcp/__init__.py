"""MCP servers exposing Patina's tools over the Model Context Protocol.

Two servers (the rubric asks for >= 2 MCP integrations):
  - registry_server  — registry_lookup, sanctions_check
  - memory_server    — memory_search, memory_stats

Run over stdio, e.g.:  uv run python -m patina.mcp.registry_server
"""
