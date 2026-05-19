import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import type { LLMProvider } from '../../shared/types'

export interface AnalyzedScene {
  text: string
  keywords_en: string[]
}

const SYSTEM_PROMPT = `You split a video script into scenes for a vertical 9:16 social video.

Rules:
- Each scene is one short visual idea (typically 1 sentence, 5-15 words). Long sentences may be split at natural breaks.
- Keep the original wording exactly. Never paraphrase, translate, summarize, or change punctuation/casing of the text.
- Every single word from the original script MUST appear in exactly one scene. Do not drop, merge, deduplicate or reorder any text — even if a sentence is repeated word-for-word, keep both copies in order.
- The concatenation of all scene "text" fields, separated by single spaces, MUST be lexically equivalent to the input script (ignoring leading/trailing whitespace).
- For each scene return 3 short visual keywords in English (single nouns or 2-word phrases) that describe what should be shown on screen. Concrete and searchable on stock-video sites. Avoid abstract concepts.

Return ONLY valid JSON with this shape:
{ "scenes": [{ "text": "...", "keywords_en": ["...", "...", "..."] }] }
No code fences. No commentary.`

export async function analyzeScript(opts: {
  provider: LLMProvider
  apiKey: string
  script: string
}): Promise<AnalyzedScene[]> {
  const userMsg = `Script:\n\n${opts.script}`

  let jsonText: string
  if (opts.provider === 'anthropic') {
    const client = new Anthropic({ apiKey: opts.apiKey })
    const res = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMsg }]
    })
    const block = res.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text') throw new Error('Claude returned no text')
    jsonText = block.text
  } else {
    const client = new OpenAI({ apiKey: opts.apiKey })
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMsg }
      ],
      response_format: { type: 'json_object' }
    })
    jsonText = res.choices[0]?.message?.content ?? ''
  }

  return parseScenes(jsonText)
}

function parseScenes(raw: string): AnalyzedScene[] {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('LLM returned no JSON object')
  const json = cleaned.slice(start, end + 1)
  const parsed = JSON.parse(json) as { scenes?: AnalyzedScene[] }
  if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
    throw new Error('LLM JSON missing scenes[]')
  }
  return parsed.scenes
    .map((s) => ({
      text: (s.text ?? '').trim(),
      keywords_en: Array.isArray(s.keywords_en) ? s.keywords_en.slice(0, 3) : []
    }))
    .filter((s) => s.text.length > 0)
}
