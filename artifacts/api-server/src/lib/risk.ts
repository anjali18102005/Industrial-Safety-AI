export const RISK_ORDER = ["low", "medium", "high", "critical"] as const;
export type RiskLevel = (typeof RISK_ORDER)[number];

export function highestRisk(levels: string[]): RiskLevel {
  let best: RiskLevel = "low";
  for (const level of levels) {
    const idx = RISK_ORDER.indexOf(level as RiskLevel);
    if (idx > RISK_ORDER.indexOf(best)) {
      best = level as RiskLevel;
    }
  }
  return best;
}
