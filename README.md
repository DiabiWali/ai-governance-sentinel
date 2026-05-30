# AI Governance Sentinel

**AI Governance Sentinel** is an open-source platform designed to inventory, assess and secure enterprise AI agents, RAG systems and automation workflows.

![AI Governance Sentinel Dashboard](docs/assets/dashboard-v0.1.0.png)

This project is not another chatbot. It is a governance and security control plane for enterprise AI adoption.

## Problem

Organizations are deploying AI assistants and autonomous agents connected to internal tools such as SharePoint, Outlook, GitHub, databases, APIs and business applications.

The risk is no longer only the model itself. The real risk is the combination of sensitive data access, excessive permissions, autonomous actions, weak auditability, prompt injection, insecure connectors, missing human approval and poor governance.

## Vision

AI Governance Sentinel helps teams answer a simple question:

> Which AI agents are using our data, with which permissions, and what level of risk?

## Core Features

### V1 - MVP

- AI agent inventory
- Risk scoring engine
- Connector risk analysis
- Human approval recommendations
- Prompt and output retention checks
- API-first architecture
- Docker-based local environment

### Upcoming

- Web dashboard
- Prompt injection test suite
- Compliance mapping
- RAG governance assistant
- Audit reports
- OpenTelemetry traces
- Kubernetes deployment
- MCP gateway experimentation

## Architecture

```txt
apps/
├─ web/          Next.js frontend
└─ api/          FastAPI backend

docs/            Architecture, threat model, roadmap
docker-compose   Local development stack
```

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: FastAPI, Python
- Database: PostgreSQL
- Infrastructure: Docker Compose
- Future: OpenTelemetry, Grafana, pgvector, Kubernetes

## Local Development

### Start the frontend

```bash
cd apps/web
npm install
npm run dev
```

### Start the backend

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

On Windows PowerShell:

