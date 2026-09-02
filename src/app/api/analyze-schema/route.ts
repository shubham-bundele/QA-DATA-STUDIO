import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const { schema } = await req.json();

    if (!schema) {
      return NextResponse.json({ error: 'Schema input is required' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are an expert Security and QA Engineer. Analyze the following OpenAPI/Swagger JSON schema.
      
      Extract each API endpoint and generate 3 test cases for each endpoint:
      1. A Positive/Boundary test case with a valid payload.
      2. A Negative test case with an invalid payload (e.g. missing required fields, wrong types).
      3. A Security test case (e.g. SQL Injection, XSS) in the payload or query params.
      
      Schema:
      ${schema.substring(0, 50000)} // Truncating if too large
      
      Respond STRICTLY with a valid JSON object matching this TypeScript interface. Do NOT wrap it in markdown backticks:
      {
        "endpoints": [
          {
            "path": string,
            "method": string,
            "testCases": [
              {
                "title": string,
                "type": "positive" | "negative" | "security",
                "payload": object // The JSON payload to send
              }
            ]
          }
        ]
      }`,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
        throw new Error("No response text");
    }
    
    const analysis = JSON.parse(response.text);

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    console.error('Error analyzing schema:', error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: 'Failed to analyze API schema: ' + msg },
      { status: 500 }
    );
  }
}

