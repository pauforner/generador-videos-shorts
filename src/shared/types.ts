export type LLMProvider = 'anthropic' | 'openai'

export interface AppConfig {
  elevenLabsKey: string
  pexelsKey: string
  pixabayKey: string
  llmProvider: LLMProvider
  anthropicKey: string
  openaiKey: string
  outputDir: string
}

export interface VoiceSettings {
  voiceId: string
  stability: number
  similarityBoost: number
  style: number
  speed: number
  volumeDb: number
}

export interface MusicSettings {
  mp3Path: string | null
  volumeDb: number
  ducking: boolean
}

export type SubtitleStyleId =
  | 'hormozi'
  | 'karaoke'
  | 'single-xxl'
  | 'rolling'
  | 'classic'

export type SubtitlePosition = 'center' | 'lower-third' | 'bottom'
export type SubtitleSize = 'S' | 'M' | 'L' | 'XL'
export type SubtitleFont = 'Anton' | 'Inter Black' | 'Montserrat Black'

export interface SubtitleSettings {
  styleId: SubtitleStyleId
  primaryColor: string
  highlightColor: string
  font: SubtitleFont
  size: SubtitleSize
  position: SubtitlePosition
}

export interface GenerateRequest {
  script: string
  voice: VoiceSettings
  music: MusicSettings
  subtitles: SubtitleSettings
}

export interface Word {
  text: string
  start: number
  end: number
}

export interface Scene {
  text: string
  keywordsEn: string[]
  start: number
  end: number
  duration: number
  clipPath?: string
  words: Word[]
}

export type Phase =
  | 'analyzing'
  | 'tts'
  | 'aligning'
  | 'fetching'
  | 'composing'
  | 'subtitles'
  | 'done'
  | 'error'

export interface ProgressEvent {
  phase: Phase
  message: string
  percent: number
}

export interface GenerateResult {
  videoPath: string
  durationSeconds: number
}
