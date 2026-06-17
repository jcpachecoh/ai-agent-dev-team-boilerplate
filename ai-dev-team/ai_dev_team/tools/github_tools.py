"""GitHub API tools for AI agents (issues, PRs, branches)."""
from __future__ import annotations

import os

from langchain_core.tools import tool


def _gh_client():
    from github import Github  # type: ignore[import-untyped]
    token = os.environ.get("GITHUB_TOKEN", "")
    if not token:
        raise ValueError("GITHUB_TOKEN environment variable is not set")
    return Github(token)


def _repo():
    gh = _gh_client()
    repo_name = os.environ.get("GITHUB_REPO", "")
    if not repo_name:
        raise ValueError("GITHUB_REPO environment variable is not set (e.g. 'owner/repo')")
    return gh.get_repo(repo_name)


@tool
def list_open_issues(label: str = "", limit: int = 20) -> str:
    """List open GitHub issues, optionally filtered by label.

    Args:
        label: Filter by this label (e.g. 'enhancement', 'bug'). Empty = all.
        limit: Maximum number of issues to return.
    """
    try:
        repo = _repo()
        kwargs: dict = {"state": "open"}
        if label:
            kwargs["labels"] = [label]
        issues = list(repo.get_issues(**kwargs))[:limit]
        if not issues:
            return "No open issues found."
        lines = [f"#{i.number} [{', '.join(l.name for l in i.labels) or 'no label'}] {i.title}" for i in issues]
        return "\n".join(lines)
    except Exception as e:
        return f"ERROR: {e}"


@tool
def get_issue(issue_number: int) -> str:
    """Get the title and body of a GitHub issue.

    Args:
        issue_number: The issue number (e.g. 42).
    """
    try:
        repo = _repo()
        issue = repo.get_issue(issue_number)
        return f"# {issue.title}\n\nLabels: {', '.join(l.name for l in issue.labels)}\n\n{issue.body or '(no body)'}"
    except Exception as e:
        return f"ERROR: {e}"


@tool
def create_pull_request(
    title: str,
    body: str,
    head_branch: str,
    base_branch: str = "main",
) -> str:
    """Create a GitHub pull request.

    Args:
        title: PR title (use Conventional Commits style).
        body: PR description (include 'Closes #N' to auto-link issues).
        head_branch: Branch containing the changes.
        base_branch: Target branch to merge into (default: main).
    """
    try:
        repo = _repo()
        pr = repo.create_pull(
            title=title,
            body=body,
            head=head_branch,
            base=base_branch,
        )
        return f"OK: PR #{pr.number} created: {pr.html_url}"
    except Exception as e:
        return f"ERROR: {e}"


@tool
def comment_on_issue(issue_number: int, comment: str) -> str:
    """Add a comment to a GitHub issue or pull request.

    Args:
        issue_number: The issue or PR number.
        comment: The comment text (supports markdown).
    """
    try:
        repo = _repo()
        issue = repo.get_issue(issue_number)
        issue.create_comment(comment)
        return f"OK: Comment added to #{issue_number}"
    except Exception as e:
        return f"ERROR: {e}"


@tool
def get_pr_diff(pr_number: int) -> str:
    """Get the diff of a pull request.

    Args:
        pr_number: The pull request number.
    """
    try:
        repo = _repo()
        pr = repo.get_pull(pr_number)
        files = pr.get_files()
        parts = [f"## {f.filename} (+{f.additions}/-{f.deletions})\n```diff\n{f.patch or ''}\n```" for f in files]
        return "\n\n".join(parts) or "(no diff)"
    except Exception as e:
        return f"ERROR: {e}"


github_tools = [list_open_issues, get_issue, create_pull_request, comment_on_issue, get_pr_diff]
