"""File system tools for AI agents."""
from __future__ import annotations

import os
from pathlib import Path

from langchain_core.tools import tool

from ai_dev_team.config import get_repo_root


def _resolve(path: str) -> Path:
    """Resolve a relative path against the repo root."""
    p = Path(path)
    if p.is_absolute():
        return p
    return get_repo_root() / p


@tool
def read_file(path: str) -> str:
    """Read the contents of a file relative to the repository root.

    Args:
        path: File path relative to the repo root (e.g. 'apps/api/src/main.ts').
    """
    full = _resolve(path)
    if not full.exists():
        return f"ERROR: File not found: {path}"
    return full.read_text(encoding="utf-8")


@tool
def write_file(path: str, content: str) -> str:
    """Write content to a file relative to the repository root.
    Creates parent directories automatically.

    Args:
        path: File path relative to the repo root.
        content: Text content to write.
    """
    full = _resolve(path)
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_text(content, encoding="utf-8")
    return f"OK: Written {len(content)} chars to {path}"


@tool
def list_files(directory: str = ".", pattern: str = "**/*") -> str:
    """List files in a directory matching a glob pattern.

    Args:
        directory: Directory path relative to the repo root.
        pattern: Glob pattern (default '**/*' lists all files recursively).
    """
    base = _resolve(directory)
    if not base.is_dir():
        return f"ERROR: Not a directory: {directory}"

    files = sorted(
        str(p.relative_to(get_repo_root()))
        for p in base.glob(pattern)
        if p.is_file() and ".git" not in p.parts
    )
    if not files:
        return f"No files found in {directory} matching {pattern}"
    return "\n".join(files)


@tool
def search_files(query: str, directory: str = ".", file_extension: str = "") -> str:
    """Search for a text string across files in the repository.

    Args:
        query: The string to search for.
        directory: Directory to search in (default: repo root).
        file_extension: Limit search to files with this extension (e.g. '.ts').
    """
    import subprocess

    base = str(_resolve(directory))
    cmd = ["grep", "-rl", "--include=*" if not file_extension else f"--include=*{file_extension}", query, base]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        lines = [
            str(Path(l).relative_to(get_repo_root()))
            for l in result.stdout.strip().splitlines()
            if ".git" not in l
        ]
        if not lines:
            return f"No files contain '{query}'"
        return "\n".join(lines)
    except subprocess.TimeoutExpired:
        return "ERROR: Search timed out"
    except Exception as e:
        return f"ERROR: {e}"


@tool
def read_task(task_file: str) -> str:
    """Read the content of a task file from the tasks/ directory.

    Args:
        task_file: Task filename or path (e.g. '01-project-setup.md' or 'tasks/01-project-setup.md').
    """
    if not task_file.startswith("tasks/"):
        task_file = f"tasks/{task_file}"
    return read_file.invoke({"path": task_file})  # type: ignore[attr-defined]


filesystem_tools = [read_file, write_file, list_files, search_files, read_task]
