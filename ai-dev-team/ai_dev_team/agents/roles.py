"""Per-role agent node definitions for the LangGraph dev workflow."""
from __future__ import annotations

from ai_dev_team.agents.base_agent import make_agent_node
from ai_dev_team.tools import (
    ALL_TOOLS,
    READONLY_TOOLS,
    filesystem_tools,
    git_tools,
    github_tools,
    shell_tools,
)

# ── Tool sets per role ────────────────────────────────────────────────────────
_PRODUCT_TOOLS = READONLY_TOOLS + github_tools
_ARCH_TOOLS = READONLY_TOOLS + [t for t in filesystem_tools if t.name == "write_file"]
_BACKEND_TOOLS = ALL_TOOLS
_FRONTEND_TOOLS = ALL_TOOLS
_DATA_TOOLS = filesystem_tools + shell_tools
_TESTING_TOOLS = filesystem_tools + shell_tools + [t for t in git_tools if t.name in ("git_status", "git_diff")]
_DEVOPS_TOOLS = ALL_TOOLS

# ── Agent nodes + companion tool nodes ───────────────────────────────────────
product_node,       product_tools       = make_agent_node("product",       _PRODUCT_TOOLS)
architecture_node,  architecture_tools  = make_agent_node("architecture",  _ARCH_TOOLS)
backend_node,       backend_tools       = make_agent_node("backend",       _BACKEND_TOOLS)
frontend_node,      frontend_tools      = make_agent_node("frontend",      _FRONTEND_TOOLS)
data_node,          data_tools          = make_agent_node("data",          _DATA_TOOLS)
testing_node,       testing_tools       = make_agent_node("testing",       _TESTING_TOOLS)
devops_node,        devops_tools        = make_agent_node("devops",        _DEVOPS_TOOLS)

__all__ = [
    "product_node", "product_tools",
    "architecture_node", "architecture_tools",
    "backend_node", "backend_tools",
    "frontend_node", "frontend_tools",
    "data_node", "data_tools",
    "testing_node", "testing_tools",
    "devops_node", "devops_tools",
]
