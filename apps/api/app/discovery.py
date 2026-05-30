from __future__ import annotations

import json
from typing import Any

from app.models import (
    DiscoveredAIAsset,
    DiscoveryFinding,
    DiscoveryScanRequest,
    DiscoveryScanResponse,
    DiscoveryScanSummary,
)


AI_PROVIDER_KEYWORDS = {
    "openai": "OpenAI",
    "azureopenai": "Azure OpenAI",
    "azure_openai": "Azure OpenAI",
    "anthropic": "Anthropic",
    "claude": "Anthropic",
    "mistral": "Mistral",
    "gemini": "Google Gemini",
    "googleai": "Google Gemini",
    "cohere": "Cohere",
    "ollama": "Ollama",
}

AI_FRAMEWORK_KEYWORDS = {
    "langchain": "LangChain",
    "langgraph": "LangGraph",
    "crewai": "CrewAI",
    "autogen": "AutoGen",
    "semantic-kernel": "Semantic Kernel",
    "semantickernel": "Semantic Kernel",
    "llamaindex": "LlamaIndex",
    "llama-index": "LlamaIndex",
    "vercel/ai": "Vercel AI SDK",
    "ai sdk": "Vercel AI SDK",
}

CONNECTOR_KEYWORDS = {
    "sharepoint": "sharepoint",
    "onedrive": "onedrive",
    "google drive": "google_drive",
    "googledrive": "google_drive",
    "gmail": "gmail",
    "outlook": "outlook",
    "teams": "teams",
    "slack": "slack",
    "jira": "jira",
    "servicenow": "servicenow",
    "salesforce": "salesforce",
    "notion": "notion",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "mysql": "mysql",
    "mongodb": "mongodb",
    "http request": "http_request",
    "httprequest": "http_request",
    "webhook": "webhook",
    "github": "github",
    "gitlab": "gitlab",
    "azure devops": "azure_devops",
    "qdrant": "qdrant",
    "pinecone": "pinecone",
    "weaviate": "weaviate",
    "elasticsearch": "elasticsearch",
    "azure ai search": "azure_ai_search",
}

SENSITIVE_KEYWORDS = [
    "hr",
    "payroll",
    "salary",
    "finance",
    "invoice",
    "contract",
    "legal",
    "medical",
    "health",
    "student",
    "employee",
    "customer",
    "identity",
    "personal",
    "confidential",
    "restricted",
]


def run_discovery_scan(request: DiscoveryScanRequest) -> DiscoveryScanResponse:
    source = request.source.strip().lower()

    if source == "n8n":
        assets, scanned_items = scan_n8n(request)
    elif source in {"github", "gitlab", "azure_devops", "repository", "code"}:
        assets, scanned_items = scan_code_repository(request)
    else:
        assets, scanned_items = scan_generic_payload(request)

    return DiscoveryScanResponse(
        source=request.source,
        source_name=request.source_name,
        summary=build_summary(assets=assets, scanned_items=scanned_items),
        assets=assets,
    )


def scan_n8n(request: DiscoveryScanRequest) -> tuple[list[DiscoveredAIAsset], int]:
    workflows = normalize_workflows(request.payload)
    assets: list[DiscoveredAIAsset] = []

    for index, workflow in enumerate(workflows):
        nodes = workflow.get("nodes", [])
        workflow_name = workflow.get("name") or f"n8n workflow {index + 1}"
        workflow_id = str(workflow.get("id") or workflow.get("workflowId") or workflow_name)

        node_text = json.dumps(nodes, ensure_ascii=False).lower()
        workflow_text = json.dumps(workflow, ensure_ascii=False).lower()

        has_agent_node = has_any(node_text, ["langchain.agent", "ai agent", "agent"])
        has_ai_model = has_any(node_text, list(AI_PROVIDER_KEYWORDS.keys()))
        has_tooling = has_any(node_text, ["tool", "http request", "httprequest", "gmail", "outlook", "postgres", "slack", "jira"])
        has_memory = has_any(node_text, ["memory", "buffer memory", "window memory", "postgres chat memory"])
        has_vector_store = has_any(node_text, ["vector", "pinecone", "qdrant", "weaviate", "retriever", "embeddings"])
        has_approval = has_any(node_text, ["approval", "manual", "wait", "human", "review"])
        internet_exposed = has_any(node_text, ["webhook", "chat trigger", "form trigger", "public"])

        if not (has_agent_node or has_ai_model):
            continue

        provider = detect_provider(workflow_text)
        connectors = detect_connectors(workflow_text)

        indicators = []
        findings = []

        if has_agent_node:
            indicators.append("n8n_ai_agent_node")
            findings.append(finding("AI Agent node detected", "high", "The workflow contains an AI Agent or LangChain agent node."))

        if has_ai_model:
            indicators.append("ai_model_node")
            findings.append(finding("AI model usage detected", "medium", f"Detected model provider: {provider}."))

        if has_tooling:
            indicators.append("tool_or_action_nodes")
            findings.append(finding("Tool/action execution detected", "high", "The workflow can call tools, APIs or external business applications."))

        if has_memory:
            indicators.append("memory_node")
            findings.append(finding("AI memory detected", "medium", "The workflow appears to retain conversational context or prompt history."))

        if has_vector_store:
            indicators.append("rag_or_vector_store")
            findings.append(finding("RAG/vector store detected", "medium", "The workflow appears to use retrieval, embeddings or vector storage."))

        if internet_exposed:
            indicators.append("public_trigger")
            findings.append(finding("External trigger detected", "high", "The workflow may be reachable through webhook, chat trigger or public form trigger."))

        confidence = "high" if has_agent_node else "medium" if has_ai_model and has_tooling else "low"

        assets.append(
            DiscoveredAIAsset(
                name=f"n8n - {workflow_name}",
                source="n8n",
                source_id=workflow_id,
                detected_type="ai_agent_workflow" if has_agent_node else "ai_automation_workflow",
                confidence=confidence,
                model_provider=provider,
                data_sensitivity=infer_data_sensitivity(workflow_text, connectors),
                autonomy_level=infer_autonomy_level(
                    has_tooling=has_tooling,
                    has_approval=has_approval,
                    has_agent_node=has_agent_node,
                ),
                connectors=connectors,
                internet_exposed=internet_exposed,
                human_approval_required=has_approval,
                stores_prompts=has_memory,
                stores_outputs=has_any(workflow_text, ["database", "postgres", "mysql", "sheet", "notion", "airtable", "log"]),
                indicators=indicators,
                findings=findings,
                recommended_action=recommendation_for(confidence),
            )
        )

    return assets, len(workflows)


