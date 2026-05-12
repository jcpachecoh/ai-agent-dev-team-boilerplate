"""LangGraph state schema for the AI dev team workflow."""
from __future__ import annotations

from typing import Annotated, Any
from typing_extensions import TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """Shared state passed between all nodes in the dev graph."""

    # ── Task context ──────────────────────────────────────────────────────────
    task_file: str
    """Path to the current task markdown file (relative to repo root)."""

    task_content: str
    """Raw content of the task file."""

    # ── Project context (loaded once at graph start) ──────────────────────────
    project_context: str
    """Contents of memory/project-context.md."""

    architecture: str
    """Contents of docs/ARCHITECTURE.md."""

    agents_guide: str
    """Contents of docs/AGENTS.md."""

    # ── Conversation ──────────────────────────────────────────────────────────
    messages: Annotated[list[BaseMessage], add_messages]
    """Full message history. Uses LangGraph reducer to append, not overwrite."""

    # ── Workflow control ──────────────────────────────────────────────────────
    current_agent: str
    """Name of the agent currently executing (e.g. 'product', 'backend')."""

    phase: str
    """Current workflow phase: requirements | architecture | implementation | testing | deployment | review | done."""

    # ── Agent outputs ─────────────────────────────────────────────────────────
    outputs: dict[str, str]
    """Keyed by agent role. Stores final written output per agent."""

    files_written: list[str]
    """List of file paths written by agents during this run."""

    # ── Quality gates ─────────────────────────────────────────────────────────
    tests_passing: bool
    """Set to True by the testing agent when all tests pass."""

    human_approved: bool
    """Set to True when a human has reviewed and approved the plan."""

    # ── Error tracking ────────────────────────────────────────────────────────
    errors: list[str]
    """Accumulated errors or warnings from any agent."""

    iteration: int
    """Number of agent cycles completed (for loop detection / budget tracking)."""

    # ── Metadata ──────────────────────────────────────────────────────────────
    extra: dict[str, Any]
    """Catch-all for agent-specific metadata that doesn't fit above fields."""


def initial_state(task_file: str) -> AgentState:
    """Return a fresh AgentState with sensible defaults."""
    return AgentState(
        task_file=task_file,
        task_content="",
        project_context="",
        architecture="",
        agents_guide="",
        messages=[],
        current_agent="",
        phase="requirements",
        outputs={},
        files_written=[],
        tests_passing=False,
        human_approved=False,
        errors=[],
        iteration=0,
        extra={},
    )
