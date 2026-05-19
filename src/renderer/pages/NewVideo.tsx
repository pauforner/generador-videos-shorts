import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import SubtitlePreview from '../components/SubtitlePreview'
import type {
  ClipLengthSettings,
  GenerateRequest,
  GenerateResult,
  MusicSettings,
  ProgressEvent,
  SubtitleSettings,
  SubtitleStyleId,
  VoiceOption,
  VoiceSettings
} from '../../shared/types'

type Tab = 'script' | 'voice' | 'music' | 'subs' | 'edit'

const STYLES: { id: SubtitleStyleId; label: string; desc: string }[] = [
  { id: 'hormozi', label: 'Hormozi', desc: '1-2 palabras MAYÚSCULAS con pop de color' },
  { id: 'karaoke', label: 'Karaoke', desc: 'Línea de 4 palabras, activa resaltada' },
  { id: 'single-xxl', label: 'Una palabra XXL', desc: '1 palabra centrada gigante' },
  { id: 'rolling', label: 'Word-by-word', desc: 'Ventana de 3 palabras deslizante' },
  { id: 'classic', label: 'Clásico', desc: 'Frases completas tipo Netflix' }
]

const DEFAULT_VOICE: VoiceSettings = {
  voiceId: '',
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0.0,
  speed: 1.0,
  volumeDb: 0
}

const DEFAULT_MUSIC: MusicSettings = {
  mp3Path: null,
  volumeDb: -20,
  ducking: true
}

const DEFAULT_SUBS: SubtitleSettings = {
  styleId: 'hormozi',
  primaryColor: '#FFFFFF',
  highlightColor: '#FACC15',
  font: 'Anton',
  size: 'L',
  position: 'center'
}

const DEFAULT_CLIP: ClipLengthSettings = {
  minSec: 2.5,
  maxSec: 5
}