def scan_code_repository(request: DiscoveryScanRequest) -> tuple[list[DiscoveredAIAsset], int]:
    files = normalize_repository_files(request.payload)
    repository_name = request.payload.get("repository") or request.source_name or "repository"

    combined_text = "\n".join(
        f"{file.get('path', '')}\n{file.get('content', '')}" for file in files
    ).lower()

    provider = detect_provider(combined_text)
    frameworks = detect_frameworks(combined_text)
    connectors = detect_connectors(combined_text)

    has_ai = provider != "Unknown" or len(frameworks) > 0
    has_agent_patterns = has_any(
        combined_text,
        [
            "agentexecutor",
            "create_react_agent",
            "crewai.agent",
            "autogen",
            "assistantagent",
            "tools=[",
            "tool_calls",
            "function_call",
            "@tool",
            "bind_tools",
        ],
    )
    has_rag = has_any(combined_text, ["retriever", "vectorstore", "embeddings", "similarity_search", "rag", "pgvector"])
    has_api_endpoint = has_any(combined_text, ["/api/chat", "/api/agent", "/api/assistant", "/api/rag", "/api/copilot"])
    has_secret_reference = has_any(combined_text, ["openai_api_key", "azure_openai", "anthropic_api_key", "mistral_api_key"])

    if not has_ai:
        return [], len(files)

    findings = []
    indicators = []

    if frameworks:
        indicators.append("ai_framework_detected")
        findings.append(finding("AI framework detected", "medium", f"Detected frameworks: {', '.join(frameworks)}."))

    if has_agent_patterns:
        indicators.append("agent_or_tool_pattern")
        findings.append(finding("Agent/tool pattern detected", "high", "The repository contains agent, tool calling or function calling patterns."))

    if has_rag:
        indicators.append("rag_pattern")
        findings.append(finding("RAG pattern detected", "medium", "The repository contains retrieval, vector store or embedding patterns."))

    if has_api_endpoint:
        indicators.append("ai_api_endpoint")
        findings.append(finding("AI API endpoint detected", "medium", "The repository exposes likely AI endpoints such as chat, assistant or RAG routes."))

    if has_secret_reference:
        indicators.append("ai_secret_reference")
        findings.append(finding("AI secret reference detected", "high", "The repository references AI provider secrets or endpoints."))

    confidence = "high" if has_agent_patterns else "medium" if has_rag or has_api_endpoint else "low"

    asset = DiscoveredAIAsset(
        name=f"Repository - {repository_name}",
        source=request.source,
        source_id=repository_name,
        detected_type="coded_ai_agent" if has_agent_patterns else "ai_enabled_application",
        confidence=confidence,
        model_provider=provider,
        data_sensitivity=infer_data_sensitivity(combined_text, connectors),
        autonomy_level="execute_with_approval" if has_agent_patterns else "suggest_action",
        connectors=connectors,
        internet_exposed=has_api_endpoint,
        human_approval_required=False,
        stores_prompts=has_any(combined_text, ["conversation", "chat_history", "memory", "messages"]),
        stores_outputs=has_any(combined_text, ["log", "database", "postgres", "analytics", "trace"]),
        indicators=indicators,
        findings=findings,
        recommended_action=recommendation_for(confidence),
    )

    return [asset], len(files)


