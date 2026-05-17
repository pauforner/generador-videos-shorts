import { spawn } from 'child_process'
import { join } from 'path'
import { writeFile } from 'fs/promises'
import { configureFfmpeg, getFfmpegPath } from './ffmpeg-binary'
import type { Scene, MusicSettings } from '../../shared/types'

export interface ComposeOpts {
  scenes: Scene[]
  voiceMp3: string
  voiceVolumeDb: number
  music: MusicSettings
  totalDurationSec: number
  tempDir: string
  outputPath: string
}

export async function composeVideo(opts: ComposeOpts): Promise<void> {
  configureFfmpeg()

  const segmentPaths: string[] = []
  for (let i = 0; i < opts.scenes.length; i++) {
    const scene = opts.scenes[i]
    const segPath = join(opts.tempDir, `seg_${String(i).padStart(3, '0')}.mp4`)
    await renderScene(scene, segPath)
    segmentPaths.push(segPath)
  }

  const concatList = segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n')
  const concatFile = join(opts.tempDir, 'concat.txt')
  await writeFile(concatFile, concatList)

  const silentVideo = join(opts.tempDir, 'video_silent.mp4')
  await runFfmpeg([
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFile,
    '-c', 'copy',
    '-t', String(opts.totalDurationSec),
    silentVideo
  ])

  await mixAudio({
    silentVideo,
    voiceMp3: opts.voiceMp3,
    voiceVolumeDb: opts.voiceVolumeDb,
    music: opts.music,
    totalDuration: opts.totalDurationSec,
    outputPath: opts.outputPath
  })
}

async function renderScene(scene: Scene, outPath: string): Promise<void> {
  const duration = scene.duration.toFixed(3)
  if (scene.clipPath) {
    await runFfmpeg([
      '-y',
      '-ss', '0',
      '-i', scene.clipPath,
      '-t', duration,
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30',
      '-an',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'veryfast',
      '-crf', '20',
      outPath
    ])
  } else {
    await runFfmpeg([
      '-y',
      '-f', 'lavfi',
      '-i', `color=c=#141416:s=1080x1920:d=${duration}:r=30`,
      '-t', duration,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'veryfast',
      '-crf', '23',
      outPath
    ])
  }
}

async function mixAudio(opts: {
  silentVideo: string
  voiceMp3: string
  voiceVolumeDb: number
  music: MusicSettings
  totalDuration: number
  outputPath: string
}): Promise<void> {
  const voiceGain = `volume=${opts.voiceVolumeDb}dB`

  if (!opts.music.mp3Path) {
    await runFfmpeg([
      '-y',
      '-i', opts.silentVideo,
      '-i', opts.voiceMp3,
      '-filter_complex', `[1:a]${voiceGain}[a]`,
      '-map', '0:v',
      '-map', '[a]',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      opts.outputPath
    ])
    return
  }

  const musicGain = `volume=${opts.music.volumeDb}dB`
  const ducking = opts.music.ducking
  const totalDur = opts.totalDuration.toFixed(3)

  const filterParts: string[] = []
  filterParts.push(`[1:a]${voiceGain},apad,atrim=0:${totalDur}[voice]`)
  filterParts.push(`[2:a]aloop=loop=-1:size=2e9,${musicGain},atrim=0:${totalDur}[musicraw]`)

  if (ducking) {
    filterParts.push(
      `[musicraw][voice]sidechaincompress=threshold=0.05:ratio=8:attack=5:release=300:makeup=1[ducked]`
    )
    filterParts.push(`[voice][ducked]amix=inputs=2:duration=first:dropout_transition=0[a]`)
  } else {
    filterParts.push(`[voice][musicraw]amix=inputs=2:duration=first:dropout_transition=0[a]`)
  }

  await runFfmpeg([
    '-y',
    '-i', opts.silentVideo,
    '-i', opts.voiceMp3,
    '-i', opts.music.mp3Path,
    '-filter_complex', filterParts.join(';'),
    '-map', '0:v',
    '-map', '[a]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-t', totalDur,
    opts.outputPath
  ])
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(getFfmpegPath(), args)
    let stderr = ''
    proc.stderr.on('data', (d) => {
      stderr += d.toString()
    })
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-1500)}`))
    })
  })
}
