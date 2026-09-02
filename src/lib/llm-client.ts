import OpenAI from "openai";

export const Type = {
  OBJECT: "object",
  STRING: "string",
  ARRAY: "array",
  NUMBER: "number",
  INTEGER: "integer",
  BOOLEAN: "boolean"
};

export type Schema = any;

function parseGeminiContents(contents: any): any[] {
  if (typeof contents === 'string') {
    return [{ role: 'user', content: contents }];
  }
  if (Array.isArray(contents)) {
    return contents.map((c: any) => {
      const role = c.role === 'model' ? 'assistant' : 'user';
      const text = c.parts ? c.parts.map((p: any) => p.text).join('\n') : JSON.stringify(c);
      return { role, content: text };
    });
  }
  return [{ role: 'user', content: JSON.stringify(contents) }];
}

export class GoogleGenAI {
  models: { generateContent: any, generateContentStream: any };
  client: OpenAI;

  constructor(opts: any) {
    this.client = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: process.env.NVIDIA_API_KEY,
    });
    
    this.models = {
      generateContent: async (args: any) => {
        let messages = parseGeminiContents(args.contents);
        
        if (args.config?.responseSchema) {
            messages.unshift({ 
              role: "system", 
              content: "You must respond strictly in valid JSON format. Your JSON must conform strictly to this schema: " + JSON.stringify(args.config.responseSchema) 
            });
        } else if (args.config?.responseMimeType === 'application/json') {
            messages.unshift({ 
              role: "system", 
              content: "You must respond strictly in valid JSON format."
            });
        }

        const completion = await this.client.chat.completions.create({
          model: "deepseek-ai/deepseek-v4-pro-0813",
          messages: messages,
          temperature: args.config?.temperature ?? 1,
          top_p: 0.95,
          max_tokens: 16384,
          seed: 42,
          extra_body: { chat_template_kwargs: { thinking: false } }
        } as any);

        let text = completion.choices[0]?.message?.content || "";
        if ((args.config?.responseSchema || args.config?.responseMimeType === 'application/json')) {
            text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }

        return { text };
      },
      
      generateContentStream: async (args: any) => {
         const messages = parseGeminiContents(args.contents);
         const stream = await this.client.chat.completions.create({
           model: "deepseek-ai/deepseek-v4-pro-0813",
           messages: messages,
           stream: true,
           temperature: args.config?.temperature ?? 1,
           top_p: 0.95,
           max_tokens: 16384,
           seed: 42,
           extra_body: { chat_template_kwargs: { thinking: false } }
         } as any);

         async function* iterator() {
            for await (const chunk of stream as any) {
               yield { text: chunk.choices[0]?.delta?.content || "" };
            }
         }
         return iterator();
      }
    };
  }
}
