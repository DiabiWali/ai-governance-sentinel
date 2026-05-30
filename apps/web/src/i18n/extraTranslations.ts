export const extraTranslations = {
  en: {
    app: {
      footer:
        "AI Governance Sentinel · Inventory, assess, secure, report and monitor enterprise AI agents.",
    },
    charts: {
      riskDistribution: "Risk distribution",
      riskDistributionDescription: "Number of agents by latest risk level.",
      dataSensitivity: "Data sensitivity",
      dataSensitivityDescription:
        "Distribution of agents by declared data sensitivity.",
      connectorExposure: "Connector exposure",
      connectorExposureDescription:
        "Most frequently used connectors across registered AI agents.",
      governanceActivity: "Governance activity",
      governanceActivityDescription:
        "Recent audit activity grouped by governance workflow.",
      noConnector: "No connector",
      risk: "Risk",
      agents: "Agents",
      tests: "Tests",
      reports: "Reports",
      audit: "Audit",
    },
    riskPanel: {
      eyebrow: "Risk result",
      title: "Governance score",
      empty:
        "No assessment yet. Define an agent and calculate its risk score.",
      riskSuffix: "risk",
      agent: "Agent",
      noMajorRisk: "No major risk detected",
      noMajorRiskDescription:
        "Keep audit logs, access reviews and periodic reassessment enabled.",
    },
    promptTests: {
      eyebrow: "LLM security",
      title: "Prompt injection test suite",
      description:
        "Simulated tests detect prompt injection, data exfiltration, connector abuse and approval bypass exposure.",
      runCurrent: "Test current agent",
      running: "Running tests...",
      empty: "No prompt injection tests have been executed yet.",
      total: "Total",
      passed: "Passed",
      failed: "Failed",
      attackPrompt: "Attack prompt",
      finding: "Finding",
      recommendation: "Recommendation",
      statusPassed: "passed",
      statusFailed: "failed",
    },
    v1: {
      roadmapEyebrow: "V1 product direction",
      roadmapTitle: "Enterprise AI governance platform",
      roadmapDescription:
        "The v1 workspace introduces a clearer SaaS navigation model. The next increments add compliance mapping, charts, language selection and a stronger PDF report.",
      compliance: "Compliance",
      complianceDescription:
        "OWASP LLM Top 10, NIST AI RMF and EU AI Act governance mapping.",
      charts: "Charts",
      chartsDescription:
        "Risk distribution, connector exposure, compliance coverage and activity trends.",
      languages: "Languages",
      languagesDescription:
        "English and French interface for international and French enterprise demos.",
      reports: "Reports v1",
      reportsDescription:
        "Executive PDF with risk, security findings, compliance posture and controls.",
    },
  },
  fr: {
    app: {
      footer:
        "AI Governance Sentinel · Inventorier, évaluer, sécuriser, reporter et monitorer les agents IA d’entreprise.",
    },
    charts: {
      riskDistribution: "Répartition des risques",
      riskDistributionDescription:
        "Nombre d’agents selon leur dernier niveau de risque.",
      dataSensitivity: "Sensibilité des données",
      dataSensitivityDescription:
        "Répartition des agents selon la sensibilité des données déclarée.",
      connectorExposure: "Exposition des connecteurs",
      connectorExposureDescription:
        "Connecteurs les plus utilisés par les agents IA enregistrés.",
      governanceActivity: "Activité de gouvernance",
      governanceActivityDescription:
        "Activité d’audit récente regroupée par workflow de gouvernance.",
      noConnector: "Aucun connecteur",
      risk: "Risque",
      agents: "Agents",
      tests: "Tests",
      reports: "Rapports",
      audit: "Audit",
    },
    riskPanel: {
      eyebrow: "Résultat du risque",
      title: "Score de gouvernance",
      empty:
        "Aucune évaluation pour le moment. Définis un agent puis calcule son score de risque.",
      riskSuffix: "risque",
      agent: "Agent",
      noMajorRisk: "Aucun risque majeur détecté",
      noMajorRiskDescription:
        "Maintiens les journaux d’audit, les revues d’accès et la réévaluation périodique.",
    },
    promptTests: {
      eyebrow: "Sécurité LLM",
      title: "Suite de tests prompt injection",
      description:
        "Les tests simulés détectent la prompt injection, l’exfiltration de données, l’abus de connecteurs et le contournement de validation.",
      runCurrent: "Tester l’agent courant",
      running: "Tests en cours...",
      empty: "Aucun test de prompt injection n’a encore été exécuté.",
      total: "Total",
      passed: "Réussis",
      failed: "Échoués",
      attackPrompt: "Prompt d’attaque",
      finding: "Constat",
      recommendation: "Recommandation",
      statusPassed: "réussi",
      statusFailed: "échoué",
    },
    v1: {
      roadmapEyebrow: "Orientation produit v1",
      roadmapTitle: "Plateforme de gouvernance IA entreprise",
      roadmapDescription:
        "L’espace v1 introduit une navigation SaaS plus claire. Les prochaines itérations ajoutent le mapping conformité, les graphes, le choix de langue et un rapport PDF renforcé.",
      compliance: "Conformité",
      complianceDescription:
        "Mapping OWASP LLM Top 10, NIST AI RMF et EU AI Act.",
      charts: "Graphes",
      chartsDescription:
        "Répartition des risques, exposition des connecteurs, couverture conformité et tendances d’activité.",
      languages: "Langues",
      languagesDescription:
        "Interface anglais/français pour les démos internationales et les contextes entreprise français.",
      reports: "Rapports v1",
      reportsDescription:
        "PDF exécutif avec risque, constats sécurité, posture conformité et contrôles.",
    },
  },
} as const;
