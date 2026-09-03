import { GoogleGenAI } from "./src/lib/llm-client";
async function main() {
  const ai = new GoogleGenAI();
  const res = await ai.models.generateContent({
    contents: 'Respond ONLY with valid JSON: {"status":"ok"}',
    config: { responseMimeType: "application/json" }
  });
  console.log("Result:", res);
}
main();
