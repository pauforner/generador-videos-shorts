import { mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { app } from 'electron'
import { analyzeScript } from '../api/llm'
import { ttsWithTimestamps } from '../api/elevenlabs'
import { alignScenes } from './align-scenes'
import { applyClipLength } from './split-merge'
import { fetchBrolls } from './fetch-broll'
import { composeVideo } from './compose'
import { burnSubtitles } from './burn-subs'
import { getConfig } from '../store'
import type { GenerateRequest, GenerateResult, ProgressEvent } from '../../shared/types'

export async function generateVideo(
  request: GenerateRequest,
  onProgress: (e: ProgressEvent) => void
): Promise<GenerateResult> {
  const config = getConfig()
  const jobId = Date.now().toString()
  const tempDir = join(app.getPath('temp'), `genvideo-${jobId}`)
  await mkdir(tempDir, { recursive: true })

  const outputDir = config.outputDir || join(app.getPath('videos'), 'GeneradorVideos')
  await mkdir(outputDir, { recursive: true })
  const outputPath = join(outputDir, `video-${jobId}.mp4`)

  try {
    onProgress({ phase: 'analyzing', message: 'Analizando guion…', percent: 5 })
    const analyzed = await analyzeScript({
      provider: config.llmProvider,
      apiKey: config.llmProvider === 'anthropic' ? config.anthropicKey : config.openaiKey,
      script: request.script
    })
    if (analyzed.length === 0) throw new Error('No se pudieron extraer escenas del guion')

    onProgress({ phase: 'tts', message: 'Generando voz con ElevenLabs…', percent: 20 })
    const voicePath = join(tempDir, 'voice.mp3')
    const tts = await ttsWithTimestamps({
      apiKey: config.elevenLabsKey,
      voiceId: request.voice.voiceId,
      text: request.script,
      stability: request.voice.stability,
      similarityBoost: request.voice.similarityBoost,
      style: request.voice.style,
      speed: request.voice.speed,
      outputPath: voicePath
    })

    onProgress({ phase: 'aligning', message: 'Alineando escenas con audio…', percent: 35 })
    const aligned = alignScenes(analyzed, tts.words)
    if (aligned.length === 0) throw new Error('No se pudieron alinear escenas con timestamps')
    const last = aligned[aligned.length - 1]
    if (tts.durationSeconds > last.end) {
      aligned[aligned.length - 1] = {
        ...last,
        end: tts.durationSeconds,
        duration: tts.durationSeconds - last.start
      }
    }
    const scenes = applyClipLength(aligned, request.clipLength)

    onProgress({ phase: 'fetching', message: 'Descargando b-rolls…', percent: 40 })
    const scenesWithClips = await fetchBrolls({
      scenes,
      pexelsKey: config.pexelsKey,
      pixabayKey: config.pixabayKey,
      tempDir,
      onProgress: (current, total) => {
        const pct = 40 + Math.round((current / total) * 25)
        onProgress({
          phase: 'fetching',
          message: `Descargando b-rolls ${current}/${total}…`,
          percent: pct
        })
      }
    })

    onProgress({ phase: 'composing', message: 'Componiendo vídeo…', percent: 70 })
    const composedPath = join(tempDir, 'composed.mp4')
    await composeVideo({
      scenes: scenesWithClips,
      voiceMp3: voicePath,
      voiceVolumeDb: request.voice.volumeDb,
      music: request.music,
      totalDurationSec: tts.durationSeconds,
      tempDir,
      outputPath: composedPath
    })

    onProgress({ phase: 'subtitles', message: 'Quemando subtítulos…', percent: 88 })
    await burnSubtitles({
      scenes: scenesWithClips,
      settings: request.subtitles,
      inputVideo: composedPath,
      tempDir,
      outputPath
    })

    onProgress({ phase: 'done', message: 'Vídeo generado', percent: 100 })

    return { videoPath: outputPath, durationSeconds: tts.durationSeconds }
  } finally {
    rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}
