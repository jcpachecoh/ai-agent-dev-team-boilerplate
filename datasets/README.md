# Datasets

This folder contains datasets managed by the **Data Agent**.

## Structure

```
datasets/
├── raw/                      # Unprocessed source data
│   └── <dataset-name>/       # One folder per dataset
├── processed/                # Cleaned and transformed data
│   └── <dataset-name>/
├── seed/                     # Seed data for development and testing
└── archive/                  # Outdated or deprecated datasets
```

## Guidelines

- **Raw data** — store original source files as received (CSV, JSON, etc.). Do not modify.
- **Processed data** — output from ETL scripts. Generated automatically; do not edit manually.
- **Seed data** — curated sample data used to populate development databases and test fixtures.
- **Archive** — datasets no longer in active use. Keep for audit/historical reference.

## Important Rules

- **Never commit PII or sensitive data** to this repository.
- All datasets must have a companion `schema.md` file co-located with the dataset (e.g., `datasets/raw/<dataset-name>/schema.md`) describing fields and data types.
- Raw data files should be small enough for version control. For large datasets, store only a sample and document the full data source location.

## Companion Schema File Format

```markdown
# Schema: <Dataset Name>

## Source
Where does this data come from?

## Fields

| Field | Type | Description |
|-------|------|-------------|
| id    | int  | Unique identifier |
| ...   | ...  | ...         |
```
