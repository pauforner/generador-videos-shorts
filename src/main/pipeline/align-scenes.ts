import type { Scene, Word } from '../../shared/types'
import type { AnalyzedScene } from '../api/llm'

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function alignScenes(analyzed: AnalyzedScene[], words: Word[]): Scene[] {
  const scenes: Scene[] = []
  let wordIdx = 0

  for (const a of analyzed) {
    const sceneTokens = normalize(a.text).split(' ').filter(Boolean)
    if (sceneTokens.length === 0) continue

    const sceneWords: Word[] = []
    let matched = 0
    const startIdx = wordIdx

    while (wordIdx < words.length && matched < sceneTokens.length) {
      const w = words[wordIdx]
      const wn = normalize(w.text)
      if (wn && wn === sceneTokens[matched]) {
        sceneWords.push(w)
        matched++
        wordIdx++
      } else if (wn) {
        sceneWords.push(w)
        wordIdx++
      } else {
        wordIdx++
      }
    }

    if (sceneWords.length === 0) {
      const fallbackEnd = Math.min(startIdx + sceneTokens.length, words.length)
      for (let i = startIdx; i < fallbackEnd; i++) sceneWords.push(words[i])
      wordIdx = fallbackEnd
    }

    if (sceneWords.length === 0) continue

    const start = sceneWords[0].start
    const end = sceneWords[sceneWords.length - 1].end
    scenes.push({
      text: a.text,
      keywordsEn: a.keywords_en,
      start,
      end,
      duration: Math.max(0.5, end - start),
      words: sceneWords
    })
  }

  if (wordIdx < words.length) {
    const remaining = words.slice(wordIdx)
    if (scenes.length > 0) {
      const last = scenes[scenes.length - 1]
      const mergedWords = [...last.words, ...remaining]
      const newEnd = remaining[remaining.length - 1].end
      scenes[scenes.length - 1] = {
        ...last,
        words: mergedWords,
        end: newEnd,
        duration: Math.max(0.5, newEnd - last.start)
      }
    } else {
      const start = remaining[0].start
      const end = remaining[remaining.length - 1].end
      scenes.push({
        text: remaining.map((w) => w.text).join(' '),
        keywordsEn: ['lifestyle'],
        start,
        end,
        duration: Math.max(0.5, end - start),
        words: remaining
      })
    }
  }

  for (let i = 0; i < scenes.length - 1; i++) {
    const nextStart = scenes[i + 1].start
    if (nextStart > scenes[i].end) {
      scenes[i] = {
        ...scenes[i],
        end: nextStart,
        duration: Math.max(0.5, nextStart - scenes[i].start)
      }
    }
  }

  return scenes
}
