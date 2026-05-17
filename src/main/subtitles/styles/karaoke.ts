import type { Scene, SubtitleSettings, Word } from '../../../shared/types'
import { assTime, escapeAssText, toAssColor, yPositionFor, VIDEO_W } from '../ass-builder'

const WORDS_PER_LINE = 4

export function karaokeStyle(scenes: Scene[], settings: SubtitleSettings): string {
  const highlight = toAssColor(settings.highlightColor)
  const primary = toAssColor(settings.primaryColor)
  const yPos = yPositionFor(settings.position)
  const x = Math.round(VIDEO_W / 2)
  const lines: string[] = []

  for (const scene of scenes) {
    for (let i = 0; i < scene.words.length; i += WORDS_PER_LINE) {
      const group = scene.words.slice(i, i + WORDS_PER_LINE)
      if (group.length === 0) continue

      for (let j = 0; j < group.length; j++) {
        const start = group[j].start
        const end = group[j].end
        const text = renderLine(group, j, primary, highlight)
        const intro = `{\\pos(${x},${yPos})\\an5\\bord4\\3c&H000000&}`
        lines.push(
          `Dialogue: 0,${assTime(start)},${assTime(end)},Default,,0,0,0,,${intro}${text}`
        )
      }
    }
  }

  return lines.join('\n') + '\n'
}

function renderLine(words: Word[], activeIdx: number, primary: string, highlight: string): string {
  return words
    .map((w, idx) => {
      const text = escapeAssText(w.text.toUpperCase())
      if (idx === activeIdx) return `{\\c${highlight}\\fscx108\\fscy108}${text}{\\r}{\\c${primary}}`
      return `{\\c${primary}}${text}`
    })
    .join(' ')
}
