const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const client = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY
});

async function test() {
  try {
    const completion = await client.chat.completions.create({
      model: "deepseek-ai/deepseek-coder-6.7b-instruct", // Wait, user said deepseek-ai/deepseek-v4-pro-0813
      messages: [{"role":"user","content":"Return JSON: {\"hello\":\"world\"}"}],
      max_tokens: 100,
      response_format: { type: "json_object" }
    });
    console.log("JSON_OBJECT success:", completion.choices[0].message.content);
  } catch (err) {
    console.error("JSON_OBJECT error:", err.message);
  }
}
test();
