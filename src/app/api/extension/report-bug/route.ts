import { NextResponse } from "next/server";
import { GoogleGenAI } from "@/lib/llm-client";

export const maxDuration = 60; // Allow enough time for vision analysis

export async function POST(req: Request) {
  try {
    const { imageBase64, description = "" } = await req.json();
    
    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Remove the data URI prefix (e.g., 'data:image/png;base64,')
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const prompt = `
You are an expert QA Engineer. Analyze the provided screenshot of a web application.
The user has highlighted an issue (or described it below).
User description: "${description}"

Based on the visual evidence, write a professional Bug Report in markdown format.
Include:
1. **Bug Title**: A clear, concise title.
2. **Description**: What is the visual or functional issue?
3. **Expected Behavior**: What should happen/look like?
4. **Actual Behavior**: What is currently happening/looking like?

Respond ONLY with the markdown text.
`;

    const ai = new GoogleGenAI({});
    
    // We pass inlineData directly into the contents array
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/png" // Assuming PNG from captureVisibleTab
          }
        }
      ]
    });

    if (response.isAIFailed) {
      console.error("AI Generation Failed:", response.reason);
      return NextResponse.json({ error: "AI Generation Failed" }, { status: 500 });
    }
    
    const bugReport = response.text || "";

    return NextResponse.json({ success: true, data: bugReport });
  } catch (error: unknown) {
    console.error("Extension report-bug API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

