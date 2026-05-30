# Architecture Overview

AI Governance Sentinel follows a modular architecture designed for enterprise AI governance.

## Components

### Web Application

The web application provides dashboards, inventory views, AI agent detail pages and risk reports.

### API

The API exposes governance and risk scoring capabilities through FastAPI.

### Risk Engine

The risk engine evaluates AI agents according to:

- data sensitivity,
- autonomy level,
- connector exposure,
- internet exposure,
- human approval requirements,
- prompt and output retention.

### Database

PostgreSQL will store:

- AI agents,
- connectors,
- risk assessments,
- audit logs,
- recommendations,
- users and roles.

### Future Observability

OpenTelemetry will be used to collect traces and metrics from agent evaluations and governance workflows.
