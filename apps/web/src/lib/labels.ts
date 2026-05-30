import type { Language } from "@/i18n/translations";

const riskLevels: Record<Language, Record<string, string>> = {
  en: {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    no_assessment: "No assessment",
  },
  fr: {
    critical: "Critique",
    high: "Élevé",
    medium: "Moyen",
    low: "Faible",
    no_assessment: "Non évalué",
  },
};

const dataSensitivity: Record<Language, Record<string, string>> = {
  en: {
    public: "Public",
    internal: "Internal",
    confidential: "Confidential",
    restricted: "Restricted",
  },
  fr: {
    public: "Public",
    internal: "Interne",
    confidential: "Confidentiel",
    restricted: "Restreint",
  },
};

const autonomyLevels: Record<Language, Record<string, string>> = {
  en: {
    read_only: "Read only",
    suggest_action: "Suggest action",
    execute_with_approval: "Execute with approval",
    fully_autonomous: "Fully autonomous",
  },
  fr: {
    read_only: "Lecture seule",
    suggest_action: "Suggestion d’action",
    execute_with_approval: "Exécution avec validation",
    fully_autonomous: "Entièrement autonome",
  },
};

const complianceStatuses: Record<Language, Record<string, string>> = {
  en: {
    aligned: "Aligned",
    partial: "Partial",
    gap: "Gap",
    not_applicable: "Not applicable",
  },
  fr: {
    aligned: "Aligné",
    partial: "Partiel",
    gap: "Écart",
    not_applicable: "Non applicable",
  },
};

const severities: Record<Language, Record<string, string>> = {
  en: {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  },
  fr: {
    critical: "Critique",
    high: "Élevée",
    medium: "Moyenne",
    low: "Faible",
  },
};

const postures: Record<Language, Record<string, string>> = {
  en: {
    strong: "Strong",
    moderate: "Moderate",
    weak: "Weak",
    critical: "Critical",
  },
  fr: {
    strong: "Forte",
    moderate: "Modérée",
    weak: "Faible",
    critical: "Critique",
  },
};

export function formatRiskLevel(value: string | undefined, language: Language): string {
  if (!value) {
    return riskLevels[language].no_assessment;
  }

  return riskLevels[language][value] || humanize(value);
}

export function formatDataSensitivity(value: string, language: Language): string {
  return dataSensitivity[language][value] || humanize(value);
}

export function formatAutonomyLevel(value: string, language: Language): string {
  return autonomyLevels[language][value] || humanize(value);
}

export function formatComplianceStatus(value: string, language: Language): string {
  return complianceStatuses[language][value] || humanize(value);
}

export function formatSeverity(value: string, language: Language): string {
  return severities[language][value] || humanize(value);
}

export function formatPosture(value: string, language: Language): string {
  return postures[language][value] || humanize(value);
}

export function formatBoolean(value: boolean, language: Language): string {
  if (language === "fr") {
    return value ? "Oui" : "Non";
  }

  return value ? "Yes" : "No";
}

export function humanize(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}