export default function NewVideo({
  initialRequest,
  onGenerated,
  onOpenSetup
}: {
  initialRequest: GenerateRequest | null
  onGenerated: (req: GenerateRequest, res: GenerateResult) => void
  onOpenSetup: () => void
}) {
  const [tab, setTab] = useState<Tab>('script')
  const [script, setScript] = useState(initialRequest?.script ?? '')
  const [voice, setVoice] = useState<VoiceSettings>(initialRequest?.voice ?? DEFAULT_VOICE)
  const [music, setMusic] = useState<MusicSettings>(initialRequest?.music ?? DEFAULT_MUSIC)
  const [subs, setSubs] = useState<SubtitleSettings>(initialRequest?.subtitles ?? DEFAULT_SUBS)
  const [clip, setClip] = useState<ClipLengthSettings>(
    initialRequest?.clipLength ?? DEFAULT_CLIP
  )
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState<ProgressEvent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [voices, setVoices] = useState<VoiceOption[] | null>(null)
  const [loadingVoices, setLoadingVoices] = useState(false)
  const [voiceMode, setVoiceMode] = useState<'list' | 'manual'>(
    initialRequest?.voice.voiceId ? 'manual' : 'list'
  )
  const [testing, setTesting] = useState(false)
  const [testAudio, setTestAudio] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (tab !== 'voice' || voices !== null || loadingVoices) return
    setLoadingVoices(true)
    window.api
      .listVoices()
      .then((vs) => setVoices(vs))
      .catch(() => {
        setVoices([])
        setVoiceMode('manual')
      })
      .finally(() => setLoadingVoices(false))
  }, [tab, voices, loadingVoices])

  const generate = async (): Promise<void> => {
    if (!script.trim()) {
      setError('Pega un guion antes de generar.')
      return
    }
    if (!voice.voiceId.trim()) {
      setError('Falta el Voice ID de ElevenLabs.')
      return
    }
    if (clip.minSec >= clip.maxSec) {
      setError('La duración mínima debe ser menor que la máxima.')
      return
    }
    setError(null)
    setGenerating(true)
    setProgress({ phase: 'analyzing', message: 'Iniciando…', percent: 0 })

    const unsubscribe = window.api.onProgress(setProgress)

    try {
      const request: GenerateRequest = {
        script,
        voice,
        music,
        subtitles: subs,
        clipLength: clip
      }
      const result = await window.api.generateVideo(request)
      onGenerated(request, result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      unsubscribe()
      setGenerating(false)
    }
  }

  const testVoice = async (): Promise<void> => {
    if (!voice.voiceId.trim()) {
      setError('Selecciona o pega un Voice ID antes de probar.')
      return
    }
    setError(null)
    setTesting(true)
    try {
      const url = await window.api.testVoice(voice)
      setTestAudio(url)
      setTimeout(() => audioRef.current?.play(), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setTesting(false)
    }
  }

  const pickMp3 = async (): Promise<void> => {
    const path = await window.api.pickMp3()
    if (path) setMusic({ ...music, mp3Path: path })
  }

  return (
    <div className="h-full flex flex-col">
      <Header
        title="Nuevo vídeo"
        right={
          <button className="btn-ghost text-xs" onClick={onOpenSetup}>
            Ajustes
          </button>
        }
      />

      <div className="flex border-b border-border">
        {(['script', 'voice', 'music', 'subs', 'edit'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm border-b-2 transition-colors ${
              tab === t
                ? 'border-primary text-text'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {t === 'script' && 'Guion'}
            {t === 'voice' && 'Voz'}
            {t === 'music' && 'Música'}
            {t === 'subs' && 'Subtítulos'}
            {t === 'edit' && 'Edición'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'script' && (
          <div className="max-w-3xl">
            <label className="label">Guion completo</label>
            <textarea
              className="input min-h-[420px] font-mono text-sm"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Pega aquí el guion completo del vídeo…"
            />
            <p className="text-xs text-muted mt-2">
              {script.split(/\s+/).filter(Boolean).length} palabras · estimado{' '}
              {Math.round(script.split(/\s+/).filter(Boolean).length / 2.5)}s
            </p>
          </div>
        )}

        {tab === 'voice' && (
          <div className="max-w-2xl space-y-4">
            <div className="flex gap-2 text-xs">
              <button
                className={`btn ${voiceMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setVoiceMode('list')}
              >
                Mis voces
              </button>
              <button
                className={`btn ${voiceMode === 'manual' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setVoiceMode('manual')}
              >
                Pegar Voice ID
              </button>
            </div>

            {voiceMode === 'list' && (
              <div>
                <label className="label">Voz</label>
                {loadingVoices ? (
                  <div className="text-sm text-muted">Cargando voces…</div>
                ) : voices && voices.length > 0 ? (
                  <select
                    className="input"
                    value={voice.voiceId}
                    onChange={(e) => setVoice({ ...voice, voiceId: e.target.value })}
                  >
                    <option value="">— Selecciona una voz —</option>
                    {voices.map((v) => (
                      <option key={v.voice_id} value={v.voice_id}>
                        {v.name} {v.category ? `(${v.category})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-muted">
                    No se pudieron cargar las voces. Cambia a "Pegar Voice ID".
                  </div>
                )}
              </div>
            )}

            {voiceMode === 'manual' && (
              <div>
                <label className="label">Voice ID de ElevenLabs</label>
                <input
                  className="input"
                  value={voice.voiceId}
                  onChange={(e) => setVoice({ ...voice, voiceId: e.target.value })}
                  placeholder="21m00Tcm4TlvDq8ikWAM"
                />
              </div>
            )}

            <Slider
              label="Estabilidad"
              value={voice.stability}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setVoice({ ...voice, stability: v })}
            />
            <Slider
              label="Similarity boost"
              value={voice.similarityBoost}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setVoice({ ...voice, similarityBoost: v })}
            />
            <Slider
              label="Style"
              value={voice.style}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setVoice({ ...voice, style: v })}
            />
            <Slider
              label="Velocidad"
              value={voice.speed}
              min={0.7}
              max={1.2}
              step={0.05}
              onChange={(v) => setVoice({ ...voice, speed: v })}
            />
            <Slider
              label="Volumen voz (dB)"
              value={voice.volumeDb}
              min={-20}
              max={6}
              step={1}
              onChange={(v) => setVoice({ ...voice, volumeDb: v })}
              format={(v) => `${v} dB`}
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                className="btn-ghost"
                disabled={testing || !voice.voiceId}
                onClick={testVoice}
              >
                {testing ? 'Generando muestra…' : 'Probar voz'}
              </button>
              {testAudio && (
                <audio ref={audioRef} src={testAudio} controls className="flex-1" />
              )}
            </div>
          </div>
        )}

        {tab === 'music' && (
          <div className="max-w-2xl space-y-4">
            <div>
              <label className="label">Archivo MP3</label>
              <div className="flex items-center gap-3">
                <button className="btn-ghost" onClick={pickMp3}>
                  {music.mp3Path ? 'Cambiar archivo' : 'Elegir MP3'}
                </button>
                <span className="text-sm text-muted truncate">
                  {music.mp3Path || 'Sin música'}
                </span>
                {music.mp3Path && (
                  <button
                    className="text-xs text-muted underline"
                    onClick={() => setMusic({ ...music, mp3Path: null })}
                  >
                    quitar
                  </button>
                )}
              </div>
            </div>
            <Slider
              label="Volumen música (dB)"
              value={music.volumeDb}
              min={-40}
              max={-5}
              step={1}
              onChange={(v) => setMusic({ ...music, volumeDb: v })}
              format={(v) => `${v} dB`}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={music.ducking}
                onChange={(e) => setMusic({ ...music, ducking: e.target.checked })}
              />
              Bajar música automáticamente bajo la voz (ducking)
            </label>
          </div>
        )}

        {tab === 'subs' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="label">Estilo</label>
                <div className="space-y-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSubs({ ...subs, styleId: s.id })}
                      className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                        subs.styleId === s.id
                          ? 'border-primary bg-surface'
                          : 'border-border hover:bg-surface'
                      }`}
                    >
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="text-xs text-muted">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Color principal</label>
                  <input
                    type="color"
                    className="h-10 w-full rounded-md bg-surface border border-border"
                    value={subs.primaryColor}
                    onChange={(e) => setSubs({ ...subs, primaryColor: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Color highlight</label>
                  <input
                    type="color"
                    className="h-10 w-full rounded-md bg-surface border border-border"
                    value={subs.highlightColor}
                    onChange={(e) => setSubs({ ...subs, highlightColor: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Fuente</label>
                  <select
                    className="input"
                    value={subs.font}
                    onChange={(e) => setSubs({ ...subs, font: e.target.value as never })}
                  >
                    <option>Anton</option>
                    <option>Inter Black</option>
                    <option>Montserrat Black</option>
                  </select>
                </div>
                <div>
                  <label className="label">Tamaño</label>
                  <select
                    className="input"
                    value={subs.size}
                    onChange={(e) => setSubs({ ...subs, size: e.target.value as never })}
                  >
                    <option>S</option>
                    <option>M</option>
                    <option>L</option>
                    <option>XL</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Posición</label>
                  <select
                    className="input"
                    value={subs.position}
                    onChange={(e) =>
                      setSubs({ ...subs, position: e.target.value as never })
                    }
                  >
                    <option value="center">Centro</option>
                    <option value="lower-third">Tercio inferior</option>
                    <option value="bottom">Abajo</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="label">Preview</label>
              <SubtitlePreview settings={subs} />
            </div>
          </div>
        )}

        {tab === 'edit' && (
          <div className="max-w-2xl space-y-5">
            <div>
              <h3 className="text-sm font-semibold mb-1">Duración de los b-rolls</h3>
              <p className="text-xs text-muted">
                Las escenas largas se dividen en varios clips (cada uno con un b-roll
                distinto) y las cortas se fusionan. Más cortes = vídeo más dinámico.
              </p>
            </div>
            <Slider
              label="Duración mínima (s)"
              value={clip.minSec}
              min={1.5}
              max={5}
              step={0.5}
              onChange={(v) => setClip({ ...clip, minSec: v })}
              format={(v) => `${v.toFixed(1)} s`}
            />
            <Slider
              label="Duración máxima (s)"
              value={clip.maxSec}
              min={3}
              max={10}
              step={0.5}
              onChange={(v) => setClip({ ...clip, maxSec: v })}
              format={(v) => `${v.toFixed(1)} s`}
            />
          </div>
        )}
      </div>

      <footer className="border-t border-border px-6 py-4 flex items-center justify-between gap-4">
        {generating && progress ? (
          <div className="flex-1">
            <div className="text-sm mb-1">{progress.message}</div>
            <div className="h-2 bg-border rounded">
              <div
                className="h-full bg-primary rounded transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-red-400">{error}</div>
        )}
        <button className="btn-primary" disabled={generating} onClick={generate}>
          {generating ? 'Generando…' : 'Generar vídeo'}
        </button>
      </footer>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <label className="label mb-0">{label}</label>
        <span className="text-xs text-muted tabular-nums">
          {format ? format(value) : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
