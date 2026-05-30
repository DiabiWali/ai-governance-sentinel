# Demo Scenarios

This document provides realistic scenarios to demonstrate AI Governance Sentinel.

## Scenario 1 - Low Risk FAQ Assistant

### Context

An AI assistant answers questions based only on public documentation.

### Configuration

- Data sensitivity: Public
- Autonomy level: Read only
- Connectors: None
- Internet exposed: No
- Human approval required: No
- Stores prompts: No
- Stores outputs: No

### Expected Result

Low risk.

### Governance Interpretation

This agent has limited exposure. It does not access sensitive data, does not execute actions and does not use sensitive connectors.

## Scenario 2 - HR Assistant

### Context

An AI assistant helps employees understand HR policies and draft internal emails.

### Configuration

- Data sensitivity: Confidential
- Autonomy level: Fully autonomous
- Connectors: SharePoint, Outlook, HR API
- Internet exposed: No
- Human approval required: No
- Stores prompts: Yes
- Stores outputs: Yes

### Expected Result

Critical risk.

### Governance Interpretation

The agent combines confidential data, sensitive connectors and autonomous actions without human approval.

Recommended mitigations:

- Require human approval
- Reduce connector permissions
- Enable audit logging
- Limit access to HR documents
- Define retention rules for prompts and outputs

## Scenario 3 - Finance Analysis Agent

### Context

An AI agent analyzes internal financial reports and drafts recommendations for management.

### Configuration

- Data sensitivity: Restricted
- Autonomy level: Suggest action
- Connectors: PostgreSQL, Finance API
- Internet exposed: No
- Human approval required: Yes
- Stores prompts: Yes
- Stores outputs: Yes

### Expected Result

High risk.

### Governance Interpretation

The agent handles restricted data and sensitive financial systems. Human approval reduces the risk, but strict monitoring and access control remain necessary.

## Scenario 4 - Public Support Agent

### Context

An internet-facing assistant answers product questions for external users.

### Configuration

- Data sensitivity: Public
- Autonomy level: Read only
- Connectors: None
- Internet exposed: Yes
- Human approval required: No
- Stores prompts: Yes
- Stores outputs: Yes

### Expected Result

Medium risk.

### Governance Interpretation

The data is public, but internet exposure increases the threat surface. Rate limiting, abuse monitoring and prompt injection protections are required.
