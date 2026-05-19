import type { Scene, SubtitleSettings } from '../../../shared/types'
import { assTime, escapeAssText, toAssColor, yPositionFor, VIDEO_W } from '../ass-builder'

export function singleXxlStyle(scenes: Scene[], settings: SubtitleSettings): string {
  const primary = toAssColor(settings.primaryColor)
  const yPos = yPositionFor(settings.position)
  const x = Math.round(VIDEO_W / 2)
  const lines: string[] = []

  for (const scene of scenes) {
    for (let i = 0; i < scene.words.length; i++) {
      const w = scene.words[i]
      const next = scene.words[i + 1]
      const start = w.start
      const end = next ? next.start : scene.end
      const text = escapeAssText(w.text.toUpperCase())
      const intro = `{\\pos(${x},${yPos})\\an5\\bord10\\3c&H000000&\\c${primary}\\fscx140\\fscy140\\fad(60,30)}`
      lines.push(
        `Dialogue: 0,${assTime(start)},${assTime(end)},Default,,0,0,0,,${intro}${text}`
      )
    }
  }

  return lines.join('\n') + '\n'
}
