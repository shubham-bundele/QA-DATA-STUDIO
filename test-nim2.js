const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const client = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY
});

async function test() {
  try {
    const completion = await client.chat.completions.create({
      model: "deepseek-ai/deepseek-v4-pro-0813",
      messages: [{"role":"user","content":"Write a limerick about the wonders of GPU computing."}],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 16384,
      seed: 42,
      // @ts-ignore
      extra_body: { chat_template_kwargs: { thinking: false } }
    });
    console.log("Success:", completion.choices[0].message.content);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