```powershell
cd apps\api
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend health check:

```txt
http://localhost:8000/health
```

API documentation:

```txt
http://localhost:8000/docs
```

## Example Risk Assessment Payload

```json
{
  "name": "HR Assistant",
  "purpose": "Answer HR policy questions and draft internal emails",
  "model_provider": "OpenAI",
  "data_sensitivity": "confidential",
  "autonomy_level": "fully_autonomous",
  "connectors": ["sharepoint", "outlook", "hr_api"],
  "internet_exposed": false,
  "human_approval_required": false,
  "stores_prompts": true,
  "stores_outputs": true
}
```

## Security Principles

- Least privilege by design
- Human-in-the-loop for sensitive actions
- Auditability of agent decisions
- Risk-based governance
- Connector-level security analysis
- Privacy and retention awareness

## Roadmap

- [x] Repository bootstrap
- [x] FastAPI risk scoring API
- [ ] Frontend dashboard
- [ ] Agent inventory CRUD
- [ ] PostgreSQL persistence
- [ ] Prompt injection test suite
- [ ] AI risk report export
- [ ] Authentication and RBAC
- [ ] Observability dashboard
- [ ] Kubernetes deployment

## Author

Built by Wali Diabi as a practical AI, cloud, cybersecurity and enterprise architecture project.

## Demo Scenarios

The project includes realistic enterprise AI governance scenarios:

- Low-risk public FAQ assistant
- Critical-risk HR assistant
- High-risk finance analysis agent
- Medium-risk public support agent

See [Demo Scenarios](docs/demo-scenarios.md).

## Roadmap

See [Roadmap](ROADMAP.md).

## Current Capabilities

AI Governance Sentinel currently provides:

- AI agent inventory
- Dynamic risk scoring
- PostgreSQL persistence
- Prompt injection security testing
- PDF governance report export
- API key authentication
- Role-based access control
- Admin audit logs
- Frontend governance dashboard

## Security Model

The API is protected with API key authentication using the `X-API-Key` header.

Demo roles:

- `analyst`: can assess agents, run prompt injection tests and generate reports
- `admin`: can perform analyst actions and access audit logs

Demo keys are provided only for local development and must not be used in production.

## Demo Credentials

For local development:

``txt
Admin API key: dev-admin-key
Analyst API key: dev-analyst-key
``

The frontend uses `NEXT_PUBLIC_DEMO_API_KEY` for local demo purposes.

## API Security Headers

Protected endpoints require the following header:

``txt
X-API-Key: dev-admin-key
``

Example:

``bash
curl -H "X-API-Key: dev-admin-key" http://localhost:8000/auth/me
``

## Enterprise Security Capabilities

The v0.6.x branch introduces enterprise-oriented controls:

- authenticated API access,
- role-based authorization,
- admin-only audit logs,
- traceability of risk assessments,
- traceability of prompt injection tests,
- traceability of report generation,
- traceability of PDF exports.

These controls are designed to demonstrate how AI governance workflows can be secured and audited in an enterprise information system.

## Docker Quick Start

AI Governance Sentinel can be started locally with Docker Compose.

### Requirements

- Docker Desktop
- Docker Compose
- Git

### Start the full platform

```bash
git clone https://github.com/DiabiWali/ai-governance-sentinel.git
cd ai-governance-sentinel
docker compose up --build
```

The platform will start:

- Frontend: http://localhost:3000
- API: http://localhost:8000
- API docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432

### Docker services

| Service | Description | Port |
|---|---|---|
| web | Next.js frontend | 3000 |
| api | FastAPI backend | 8000 |
| postgres | PostgreSQL database | 5432 |

### Health checks

```bash
curl http://localhost:8000/live
curl http://localhost:8000/ready
```

### Authenticated API example

```bash
curl -H "X-API-Key: dev-admin-key" http://localhost:8000/auth/me
```

### Metrics endpoint

```bash
curl -H "X-API-Key: dev-admin-key" http://localhost:8000/metrics
```

### Stop the platform

```bash
docker compose down
```

### Stop and remove local database volume

```bash
docker compose down -v
```

## Docker Environment

The Docker Compose stack uses local development values by default:

```txt
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_governance_sentinel
API_KEY=dev-analyst-key
ADMIN_API_KEY=dev-admin-key
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEMO_API_KEY=dev-admin-key
```

These values are intended for local development only and must be changed for production.

## Production Readiness Notes

The v0.9.x branch introduces a containerized runtime for easier local testing and deployment preparation.

Current production-readiness capabilities include:

- Dockerized FastAPI backend
- Dockerized Next.js frontend
- PostgreSQL service with persistent volume
- Docker health checks
- API liveness endpoint
- API readiness endpoint
- Metrics endpoint
- Environment-based configuration
- Isolated Docker build contexts
- Local development secrets excluded from Docker images

Before real production deployment, the following should still be added:

- real identity provider integration
- secret manager integration
- HTTPS / reverse proxy configuration
- production-grade database credentials
- CI/CD pipeline
- container image scanning
- centralized logs and metrics backend
- deployment manifests for Kubernetes or a cloud platform

<!-- V1_ENTERPRISE_PLATFORM_START -->

## V1 Enterprise Platform

AI Governance Sentinel v1 turns the project into an enterprise-oriented AI governance platform.

It provides a complete workflow to inventory, assess, secure, monitor and report on AI agents connected to enterprise systems.

### V1 capabilities

- Premium SaaS cockpit with sidebar navigation
- English / French language switch
- AI agent inventory
- Dynamic AI risk scoring
- Prompt injection test suite
- Compliance mapping engine
- OWASP LLM Top 10 mapping
- NIST AI RMF mapping
- EU AI Act governance pre-assessment
- PDF governance report v1
- Compliance charts
- Risk and connector exposure charts
- PostgreSQL persistence
- API key authentication
- Role-based access control
- Admin audit logs
- Observability and monitoring
- Docker Compose runtime

### Product workflow

1. Register or define an AI agent
2. Assess its governance and security risk
3. Run prompt injection security tests
4. Map the agent against governance frameworks
5. Generate an executive PDF report
6. Monitor platform health and audit logs

### V1 modules

| Module | Purpose |
|---|---|
| Overview | Global AI governance cockpit with charts and posture indicators |
| Agents | Persistent inventory of AI agents |
| Assessment | Risk scoring studio |
| Security Tests | Prompt injection and abuse scenario testing |
| Compliance | OWASP, NIST AI RMF and EU AI Act pre-assessment |
| Reports | Markdown and PDF governance reports |
| Monitoring | API health, database status, latency and metrics |
| Audit Logs | Traceability of sensitive actions |
| Settings | Language and workspace preferences |

### Compliance mapping

The compliance engine produces an automated governance pre-assessment across OWASP LLM Top 10, NIST AI Risk Management Framework and EU AI Act risk-based governance expectations.

The EU AI Act output is intentionally presented as a governance pre-assessment. It is not a legal opinion, certification or final regulatory qualification.

### Local Docker demo

Run:

    docker compose up --build

Then open:

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs
- API health: http://localhost:8000/live
- API readiness: http://localhost:8000/ready

### Demo credentials

- Admin API key: dev-admin-key
- Analyst API key: dev-analyst-key

These keys are for local development only and must not be used in production.

### Recommended screenshots for GitHub

- docs/assets/overview-cockpit.png
- docs/assets/agent-assessment.png
- docs/assets/compliance-mapping.png
- docs/assets/compliance-charts.png
- docs/assets/pdf-report-preview.png
- docs/assets/monitoring.png

### Production-readiness roadmap

- OpenID Connect / enterprise identity provider
- Secret manager integration
- HTTPS reverse proxy
- CI/CD pipeline
- Container image scanning
- Centralized logging and metrics backend
- Kubernetes manifests or Helm chart
- Policy-based approval workflows
- Multi-tenant workspace model
- Real enterprise connector inventory

<!-- V1_ENTERPRISE_PLATFORM_END -->

