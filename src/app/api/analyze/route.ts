import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { countWords, estimateReadingTime, generateId, getRiskLabel } from "@/lib/utils";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const { content, title } = await req.json();

    if (!content || !title) {
      return NextResponse.json(
        { error: "Missing content or title" },
        { status: 400 }
      );
    }

    const wordCount = countWords(content);
    const readingTime = estimateReadingTime(wordCount);

    const prompt = `You are an expert policy analyst. Analyze the following policy document and provide a structured analysis in JSON format.

Policy Title: ${title}

Policy Content:
${content.slice(0, 8000)}

Provide your analysis as a valid JSON object with this exact structure:
{
  "summary": "A comprehensive 2-3 sentence summary of the policy",
  "riskScore": <number from 0-100 where 0=no risk, 100=critical risk>,
  "complianceStatus": "A brief statement about compliance implications",
  "keyFindings": [
    {
      "id": "unique-id-1",
      "type": "risk|requirement|recommendation|compliance",
      "severity": "low|medium|high|critical",
      "title": "Finding title",
      "description": "Detailed description",
      "section": "Optional: section reference"
    }
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ]
}

Include 4-8 key findings and 3-5 recommendations. Be specific and actionable.`;

    if (!process.env.OPENAI_API_KEY) {
      // Return mock analysis when no API key is configured
      const mockAnalysis = generateMockAnalysis(title, content, wordCount, readingTime);
      return NextResponse.json(mockAnalysis);
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert policy analyst. Always respond with valid JSON only, no markdown.",
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

// Risk score bounds for mock analysis (avoids extreme values in demo mode)
const MIN_MOCK_RISK_SCORE = 20;
const MAX_MOCK_RISK_SCORE = 60;

function generateMockAnalysis(title: string, content: string, wordCount: number, readingTime: number) {
  const riskScore =
    Math.floor(Math.random() * (MAX_MOCK_RISK_SCORE - MIN_MOCK_RISK_SCORE + 1)) +
    MIN_MOCK_RISK_SCORE;
  const riskLevel = getRiskLabel(riskScore);

  return {
    summary: `This policy document "${title}" outlines key guidelines and procedures. It addresses important organizational requirements and establishes clear expectations for compliance. The document covers essential topics relevant to the stated category with ${wordCount} words.`,
    riskScore,
    riskLevel,
    complianceStatus: "This policy requires review against applicable regulations. Some areas may need updates to align with current standards.",
    keyFindings: [
      {
        id: generateId(),
        type: "risk",
        severity: "medium",
        title: "Data Handling Ambiguity",
        description: "The policy contains ambiguous language around data handling procedures that could lead to inconsistent implementation.",
        section: "Section 2.1",
      },
      {
        id: generateId(),
        type: "requirement",
        severity: "high",
        title: "Employee Training Required",
        description: "All employees covered by this policy must complete mandatory training within 30 days of policy adoption.",
        section: "Section 4",
      },
      {
        id: generateId(),
        type: "compliance",
        severity: "low",
        title: "Regulatory Alignment",
        description: "The policy aligns with most applicable regulatory requirements but should be reviewed annually.",
      },
      {
        id: generateId(),
        type: "recommendation",
        severity: "medium",
        title: "Update Review Cycle",
        description: "Consider establishing a quarterly review cycle to ensure the policy remains current with evolving standards.",
      },
    ],
    recommendations: [
      "Clarify ambiguous language in data handling sections to ensure consistent application.",
      "Establish a formal review and approval process for policy updates.",
      "Add specific timelines and responsible parties for all compliance requirements.",
      "Consider adding examples and use cases to help employees understand the policy's intent.",
      "Implement a tracking system to monitor policy adherence and exceptions.",
    ],
    wordCount,
    readingTime,
    analyzedAt: new Date().toISOString(),
  };
}
