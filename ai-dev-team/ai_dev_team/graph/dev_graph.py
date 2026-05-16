"""
RestOpsIQ AI Dev Team — LangGraph Workflow
==========================================

Phase flow:
  load_context → product → architecture → [human_review?]
      → backend + frontend + data (parallel)
      → testing → devops → final_review → done
"""
from __future__ import annotations

from pathlib import Path
from typing import Literal

from langchain_core.messages import HumanMessage
from langgraph.graph import END, START, StateGraph
from langgraph.checkpoint.memory import MemorySaver

from ai_dev_team.config import get_repo_root, max_iterations, require_human_approval
from ai_dev_team.graph.state import AgentState
from ai_dev_team.agents.roles import (
    architecture_node, architecture_tools,
    backend_node, backend_tools,
    data_node, data_tools,
    devops_node, devops_tools,
    frontend_node, frontend_tools,
    product_node, product_tools,
    testing_node, testing_tools,
)


# ── Context loader ─────────────────────────────────────────────────────────────

def load_context(state: AgentState) -> dict:
    """Load task file, project context, and architecture docs into state."""
    root = get_repo_root()

    def _read(rel_path: str) -> str:
        p = root / rel_path
        return p.read_text(encoding="utf-8") if p.exists() else f"(file not found: {rel_path})"

    task_file = state["task_file"]
    task_content = _read(task_file)
    project_context = _read("memory/project-context.md")
    architecture = _read("docs/ARCHITECTURE.md")
    agents_guide = _read("docs/AGENTS.md")

    return {
        "task_content": task_content,
        "project_context": project_context,
        "architecture": architecture,
        "agents_guide": agents_guide,
        "phase": "requirements",
        "messages": [
            HumanMessage(
                content=(
                    f"## Task File: `{task_file}`\n\n{task_content}\n\n"
                    "Please analyze this task and begin your part of the implementation."
                )
            )
        ],
    }


# ── Human-in-the-loop interrupt node ──────────────────────────────────────────

def human_review_node(state: AgentState) -> dict:
    """
    Interrupt point for human approval.
    LangGraph will pause here when interrupt_before=['human_review'] is set.
    Resume by calling graph.update_state(..., {"human_approved": True}).
    """
    return {"phase": "human_review"}


# ── Phase transition helpers ───────────────────────────────────────────────────

def _after_product(state: AgentState) -> Literal["architecture", "__end__"]:
    if state.get("errors") and len(state["errors"]) > 3:
        return END
    return "architecture"


def _after_architecture(state: AgentState) -> Literal["human_review", "parallel_impl"]:
    if require_human_approval():
        return "human_review"
    return "parallel_impl"


def _after_human_review(state: AgentState) -> Literal["parallel_impl", "__end__"]:
    if state.get("human_approved"):
        return "parallel_impl"
    return END


def _after_testing(state: AgentState) -> Literal["devops", "backend", "__end__"]:
    if state.get("iteration", 0) >= max_iterations():
        return END
    if state.get("tests_passing"):
        return "devops"
    # Send back to backend for fixes (simplistic; extend for smarter routing)
    return "backend"


def _after_devops(state: AgentState) -> Literal["architecture", "__end__"]:
    return "architecture"  # final review by architecture agent


def _is_final_review(state: AgentState) -> Literal["__end__"]:
    return END


# ── Graph assembly ─────────────────────────────────────────────────────────────

def build_graph(checkpointer=None) -> StateGraph:
    """Build and compile the RestOpsIQ dev workflow graph."""

    builder = StateGraph(AgentState)

    # ── Nodes ─────────────────────────────────────────────────────────────────
    builder.add_node("load_context",    load_context)
    builder.add_node("product",         product_node)
    builder.add_node("product_tools",   product_tools)
    builder.add_node("architecture",    architecture_node)
    builder.add_node("arch_tools",      architecture_tools)
    builder.add_node("human_review",    human_review_node)

    # Parallel implementation track
    builder.add_node("backend",         backend_node)
    builder.add_node("backend_tools",   backend_tools)
    builder.add_node("frontend",        frontend_node)
    builder.add_node("frontend_tools",  frontend_tools)
    builder.add_node("data",            data_node)
    builder.add_node("data_tools",      data_tools)

    builder.add_node("testing",         testing_node)
    builder.add_node("testing_tools",   testing_tools)
    builder.add_node("devops",          devops_node)
    builder.add_node("devops_tools",    devops_tools)

    # ── Edges ─────────────────────────────────────────────────────────────────
    builder.add_edge(START, "load_context")
    builder.add_edge("load_context", "product")

    # product ↔ tools loop, then route forward
    builder.add_conditional_edges("product", _should_call_tools("product", "product_tools", _after_product))
    builder.add_edge("product_tools", "product")

    # architecture ↔ tools loop, then human review gate
    builder.add_conditional_edges("architecture", _should_call_tools("architecture", "arch_tools", _after_architecture))
    builder.add_edge("arch_tools", "architecture")

    builder.add_conditional_edges("human_review", _after_human_review, {"parallel_impl": "backend", END: END})

    # Parallel implementation: all three start from "backend" entry point
    # (LangGraph doesn't natively fan-out from one node, so we chain: backend → frontend → data)
    builder.add_conditional_edges("backend", _should_call_tools("backend", "backend_tools", lambda s: "frontend"))
    builder.add_edge("backend_tools", "backend")

    builder.add_conditional_edges("frontend", _should_call_tools("frontend", "frontend_tools", lambda s: "data"))
    builder.add_edge("frontend_tools", "frontend")

    builder.add_conditional_edges("data", _should_call_tools("data", "data_tools", lambda s: "testing"))
    builder.add_edge("data_tools", "data")

    # Testing → devops (or loop back to backend on failure)
    builder.add_conditional_edges("testing", _should_call_tools("testing", "testing_tools", _after_testing))
    builder.add_edge("testing_tools", "testing")

    # DevOps → final architecture review
    builder.add_conditional_edges("devops", _should_call_tools("devops", "devops_tools", _after_devops))
    builder.add_edge("devops_tools", "devops")

    # Architecture final review → END
    # We distinguish final review from initial review by checking phase
    builder.add_conditional_edges(
        "architecture",
        lambda s: END if s.get("phase") == "final_review" else _should_call_tools("architecture", "arch_tools", _after_architecture)(s),
    )

    return builder.compile(
        checkpointer=checkpointer or MemorySaver(),
        interrupt_before=["human_review"] if require_human_approval() else [],
    )


def _should_call_tools(agent_name: str, tool_node_name: str, next_fn):
    """
    Return a routing function that sends to the tool node if the LLM made tool calls,
    otherwise calls next_fn(state) to continue the workflow.
    """
    def route(state: AgentState):
        messages = state.get("messages", [])
        if not messages:
            return next_fn(state)
        last = messages[-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return tool_node_name
        return next_fn(state)

    route.__name__ = f"route_after_{agent_name}"
    return route


# ── Public API ────────────────────────────────────────────────────────────────

def create_graph():
    """Create a compiled LangGraph dev workflow with in-memory checkpointing."""
    return build_graph()
