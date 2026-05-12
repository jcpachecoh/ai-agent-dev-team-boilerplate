# Local Development Guide

This guide explains how to set up the local development environment for RestOpsIQ.

## Prerequisites

- Docker and Docker Compose
- Node.js (>= 18)
- npm

## 1. Database Setup

The project uses PostgreSQL 16 managed via Docker Compose.

### Start the database

```bash
docker compose up -d
```

### View logs

```bash
docker compose logs -f postgres
```

### Stop the database

```bash
docker compose down
```

## 2. Prisma Database Operations

Once the database is running, navigate to the API directory to manage the schema and migrations.

### Generate Prisma Client

```bash
cd apps/api && npx prisma generate
```

### Run Migrations

```bash
cd apps/api && npx prisma migrate dev
```

### Open Prisma Studio

```bash
cd apps/api && npx prisma studio
```
