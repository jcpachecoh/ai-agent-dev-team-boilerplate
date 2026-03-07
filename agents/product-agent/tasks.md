# Product Agent — Task List

This file tracks the standard recurring tasks owned by the Product Agent.

## Recurring Tasks

### PT-001: Define Product Scope
- Review business requirements with stakeholders
- Write a high-level scope document in `specs/product-scope.md`
- Define MVP vs. future phases

### PT-002: Generate Feature Spec
- For each feature in `docs/ROADMAP.md`, create a spec file in `specs/`
- Include goal, user stories, requirements, and acceptance criteria
- Flag any ambiguous requirements for clarification

### PT-003: Break Features into Tasks
- For each approved spec, create granular task files in `tasks/`
- Assign a sequential number and descriptive name to each task
- Ensure each task is small enough to complete in a single session

### PT-004: Update Task Pointer
- After completing a task or phase, update `NEXT_TASK.md`
- Ensure it always points to the highest-priority incomplete task

### PT-005: Maintain Product Documentation
- Keep `docs/ROADMAP.md` up to date with feature status
- Archive completed specs by moving them to `specs/archive/`
- Document any scope changes with rationale

## Task Template

When creating a new task file in `tasks/`, use this format:

```markdown
# Task: <Feature Name>

**Spec:** specs/<feature-name>.md
**Agent:** <responsible agent>
**Priority:** High | Medium | Low
**Status:** Pending | In Progress | Done

## Goal
One sentence describing what to implement.

## Requirements
- Requirement 1
- Requirement 2

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Context
Any additional notes or constraints.
```
