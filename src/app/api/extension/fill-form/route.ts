import { NextResponse } from "next/server";
import { GoogleGenAI, MODEL_CONFIG } from "@/lib/llm-client";

export async function POST(req: Request) {
  try {
    const { fields } = await req.json();
    
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: "No fields provided" }, { status: 400 });
    }

    const prompt = `
You are an intelligent QA Test Data generator. I am providing you with a list of HTML form fields extracted from a webpage.
For each field, generate realistic, varied, and appropriate test data. 

Form fields:
${JSON.stringify(fields, null, 2)}

Return a JSON array of objects. Each object must have:
- "id": The exact id/name provided in the input field
- "value": The generated realistic test data (string, number, or boolean for checkboxes)

Respond ONLY with valid JSON. Do not include markdown blocks like \`\`\`json.
`;

    const ai = new GoogleGenAI({});
    const response = await ai.models.generateContent({
      model: MODEL_CONFIG.primaryModel,
      contents: prompt,
    });
    
    // Parse the JSON response safely
    let parsedData = [];
    try {
      const responseText = response.text || "";
      const cleanJson = responseText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      parsedData = JSON.parse(cleanJson);
    } catch (_e) {
      console.error("Failed to parse AI form fill response:", response.text);
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: unknown) {
    console.error("Extension fill-form API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
