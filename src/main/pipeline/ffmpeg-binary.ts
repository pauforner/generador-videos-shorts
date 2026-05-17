import ffmpegStatic from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import { app } from 'electron'

let configured = false

export function getFfmpegPath(): string {
  if (!ffmpegStatic) throw new Error('ffmpeg-static path is null')
  if (app.isPackaged) {
    return ffmpegStatic.replace('app.asar', 'app.asar.unpacked')
  }
  return ffmpegStatic
}

export function configureFfmpeg(): void {
  if (configured) return
  ffmpeg.setFfmpegPath(getFfmpegPath())
  configured = true
}

export { ffmpeg }
