# AI Governance Sentinel - V1.1 Shadow AI Discovery Demo Script

## Goal

Show that AI Governance Sentinel can move beyond declarative inventory and start detecting Shadow AI signals from authorized endpoints.

## Demo flow

1. Open the application.
2. Go to the Discovery module.
3. Explain that Shadow AI can exist outside the official inventory.
4. Run the Windows endpoint scanner:

   .\tools\endpoint-scanner\windows_shadow_ai_scan.ps1 > endpoint-report.json

5. Import endpoint-report.json into the Discovery module.
6. Click Analyze endpoint report.
7. Show the detected assets:
   - local LLM runtime
   - coded AI tooling
   - RAG/vector stack
8. Explain confidence, detected type, source, findings and recommended action.
9. Show Discovery History.
10. Change an asset status to reviewing, ignored or false positive.
11. Promote a confirmed asset to the governed inventory.
12. Open Agents and show that the promoted asset is now governed.
13. Return to Discovery and show that the asset status is promoted.

## Key message

Shadow AI is not only a chatbot problem. It can be a local LLM runtime, an automation workflow, a developer framework, a RAG stack, a Docker container or a hidden AI-enabled application.

AI Governance Sentinel v1.1 helps detect these signals and bring them into a governed lifecycle.

## Security note

The endpoint scanner does not collect secrets. It reports signals only: process names, ports, Docker images, AI packages, known local paths and environment variable names without values.
