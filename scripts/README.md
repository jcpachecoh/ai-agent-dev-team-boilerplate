# Scripts

This folder contains automation and utility scripts managed by the **Data Agent** and **DevOps Agent**.

## Structure

```
scripts/
├── etl-<source>-to-<target>.py   # ETL pipeline scripts (Data Agent)
├── seed-database.py              # Database seeding scripts (Data Agent)
├── deploy-<environment>.sh       # Deployment scripts (DevOps Agent)
└── README.md                     # This file
```

## Script Categories

### ETL Scripts (Data Agent)
Scripts that extract, transform, and load data between sources and targets.

Naming convention: `etl-<source>-to-<target>.<ext>`

Example: `etl-csv-to-postgres.py`

### Seed Scripts (Data Agent)
Scripts that populate development or test databases with sample data.

Example: `seed-database.py`

### Deployment Scripts (DevOps Agent)
Scripts that automate deployment steps not covered by CI/CD pipelines.

Example: `deploy-staging.sh`

## Guidelines

- Every script must include a docstring or header comment explaining its purpose, inputs, and outputs.
- ETL scripts must be **idempotent** — safe to re-run without creating duplicate data.
- Never hardcode credentials or secrets in scripts. Use environment variables.
- Log progress and errors clearly so scripts can be debugged without deep investigation.
