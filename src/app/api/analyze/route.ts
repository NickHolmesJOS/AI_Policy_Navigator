import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { countWords, estimateReadingTime, generateId, getRiskLabel } from "@/lib/utils";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, clause, title, content } = body;

    // AI Clause Rewriter
    if (mode === "rewrite" && clause) {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ rewrite: "Improved clause: " + clause.slice(0, 120) + "..." });
      }
      const rewritePrompt =
        "Rewrite the following policy clause to improve clarity, precision, and compliance. " +
        "Make it more actionable and professional, but keep the original intent. " +
        "Respond with only the rewritten clause, no explanations.\n\nClause: " + clause;

      const rewriteCompletion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert policy drafter. Always respond with only the rewritten clause." },
          { role: "user", content: rewritePrompt },
        ],
        temperature: 0.2,
      });
      const rewrite = rewriteCompletion.choices[0]?.message?.content?.trim();
      return NextResponse.json({ rewrite });
    }

    // Default: Policy Analysis
    if (!content || !title) {
      return NextResponse.json(
        { error: "Missing content or title" },
        { status: 400 }
      );
    }

    const wordCount = countWords(content);
    const readingTime = estimateReadingTime(wordCount);

    const promptLines = [
      "You are an expert policy analyst. Analyze the following policy document and provide a structured analysis in JSON format.",
      "",
      "Policy Title: " + title,
      "",
      "Policy Content:",
      content.slice(0, 8000),
      "",
      "Provide your analysis as a valid JSON object with this exact structure:",
      "{",
      '  "summary": "A comprehensive 2-3 sentence summary of the policy",',
      '  "riskScore": <number from 0-100 where 0=no risk, 100=critical risk>,',
      '  "complianceStatus": "A brief statement about compliance implications",',
      '  "keyFindings": [',
      "    {",
      '      "id": "unique-id-1",',
      '      "type": "risk|requirement|recommendation|compliance",',
      '      "severity": "low|medium|high|critical",',
      '      "title": "Finding title",',
      '      "description": "Detailed description",',
      '      "section": "Optional: section reference"',
      "    }",
      "  ],",
      '  "recommendations": [',
      '    "Actionable recommendation 1",',
      '    "Actionable recommendation 2"',
      "  ]",
      "}",
      "",
      "Include 4-8 key findings and 3-5 recommendations. Be specific and actionable.",
    ];
    const prompt = promptLines.join("\n");

    if (!process.env.OPENAI_API_KEY) {
      const mockAnalysis = generateMockAnalysis(title, content, wordCount, readingTime);
      return NextResponse.json(mockAnalysis);
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert policy analyst. Always respond with valid JSON only, no markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const analysisData = JSON.parse(responseText);
    const riskScore = Math.max(0, Math.min(100, analysisData.riskScore || 50));
    const riskLevel = getRiskLabel(riskScore);

    const analysis = {
      summary: analysisData.summary || "Analysis complete.",
      riskScore,
      riskLevel,
      complianceStatus: analysisData.complianceStatus || "Review required.",
      keyFindings: (analysisData.keyFindings || []).map(
        (f: {
          id?: string;
          type?: string;
          severity?: string;
          title?: string;
          description?: string;
          section?: string;
        }) => ({
          id: f.id || generateId(),
          type: f.type || "risk",
          severity: f.severity || "medium",
          title: f.title || "Finding",
          description: f.description || "",
          section: f.section,
        })
      ),
      recommendations: analysisData.recommendations || [],
      wordCount,
      readingTime,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════
   Content-aware mock analysis (used when no API key)
   ═══════════════════════════════════════════════════════ */

/** Keyword buckets the mock analyzer looks for. Each bucket maps to a
 *  finding / recommendation pair that is only emitted when we actually
 *  detect the topic in the policy text. */
interface TopicBucket {
  keywords: string[];
  finding: { type: string; severity: string; title: string; descPresent: string; descAbsent: string; section?: string };
  recPresent: string;
  recAbsent: string;
  /** Extra risk weight when the topic is *absent* but expected */
  riskIfMissing: number;
}

const TOPIC_BUCKETS: TopicBucket[] = [
  {
    keywords: ["personal data", "pii", "personally identifiable", "data subject", "data protection", "gdpr", "privacy"],
    finding: { type: "compliance", severity: "high", title: "Personal Data Handling", descPresent: "The policy addresses personal data handling which is a positive sign for privacy compliance. Verify that all processing activities are documented.", descAbsent: "The policy does not explicitly address personal data or PII handling, which may create regulatory risk under GDPR/CCPA.", section: "Data Privacy" },
    recPresent: "Review personal-data clauses against the latest GDPR/CCPA guidance and ensure lawful basis is documented for every processing activity.",
    recAbsent: "Add explicit sections covering personal data classification, lawful processing basis, and data subject rights.",
    riskIfMissing: 12,
  },
  {
    keywords: ["encryption", "encrypt", "tls", "ssl", "aes", "cryptograph", "cipher"],
    finding: { type: "risk", severity: "high", title: "Encryption Standards", descPresent: "Encryption is referenced in the policy. Ensure specific algorithms and minimum key lengths are specified.", descAbsent: "No encryption requirements are mentioned, leaving data-at-rest and data-in-transit protections undefined.", section: "Security Controls" },
    recPresent: "Specify exact cipher suites and minimum key lengths (e.g., AES-256, TLS 1.2+) rather than generic 'encryption' language.",
    recAbsent: "Introduce encryption requirements for data at rest and in transit, specifying minimum standards (AES-256, TLS 1.2+).",
    riskIfMissing: 10,
  },
  {
    keywords: ["access control", "authentication", "authorization", "mfa", "multi-factor", "role-based", "rbac", "least privilege", "password"],
    finding: { type: "requirement", severity: "medium", title: "Access Control Provisions", descPresent: "Access control measures are referenced. Ensure role definitions and periodic access reviews are included.", descAbsent: "The policy lacks explicit access control requirements, which could lead to over-provisioned accounts.", section: "Access Management" },
    recPresent: "Mandate periodic access reviews (at least quarterly) and enforce multi-factor authentication for privileged accounts.",
    recAbsent: "Add role-based access control requirements, enforce least-privilege principles, and mandate MFA for all sensitive systems.",
    riskIfMissing: 8,
  },
  {
    keywords: ["incident", "breach", "response plan", "incident response", "forensic", "notification", "security event"],
    finding: { type: "risk", severity: "high", title: "Incident Response Readiness", descPresent: "Incident response procedures are outlined. Verify that escalation paths, SLAs, and communication plans are well-defined.", descAbsent: "There is no incident response or breach notification procedure documented in this policy.", section: "Incident Management" },
    recPresent: "Run tabletop exercises at least annually and ensure breach notification timelines comply with regulatory requirements (e.g., 72 hours under GDPR).",
    recAbsent: "Create a formal incident response plan including detection, containment, eradication, recovery, and post-mortem stages.",
    riskIfMissing: 14,
  },
  {
    keywords: ["retention", "dispose", "disposal", "deletion", "archive", "destroy", "lifecycle", "expiration"],
    finding: { type: "compliance", severity: "medium", title: "Data Retention & Disposal", descPresent: "Data retention and disposal clauses are present. Ensure retention schedules align with legal hold obligations.", descAbsent: "No data retention or disposal schedule is defined, potentially violating data minimization principles.", section: "Data Lifecycle" },
    recPresent: "Cross-reference retention schedules with all applicable regulatory minimums and maximums; automate disposal where feasible.",
    recAbsent: "Define clear retention periods by data category and implement automated deletion workflows to enforce data minimization.",
    riskIfMissing: 7,
  },
  {
    keywords: ["training", "awareness", "educate", "onboarding", "competency", "certification"],
    finding: { type: "requirement", severity: "medium", title: "Training & Awareness", descPresent: "Employee training requirements are addressed. Ensure completion tracking and refresher cadence are specified.", descAbsent: "The policy does not mandate any training or awareness program, risking inconsistent understanding across the organization." },
    recPresent: "Track training completion rates and require annual refresher courses; tie compliance training to performance reviews.",
    recAbsent: "Establish mandatory security/compliance awareness training for all employees within 30 days of onboarding and annually thereafter.",
    riskIfMissing: 6,
  },
  {
    keywords: ["third party", "vendor", "supplier", "subprocessor", "outsourc", "contractor", "service provider"],
    finding: { type: "risk", severity: "medium", title: "Third-Party Risk", descPresent: "Third-party/vendor considerations are mentioned. Ensure due diligence and contractual safeguards are specified.", descAbsent: "No third-party or vendor risk management provisions exist, leaving supply-chain risks unaddressed.", section: "Vendor Management" },
    recPresent: "Require vendor security assessments before onboarding and include audit-right clauses in all contracts.",
    recAbsent: "Add a third-party risk management section covering due diligence, contractual security requirements, and ongoing monitoring.",
    riskIfMissing: 9,
  },
  {
    keywords: ["audit", "logging", "log", "monitor", "siem", "trail", "accountability"],
    finding: { type: "compliance", severity: "low", title: "Audit & Monitoring", descPresent: "Auditing and logging requirements are covered. Verify log retention periods and tamper-evidence controls.", descAbsent: "The policy lacks audit trail and monitoring provisions, limiting forensic capability and accountability." },
    recPresent: "Ensure logs are immutable, retained for at least 12 months, and reviewed regularly via SIEM or equivalent.",
    recAbsent: "Implement centralized logging with tamper-proof storage, define retention periods, and establish regular log review cadences.",
    riskIfMissing: 6,
  },
  {
    keywords: ["consent", "opt-in", "opt-out", "consent management", "cookie", "tracking"],
    finding: { type: "compliance", severity: "medium", title: "Consent Management", descPresent: "Consent mechanisms are referenced. Ensure granularity of consent choices and withdrawal processes are documented.", descAbsent: "No consent management framework is described, which may conflict with GDPR, ePrivacy, or CCPA consent requirements." },
    recPresent: "Implement granular consent controls and ensure users can withdraw consent as easily as they granted it.",
    recAbsent: "Add a consent management framework specifying how consent is collected, recorded, and honored for withdrawal.",
    riskIfMissing: 8,
  },
  {
    keywords: ["disaster recovery", "business continuity", "backup", "failover", "rpo", "rto", "high availability"],
    finding: { type: "risk", severity: "high", title: "Business Continuity & DR", descPresent: "Business continuity or disaster recovery is addressed. Confirm that RPO/RTO targets and testing schedules are defined.", descAbsent: "The policy does not cover disaster recovery or business continuity planning, leaving critical operations vulnerable to disruption." },
    recPresent: "Test DR plans at least semi-annually and update RPO/RTO targets based on evolving business criticality assessments.",
    recAbsent: "Develop and document a disaster recovery plan with defined RPO/RTO targets, backup procedures, and regular testing cadence.",
    riskIfMissing: 11,
  },
  {
    keywords: ["classification", "confidential", "internal", "public", "restricted", "top secret", "sensitivity"],
    finding: { type: "requirement", severity: "low", title: "Information Classification", descPresent: "Data classification levels are defined. Ensure handling procedures differ appropriately per classification tier.", descAbsent: "No information classification scheme is described, making it difficult to apply proportionate controls." },
    recPresent: "Map each classification tier to specific handling, storage, and sharing controls; audit adherence quarterly.",
    recAbsent: "Introduce a classification scheme (e.g., Public / Internal / Confidential / Restricted) and define handling rules for each level.",
    riskIfMissing: 5,
  },
  {
    keywords: ["review cycle", "annual review", "policy review", "update", "revision", "version control", "effective date"],
    finding: { type: "recommendation", severity: "low", title: "Policy Governance & Review", descPresent: "A review cycle is mentioned. Ensure version control and an approval workflow are clearly documented.", descAbsent: "The policy does not specify a review cadence or version control mechanism, risking the document becoming stale." },
    recPresent: "Pair the review cycle with a formal change-management workflow and maintain a revision history log.",
    recAbsent: "Establish at minimum an annual review cycle with designated owners, approval authority, and published revision history.",
    riskIfMissing: 4,
  },
];

function generateMockAnalysis(title: string, content: string, wordCount: number, readingTime: number) {
  const lower = content.toLowerCase();
  const titleLower = title.toLowerCase();

  /* ── Detect which topics appear / are absent ── */
  const detected: { bucket: TopicBucket; found: boolean }[] = TOPIC_BUCKETS.map((b) => ({
    bucket: b,
    found: b.keywords.some((kw) => lower.includes(kw) || titleLower.includes(kw)),
  }));

  /* ── Risk score: starts at a base, increases for missing critical topics ── */
  let riskScore = 15; // baseline
  for (const { bucket, found } of detected) {
    if (!found) riskScore += bucket.riskIfMissing;
    else riskScore -= 2; // small reward for coverage
  }
  // Add a bit of variance so repeated runs aren't identical
  riskScore += Math.floor(Math.random() * 7) - 3;
  riskScore = Math.max(10, Math.min(85, riskScore));
  const riskLevel = getRiskLabel(riskScore);

  /* ── Build findings (pick those most relevant) ── */
  // Sort: present topics first (so findings are about what IS in the policy),
  // then absent high-severity topics
  const sorted = [...detected].sort((a, b) => {
    if (a.found !== b.found) return a.found ? -1 : 1;
    const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (sevOrder[a.bucket.finding.severity] ?? 3) - (sevOrder[b.bucket.finding.severity] ?? 3);
  });

  // Take up to 6 findings: prefer a mix of found and not-found
  const foundItems = sorted.filter((d) => d.found).slice(0, 3);
  const missingItems = sorted.filter((d) => !d.found).slice(0, 3);
  const selectedFindings = [...foundItems, ...missingItems].slice(0, 6);

  const keyFindings = selectedFindings.map(({ bucket, found }) => ({
    id: generateId(),
    type: bucket.finding.type,
    severity: found ? bucket.finding.severity : (bucket.finding.severity === "low" ? "medium" : bucket.finding.severity),
    title: bucket.finding.title,
    description: found ? bucket.finding.descPresent : bucket.finding.descAbsent,
    section: bucket.finding.section,
  }));

  /* ── Build recommendations (tailored to what's present/absent) ── */
  const recommendations: string[] = [];
  for (const { bucket, found } of sorted) {
    if (recommendations.length >= 5) break;
    const rec = found ? bucket.recPresent : bucket.recAbsent;
    recommendations.push(rec);
  }

  /* ── Dynamic summary ── */
  const presentTopics = detected.filter((d) => d.found).map((d) => d.bucket.finding.title);
  const missingHighSev = detected.filter((d) => !d.found && ["high", "critical"].includes(d.bucket.finding.severity)).map((d) => d.bucket.finding.title);

  let summary = `This policy document "${title}" contains ${wordCount} words and covers ${presentTopics.length} of ${TOPIC_BUCKETS.length} key compliance areas.`;
  if (presentTopics.length > 0) {
    summary += ` Topics addressed include ${presentTopics.slice(0, 3).join(", ")}${presentTopics.length > 3 ? ` and ${presentTopics.length - 3} more` : ""}.`;
  }
  if (missingHighSev.length > 0) {
    summary += ` Notable gaps requiring attention: ${missingHighSev.join(", ")}.`;
  }

  const complianceStatus = missingHighSev.length === 0
    ? "The policy covers critical compliance areas. A detailed review is still recommended to ensure full regulatory alignment."
    : `${missingHighSev.length} high-priority compliance gap${missingHighSev.length > 1 ? "s" : ""} detected. Immediate remediation is recommended before regulatory review.`;

  return {
    summary,
    riskScore,
    riskLevel,
    complianceStatus,
    keyFindings,
    recommendations,
    wordCount,
    readingTime,
    analyzedAt: new Date().toISOString(),
  };
}
