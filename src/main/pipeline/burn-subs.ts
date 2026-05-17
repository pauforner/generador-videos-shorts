import { spawn } from 'child_process'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { getFfmpegPath } from './ffmpeg-binary'
import { buildAss } from '../subtitles/styles'
import type { Scene, SubtitleSettings } from '../../shared/types'

export async function burnSubtitles(opts: {
  scenes: Scene[]
  settings: SubtitleSettings
  inputVideo: string
  tempDir: string
  outputPath: string
}): Promise<void> {
  const ass = buildAss(opts.scenes, opts.settings)
  const assPath = join(opts.tempDir, 'subs.ass')
  await writeFile(assPath, ass, 'utf8')

  const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'")

  await runFfmpeg([
    '-y',
    '-i', opts.inputVideo,
    '-vf', `subtitles='${escapedAss}'`,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'veryfast',
    '-crf', '20',
    '-c:a', 'copy',
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
