import Store from 'electron-store'
import { app, safeStorage } from 'electron'
import { join } from 'path'
import type { AppConfig } from '../shared/types'

type SecretKey =
  | 'elevenLabsKey'
  | 'pexelsKey'
  | 'pixabayKey'
  | 'anthropicKey'
  | 'openaiKey'

const SECRET_KEYS: SecretKey[] = [
  'elevenLabsKey',
  'pexelsKey',
  'pixabayKey',
  'anthropicKey',
  'openaiKey'
]

const defaults: AppConfig = {
  elevenLabsKey: '',
  pexelsKey: '',
  pixabayKey: '',
  llmProvider: 'anthropic',
  anthropicKey: '',
  openaiKey: '',
  outputDir: ''
}

interface PersistedShape {
  llmProvider: 'anthropic' | 'openai'
  outputDir: string
  encrypted: Record<string, string>
}

const store = new Store<PersistedShape>({
  name: 'config',
  defaults: {
    llmProvider: 'anthropic',
    outputDir: '',
    encrypted: {}
  }
})

function encrypt(value: string): string {
  if (!value) return ''
  if (!safeStorage.isEncryptionAvailable()) return Buffer.from(value).toString('base64')
  return safeStorage.encryptString(value).toString('base64')
}

function decrypt(value: string): string {
  if (!value) return ''
  const buf = Buffer.from(value, 'base64')
  if (!safeStorage.isEncryptionAvailable()) return buf.toString('utf8')
  try {
    return safeStorage.decryptString(buf)
  } catch {
    return ''
  }
}

export function getConfig(): AppConfig {
  const encrypted = store.get('encrypted') ?? {}
  const config: AppConfig = {
    ...defaults,
    llmProvider: (store.get('llmProvider', 'anthropic') as 'anthropic' | 'openai'),
    outputDir: store.get('outputDir', '') || join(app.getPath('videos'), 'GeneradorVideos')
  }
  for (const key of SECRET_KEYS) {
    config[key] = decrypt(encrypted[key] ?? '')
  }
  return config
}

export function setConfig(partial: Partial<AppConfig>): AppConfig {
  if (partial.llmProvider !== undefined) {
    store.set('llmProvider', partial.llmProvider)
  }
  if (partial.outputDir !== undefined) {
    store.set('outputDir', partial.outputDir)
  }
  const encrypted = store.get('encrypted') ?? {}
  for (const key of SECRET_KEYS) {
    if (partial[key] !== undefined) {
      encrypted[key] = encrypt(partial[key] as string)
    }
  }
  store.set('encrypted', encrypted)
  return getConfig()
}

export function isConfigured(): boolean {
  const c = getConfig()
  const llmOk = c.llmProvider === 'anthropic' ? !!c.anthropicKey : !!c.openaiKey
  return !!c.elevenLabsKey && !!c.pexelsKey && llmOk
}
