# Task 01b: Local PostgreSQL Development Setup

## Goal

Provide a consistent local PostgreSQL environment using Docker Compose so Prisma migrations and integration tests can run locally.

## Requirements

- Add local PostgreSQL setup in a future implementation step.
- Use Docker Compose.
- Prefer the modern command: `docker compose up -d`.
- Add a PostgreSQL 16 service.
- Suggested container name: `restopsiq-db`.
- Suggested database: `restopsiq`.
- Suggested local credentials: `postgres`/`postgres`.
- Add a persistent volume.
- Add root `.env.example` if missing with:
  `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/restopsiq?schema=public"`
- Add `docs/LOCAL_DEVELOPMENT.md` with local DB and Prisma commands.

## Acceptance Criteria

- A developer can start local PostgreSQL with `docker compose up -d`.
- Prisma can connect using `DATABASE_URL`.
- Local migration commands are documented.

## Files likely affected in the future implementation

- `docker-compose.yml`
- `.env.example`
- `docs/LOCAL_DEVELOPMENT.md`

## Out of Scope

- Production infrastructure.
- Railway/AWS.
- CI secrets.
- Business models.
- `schema.prisma` changes.
- Services/controllers/tests.
- `README` changes unless explicitly requested later.
