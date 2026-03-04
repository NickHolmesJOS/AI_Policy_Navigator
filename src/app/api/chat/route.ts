import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const { question, policyContent, policyTitle, chatHistory } =
      await req.json();

    if (!question || !policyContent) {
      return NextResponse.json(
        { error: "Missing question or policy content" },
        { status: 400 }
      );
    }

    // Truncate to ~8000 chars to stay within token budget for gpt-4o-mini
    const truncatedContent = policyContent.slice(0, 8000);

    if (!process.env.OPENAI_API_KEY) {
      // Return mock response when no API key
      const mockAnswer = generateMockAnswer(question, policyTitle);
      return NextResponse.json({ answer: mockAnswer });
    }

    const systemPrompt = `You are an expert policy analyst assistant. You have been given a policy document to analyze and answer questions about. 

Policy Title: ${policyTitle}

Policy Content:
${truncatedContent}

Instructions:
- Answer questions specifically about this policy document
- Be concise but thorough
- Reference specific sections when relevant
- If information is not in the policy, say so clearly
- Provide practical, actionable insights`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-10).map(
        (msg: { role: "user" | "assistant"; content: string }) => ({
          role: msg.role,
          content: msg.content,
        })
      ),
      { role: "user", content: question },
    ];

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.5,
      max_tokens: 500,
    });

    const answer = completion.choices[0]?.message?.content;
    if (!answer) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}

function generateMockAnswer(question: string, policyTitle: string): string {
  const lowerQ = question.toLowerCase();

  if (lowerQ.includes("risk")) {
    return `Based on my analysis of "${policyTitle}", there are several key risk areas to consider. The policy identifies medium to high risk in data handling procedures and compliance requirements. I recommend reviewing sections related to data governance and employee responsibilities to mitigate these risks.`;
  }

  if (lowerQ.includes("gdpr") || lowerQ.includes("compliance") || lowerQ.includes("regulation")) {
    return `Regarding compliance for "${policyTitle}": The policy has several provisions that align with regulatory requirements. However, there are areas that may need strengthening, particularly around data subject rights, consent mechanisms, and breach notification procedures. I recommend a formal compliance audit against applicable regulations.`;
  }

  if (lowerQ.includes("employee") || lowerQ.includes("staff") || lowerQ.includes("action")) {
    return `Employees covered by "${policyTitle}" are required to: 1) Complete mandatory training within 30 days, 2) Acknowledge and sign the policy, 3) Report any violations to their manager or compliance team, and 4) Follow the specific procedures outlined in each section. Non-compliance may result in disciplinary action.`;
  }

  if (lowerQ.includes("retention") || lowerQ.includes("data") || lowerQ.includes("storage")) {
    return `The data retention requirements in "${policyTitle}" specify that records must be maintained according to applicable regulatory timelines. The policy outlines specific retention periods for different data categories. Organizations should implement data lifecycle management systems to ensure compliance with these requirements.`;
  }

  if (lowerQ.includes("vendor") || lowerQ.includes("third-party") || lowerQ.includes("supplier")) {
    return `Regarding third-party vendors under "${policyTitle}": All vendors with access to organizational data must sign a data processing agreement. They are subject to the same security standards outlined in the policy and must undergo periodic compliance assessments. Vendor management is a key component of overall policy compliance.`;
  }

  if (lowerQ.includes("penalt") || lowerQ.includes("consequence") || lowerQ.includes("violation")) {
    return `Non-compliance with "${policyTitle}" can result in: disciplinary action up to and including termination, regulatory fines and penalties, legal liability, and reputational damage. The policy requires all violations to be reported and investigated through the formal incident management process.`;
  }

  return `Regarding your question about "${policyTitle}": This is a demo mode response as no OpenAI API key is configured. To get accurate AI-powered answers about this specific policy, please add your OPENAI_API_KEY to the environment configuration. The AI will then analyze the actual policy content and provide precise, contextual answers to your questions.`;
}
