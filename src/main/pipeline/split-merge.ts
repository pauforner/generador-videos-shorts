import type { ClipLengthSettings, Scene, Word } from '../../shared/types'

export function applyClipLength(scenes: Scene[], settings: ClipLengthSettings): Scene[] {
  const merged = mergeShort(scenes, settings)
  const split = splitLong(merged, settings)
  return split
}

function mergeShort(scenes: Scene[], settings: ClipLengthSettings): Scene[] {
  const result: Scene[] = []
  let i = 0
  while (i < scenes.length) {
    let current = scenes[i]
    while (
      current.duration < settings.minSec &&
      i + 1 < scenes.length &&
      current.duration + scenes[i + 1].duration <= settings.maxSec
    ) {
      const next = scenes[i + 1]
      current = {
        text: `${current.text} ${next.text}`.trim(),
        keywordsEn: dedupe([...current.keywordsEn, ...next.keywordsEn]).slice(0, 3),
        start: current.start,
        end: next.end,
        duration: next.end - current.start,
        words: [...current.words, ...next.words]
      }
      i++
    }
    result.push(current)
    i++
  }
  return result
}

function splitLong(scenes: Scene[], settings: ClipLengthSettings): Scene[] {
  const result: Scene[] = []
  for (const scene of scenes) {
    if (scene.duration <= settings.maxSec) {
      result.push(scene)
      continue
    }
    const parts = Math.ceil(scene.duration / settings.maxSec)
    const partDuration = scene.duration / parts
    for (let p = 0; p < parts; p++) {
      const subStart = scene.start + p * partDuration
      const subEnd = p === parts - 1 ? scene.end : scene.start + (p + 1) * partDuration
      const subWords: Word[] = scene.words.filter(
        (w) => w.start >= subStart - 0.01 && w.end <= subEnd + 0.01
      )
      result.push({
        text: scene.text,
        keywordsEn: scene.keywordsEn,
        start: subStart,
        end: subEnd,
        duration: subEnd - subStart,
        words: subWords
      })
    }
  }
  return result
}

function dedupe(arr: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of arr) {
    const key = item.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      out.push(item)
    }
  }
  return out
}
