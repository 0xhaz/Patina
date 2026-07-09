"""MCP server: business-registry + denied-party lookup.

    uv run python -m patina.mcp.registry_server        # stdio MCP server
"""

from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from patina.tools.registry import registry_lookup as _registry_lookup
from patina.tools.registry import sanctions_check as _sanctions_check

mcp = FastMCP("patina-registry")


@mcp.tool()
def registry_lookup(entity_name: str, country: str | None = None) -> dict:
    """Look up a company in the business registry; returns registration status + id."""
    return _registry_lookup(entity_name, country)


@mcp.tool()
def sanctions_check(name: str) -> dict:
    """Screen a name against denied-party / sanctions lists (OpenSanctions, live)."""
    return _sanctions_check(name)


if __name__ == "__main__":
    mcp.run()
