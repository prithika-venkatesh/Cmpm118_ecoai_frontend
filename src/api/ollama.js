// ─────────────────────────────────────────────────────────
//  ollama.js  –  Call both LLM models via Ollama on Nautilus
// ─────────────────────────────────────────────────────────

import { estimateUsage } from './carbon.js'

const OLLAMA_URL = 'https://ecoai-ollama.nrp-nautilus.io/api/chat'
const MODELS = {
  standard: 'llama3.2:1b',
  cot:      'qwen2.5:1.5b',
}

async function callModel(modelKey, prompt) {
  const start = Date.now()

  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODELS[modelKey],
      stream: false,
      messages: [
        {
          role: 'system',
          content: modelKey === 'cot'
            ? 'You are a helpful assistant. Think through this problem step by step, showing your reasoning before giving a final answer.'
            : 'You are a helpful, concise assistant. Answer clearly and directly in as few words as possible.',

        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || `Ollama API error: ${res.status}`)
  }

  const data = await res.json()
  const durationMs = Date.now() - start

  const text = data.message.content
  const promptToks = data.prompt_eval_count || 0
  const completeToks = data.eval_count || 0

  return {
    text,
    modelName: MODELS[modelKey],
    ...estimateUsage(promptToks, completeToks, durationMs),
  }
}

export async function queryBothModels(prompt) {
  const [standard, cot] = await Promise.all([
    callModel('standard', prompt),
    callModel('cot',      prompt),
  ])
  return { standard, cot }
}