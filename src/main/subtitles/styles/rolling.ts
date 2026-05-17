import type { Scene, SubtitleSettings, Word } from '../../../shared/types'
import { assTime, escapeAssText, toAssColor, yPositionFor, VIDEO_W } from '../ass-builder'

const WINDOW = 3

export function rollingStyle(scenes: Scene[], settings: SubtitleSettings): string {
  const primary = toAssColor(settings.primaryColor)
  const highlight = toAssColor(settings.highlightColor)
  const yPos = yPositionFor(settings.position)
  const x = Math.round(VIDEO_W / 2)
  const allWords: Word[] = scenes.flatMap((s) => s.words)
  const lines: string[] = []

  for (let i = 0; i < allWords.length; i++) {
    const center = allWords[i]
    const windowStart = Math.max(0, i - Math.floor(WINDOW / 2))
    const windowEnd = Math.min(allWords.length, windowStart + WINDOW)
    const window = allWords.slice(windowStart, windowEnd)
    const centerIdx = i - windowStart

    const text = window
      .map((w, idx) => {
        const t = escapeAssText(w.text.toUpperCase())
        if (idx === centerIdx) return `{\\c${highlight}\\fscx112\\fscy112}${t}{\\r}{\\c${primary}}`
        return `{\\c${primary}\\alpha&H40&}${t}{\\alpha&H00&}`
      })
      .join(' ')

    const intro = `{\\pos(${x},${yPos})\\an5\\bord5\\3c&H000000&}`
    lines.push(
      `Dialogue: 0,${assTime(center.start)},${assTime(center.end)},Default,,0,0,0,,${intro}${text}`
    )
  }

  return lines.join('\n') + '\n'
}
