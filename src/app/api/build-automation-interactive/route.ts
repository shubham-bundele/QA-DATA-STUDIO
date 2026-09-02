import { NextResponse } from "next/server";
import { GoogleGenAI } from "@/lib/llm-client";
import { QA_SYSTEM_CONTEXT } from "@/core/engines/ai-orchestrator";

const SYSTEM_PROMPT = `You are an expert Test Automation Architect. 
Your goal is to build robust, resilient automation scripts using the precise HTML DOM provided by the user.

${QA_SYSTEM_CONTEXT}

WORKFLOW:
1. The user will provide a test scenario.
2. If the user HAS NOT provided the relevant HTML DOM snippets for the elements required, ask them to paste the HTML. Be specific about what you need (e.g., "Please paste the HTML for the Login form").
3. If the user provides HTML, analyze it. Extract robust locators (prefer data-testid, aria-labels, text, then css/xpath).
4. If the HTML provided is missing critical elements to complete the scenario, explicitly ask the user for the missing parts.
5. ONCE YOU HAVE ENOUGH DOM CONTEXT to write the script, generate the code.

CODE GENERATION RULES:
When generating code, you MUST output it as a JSON array of file objects inside a markdown JSON block. 
Do not output raw code outside of this JSON block. 
The user will specify the framework (e.g., Playwright POM, Cucumber, Cypress). Provide all necessary files.

Format your output exactly like this when returning code:
\`\`\`json
[
  {
    "filename": "tests/login.spec.ts",
    "language": "typescript",
    "content": "import { test, expect } from '@playwright/test';\\n..."
  },
  {
    "filename": "pages/LoginPage.ts",
    "language": "typescript",
    "content": "export class LoginPage { ... }"
  }
]
\`\`\`
If you are just asking for more HTML, just respond with normal text, NO JSON block.`;

export async function POST(req: Request) {
  try {
    const { messages, framework } = await req.json();

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let fullPrompt = SYSTEM_PROMPT + "\n\nTarget Framework: " + framework + "\n\nChat History:\n";
    for (const msg of messages) {
      fullPrompt += `[${msg.role.toUpperCase()}]: ${msg.content}\n\n`;
    }

    const response = await ai.models.generateContent({
      contents: fullPrompt
    });

    if (response.isAIFailed) {
        throw new Error(response.reason || 'AI generation failed');
    }

    return NextResponse.json({ 
      content: response.text || "No response generated." 
    });
  } catch (error: any) { console.error("AI Build Interactive failed, using fallback"); return NextResponse.json({ content: "The AI service is currently unavailable. Please generate using the standard builder." }); }


}
