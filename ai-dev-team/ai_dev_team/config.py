"""Configuration loader for the AI dev team."""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the ai-dev-team directory
_env_path = Path(__file__).parent.parent / ".env"
load_dotenv(_env_path, override=False)


@lru_cache(maxsize=1)
def get_repo_root() -> Path:
    """Return the absolute path to the repository root."""
    env_root = os.environ.get("REPO_ROOT", "").strip()
    if env_root:
        return Path(env_root).resolve()
    # Walk up from this file to find the git root
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / ".git").exists():
            return parent
    raise RuntimeError("Could not locate repository root. Set REPO_ROOT in .env")


def get_llm_provider() -> str:
    return os.environ.get("LLM_PROVIDER", "anthropic").lower()


def get_llm_settings() -> dict:
    return {
        "temperature": float(os.environ.get("LLM_TEMPERATURE", "0.2")),
        "max_tokens": int(os.environ.get("LLM_MAX_TOKENS", "8192")),
    }


def get_anthropic_model() -> str:
    return os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")


def get_openai_model() -> str:
    return os.environ.get("OPENAI_MODEL", "gpt-4o")


def require_human_approval() -> bool:
    return os.environ.get("REQUIRE_HUMAN_APPROVAL", "true").lower() == "true"


def max_iterations() -> int:
    return int(os.environ.get("MAX_AGENT_ITERATIONS", "10"))
