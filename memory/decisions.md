# Architectural & Product Decisions

This file is the canonical log of all significant decisions made during the project. Agents must record decisions here so that the entire team shares a consistent understanding of _why_ the system is designed the way it is.

For formal Architecture Decision Records (ADRs), see `docs/adr/`.

---

## Decision Log Format

Each entry should follow this structure:

```
### DEC-NNN: <Short Title>

- **Date:** YYYY-MM-DD
- **Status:** proposed | accepted | superseded | deprecated
- **Decided by:** <Agent name or human>
- **Context:** Why was this decision needed?
- **Decision:** What was decided?
- **Rationale:** Why was this option chosen over alternatives?
- **Consequences:** What does this decision make easier or harder?
```

---

## Decisions

### DEC-001: Use Task-Driven Workflow

- **Date:** _YYYY-MM-DD_
- **Status:** accepted
- **Decided by:** Architecture Agent
- **Context:** The project requires multiple AI agents to collaborate without stepping on each other's work.
- **Decision:** All work is expressed as task files in `tasks/`. Agents are assigned tasks by the Orchestrator based on domain tags.
- **Rationale:** Task files provide a clear, auditable record of work to be done, and they are easy to share across AI sessions.
- **Consequences:** Every feature must be broken into task files before implementation can begin. This adds a small upfront cost but significantly improves coordination.

---

_Add new decisions below this line as the project evolves._
