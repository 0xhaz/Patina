"""MCP server: query the learned memory store.

    uv run python -m patina.mcp.memory_server          # stdio MCP server
"""

from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from patina.tools.memory_tool import memory_search as _memory_search
from patina.tools.memory_tool import memory_stats as _memory_stats

mcp = FastMCP("patina-memory")


@mcp.tool()
def memory_search(
    query: str,
    scope: str = "exception",
    country: str | None = None,
    doc_type: str | None = None,
    k: int = 3,
) -> dict:
    """Search the learned memory store for prior resolved cases within a scope."""
    return _memory_search(query, scope, country, doc_type, k)  # type: ignore[arg-type]


@mcp.tool()
def memory_stats() -> dict:
    """Counts of learned memory items per scope."""
    return _memory_stats()


if __name__ == "__main__":
    mcp.run()
