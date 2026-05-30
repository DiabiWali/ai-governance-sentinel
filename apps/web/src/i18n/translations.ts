export type Language = "en" | "fr";

export const DEFAULT_LANGUAGE: Language = "en";

export const languageLabels: Record<Language, string> = {
  en: "English",
  fr: "Français",
};

export const translations = {
  en: {
    common: {
      github: "GitHub",
      unknown: "unknown",
      loading: "Loading...",
      refresh: "Refresh",
      english: "English",
      french: "French",
    },
    sidebar: {
      productName: "AI Governance",
      workspace: "Sentinel v1 workspace",
      demoMode: "Demo mode",
      demoDescription:
        "Local enterprise cockpit with API key auth, RBAC, audit logs and monitoring.",
      overview: "Overview",
      overviewDescription: "Command center",
      agents: "Agents",
      agentsDescription: "Inventory",
      assessment: "Assessment",
      assessmentDescription: "Risk scoring",
      security: "Security Tests",
      securityDescription: "Prompt injection",
      compliance: "Compliance",
      complianceDescription: "OWASP, NIST, AI Act",
      reports: "Reports",
      reportsDescription: "PDF exports",
      monitoring: "Monitoring",
      monitoringDescription: "Health and metrics",
      audit: "Audit Logs",
      auditDescription: "Traceability",
      settings: "Settings",
      settingsDescription: "Language",
    },
    topbar: {
      product: "AI Governance Sentinel",
      identity: "Identity",
      api: "API",
      database: "Database",
      latency: "Latency",
      notAuthenticated: "not authenticated",
      overviewTitle: "Enterprise AI governance cockpit",
      overviewSubtitle: "Global posture, platform health and governance workflow.",
      agentsTitle: "AI agent inventory",
      agentsSubtitle: "Manage, filter and govern registered enterprise AI agents.",
      assessmentTitle: "Risk assessment studio",
      assessmentSubtitle:
        "Evaluate agent exposure, autonomy, connectors and data sensitivity.",
      securityTitle: "LLM security testing",
      securitySubtitle: "Run prompt injection and connector abuse simulations.",
      complianceTitle: "Compliance mapping",
      complianceSubtitle:
        "Prepare OWASP, NIST AI RMF and EU AI Act governance mapping.",
      reportsTitle: "Governance reports",
      reportsSubtitle:
        "Generate executive and technical exports for review committees.",
      monitoringTitle: "Observability and operations",
      monitoringSubtitle:
        "Track runtime health, latency, errors and governance activity.",
      auditTitle: "Audit trail",
      auditSubtitle:
        "Review traceability of security-sensitive platform actions.",
      settingsTitle: "Workspace settings",
      settingsSubtitle:
        "Language, preferences and future enterprise configuration.",
    },
    commandCenter: {
      badge: "AI Governance • LLM Security • Enterprise Architecture",
      title: "AI Governance Sentinel",
      description:
        "A governance control plane to inventory, assess, test, report and monitor enterprise AI agents before they become a risk for the information system.",
      refreshIdentity: "Refresh identity",
      refreshAuditLogs: "Refresh audit logs",
      refreshMonitoring: "Refresh monitoring",
      securityContext: "Enterprise security context",
      savedAgents: "Saved agents",
      criticalAgents: "Critical agents",
      visibleAgents: "Visible agents",
      auditEvents: "Audit events",
      api: "API",
      readiness: "Readiness",
      database: "Database",
      version: "Version",
    },
    workflow: {
      defineTitle: "Define agent",
      defineDescription:
        "Describe the AI agent, its purpose, data exposure and connected systems.",
      assessTitle: "Assess risk",
      assessDescription:
        "Calculate a governance score based on sensitivity, autonomy and permissions.",
      testTitle: "Test security",
      testDescription:
        "Run simulated prompt injection and connector abuse scenarios.",
      reportTitle: "Generate report",
      reportDescription:
        "Export an executive PDF report with findings and remediation actions.",
      monitorTitle: "Monitor",
      monitorDescription:
        "Track audit logs, API health, database status and operational metrics.",
    },
    overview: {
      organizationPosture: "Organization posture",
      commandOverview: "AI risk command overview",
      description:
        "Visualize your AI agent landscape by risk, data sensitivity, connector exposure and governance activity.",
      registeredAgents: "Registered agents",
      registeredAgentsDescription:
        "AI agents currently saved in the governance inventory.",
      highOrCritical: "High or critical",
      highOrCriticalDescription:
        "Agents requiring security or governance attention.",
      criticalAgents: "Critical agents",
      criticalAgentsDescription:
        "Agents that should not move forward without remediation.",
      assessAgent: "Assess agent",
      manageInventory: "Manage inventory",
      runSecurityTests: "Run security tests",
      openCompliance: "Open compliance",
      runtimeSnapshot: "Runtime snapshot",
      platformHealth: "Platform health",
      totalRequests: "Total requests",
      totalErrors: "Total errors",
      averageLatency: "Average latency",
      auditEvents: "Audit events",
    },
    settings: {
      eyebrow: "Settings",
      title: "Language and workspace preferences",
      description:
        "Choose the interface language for the AI Governance Sentinel workspace.",
      languageTitle: "Interface language",
      languageDescription:
        "English is recommended for GitHub and international demos. French is useful for French enterprise, DSI and governance contexts.",
      currentLanguage: "Current language",
      roadmapTitle: "Upcoming preferences",
      roadmapDescription:
        "Future v1 iterations can add theme preferences, organization profile, default framework selection and report export options.",
    },
  },
  fr: {
    common: {
      github: "GitHub",
      unknown: "inconnu",
      loading: "Chargement...",
      refresh: "Actualiser",
      english: "Anglais",
      french: "Français",
    },
    sidebar: {
      productName: "Gouvernance IA",
      workspace: "Espace Sentinel v1",
      demoMode: "Mode démo",
      demoDescription:
        "Cockpit entreprise local avec clé API, RBAC, journaux d’audit et monitoring.",
      overview: "Vue globale",
      overviewDescription: "Centre de pilotage",
      agents: "Agents",
      agentsDescription: "Inventaire",
      assessment: "Évaluation",
      assessmentDescription: "Score de risque",
      security: "Tests sécurité",
      securityDescription: "Prompt injection",
      compliance: "Conformité",
      complianceDescription: "OWASP, NIST, AI Act",
      reports: "Rapports",
      reportsDescription: "Exports PDF",
      monitoring: "Monitoring",
      monitoringDescription: "Santé et métriques",
      audit: "Journaux d’audit",
      auditDescription: "Traçabilité",
      settings: "Paramètres",
      settingsDescription: "Langue",
    },
    topbar: {
      product: "AI Governance Sentinel",
      identity: "Identité",
      api: "API",
      database: "Base de données",
      latency: "Latence",
      notAuthenticated: "non authentifié",
      overviewTitle: "Cockpit de gouvernance IA entreprise",
      overviewSubtitle:
        "Posture globale, santé de la plateforme et parcours de gouvernance.",
      agentsTitle: "Inventaire des agents IA",
      agentsSubtitle:
        "Gérer, filtrer et gouverner les agents IA enregistrés.",
      assessmentTitle: "Studio d’évaluation du risque",
      assessmentSubtitle:
        "Évaluer l’exposition, l’autonomie, les connecteurs et la sensibilité des données.",
      securityTitle: "Tests de sécurité LLM",
      securitySubtitle:
        "Exécuter des simulations de prompt injection et d’abus de connecteurs.",
      complianceTitle: "Mapping conformité",
      complianceSubtitle:
        "Préparer le mapping OWASP, NIST AI RMF et EU AI Act.",
      reportsTitle: "Rapports de gouvernance",
      reportsSubtitle:
        "Générer des exports exécutifs et techniques pour les comités de revue.",
      monitoringTitle: "Observabilité et exploitation",
      monitoringSubtitle:
        "Suivre la santé, la latence, les erreurs et l’activité de gouvernance.",
      auditTitle: "Piste d’audit",
      auditSubtitle:
        "Consulter la traçabilité des actions sensibles de la plateforme.",
      settingsTitle: "Paramètres de l’espace",
      settingsSubtitle:
        "Langue, préférences et future configuration entreprise.",
    },
    commandCenter: {
      badge: "Gouvernance IA • Sécurité LLM • Architecture entreprise",
      title: "AI Governance Sentinel",
      description:
        "Une plateforme de gouvernance pour inventorier, évaluer, tester, reporter et monitorer les agents IA d’entreprise avant qu’ils ne deviennent un risque pour le système d’information.",
      refreshIdentity: "Actualiser l’identité",
      refreshAuditLogs: "Actualiser les audits",
      refreshMonitoring: "Actualiser le monitoring",
      securityContext: "Contexte sécurité entreprise",
      savedAgents: "Agents sauvegardés",
      criticalAgents: "Agents critiques",
      visibleAgents: "Agents visibles",
      auditEvents: "Événements d’audit",
      api: "API",
      readiness: "Disponibilité",
      database: "Base de données",
      version: "Version",
    },
    workflow: {
      defineTitle: "Définir l’agent",
      defineDescription:
        "Décrire l’agent IA, son objectif, son exposition aux données et les systèmes connectés.",
      assessTitle: "Évaluer le risque",
      assessDescription:
        "Calculer un score de gouvernance selon la sensibilité, l’autonomie et les permissions.",
      testTitle: "Tester la sécurité",
      testDescription:
        "Exécuter des scénarios simulés de prompt injection et d’abus de connecteurs.",
      reportTitle: "Générer le rapport",
      reportDescription:
        "Exporter un rapport PDF exécutif avec constats et actions de remédiation.",
      monitorTitle: "Monitorer",
      monitorDescription:
        "Suivre les audits, la santé API, la base de données et les métriques opérationnelles.",
    },
    overview: {
      organizationPosture: "Posture organisationnelle",
      commandOverview: "Vue de pilotage du risque IA",
      description:
        "Visualiser le paysage des agents IA par risque, sensibilité des données, exposition des connecteurs et activité de gouvernance.",
      registeredAgents: "Agents enregistrés",
      registeredAgentsDescription:
        "Agents IA actuellement présents dans l’inventaire de gouvernance.",
      highOrCritical: "Élevé ou critique",
      highOrCriticalDescription:
        "Agents nécessitant une attention sécurité ou gouvernance.",
      criticalAgents: "Agents critiques",
      criticalAgentsDescription:
        "Agents qui ne devraient pas avancer sans remédiation.",
      assessAgent: "Évaluer un agent",
      manageInventory: "Gérer l’inventaire",
      runSecurityTests: "Lancer les tests sécurité",
      openCompliance: "Ouvrir conformité",
      runtimeSnapshot: "État runtime",
      platformHealth: "Santé plateforme",
      totalRequests: "Requêtes totales",
      totalErrors: "Erreurs totales",
      averageLatency: "Latence moyenne",
      auditEvents: "Événements d’audit",
    },
    settings: {
      eyebrow: "Paramètres",
      title: "Langue et préférences de l’espace",
      description:
        "Choisis la langue d’interface pour l’espace AI Governance Sentinel.",
      languageTitle: "Langue de l’interface",
      languageDescription:
        "L’anglais est recommandé pour GitHub et les démos internationales. Le français est utile pour les contextes DSI, gouvernance et entreprise française.",
      currentLanguage: "Langue actuelle",
      roadmapTitle: "Préférences à venir",
      roadmapDescription:
        "Les prochaines itérations v1 pourront ajouter le thème, le profil organisation, le référentiel par défaut et les options d’export de rapport.",
    },
  },
} as const;
