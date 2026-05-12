# Task 01: Prisma Foundation Setup

## Goal

Initialize Prisma ORM in the API application to provide a typed data access layer.

## Requirements

- Add `prisma` and `@prisma/client` to `apps/api/package.json`.
- Create `apps/api/prisma/schema.prisma`.
- Configure `datasource` for PostgreSQL (using env vars).
- Configure `generator client` with `provider = "prisma-client-js"`.
- Add `prisma generate` and `prisma migrate` scripts to `apps/api/package.json`.

## Acceptance Criteria

- Running `npx prisma generate` inside `apps/api` succeeds.
- No business models are implemented yet, only the provider and generator configuration.

## Files Likely Affected

- `apps/api/package.json`
- `apps/api/prisma/schema.prisma`

## Out of Scope

- Creating business models (Recipe, Product, etc.).
- Establishing DB connection in production.
