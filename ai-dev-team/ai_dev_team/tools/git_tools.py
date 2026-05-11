"""Git tools for AI agents (read-only + safe write operations)."""
from __future__ import annotations

from langchain_core.tools import tool

from ai_dev_team.config import get_repo_root


def _repo():
    import git  # type: ignore[import-untyped]
    return git.Repo(get_repo_root())


@tool
def git_status() -> str:
    """Return the current git status of the repository."""
    repo = _repo()
    return repo.git.status()


@tool
def git_diff(path: str = "") -> str:
    """Show the current unstaged diff. Optionally limit to a specific file path.

    Args:
        path: Optional file path to diff (relative to repo root).
    """
    repo = _repo()
    return repo.git.diff(path) if path else repo.git.diff()


@tool
def git_log(n: int = 10) -> str:
    """Show the last N commit messages.

    Args:
        n: Number of commits to show (default 10).
    """
    repo = _repo()
    return repo.git.log("--oneline", f"-{n}")


@tool
def git_create_branch(branch_name: str) -> str:
    """Create and check out a new git branch.

    Args:
        branch_name: Name of the new branch (e.g. 'feature/42-auth').
    """
    repo = _repo()
    try:
        repo.git.checkout("-b", branch_name)
        return f"OK: Created and checked out branch '{branch_name}'"
    except Exception as e:
        return f"ERROR: {e}"


@tool
def git_commit(message: str, paths: list[str] | None = None) -> str:
    """Stage and commit files.

    Args:
        message: Commit message (use Conventional Commits style).
        paths: List of file paths to stage. If None, stages all changes.
    """
    repo = _repo()
    try:
        if paths:
            repo.index.add(paths)
        else:
            repo.git.add("-A")
        repo.index.commit(
            message + "\n\nCo-authored-by: AI Dev Team <ai-dev-team@restopsiq.com>"
        )
        return f"OK: Committed with message: {message}"
    except Exception as e:
        return f"ERROR: {e}"


@tool
def git_push(branch: str = "") -> str:
    """Push the current branch to origin.

    Args:
        branch: Branch name to push (defaults to current branch).
    """
    repo = _repo()
    try:
        current = branch or repo.active_branch.name
        repo.git.push("origin", current)
        return f"OK: Pushed '{current}' to origin"
    except Exception as e:
        return f"ERROR: {e}"


@tool
def git_current_branch() -> str:
    """Return the name of the currently checked-out branch."""
    repo = _repo()
    return repo.active_branch.name


git_tools = [git_status, git_diff, git_log, git_create_branch, git_commit, git_push, git_current_branch]
