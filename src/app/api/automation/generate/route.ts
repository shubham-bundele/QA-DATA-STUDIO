import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from "@/lib/llm-client";
import { generateFallbackAutomationCode } from "@/core/engines/automation-fallbacks";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    files: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          language: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ['name', 'language', 'content']
      }
    }
  },
  required: ['files']
};

export async function POST(req: Request) {
  try {
    const { story, locators, framework } = await req.json();
    if (!story || !framework) return NextResponse.json({ error: 'Missing requirements' }, { status: 400 });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Generate automation code for the following user story. 
        Framework: ${framework}
        Story: ${story}
        Locators: ${JSON.stringify(locators)}
        
        Return an array of files appropriate for the framework. For example, Playwright BDD needs a .feature file, step definitions, and a POM. Selenium needs Java classes.
        ALWAYS include a "README.md" file that explains:
        1. How to run these tests.
        2. How to install the QA Data Studio VS Code extension (Install from VSIX in VS Code Extensions view).`,
        config: { responseMimeType: 'application/json', responseSchema: generateSchema, temperature: 0.2 }
      });

      if (!response.text) throw new Error("No response");
      return NextResponse.json(JSON.parse(response.text));
    } catch (aiError) {
      console.error('AI Generation failed, falling back:', aiError);
      return NextResponse.json(generateFallbackAutomationCode(story, locators || [], framework));
    }
  } catch (error) {
    console.error('Outer Generate Error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
