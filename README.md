# AI Agent Development Team Boilerplate

A structured framework for building projects using AI-assisted development with GitHub Copilot, Claude, or LangGraph agents

## Overview

This boilerplate provides a task-driven workflow where AI agents collaborate to implement features. It's designed to integrate AI development assistance directly into the development process while maintaining code quality and organization.

## Quick Start

### 1. Setup

```bash
# Clone or use this boilerplate as a template
git clone <repo-url>
cd ai-agent-dev-team-boilerplate

# Install dependencies (Python for agents, Node for app, etc.)
pip install -r requirements.txt  # If using Python agents
npm install                      # If using Node/Next.js
```

### 2. Define Your Project

Update the documentation files:

- **`docs/ARCHITECTURE.md`** - Describe your tech stack and system design
- **`docs/ROADMAP.md`** - Outline features and milestones
- **`tasks/`** - Break down work into detailed task files
- **`NEXT_TASK.md`** - Always points to the current task to work on

### 3. Execute Tasks

For each task:

1. **Read the current task** - Check `NEXT_TASK.md`
2. **Use AI assistance**:
   - Share `NEXT_TASK.md`, relevant `tasks/`, `ARCHITECTURE.md` with Copilot/Claude
   - Or run automation agents in `ai-dev-team/`
3. **Review & test** - Verify generated code meets requirements
4. **Commit** - Save changes with clear commit messages
5. **Update NEXT_TASK.md** - Point to the next task

## Project Structure

```
ai-agent-dev-team-boilerplate/
├── README.md                    # This file
├── NEXT_TASK.md                # Current task pointer
├── docs/                        # Project documentation
│   ├── AGENTS.md               # Agent guidelines
│   ├── ARCHITECTURE.md         # Tech stack & system design
│   └── ROADMAP.md              # Feature roadmap
├── tasks/                       # Task definitions
│   ├── 01-project-setup.md
│   ├── 02-authentication.md
│   └── ...
└── ai-dev-team/                # AI automation agents
    ├── agents/                 # Agent implementations
    │   └── example_agent.py
    └── graph/                  # LangGraph workflows
        └── dev_graph.py
```

## How to Use

### Option 1: Manual AI-Assisted Development

Best for: Quick projects, exploratory work

```bash
# 1. Update current task
echo "tasks/03-database-schema.md" > NEXT_TASK.md

# 2. Share with AI assistant (e.g., GitHub Copilot in VS Code)
# Copy content from:
#   - NEXT_TASK.md
#   - tasks/03-database-schema.md
#   - docs/ARCHITECTURE.md
# Paste into Copilot chat and request implementation

# 3. Review changes and test
npm test

# 4. Commit
git add .
git commit -m "feat: implement database schema"
git push
```

### Option 2: Automated Agent Workflow

Best for: Complex projects, multi-step workflows

```bash
# 1. Create your task definition
cat > tasks/03-database-schema.md << EOF
# Task: Database Schema

## Goal
Create Prisma schema for user and post models.

## Requirements
- User table with email and password
- Post table with title, content, author
- ...
EOF

# 2. Update NEXT_TASK.md
echo "tasks/03-database-schema.md" > NEXT_TASK.md

# 3. Run agent workflow (if configured)
python ai-dev-team/graph/dev_graph.py

# 4. Review and commit changes
git status
git add .
git commit -m "feat: implement database schema (automated)"
```

## Configuration

### Typical Tech Stack (from ARCHITECTURE.md)

```
Frontend:  Next.js + TailwindCSS
Backend:   NestJS or Node.js
Database:  PostgreSQL + Prisma ORM
DevOps:    Docker + GitHub Actions
```

Customize in `docs/ARCHITECTURE.md` for your project.

### Agent Configuration

Agents can read and reference:

- `docs/ARCHITECTURE.md` - Technical constraints
- `docs/ROADMAP.md` - Feature priorities
- `tasks/` - Detailed requirements
- `NEXT_TASK.md` - Current focus

See `docs/AGENTS.md` for agent guidelines.

## Best Practices

