import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from "@/lib/llm-client";

export const maxDuration = 60;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const { testCases, userStory } = await req.json();

    if (!testCases || !Array.isArray(testCases)) {
      return NextResponse.json({ error: 'Test cases are required' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `You are an expert SDET. Write a Playwright test script in TypeScript for the following User Story and Test Cases.
      
      User Story: ${userStory}

      Test Cases JSON:
      ${JSON.stringify(testCases, null, 2)}
      
      Requirements:
      - Use standard Playwright format: import { test, expect } from '@playwright/test';
      - Create a test.describe block.
      - Add realistic test.step() blocks inside each test.
      - Output ONLY valid TypeScript code. No markdown code block backticks surrounding it, just raw code.`,
      config: {
        temperature: 0.2
      }
    });

    if (!response.text) {
        throw new Error("No response text");
    }
    
    // Clean up potential markdown backticks if the model still adds them
    let code = response.text.trim();
    if (code.startsWith("\`\`\`typescript")) code = code.replace("\`\`\`typescript", "");
    else if (code.startsWith("\`\`\`ts")) code = code.replace("\`\`\`ts", "");
    else if (code.startsWith("\`\`\`")) code = code.replace("\`\`\`", "");
    if (code.endsWith("\`\`\`")) code = code.slice(0, -3);

    return NextResponse.json({ code: code.trim() });
  } catch (error: unknown) { console.error("AI Playwright Generator failed, using fallback"); return NextResponse.json({ code: "import { test, expect } from `@playwright/test`;\\n\\n// AI Generation Failed. Fallback Template.\\ntest.describe(`Generated Suite`, () => {\\n  test(`Test Case 1`, async ({ page }) => {\\n    await page.goto(`/`);\\n  });\\n});" }); }



}
