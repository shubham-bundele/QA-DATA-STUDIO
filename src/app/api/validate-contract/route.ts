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
    const { schemaDefinition, jsonPayload } = await req.json();

    if (!schemaDefinition || !jsonPayload) {
      return NextResponse.json({ error: "Missing schema or payload" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are an expert QA Engineer doing API Contract Testing.

I have an OpenAPI / Swagger schema definition (or JSON schema) for an endpoint:
\`\`\`
${schemaDefinition}
\`\`\`

And I have the actual JSON payload returned by my Mock Server:
\`\`\`json
${jsonPayload}
\`\`\`

Validate the payload against the schema strictly. 
1. Are there missing required fields?
2. Are there type mismatches (e.g. string instead of int)?
3. Are there extra fields not defined in the schema?

Return the response STRICTLY as a JSON object with this exact structure, no markdown wrappers, no backticks, just raw JSON:
{
  "isValid": boolean,
  "errors": [ "list", "of", "error", "strings", "or empty array" ],
  "warnings": [ "list", "of", "warnings", "or empty array" ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        temperature: 0.1
      }
    });

    let text = response.text || "{}";
    text = text.replace(/^```(\w+)?\n/, '').replace(/```$/, '').trim();

    const result = JSON.parse(text);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