1. **Write detailed tasks** - The more context in task files, the better the AI output
2. **Review all changes** - Always review AI-generated code before merging
3. **Test thoroughly** - Run tests and validation before committing
4. **Keep tasks focused** - One feature per task for clarity
5. **Update documentation** - Keep ARCHITECTURE.md and ROADMAP.md in sync
6. **Commit frequently** - Small commits are easier to review and revert

## Task File Template

Create clear task definitions in `tasks/`:

```markdown
# Task: Feature Name

## Goal

One sentence describing the goal.

## Requirements

- Requirement 1
- Requirement 2
- Acceptance criteria

## Context

Additional context or constraints.

## Files to Create/Modify

- src/components/...
- src/api/...
```

## Workflow Example

```
NEXT_TASK.md → tasks/01-project-setup.md ✓
NEXT_TASK.md → tasks/02-authentication.md ✓
NEXT_TASK.md → tasks/03-database-schema.md (current)
NEXT_TASK.md → tasks/04-api-endpoints.md
NEXT_TASK.md → tasks/05-ui-components.md
...
```

## Integration with Tools

**GitHub Copilot (Recommended)**

- Copy task content into VS Code Copilot chat
- Fast iteration with inline code suggestions
- Works within your editor

**Claude / ChatGPT**

- Share task files for detailed implementation
- Use web interface or API integration
- Good for complex architectural decisions

**LangGraph Agents**

- Create custom agents in `ai-dev-team/agents/`
- Implement autonomous task execution
- Integrate with your CI/CD pipeline

## GitHub Issues Integration

Automate your workflow by connecting GitHub Issues to tasks:

### Setup GitHub Actions Automation

Create `.github/workflows/issue-to-task.yml`:

```yaml
name: Convert Issue to Task

on:
  issues:
    types: [opened, edited]

jobs:
  create-task:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Create task from issue
        run: |
          TASK_NUM=$(ls tasks/ | wc -l)
          TASK_NUM=$((TASK_NUM + 1))
          ISSUE_NUM=${{ github.event.issue.number }}
          TASK_FILE="tasks/$(printf '%02d' $TASK_NUM)-issue-$ISSUE_NUM.md"

          cat > "$TASK_FILE" << 'EOF'
          # ${{ github.event.issue.title }}

          **Issue:** #${{ github.event.issue.number }}
          **Created:** ${{ github.event.issue.created_at }}

          ## Goal
          ${{ github.event.issue.body }}

          ## Acceptance Criteria
          - [ ] Issue requirements met
          - [ ] Tests passing
          - [ ] Code reviewed
          - [ ] Changes merged
          EOF

          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add "$TASK_FILE"
          git commit -m "task: create task from issue #$ISSUE_NUM"
          git push

      - name: Comment on issue
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Task created: `tasks/NN-issue-${{ github.event.issue.number }}.md`'
            })
```

### Auto-Link Branches to Issues

Create `.github/workflows/branch-from-issue.yml`:

```yaml
name: Create Branch from Issue

on:
  issues:
    types: [opened]

jobs:
  create-branch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Create feature branch
        run: |
          ISSUE_NUM=${{ github.event.issue.number }}
          ISSUE_TITLE=$(echo "${{ github.event.issue.title }}" | \
            sed 's/[^a-zA-Z0-9]/-/g' | tr '[:upper:]' '[:lower:]' | \
            sed 's/-*$//' | cut -c1-20)

          BRANCH_NAME="issue/${ISSUE_NUM}-${ISSUE_TITLE}"

          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git checkout -b "$BRANCH_NAME"
          git push -u origin "$BRANCH_NAME"

      - name: Link branch to issue
        uses: actions/github-script@v6
        with:
          script: |
            const BRANCH = "issue/${{ github.event.issue.number }}-*"
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🔗 Development branch: `' + BRANCH + '`'
            })
```

### Auto-Close Issues on PR Merge

Create `.github/workflows/close-issue-on-merge.yml`:

