import { useEffect, useState } from 'react'
import Header from '../components/Header'
import type { AppConfig, LLMProvider } from '../../shared/types'

export default function Setup({ onDone }: { onDone: () => void }) {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.getConfig().then(setConfig)
  }, [])

  if (!config) return <div className="p-8 text-muted">Cargando…</div>

  const update = <K extends keyof AppConfig>(key: K, value: AppConfig[K]): void => {
    setConfig({ ...config, [key]: value })
  }

  const pickFolder = async (): Promise<void> => {
    const folder = await window.api.pickFolder()
    if (folder) update('outputDir', folder)
  }

  const save = async (): Promise<void> => {
    setError(null)
    if (!config.elevenLabsKey || !config.pexelsKey) {
      setError('ElevenLabs y Pexels son obligatorias.')
      return
    }
    if (config.llmProvider === 'anthropic' && !config.anthropicKey) {
      setError('Falta la API key de Anthropic.')
      return
    }
    if (config.llmProvider === 'openai' && !config.openaiKey) {
      setError('Falta la API key de OpenAI.')
      return
    }
    setSaving(true)
    await window.api.setConfig(config)
    setSaving(false)
    onDone()
  }

  return (
    <div className="h-full flex flex-col">
      <Header title="Configuración inicial" />
      <div className="flex-1 overflow-y-auto px-8 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <p className="text-muted text-sm">
          Pega tus API keys. Se guardan cifradas en este equipo. No salen de aquí.
        </p>

        <section className="card space-y-4">
          <h2 className="text-base font-semibold">APIs obligatorias</h2>
          <div>
            <label className="label">ElevenLabs API key</label>
            <input
              className="input"
              type="password"
              value={config.elevenLabsKey}
              onChange={(e) => update('elevenLabsKey', e.target.value)}
              placeholder="sk_..."
            />
          </div>
          <div>
            <label className="label">Pexels API key</label>
            <input
              className="input"
              type="password"
              value={config.pexelsKey}
              onChange={(e) => update('pexelsKey', e.target.value)}
            />
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="text-base font-semibold">LLM para análisis del guion</h2>
          <div className="flex gap-2">
            {(['anthropic', 'openai'] as LLMProvider[]).map((p) => (
              <button
                key={p}
                className={`btn ${
                  config.llmProvider === p ? 'btn-primary' : 'btn-ghost'
                }`}
                onClick={() => update('llmProvider', p)}
              >
                {p === 'anthropic' ? 'Anthropic (Claude)' : 'OpenAI'}
              </button>
            ))}
          </div>
          {config.llmProvider === 'anthropic' ? (
            <div>
              <label className="label">Anthropic API key</label>
              <input
                className="input"
                type="password"
                value={config.anthropicKey}
                onChange={(e) => update('anthropicKey', e.target.value)}
                placeholder="sk-ant-..."
              />
            </div>
          ) : (
            <div>
              <label className="label">OpenAI API key</label>
              <input
                className="input"
                type="password"
                value={config.openaiKey}
                onChange={(e) => update('openaiKey', e.target.value)}
                placeholder="sk-..."
              />
            </div>
          )}
        </section>

        <section className="card space-y-4">
          <h2 className="text-base font-semibold">Opcionales</h2>
          <div>
            <label className="label">Pixabay API key (fallback de b-rolls)</label>
            <input
              className="input"
              type="password"
              value={config.pixabayKey}
              onChange={(e) => update('pixabayKey', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Carpeta de salida</label>
            <div className="flex gap-2">
              <input
                className="input"
                value={config.outputDir}
                onChange={(e) => update('outputDir', e.target.value)}
                placeholder="~/Vídeos/GeneradorVideos"
              />
              <button className="btn-ghost shrink-0" onClick={pickFolder}>
                Elegir…
              </button>
            </div>
          </div>
        </section>

        {error && <div className="text-red-400 text-sm">{error}</div>}

        <div className="flex justify-end">
          <button className="btn-primary" disabled={saving} onClick={save}>
            {saving ? 'Guardando…' : 'Guardar y continuar'}
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
