import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const { prompt, framework } = await req.json();

    if (!prompt || !framework) {
      return NextResponse.json({ error: "Missing prompt or framework" }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const systemPrompt = `You are a Senior QA Automation Engineer.
The user will describe a user journey in plain English.
You must generate a complete, working End-to-End (E2E) automation script using the requested framework: ${framework}.

Guidelines:
1. Write Production-ready code (use best practices, wait for selectors, handle assertions).
2. ONLY output the code. No markdown formatting blocks like \`\`\`javascript, just the raw code.
3. Include helpful comments explaining the logic.
4. Assume standard locators if the user doesn't provide them (e.g., input[name='email']).`;

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [
         { role: 'user', parts: [{ text: systemPrompt }] },
         { role: 'model', parts: [{ text: "Understood. I will provide raw automation code." }] },
         { role: 'user', parts: [{ text: prompt }] }
      ]
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
          try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Automation Builder Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