def scan_generic_payload(request: DiscoveryScanRequest) -> tuple[list[DiscoveredAIAsset], int]:
    text = json.dumps(request.payload, ensure_ascii=False).lower()

    provider = detect_provider(text)
    connectors = detect_connectors(text)
    has_ai = provider != "Unknown" or has_any(text, ["agent", "assistant", "copilot", "rag", "llm", "prompt"])

    if not has_ai:
        return [], 1

    has_tools = has_any(text, ["tool", "connector", "action", "api", "webhook"])
    has_approval = has_any(text, ["approval", "review", "human", "validation"])

    confidence = "medium" if has_tools else "low"

    asset = DiscoveredAIAsset(
        name=f"Detected AI asset - {request.source_name}",
        source=request.source,
        source_id=request.source_name,
        detected_type="generic_ai_asset",
        confidence=confidence,
        model_provider=provider,
        data_sensitivity=infer_data_sensitivity(text, connectors),
        autonomy_level=infer_autonomy_level(
            has_tooling=has_tools,
            has_approval=has_approval,
            has_agent_node=True,
        ),
        connectors=connectors,
        internet_exposed=has_any(text, ["public", "webhook", "internet", "external"]),
        human_approval_required=has_approval,
        stores_prompts=has_any(text, ["memory", "prompt", "history"]),
        stores_outputs=has_any(text, ["log", "database", "storage"]),
        indicators=["generic_ai_signal"],
        findings=[
            finding(
                "Generic AI signal detected",
                "medium",
                "The payload contains AI, agent, prompt, tool or connector signals.",
            )
        ],
        recommended_action=recommendation_for(confidence),
    )

    return [asset], 1


def normalize_workflows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    if isinstance(payload.get("workflows"), list):
        return payload["workflows"]

    if isinstance(payload.get("workflow"), dict):
        return [payload["workflow"]]

    if "nodes" in payload:
        return [payload]

    return []


def normalize_repository_files(payload: dict[str, Any]) -> list[dict[str, str]]:
    files = payload.get("files")

    if isinstance(files, list):
        return [
            {
                "path": str(file.get("path", "")),
                "content": str(file.get("content", "")),
            }
            for file in files
            if isinstance(file, dict)
        ]

    return []


def detect_provider(text: str) -> str:
    for keyword, provider in AI_PROVIDER_KEYWORDS.items():
        if keyword in text:
            return provider

    return "Unknown"


def detect_frameworks(text: str) -> list[str]:
    frameworks = []

    for keyword, framework in AI_FRAMEWORK_KEYWORDS.items():
        if keyword in text and framework not in frameworks:
            frameworks.append(framework)

    return frameworks


def detect_connectors(text: str) -> list[str]:
    connectors = []

    for keyword, connector in CONNECTOR_KEYWORDS.items():
        if keyword in text and connector not in connectors:
            connectors.append(connector)

    return connectors


def infer_data_sensitivity(text: str, connectors: list[str]) -> str:
    if any(keyword in text for keyword in ["restricted", "medical", "health", "payroll", "salary", "identity"]):
        return "restricted"

    if any(keyword in text for keyword in SENSITIVE_KEYWORDS):
        return "confidential"

    if any(connector in connectors for connector in ["sharepoint", "outlook", "gmail", "postgresql", "salesforce", "servicenow"]):
        return "confidential"

    return "internal"


def infer_autonomy_level(
    has_tooling: bool,
    has_approval: bool,
    has_agent_node: bool,
) -> str:
    if has_tooling and has_approval:
        return "execute_with_approval"

    if has_tooling and has_agent_node:
        return "fully_autonomous"

    if has_agent_node:
        return "suggest_action"

    return "read_only"


def finding(label: str, severity: str, evidence: str) -> DiscoveryFinding:
    return DiscoveryFinding(label=label, severity=severity, evidence=evidence)


def recommendation_for(confidence: str) -> str:
    if confidence == "high":
        return "Review immediately, validate ownership and promote to governed inventory before production use."

    if confidence == "medium":
        return "Review with the application owner and confirm whether this asset should enter the governed AI inventory."

    return "Triage manually to confirm whether this is a real AI agent, AI workflow or false positive."


def build_summary(
    assets: list[DiscoveredAIAsset],
    scanned_items: int,
) -> DiscoveryScanSummary:
    return DiscoveryScanSummary(
        scanned_items=scanned_items,
        detected_assets=len(assets),
        high_confidence=sum(1 for asset in assets if asset.confidence == "high"),
        medium_confidence=sum(1 for asset in assets if asset.confidence == "medium"),
        low_confidence=sum(1 for asset in assets if asset.confidence == "low"),
    )


def has_any(text: str, keywords: list[str]) -> bool:
    return any(keyword.lower() in text for keyword in keywords)
