import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const { prompt } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const responseSchema: Schema = {
      type: Type.ARRAY,
      description: "A list of mock API endpoints",
      items: {
        type: Type.OBJECT,
        properties: {
          path: { type: Type.STRING, description: "The URL path, e.g., 'users' or 'cart/items'" },
          method: { type: Type.STRING, description: "HTTP Method (GET, POST, PUT, DELETE)" },
          statusCode: { type: Type.INTEGER, description: "HTTP status code, e.g., 200 or 201" },
          responseBody: { type: Type.STRING, description: "A beautifully formatted JSON string representing the mock response data. MUST be valid JSON stringified." },
          delay: { type: Type.INTEGER, description: "Simulated network delay in ms" },
        },
        required: ["path", "method", "statusCode", "responseBody", "delay"],
      }
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `Generate a comprehensive set of mock API endpoints for the following domain/description: "${prompt}". Provide 3 to 6 realistic endpoints covering CRUD operations. Populate the responseBody with highly realistic dummy data in JSON format (ensure responseBody is a stringified JSON).` }]
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

    const generatedMocks = JSON.parse(text);

    return NextResponse.json(generatedMocks);
  } catch (error: any) {
    console.error("AI Mock Gen Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate mocks" }, { status: 500 });
  }
}


