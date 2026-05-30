export function riskWeight(level?: string): number {
  switch (level) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

export function riskTone(level: string): string {
  switch (level) {
    case "critical":
      return "border-red-400/30 bg-red-400/10 text-red-100";
    case "high":
      return "border-orange-400/30 bg-orange-400/10 text-orange-100";
    case "medium":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-100";
    case "passed":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
    default:
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }
}

export function riskBadge(level: string): string {
  switch (level) {
    case "critical":
      return "border-red-400/30 bg-red-400/10 text-red-100";
    case "high":
      return "border-orange-400/30 bg-orange-400/10 text-orange-100";
    case "medium":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-100";
    default:
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }
}
