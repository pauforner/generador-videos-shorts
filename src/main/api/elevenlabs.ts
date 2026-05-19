import { writeFile } from 'fs/promises'
import type { Word } from '../../shared/types'

export interface ElevenLabsVoice {
  voice_id: string
  name: string
  category: string
  description: string | null
  labels: Record<string, string>
  preview_url: string | null
}

interface VoicesListResponse {
  voices: ElevenLabsVoice[]
}

export async function listVoices(apiKey: string): Promise<ElevenLabsVoice[]> {
  const res = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey }
  })
  if (!res.ok) throw new Error(`ElevenLabs voices ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as VoicesListResponse
  return (data.voices ?? []).map((v) => ({
    voice_id: v.voice_id,
    name: v.name,
    category: v.category ?? 'cloned',
    description: v.description ?? null,
    labels: v.labels ?? {},
    preview_url: v.preview_url ?? null
  }))
}

export async function ttsSample(opts: {
  apiKey: string
  voiceId: string
  text: string
  stability: number
  similarityBoost: number
  style: number
  speed: number
}): Promise<Buffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${opts.voiceId}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': opts.apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg'
    },
    body: JSON.stringify({
      text: opts.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: opts.stability,
        similarity_boost: opts.similarityBoost,
        style: opts.style,
        use_speaker_boost: true,
        speed: opts.speed
      }
    })
  })
  if (!res.ok) throw new Error(`ElevenLabs TTS ${res.status}: ${await res.text()}`)
  const arrayBuf = await res.arrayBuffer()
  return Buffer.from(arrayBuf)
}

interface AlignmentBlock {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}

interface ElevenLabsWithTimestampsResponse {
  audio_base64: string
  alignment: AlignmentBlock | null
  normalized_alignment: AlignmentBlock | null
}

export interface TtsResult {
  audioPath: string
  words: Word[]
  durationSeconds: number
}

export async function ttsWithTimestamps(opts: {
  apiKey: string
  voiceId: string
  text: string
  stability: number
  similarityBoost: number
  style: number
  speed: number
  outputPath: string
}): Promise<TtsResult> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${opts.voiceId}/with-timestamps`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': opts.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      text: opts.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: opts.stability,
        similarity_boost: opts.similarityBoost,
        style: opts.style,
        use_speaker_boost: true,
        speed: opts.speed
      }
    })
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`ElevenLabs ${res.status}: ${body}`)
  }

  const data = (await res.json()) as ElevenLabsWithTimestampsResponse

  const audioBuffer = Buffer.from(data.audio_base64, 'base64')
  await writeFile(opts.outputPath, audioBuffer)

  const alignment = data.normalized_alignment ?? data.alignment
  if (!alignment) throw new Error('ElevenLabs did not return alignment data')

  const words = charactersToWords(alignment)
  const lastWord = words[words.length - 1]
  const durationSeconds = lastWord ? lastWord.end : 0

  return { audioPath: opts.outputPath, words, durationSeconds }
}

function charactersToWords(alignment: AlignmentBlock): Word[] {
  const words: Word[] = []
  let currentChars: string[] = []
  let wordStart = 0

  for (let i = 0; i < alignment.characters.length; i++) {
    const ch = alignment.characters[i]
    const charStart = alignment.character_start_times_seconds[i]
    const charEnd = alignment.character_end_times_seconds[i]

    if (/\s/.test(ch)) {
      if (currentChars.length > 0) {
        const wordEnd = alignment.character_end_times_seconds[i - 1] ?? charEnd
        words.push({ text: currentChars.join(''), start: wordStart, end: wordEnd })
        currentChars = []
      }
    } else {
      if (currentChars.length === 0) wordStart = charStart
      currentChars.push(ch)
    }
  }

  if (currentChars.length > 0) {
    const lastIdx = alignment.characters.length - 1
    const wordEnd = alignment.character_end_times_seconds[lastIdx] ?? wordStart
    words.push({ text: currentChars.join(''), start: wordStart, end: wordEnd })
  }

  return words
}
