"""Base agent factory: builds an LLM with bound tools from a system prompt file."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import SystemMessage
from langchain_core.tools import BaseTool

from ai_dev_team.config import (
    get_anthropic_model,
    get_llm_provider,
    get_llm_settings,
    get_openai_model,
)


def build_llm(tools: list[BaseTool] | None = None) -> BaseChatModel:
    """Instantiate the configured LLM, optionally binding tools."""
    provider = get_llm_provider()
    settings = get_llm_settings()

    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic  # type: ignore[import-untyped]
        llm: BaseChatModel = ChatAnthropic(model=get_anthropic_model(), **settings)  # type: ignore[call-arg]
    elif provider == "openai":
        from langchain_openai import ChatOpenAI  # type: ignore[import-untyped]
        llm = ChatOpenAI(model=get_openai_model(), **settings)
    else:
        raise ValueError(f"Unknown LLM_PROVIDER: {provider!r}. Use 'anthropic' or 'openai'.")

    if tools:
        llm = llm.bind_tools(tools)  # type: ignore[assignment]
    return llm


def load_agent_prompt(role: str) -> str:
    """Load the system prompt for a named agent role from agents/<role>/prompt.md."""
    repo_root = Path(__file__).parent.parent.parent.parent  # ai-dev-team/../..
    prompt_file = repo_root / "agents" / f"{role}-agent" / "prompt.md"
    if prompt_file.exists():
        return prompt_file.read_text(encoding="utf-8")
    return f"You are the {role.title()} Agent for the RestOpsIQ platform. Follow the project architecture and conventions."


def system_message(role: str, extra_context: str = "") -> SystemMessage:
    """Build the SystemMessage for an agent, combining its prompt with project context."""
    prompt = load_agent_prompt(role)
    if extra_context:
        prompt = f"{prompt}\n\n---\n\n{extra_context}"
    return SystemMessage(content=prompt)


def make_agent_node(role: str, tools: list[BaseTool]) -> Any:
    """
    Return a LangGraph node callable for the given agent role.

    The node:
    1. Prepends the agent's system prompt
    2. Invokes the LLM (with tool calling enabled)
    3. Handles tool call execution via the tool node pattern
    4. Returns state updates
    """
    from langgraph.prebuilt import ToolNode  # type: ignore[import-untyped]

    llm = build_llm(tools)
    tool_node = ToolNode(tools)

    def node(state: dict) -> dict:
        context = f"## Project Context\n{state.get('project_context', '')}\n\n## Architecture\n{state.get('architecture', '')}\n\n## Current Task\n{state.get('task_content', '')}"
        sys_msg = system_message(role, context)

        messages = [sys_msg] + list(state.get("messages", []))
        response = llm.invoke(messages)

        outputs = dict(state.get("outputs", {}))
        outputs[role] = response.content if hasattr(response, "content") else str(response)

        return {
            "messages": [response],
            "current_agent": role,
            "outputs": outputs,
            "iteration": state.get("iteration", 0) + 1,
        }

    node.__name__ = f"{role}_agent_node"
    return node, tool_node
