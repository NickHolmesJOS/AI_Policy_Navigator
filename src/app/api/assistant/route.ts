import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const { question, context, chatHistory } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    // Truncate context to ~12k chars to stay within token budget
    const truncatedContext = (context || "").slice(0, 12000);

    if (!process.env.OPENAI_API_KEY) {
      const mockAnswer = generateMockAnswer(question, truncatedContext);
      return NextResponse.json({ answer: mockAnswer });
    }

    const systemPrompt = `You are an expert AI assistant for the AI Policy Navigator application. You have deep knowledge of policy analysis, compliance frameworks (GDPR, HIPAA, SOC 2, PCI DSS, ISO 27001, CCPA), and organizational governance.

The user has the following data in their workspace:

${truncatedContext}

Instructions:
- Answer questions about any aspect of the user's policies, compliance status, folders, tags, analytics, and application features.
- Reference specific policies, compliance rules, or data points when relevant.
- Be concise, helpful, and actionable.
- If the user asks about something not in their data, provide general expert guidance.
- You can help with: policy questions, compliance guidance, risk assessment, data interpretation, navigating the app, and best practices.
- Format responses with markdown when helpful (lists, bold, etc.).`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...(chatHistory || []).slice(-10).map(
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
      max_tokens: 600,
    });

    const answer = completion.choices[0]?.message?.content;
    if (!answer) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Assistant error:", error);
    return NextResponse.json({ error: "Assistant failed" }, { status: 500 });
  }
}

function generateMockAnswer(question: string, context: string): string {
  const lowerQ = question.toLowerCase();

  // Extract some data points from context for smart mock responses
  const policyCountMatch = context.match(/Total policies: (\d+)/);
  const policyCount = policyCountMatch ? policyCountMatch[1] : "0";
  const folderCountMatch = context.match(/Folders: (\d+)/);
  const folderCount = folderCountMatch ? folderCountMatch[1] : "0";

  if (lowerQ.includes("how many") && lowerQ.includes("polic")) {
    return `You currently have **${policyCount} policies** in your workspace. You can view and manage them from the Dashboard or organize them into folders on the Organize page.`;
  }

  if (lowerQ.includes("compliance") || lowerQ.includes("compliant")) {
    return `Based on your current data, here's a compliance overview:\n\nYour policies have compliance rules assigned through folders, tags, and individual assignments. To see detailed compliance status for each policy, click on any policy and navigate to the **Compliance** tab.\n\nYou can manage frameworks and rule assignments on the **Compliance Dashboard** page. The system supports GDPR, HIPAA, SOC 2, PCI DSS, ISO 27001, and CCPA frameworks, plus any custom frameworks you create.`;
  }

  if (lowerQ.includes("risk") || lowerQ.includes("score")) {
    return `Risk scores are calculated during policy analysis on a 0-100 scale:\n\n- **0-30**: Low risk (green)\n- **31-60**: Medium risk (amber)\n- **61-80**: High risk (orange)\n- **81-100**: Critical risk (red)\n\nTo analyze a policy's risk, go to the **Analyze** page or click "Analyze" on any unanalyzed policy. Each analysis includes key findings, compliance status, and specific recommendations.`;
  }

  if (lowerQ.includes("folder") || lowerQ.includes("organiz")) {
    return `You have **${folderCount} folders** set up. Folders help you organize policies by department, project, or any grouping you prefer.\n\nFolders are also powerful for compliance — you can assign compliance rules to an entire folder, and every policy in that folder inherits those rules automatically. Manage folders on the **Organize** page.`;
  }

  if (lowerQ.includes("tag")) {
    return `Tags provide flexible categorization for your policies. Unlike folders (which are exclusive), a policy can have multiple tags.\n\nTags also integrate with the compliance system — you can assign compliance rules to a tag, and all policies with that tag will inherit those rules. Add tags to policies from the policy detail page or during analysis.`;
  }

  if (lowerQ.includes("export") || lowerQ.includes("download")) {
    return `You can export policies in multiple formats:\n\n- **Markdown** (.md) — great for documentation\n- **JSON** — structured data for integrations\n- **Plain Text** (.txt) — universal compatibility\n\nSet your default export format in **Settings**. You can also export from the policy detail page or use bulk actions to export multiple policies at once.`;
  }

  if (lowerQ.includes("template")) {
    return `Policy templates give you a head start on creating new policies. The **Templates** page offers pre-built templates across categories like Privacy, Security, HR, Compliance, and more.\n\nEach template includes industry-standard language and structure. Simply select a template, customize it for your organization, and submit it for analysis.`;
  }

  if (lowerQ.includes("help") || lowerQ.includes("what can") || lowerQ.includes("feature")) {
    return `Here's what I can help you with:\n\n🔍 **Policy Questions** — Ask about any of your ${policyCount} policies\n📊 **Compliance Status** — Check compliance across frameworks\n⚡ **Risk Analysis** — Understand risk scores and findings\n📁 **Organization** — Help with folders, tags, and structure\n📋 **Templates** — Guide you to relevant templates\n🔧 **App Navigation** — Help you find features\n💡 **Best Practices** — Policy and compliance guidance\n\nJust ask me anything!`;
  }

  // Default response
  return `Great question! Based on your workspace with **${policyCount} policies** across **${folderCount} folders**, I can help you with policy analysis, compliance tracking, risk assessment, and more.\n\nCould you be more specific about what you'd like to know? For example:\n- "What's the compliance status of my policies?"\n- "Which policies have the highest risk?"\n- "How do I assign compliance rules?"\n- "What templates are available?"`;
}
