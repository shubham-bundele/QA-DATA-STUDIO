import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from "@/lib/llm-client";
import { extractFallbackLocators } from "@/core/engines/automation-fallbacks";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const locatorsSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      primary: { type: Type.STRING },
      fallback: { type: Type.STRING },
      score: { type: Type.NUMBER },
      reason: { type: Type.STRING }
    },
    required: ['name', 'primary', 'fallback', 'score', 'reason']
  }
};

export async function POST(req: Request) {
  try {
    const { html } = await req.json();
    if (!html) return NextResponse.json({ error: 'HTML is required' }, { status: 400 });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Analyze this HTML snippet and extract robust candidate locators for test automation. Prefer data-* attributes, ARIA labels, and semantic elements. Provide a primary selector, a fallback selector, a stability score (0-100), and a brief reason.
        HTML: ${html.slice(0, 15000)}`, // truncate to avoid token limits if extremely large
        config: { responseMimeType: 'application/json', responseSchema: locatorsSchema, temperature: 0.1 }
      });

      if (!response.text) throw new Error("No response");
      return NextResponse.json({ locators: JSON.parse(response.text) });
    } catch (aiError) {
      console.error('AI Locator Extraction failed, falling back:', aiError);
      return NextResponse.json({
        locators: extractFallbackLocators(html)
      });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
