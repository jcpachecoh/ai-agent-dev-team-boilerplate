# Backend Agent — Task List

This file tracks the standard recurring tasks owned by the Backend Agent.

## Recurring Tasks

### BT-001: Design Database Schema
- Read the feature spec from `specs/`
- Define tables, columns, types, and relationships
- Create migration files using the project ORM

### BT-002: Implement Service Layer
- Create service classes with business logic
- Follow the repository pattern for data access
- Ensure services are stateless and testable

### BT-003: Create API Endpoints
- Implement RESTful routes for the feature
- Validate all request inputs
- Return structured JSON responses with appropriate HTTP status codes

### BT-004: Write Backend Tests
- Write unit tests for service methods
- Write integration tests for API endpoints
- Ensure edge cases and error paths are covered

### BT-005: Review API Contracts
- Document all new or changed endpoints
- Share API contracts with the Frontend Agent
- Update OpenAPI/Swagger documentation if applicable

### BT-006: Security Review
- Ensure all endpoints are properly authenticated and authorized
- Sanitize and validate all user inputs
- Review for SQL injection, XSS, and other common vulnerabilities

## Notes

- Always read `docs/ARCHITECTURE.md` before starting a task.
- Coordinate with the Architecture Agent before adding new dependencies.
- Update `NEXT_TASK.md` when a task is complete.
