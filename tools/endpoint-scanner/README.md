# Windows Shadow AI Endpoint Scanner

This collector detects local Shadow AI signals on an authorized Windows endpoint.

It does not collect secrets. It reports signal names and evidence only.

Detected signals include:

- AI-related running processes
- local listening ports
- Docker containers and images
- known local paths such as .n8n or .ollama
- AI-related npm packages
- AI-related Python packages
- AI-related environment variable names without values

Local JSON output:

    .\tools\endpoint-scanner\windows_shadow_ai_scan.ps1 > endpoint-report.json

Post directly to AI Governance Sentinel:

    .\tools\endpoint-scanner\windows_shadow_ai_scan.ps1 -PostToApi -ApiUrl "http://localhost:8000" -ApiKey "dev-admin-key"

Security note:

Run this only on endpoints you are authorized to assess. The scanner is designed for governance and inventory, not credential harvesting or intrusive inspection.
