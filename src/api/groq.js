// ─────────────────────────────────────────────────────────
//  groq.js  –  Call both LLM models at the same time
// ─────────────────────────────────────────────────────────
//
//  We use the Groq API because it's:
//    • Free tier  (no credit card needed to start)
//    • Very fast  (purpose-built inference hardware)
//    • Returns token counts in every response
//
//  The two models:
//    ⚡ llama-3.3-70b-versatile   →  "Standard"  (fast, direct)
//    🧠 qwen/qwen3-32b →  "Chain-of-Thought"
//       (reasons step-by-step before answering, uses more tokens)
//
//  HOW TO GET A FREE GROQ KEY:
//    1. Go to https://console.groq.com
//    2. Sign up (free)
//    3. API Keys → Create key
//    4. Paste it into your .env as VITE_GROQ_API_KEY
//
// ─────────────────────────────────────────────────────────

import { estimateUsage } from './carbon.js'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const API_KEY  = import.meta.env.VITE_GROQ_API_KEY

const MODELS = {
  standard: 'llama-3.3-70b-versatile',
  cot:      'qwen/qwen3-32b',
}

/**
 * Call a single Groq model and return the response + usage stats.
 */
async function callModel(modelKey, prompt) {
  const start = Date.now()

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model:       MODELS[modelKey],
      max_tokens:  1024,
      messages: [
        {
          role:    'system',
          content: 'You are a helpful, concise assistant. Answer clearly and directly.',
        },
        {
          role:    'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Groq API error: ${res.status}`)
  }

  const data      = await res.json()
  const durationMs = Date.now() - start

  const text         = data.choices[0].message.content
  .replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  const promptToks   = data.usage.prompt_tokens
  const completeToks = data.usage.completion_tokens

  return {
    text,
    modelName: MODELS[modelKey],
    ...estimateUsage(promptToks, completeToks, durationMs),
  }
}

/**
 * Call BOTH models in parallel and return results together.
 * Using Promise.all means they run at the same time — not one
 * after the other — so total wait time is ~max(model1, model2).
 */
export async function queryBothModels(prompt) {
  const [standard, cot] = await Promise.all([
    callModel('standard', prompt),
    callModel('cot',      prompt),
  ])
  return { standard, cot }
}
