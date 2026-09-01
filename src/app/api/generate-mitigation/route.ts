import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { vulnerability, framework } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const responseSchema: Schema = {
      type: Type.OBJECT,
      description: "Code and explanation to mitigate a security vulnerability",
      properties: {
        codeSnippet: { type: Type.STRING, description: "The exact code required to fix the vulnerability" },
        explanation: { type: Type.STRING, description: "A short, professional explanation of why the fix works" },
      },
      required: ["codeSnippet", "explanation"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `A security vulnerability was found during automated testing:\n\n${vulnerability}\n\nGenerate the exact backend/middleware code needed to mitigate this threat. Assume the backend uses ${framework || 'Node.js/Express'}. Return the response strictly matching the JSON schema.` }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text returned from Gemini");
    }

    const result = JSON.parse(text);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Mitigation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate mitigation" }, { status: 500 });
  }
}

