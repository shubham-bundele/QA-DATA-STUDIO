import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const { script, htmlContext, errorMessage } = await req.json();

    if (!script || !htmlContext) {
      return NextResponse.json({ error: "Missing script or htmlContext" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are an expert QA Automation Engineer.
The following E2E test script (Playwright/Cypress/Selenium) is failing because the DOM has changed.

Original Failing Script:
\`\`\`
${script}
\`\`\`

Error Message (if any):
${errorMessage || "Locator not found or timeout."}

New HTML Context (DOM snippet):
\`\`\`html
${htmlContext}
\`\`\`

Analyze the DOM changes and rewrite the automation script with the corrected CSS or XPath selectors.
Output ONLY the corrected script code, no markdown blocks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        temperature: 0.2
      }
    });

    let healedScript = response.text || "";
    healedScript = healedScript.replace(/^```(\w+)?\n/, '').replace(/```$/, '').trim();

    return NextResponse.json({ healedScript });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


