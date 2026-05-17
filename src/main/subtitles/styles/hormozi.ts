import type { Scene, SubtitleSettings } from '../../../shared/types'
import { assTime, escapeAssText, toAssColor, yPositionFor, VIDEO_W } from '../ass-builder'

const GROUP_SIZE = 2

export function hormoziStyle(scenes: Scene[], settings: SubtitleSettings): string {
  const highlight = toAssColor(settings.highlightColor)
  const primary = toAssColor(settings.primaryColor)
  const yPos = yPositionFor(settings.position)
  const x = Math.round(VIDEO_W / 2)
  const lines: string[] = []

  for (const scene of scenes) {
    for (let i = 0; i < scene.words.length; i += GROUP_SIZE) {
      const group = scene.words.slice(i, i + GROUP_SIZE)
      if (group.length === 0) continue
      const start = group[0].start
      const end = group[group.length - 1].end
      const popIndex = Math.floor(Math.random() * group.length)

      const tokens = group.map((w, idx) => {
        const text = escapeAssText(w.text.toUpperCase())
        if (idx === popIndex) {
          return `{\\c${highlight}\\bord8\\3c&H000000&\\fscx115\\fscy115}${text}{\\r}`
        }
        return `{\\c${primary}}${text}`
      })

      const intro = `{\\pos(${x},${yPos})\\an5\\fad(60,60)\\bord6\\3c&H000000&}`
      lines.push(
        `Dialogue: 0,${assTime(start)},${assTime(end)},Default,,0,0,0,,${intro}${tokens.join(' ')}`
      )
    }
  }

  return lines.join('\n') + '\n'
}