```yaml
name: Close Issue on PR Merge

on:
  pull_request:
    types: [closed]

jobs:
  close-issue:
    runs-on: ubuntu-latest
    if: github.event.pull_request.merged == true
    steps:
      - uses: actions/github-script@v6
        with:
          script: |
            // Extract issue number from branch name or PR
            const branch = context.payload.pull_request.head.ref;
            const match = branch.match(/issue\/(\d+)/);

            if (match && match[1]) {
              const issueNumber = parseInt(match[1]);
              
              // Close the issue
              github.rest.issues.update({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issueNumber,
                state: 'closed'
              });
              
              // Add comment
              github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issueNumber,
                body: '✅ Closed by PR #' + context.payload.pull_request.number
              });
            }
```

### Manual Issue-to-Task Workflow

If you prefer manual control:

```bash
# 1. Create issue on GitHub with title and description
# (Use the issue template with acceptance criteria)

# 2. Create task file from issue content
ISSUE_NUM=42
cat > tasks/03-new-feature.md << EOF
# New Feature

**Issue:** #$ISSUE_NUM
**Status:** In Progress

## Goal
Describe the goal here based on the issue.

## Requirements
- From GitHub issue requirements
- Additional acceptance criteria

## Implementation
Add implementation notes as you work.
EOF

# 3. Update NEXT_TASK.md
echo "tasks/03-new-feature.md" > NEXT_TASK.md

# 4. Create feature branch
git checkout -b feature/issue-$ISSUE_NUM-new-feature

# 5. Implement and commit
git add .
git commit -m "feat: implement feature for issue #$ISSUE_NUM"

# 6. Push and create PR (reference issue in PR description)
git push origin feature/issue-$ISSUE_NUM-new-feature
# PR opens with "Closes #$ISSUE_NUM" in description

# 7. When PR is merged, issue auto-closes
```

### GitHub Issue Template

Create `.github/ISSUE_TEMPLATE/feature.md`:

```markdown
---
name: Feature Request
about: Suggest a new feature
title: ''
labels: 'enhancement'
assignees: ''
---

## Goal

[One sentence describing what should be built]

## Why

[Why is this needed? What problem does it solve?]

## Requirements

- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Acceptance criterion

## Technical Notes

[Any architecture or design notes]

## Files to Create/Modify

- `src/...`
- `tests/...`
```

### Monitor Issues in Your Workflow

Link GitHub Issues dashboard in your workflow:

```bash
# Check issues assigned to you
gh issue list --assignee @me --state open

# Watch issue progress
gh issue view 42 --web

# Update NEXT_TASK.md from highest-priority open issue
NEXT_ISSUE=$(gh issue list --state open --limit 1 --json number --jq '.[0].number')
TASK_FILE="tasks/NN-issue-$NEXT_ISSUE.md"
echo "$TASK_FILE" > NEXT_TASK.md
```

### Complete Workflow Example

```
GitHub Issue Created (#42)
        ↓
Workflow: Create task file (tasks/03-issue-42.md)
        ↓
Workflow: Create feature branch (feature/issue-42-*)
        ↓
Developer: Update NEXT_TASK.md → tasks/03-issue-42.md
        ↓
Developer: Use Copilot to implement from task
        ↓
Developer: Push and create PR (references "#42")
        ↓
Review & Merge PR
        ↓
Workflow: Auto-close issue #42
        ↓
Issue closed ✓
Task completed ✓
```

## Common Commands

```bash
# Check current task
cat NEXT_TASK.md

# View task details
cat tasks/$(cat NEXT_TASK.md | cut -d'/' -f2)

# List all tasks
ls -1 tasks/

# Update to next task
echo "tasks/NN-next-feature.md" > NEXT_TASK.md

# View architecture
cat docs/ARCHITECTURE.md

# See agent guidelines
cat docs/AGENTS.md
```

## Tips for Success

- **Be explicit** - Write unambiguous requirements in task files
- **Iterate** - Use multiple AI requests to refine implementation
- **Document decisions** - Update ARCHITECTURE.md as you learn
- **Test early** - Add tests before AI implementation
- **Track progress** - Keep NEXT_TASK.md updated as source of truth

## Support

For questions about the boilerplate:

- Review `docs/AGENTS.md` for agent development
- Check `docs/ARCHITECTURE.md` for tech decisions
- See `tasks/` for example task definitions

## License

Use freely in your projects.
