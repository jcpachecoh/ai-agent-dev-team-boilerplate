# Frontend Agent — Task List

This file tracks the standard recurring tasks owned by the Frontend Agent.

## Recurring Tasks

### FT-001: Build UI Components
- Create reusable components based on the feature spec
- Follow the project design system and component conventions
- Export components from a central index file

### FT-002: Implement Pages and Layouts
- Create page files for new routes
- Implement layout wrappers (headers, footers, navigation)
- Configure routing using the framework's router

### FT-003: Connect Frontend to APIs
- Implement API client functions or hooks
- Handle loading, success, and error states in the UI
- Use environment variables for API base URLs

### FT-004: Maintain Design Consistency
- Apply consistent spacing, typography, and color tokens
- Review designs against the project style guide
- Verify responsive behavior on common screen sizes

### FT-005: Optimize Performance
- Lazy-load components and routes where appropriate
- Minimize bundle size by avoiding unnecessary imports
- Add image optimization and caching strategies

### FT-006: Write Frontend Tests
- Write unit tests for UI components
- Write integration tests for page-level flows
- Ensure all acceptance criteria are covered by tests

## Notes

- Always read API contracts from the Backend Agent before implementing integrations.
- Coordinate with the Architecture Agent before introducing new UI libraries.
- Update `NEXT_TASK.md` when a task is complete.
