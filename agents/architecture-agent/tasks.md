# Architecture Agent — Task List

This file tracks the standard recurring tasks owned by the Architecture Agent.

## Recurring Tasks

### AT-001: Define System Architecture
- Document the full system architecture in `docs/ARCHITECTURE.md`
- Include tech stack, service topology, data flow, and integration points
- Review and update after each major feature or milestone

### AT-002: Review Agent Outputs
- Review implementation proposals and pull requests from all agents
- Check for compliance with `docs/ARCHITECTURE.md`
- Approve or request changes before implementations are finalized

### AT-003: Enforce Best Practices
- Ensure all agents follow security, scalability, and maintainability standards
- Identify and flag anti-patterns in proposed implementations
- Provide guidance and examples for correct patterns

### AT-004: Approve Architecture Changes
- Evaluate requests from agents to introduce new dependencies or services
- Write an Architecture Decision Record (ADR) for each significant change
- Communicate decisions to all affected agents

### AT-005: Maintain Technical Standards
- Maintain a coding standards document or reference in `docs/ARCHITECTURE.md`
- Ensure consistent naming conventions, folder structures, and patterns across agents
- Conduct periodic architecture reviews to identify technical debt

### AT-006: Resolve Technical Ambiguity
- When agents surface conflicting or unclear requirements, provide a definitive resolution
- Document the resolution so all agents have a consistent reference

## Notes

- The Architecture Agent has final authority on technical decisions.
- Any agent can escalate a technical question to the Architecture Agent.
- ADRs should be stored in `docs/adr/` using the format `ADR-NNN-<title>.md`.
