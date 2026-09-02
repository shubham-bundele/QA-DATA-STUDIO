import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from "@/lib/llm-client";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const { html, violationId, description } = await req.json();

    if (!html) {
      return NextResponse.json({ error: "Missing HTML" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are an expert Accessibility (a11y) Engineer.
The following HTML node failed an Axe-core accessibility audit.

Violation Rule ID: ${violationId}
Description: ${description}

Failing HTML Node:
\`\`\`html
${html}
\`\`\`

Analyze the violation and provide the exact corrected HTML that resolves this accessibility issue (e.g., adding aria-labels, alt tags, fixing contrast, using semantic tags).
Output ONLY the corrected HTML code, no markdown blocks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        temperature: 0.1
      }
    });

    let healedHtml = response.text || "";
    healedHtml = healedHtml.replace(/^```(\w+)?\n/, '').replace(/```$/, '').trim();

    return NextResponse.json({ healedHtml });
  } catch (error: any) { console.error("AI Heal A11y failed, using fallback"); return NextResponse.json({ healedHtml: "<!-- Fallback: AI unavailable. Please manually fix a11y issues in this element -->\\n<div>Fallback Element</div>" }); }




}
