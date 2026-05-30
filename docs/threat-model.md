# Threat Model

## Main Risks

### Prompt Injection

A malicious user or document can attempt to override the agent instructions.

### Excessive Agency

An AI agent may perform sensitive actions without proper validation.

### Data Leakage

The agent may expose confidential data through responses, logs or external connectors.

### Insecure Connectors

Connectors such as SharePoint, Outlook, GitHub or databases can increase the blast radius of an AI incident.

### Poor Auditability

Without logs, approvals and traces, it becomes difficult to understand what the agent did and why.

## Security Controls

- Least privilege
- Human approval for sensitive actions
- DLP policies
- Audit logs
- Risk scoring
- Connector review
- Retention policies
- Monitoring
