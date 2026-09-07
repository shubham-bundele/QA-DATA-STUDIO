if (typeof process === 'undefined') {
  (globalThis as any).process = { env: {} }
} else if (!process.env) {
  (process as any).env = {}
}

import { pipeline, env } from '@xenova/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

export type InferenceType = 'embed' | 'summarize' | 'classify' | 'ner' | 'qa' | 'translate' | 'generate'

export interface InferenceRequest {
  id: number
  type: InferenceType
  modelId: string
  text: string
  context?: string
  targetLang?: string
}

export interface InferenceResponse {
  id: number
  ok: boolean
  result?: any
  error?: string
  progress?: any
}

const TYPE_TO_TASK: Record<InferenceType, string> = {
  embed: 'feature-extraction',
  summarize: 'summarization',
  classify: 'text-classification',
  ner: 'token-classification',
  qa: 'question-answering',
  translate: 'text2text-generation',
  generate: 'text-generation'
}

// LRU Cache for pipelines could be implemented here
const pipelines = new Map<string, any>()

async function getPipeline(type: InferenceType, modelId: string) {
  const key = `${type}:${modelId}`
  if (pipelines.has(key)) {
    return pipelines.get(key)
  }

  const task = TYPE_TO_TASK[type] as any
  const pipe = await pipeline(task, modelId, { quantized: true })
  pipelines.set(key, pipe)
  
  return pipe
}

function truncate(text: string, maxLen: number) {
  if (text.length > maxLen) {
    return text.substring(0, maxLen)
  }
  return text
}

self.addEventListener('message', async (event: MessageEvent<InferenceRequest>) => {
  const { id, type, modelId, text, context, targetLang } = event.data

  try {
    const pipe = await getPipeline(type, modelId)
    let result: any

    switch (type) {
      case 'embed': {
        // IMPORTANT: Return full vector (384 dims for MiniLM), do NOT truncate output
        const output = await pipe(text, { pooling: 'mean', normalize: true })
        result = Array.from(output.data)
        break
      }
      
      case 'summarize': {
        const truncated = truncate(text, 2000)
        const output = await pipe(truncated, { max_length: 150, min_length: 30, do_sample: false })
        result = Array.isArray(output) ? output[0].summary_text : output.summary_text
        break
      }

      case 'classify': {
        const truncated = truncate(text, 1000)
        result = await pipe(truncated)
        break
      }

      case 'ner': {
        const truncated = truncate(text, 2000)
        result = await pipe(truncated)
        break
      }

      case 'qa': {
        if (!context) throw new Error("QA requires context")
        const qTruncated = truncate(text, 1000)
        const cTruncated = truncate(context, 4000)
        result = await pipe({ question: qTruncated, context: cTruncated })
        result = await pipe(qTruncated, cTruncated)
        break
      }

      case 'translate': {
        const truncated = truncate(text, 1000)
        const input = `translate English to ${targetLang || 'German'}: ${truncated}`
        const output = await pipe(input)
        result = Array.isArray(output) ? output[0].translation_text : output.translation_text
        break
      }

      case 'generate': {
        const truncated = truncate(text, 500)
        const output = await pipe(truncated, { max_new_tokens: 60, temperature: 0.8, top_p: 0.9 })
        result = Array.isArray(output) ? output[0].generated_text : output.generated_text
        break
      }

      default:
        throw new Error(`Unsupported type: ${type}`)
    }

    self.postMessage({ id, ok: true, result } as InferenceResponse)
  } catch (error: any) {
    self.postMessage({ id, ok: false, error: error.message } as InferenceResponse)
  }
})

