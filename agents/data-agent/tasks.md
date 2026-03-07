# Data Agent — Task List

This file tracks the standard recurring tasks owned by the Data Agent.

## Recurring Tasks

### DT-001: Create Dataset
- Identify the data source (CSV, API, database export, etc.)
- Store raw data in `datasets/raw/<dataset-name>/`
- Document the data source and schema

### DT-002: Implement ETL Script
- Create a script in `scripts/etl-<source>-to-<target>.py`
- Extract data from the source
- Transform data to match the target schema
- Load data into the target location (`datasets/processed/` or database)

### DT-003: Validate Data Quality
- Add row count and null-value checks to every ETL script
- Verify referential integrity if data relates to database entities
- Log validation results with clear pass/fail output

### DT-004: Create Seed Data
- Prepare representative sample data for development and testing
- Store seed files in `datasets/seed/`
- Coordinate with the Backend Agent on seed data format

### DT-005: Maintain Data Pipelines
- Schedule or trigger ETL scripts via the CI/CD system (with DevOps Agent)
- Monitor pipeline runs and set up alerting for failures
- Archive outdated datasets to `datasets/archive/`

### DT-006: Document Data Schemas
- For each dataset, create a companion `schema.md` file describing fields and types
- Keep documentation in sync when schemas change

## Notes

- Never commit PII or sensitive data to the repository.
- All ETL scripts must be idempotent (safe to re-run without duplicating data).
- Coordinate schema changes with the Backend Agent before implementation.
