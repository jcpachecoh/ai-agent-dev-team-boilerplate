"""Shell execution tool for AI agents."""
from __future__ import annotations

import subprocess
from pathlib import Path

from langchain_core.tools import tool

from ai_dev_team.config import get_repo_root

# Commands that agents are allowed to run
_ALLOWED_PREFIXES = (
    "npm ",
    "npx ",
    "node ",
    "tsc ",
    "turbo ",
    "python ",
    "pytest ",
    "pip ",
    "prisma ",
    "nest ",
    "expo ",
    "git status",
    "git log",
    "git diff",
    "git branch",
    "ls ",
    "cat ",
    "echo ",
    "find ",
    "grep ",
)

# Hard-blocked commands regardless of prefix
_BLOCKED_KEYWORDS = ("rm -rf", "sudo", "curl | sh", "wget | sh", "> /dev/", "mkfs", "dd if=")


def _is_allowed(command: str) -> bool:
    stripped = command.strip()
    for blocked in _BLOCKED_KEYWORDS:
        if blocked in stripped:
            return False
    return any(stripped.startswith(prefix) for prefix in _ALLOWED_PREFIXES)


@tool
def run_command(command: str, working_directory: str = "") -> str:
    """Run a shell command in the repository root (or a subdirectory).
    Only safe, pre-approved command prefixes are permitted.

    Args:
        command: The shell command to execute (e.g. 'npm run typecheck').
        working_directory: Subdirectory to run the command in (relative to repo root).
    """
    if not _is_allowed(command):
        return (
            f"BLOCKED: Command not allowed: '{command}'\n"
            "Permitted prefixes: npm, npx, node, tsc, turbo, python, pytest, prisma, nest, expo, git status/log/diff/branch, ls, cat, echo, find, grep"
        )

    cwd = get_repo_root()
    if working_directory:
        cwd = cwd / Path(working_directory)
        if not cwd.is_dir():
            return f"ERROR: Directory not found: {working_directory}"

    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=str(cwd),
            capture_output=True,
            text=True,
            timeout=120,
        )
        output = result.stdout + result.stderr
        if result.returncode != 0:
            return f"EXIT {result.returncode}:\n{output}"
        return output or "OK (no output)"
    except subprocess.TimeoutExpired:
        return "ERROR: Command timed out after 120 seconds"
    except Exception as e:
        return f"ERROR: {e}"


shell_tools = [run_command]
