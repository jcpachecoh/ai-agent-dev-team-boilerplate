# Frontend Agent — Task List

This file tracks the standard recurring tasks owned by the Frontend Agent.

## Recurring Tasks

### FT-001: Build UI Components

- Create reusable components based on the feature spec
- Follow the SASS/SCSS Module component conventions (see `docs/ARCHITECTURE.md`)
- Every component must have: `index.ts`, `ComponentName.tsx`, `ComponentName.module.scss`
- Use design tokens from `styles/abstracts/` for colors, spacing, and typography
- Export components from a central index file
- Add a Storybook story for each new component

### FT-002: Implement Pages and Layouts

- Create page files for new routes
- Implement layout wrappers (headers, footers, navigation)
- Configure routing using the framework's router

### FT-003: Connect Frontend to APIs

- Implement API client functions or hooks
- Handle loading, success, and error states in the UI
- Use environment variables for API base URLs

### FT-004: Maintain Design Consistency

- Apply consistent spacing, typography, and color tokens from SASS abstracts
- Review designs against the project style guide and Storybook
- Verify responsive behavior on common screen sizes
- Use the 7-1 SASS architecture **only for `base/` and `abstracts/`** to define the application's look and feel — these folders own resets, global typography, design tokens, mixins, and functions for reusability and theme management
- All other component styling must use scoped `*.module.scss` files
- Never use Tailwind CSS or inline utility classes

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
