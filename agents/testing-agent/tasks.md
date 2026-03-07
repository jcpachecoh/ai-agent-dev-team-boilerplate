# Testing Agent — Task List

This file tracks the standard recurring tasks owned by the Testing Agent.

## Recurring Tasks

### TT-001: Write Unit Tests
- Identify all functions and methods with business logic
- Write tests that cover happy paths, edge cases, and error scenarios
- Ensure tests are isolated and do not depend on external services

### TT-002: Write Integration Tests
- Test interactions between services, APIs, and databases
- Use test databases or mocks to isolate from production systems
- Validate full request-response cycles for API endpoints

### TT-003: Validate Acceptance Criteria
- Map each acceptance criterion from the spec to one or more tests
- Mark criteria as verified once corresponding tests pass
- Report any untestable criteria back to the Product Agent

### TT-004: Ensure Coverage
- Run coverage reports and identify untested code paths
- Add tests for any critical paths below the coverage threshold
- Focus on meaningful coverage, not gaming metrics

### TT-005: Prevent Regressions
- Run the full test suite before marking any task complete
- Investigate and fix any tests broken by new changes
- Add regression tests for any bugs that are fixed

### TT-006: End-to-End Testing
- Identify critical user flows from the product spec
- Write E2E tests using the approved testing framework
- Run E2E tests in a staging environment that mirrors production

## Notes

- Never delete or skip existing tests.
- Use seed data from `datasets/seed/` for test fixtures.
- Coordinate with the DevOps Agent to integrate tests into the CI/CD pipeline.
