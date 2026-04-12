
# System Architecture

Typical stack used with this boilerplate:

Frontend
- Next.js
- SASS/SCSS Modules (7-1 architecture)
- Storybook (shared UI component library)

Backend
- NestJS or Node.js

Database
- PostgreSQL
- Prisma ORM

Infrastructure
- Docker
- GitHub Actions

## Frontend Component Conventions

All UI components must follow this structure:

```
ComponentName/
├── index.ts                    # Public barrel export
├── ComponentName.tsx           # Component implementation
└── ComponentName.module.scss   # Scoped styles (SCSS Module)
```

### Styling Guidelines

- **No Tailwind CSS** — use SASS/SCSS Modules for all component styling.
- Use `*.module.scss` files for component-scoped styles.
- Use the 7-1 SASS architecture for global/shared styles in `packages/ui/src/styles/`.
- **The 7-1 SASS architecture is used only for `base/` and `abstracts/` to define the look and feel of the application.** These two folders are the single source of truth for design tokens, resets, global typography, and reusable mixins/functions — prioritizing reusability and theme management. All other visual styling must live in component-scoped `*.module.scss` files.
- Import design tokens (colors, spacing, typography) from `styles/abstracts/` in component SCSS files.

### 7-1 SASS Architecture

> **Note:** Only `abstracts/` and `base/` are used to define the application's look and feel. They provide the foundation for reusability and theme management. Component-specific styling should use SCSS Modules (`*.module.scss`).

```
styles/
├── abstracts/      # Variables, mixins, functions — design tokens & reusable helpers
├── base/           # Reset, typography, global base styles — application look & feel
├── components/     # Global component styles (non-module)
├── layout/         # Header, footer, grid, navigation
├── pages/          # Page-specific styles
├── themes/         # Theme definitions (light/dark)
├── vendors/        # Third-party style overrides
└── main.scss       # Main entry point that imports all partials
```

### Shared UI Package (`@restopsiq/ui`)

- All reusable components live in `packages/ui/src/components/`.
- Each component is individually styled with SCSS Modules.
- Storybook is available for interactive component development and documentation.
- Run `npm run storybook` inside `packages/ui/` to launch Storybook.
