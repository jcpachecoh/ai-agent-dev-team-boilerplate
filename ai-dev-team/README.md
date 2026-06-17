# AI Dev Team

LangGraph-powered AI agent workflow that autonomously implements tasks for the RestOpsIQ Platform.

## Setup

```bash
cd ai-dev-team

# Copy and fill in your API keys
cp .env.example .env

# Install Python dependencies (Python 3.11+)
pip install -e .
```

## Usage

```bash
# Run the current task (reads from NEXT_TASK.md)
python -m ai_dev_team

# Run a specific task file
python -m ai_dev_team run tasks/03-auth.md

# Approve the human review checkpoint and continue
python -m ai_dev_team approve

# Check current workflow state
python -m ai_dev_team status
```

## Architecture

```
ai_dev_team/
├── config.py           — Environment & LLM configuration
├── main.py             — CLI entrypoint (typer)
├── graph/
│   ├── state.py        — AgentState TypedDict (shared state schema)
│   └── dev_graph.py    — LangGraph StateGraph (full workflow)
├── agents/
│   ├── base_agent.py   — LLM factory + agent node builder
│   └── roles.py        — Per-role agent nodes with bound tools
└── tools/
    ├── filesystem.py   — read_file, write_file, list_files, search_files
    ├── shell.py        — run_command (allowlist-guarded)
    ├── git_tools.py    — git_status, git_commit, git_create_branch, git_push
    └── github_tools.py — list_issues, create_pr, comment_on_issue
```

## Workflow Phases

```
load_context → product → architecture → [human_review] →
  backend + frontend + data (sequential) → testing → devops → done
```

Each agent reads `memory/project-context.md`, `docs/ARCHITECTURE.md`, and the
current task file before acting. Tool calls are executed by companion ToolNodes.

## Environment Variables

See `.env.example` for all configuration options (LLM provider, model, GitHub token, etc.).
