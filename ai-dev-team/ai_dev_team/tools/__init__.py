"""AI Dev Team tool registry."""
from ai_dev_team.tools.filesystem import filesystem_tools
from ai_dev_team.tools.shell import shell_tools
from ai_dev_team.tools.git_tools import git_tools
from ai_dev_team.tools.github_tools import github_tools

# All tools available to every agent
ALL_TOOLS = filesystem_tools + shell_tools + git_tools + github_tools

# Tool subsets by agent role
READONLY_TOOLS = filesystem_tools + [t for t in git_tools if t.name in ("git_status", "git_log", "git_diff", "git_current_branch")]
WRITE_TOOLS = ALL_TOOLS

__all__ = ["filesystem_tools", "shell_tools", "git_tools", "github_tools", "ALL_TOOLS", "READONLY_TOOLS", "WRITE_TOOLS"]
