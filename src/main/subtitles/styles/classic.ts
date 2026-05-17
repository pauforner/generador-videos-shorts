import type { Scene, SubtitleSettings } from '../../../shared/types'
import { assTime, escapeAssText, toAssColor, yPositionFor, VIDEO_W } from '../ass-builder'

const MAX_LINE_WORDS = 8

export function classicStyle(scenes: Scene[], settings: SubtitleSettings): string {
  const primary = toAssColor(settings.primaryColor)
  const yPos = yPositionFor(settings.position)
  const x = Math.round(VIDEO_W / 2)
  const lines: string[] = []

  for (const scene of scenes) {
    for (let i = 0; i < scene.words.length; i += MAX_LINE_WORDS) {
      const group = scene.words.slice(i, i + MAX_LINE_WORDS)
      if (group.length === 0) continue
      const start = group[0].start
      const end = group[group.length - 1].end
      const text = group.map((w) => escapeAssText(w.text)).join(' ')
      const intro = `{\\pos(${x},${yPos})\\an5\\bord4\\3c&H000000&\\c${primary}}`
      lines.push(
        `Dialogue: 0,${assTime(start)},${assTime(end)},Default,,0,0,0,,${intro}${text}`
      )
    }
  }

  return lines.join('\n') + '\n'
}
