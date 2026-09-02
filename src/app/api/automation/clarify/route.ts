import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from "@/lib/llm-client";
import { generateFallbackClarifications } from "@/core/engines/automation-fallbacks";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const clarifySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING, enum: ['PROCEED', 'CLARIFY'] },
    questions: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ['status', 'questions']
};

export async function POST(req: Request) {
  try {
    const { story } = await req.json();
    if (!story) return NextResponse.json({ error: 'Story is required' }, { status: 400 });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Analyze this user story for test automation. If it's detailed enough to write POMs and test scripts, return status PROCEED. If it's missing critical info (like URL, roles, environments), return status CLARIFY and provide up to 3 high-value questions.
        Story: ${story}`,
        config: { responseMimeType: 'application/json', responseSchema: clarifySchema, temperature: 0.1 }
      });

      if (!response.text) throw new Error("No response");
      return NextResponse.json(JSON.parse(response.text));
    } catch (aiError) {
      console.error('AI Clarify failed, falling back:', aiError);
      return NextResponse.json({
        status: 'CLARIFY',
        questions: generateFallbackClarifications()
      });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
