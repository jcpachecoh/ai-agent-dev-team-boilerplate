# DevOps Agent — Task List

This file tracks the standard recurring tasks owned by the DevOps Agent.

## Recurring Tasks

### DO-001: Docker Setup
- Create a `Dockerfile` for each service (frontend, backend, etc.)
- Create a `docker-compose.yml` for local development
- Use multi-stage builds to minimize production image size
- Test that all services start correctly with `docker compose up`

### DO-002: CI/CD Pipeline Configuration
- Create or update pipeline workflow files (e.g., `.github/workflows/`)
- Add steps for install, lint, test, build, and deploy
- Ensure the pipeline runs on pull requests and merges to main

### DO-003: Environment Configuration
- Maintain `.env.example` with all required environment variables
- Document the purpose of each variable
- Ensure no secrets are hardcoded or committed to the repository

### DO-004: Cloud Deployment
- Configure deployment to the target cloud provider
- Use infrastructure as code (Terraform, Pulumi, or cloud-native tools)
- Test deployments in a staging environment before production

### DO-005: Monitoring and Logging
- Set up application logging with structured output
- Configure uptime monitoring and health check endpoints
- Set up alerting for errors and performance degradation

### DO-006: Rollback Procedures
- Document rollback steps for each deployment
- Ensure the CI/CD pipeline supports one-click rollback
- Test rollback procedures in staging

## Notes

- All infrastructure changes must be reviewed by the Architecture Agent.
- Integrate automated tests (from the Testing Agent) into every pipeline run.
- Keep deployment scripts in `scripts/` with clear documentation.
