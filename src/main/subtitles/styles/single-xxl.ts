import type { Scene, SubtitleSettings } from '../../../shared/types'
import { assTime, escapeAssText, toAssColor, yPositionFor, VIDEO_W } from '../ass-builder'

export function singleXxlStyle(scenes: Scene[], settings: SubtitleSettings): string {
  const primary = toAssColor(settings.primaryColor)
  const yPos = yPositionFor(settings.position)
  const x = Math.round(VIDEO_W / 2)
  const lines: string[] = []

  for (const scene of scenes) {
    for (const w of scene.words) {
      const text = escapeAssText(w.text.toUpperCase())
      const intro = `{\\pos(${x},${yPos})\\an5\\bord10\\3c&H000000&\\c${primary}\\fscx140\\fscy140\\fad(40,40)}`
      lines.push(
        `Dialogue: 0,${assTime(w.start)},${assTime(w.end)},Default,,0,0,0,,${intro}${text}`
      )
    }
  }

  return lines.join('\n') + '\n'
}
