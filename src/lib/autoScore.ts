import type { ComplianceRule, ComplianceCheckStatus } from "@/types";

export interface AutoScoreResult {
  ruleId: string;
  status: ComplianceCheckStatus;
  matchedKeywords: string[];
  totalKeywords: number;
  matchRatio: number;
  note: string;
}

/**
 * Auto-score a policy's content against a set of compliance rules
 * using keyword matching. Each rule has a keywords[] array.
 *
 * Scoring logic:
 * - >= 60% keyword match → "pass"
 * - >= 25% keyword match → "partial"
 * - < 25% keyword match  → "fail"
 */
export function autoScorePolicy(
  policyContent: string,
  rules: ComplianceRule[]
): AutoScoreResult[] {
  const lowerContent = policyContent.toLowerCase();

  return rules.map((rule) => {
    const keywords = rule.keywords;
    if (keywords.length === 0) {
      return {
        ruleId: rule.id,
        status: "unchecked" as ComplianceCheckStatus,
        matchedKeywords: [],
        totalKeywords: 0,
        matchRatio: 0,
        note: "No keywords defined for this rule.",
      };
    }

    const matched = keywords.filter((kw) => lowerContent.includes(kw.toLowerCase()));
    const ratio = matched.length / keywords.length;

    let status: ComplianceCheckStatus;
    if (ratio >= 0.6) {
      status = "pass";
    } else if (ratio >= 0.25) {
      status = "partial";
    } else {
      status = "fail";
    }

    const note =
      status === "pass"
        ? `Auto-scored: ${matched.length}/${keywords.length} keywords found (${Math.round(ratio * 100)}% match).`
        : status === "partial"
        ? `Auto-scored: ${matched.length}/${keywords.length} keywords found (${Math.round(ratio * 100)}% match). Missing: ${keywords.filter((k) => !matched.includes(k)).slice(0, 3).join(", ")}${keywords.filter((k) => !matched.includes(k)).length > 3 ? "…" : ""}.`
        : `Auto-scored: Only ${matched.length}/${keywords.length} keywords found (${Math.round(ratio * 100)}% match). Policy may not address this requirement.`;

    return {
      ruleId: rule.id,
      status,
      matchedKeywords: matched,
      totalKeywords: keywords.length,
      matchRatio: ratio,
      note,
    };
  });
}
