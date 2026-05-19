import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { join } from 'path'
import { searchPexelsVideos, type BrollMatch } from '../api/pexels'
import { searchPixabayVideos } from '../api/pixabay'
import type { Scene } from '../../shared/types'

const FALLBACK_QUERIES = ['city', 'nature', 'people walking', 'abstract', 'lifestyle']

export async function fetchBrolls(opts: {
  scenes: Scene[]
  pexelsKey: string
  pixabayKey: string
  tempDir: string
  onProgress: (current: number, total: number) => void
}): Promise<Scene[]> {
  const result: Scene[] = new Array(opts.scenes.length)
  const used = new Set<string>()
  const cache = new Map<string, BrollMatch[]>()
  let completed = 0

  for (let idx = 0; idx < opts.scenes.length; idx++) {
    const scene = opts.scenes[idx]
    const query =
      scene.keywordsEn.join(' ') || FALLBACK_QUERIES[idx % FALLBACK_QUERIES.length]
    const clipPath = join(opts.tempDir, `clip_${String(idx).padStart(3, '0')}.mp4`)

    const candidates = await getCandidates(
      cache,
      query,
      scene.duration,
      opts.pexelsKey,
      opts.pixabayKey
    )

    const pick =
      candidates.find((c) => !used.has(c.url)) ??
      (await getFallbackCandidate(
        cache,
        idx,
        scene.duration,
        used,
        opts.pexelsKey,
        opts.pixabayKey
      ))

    if (pick) {
      used.add(pick.url)
      try {
        await downloadFile(pick.url, clipPath)
        result[idx] = { ...scene, clipPath }
      } catch (err) {
        console.error('[broll download]', err)
        result[idx] = { ...scene, clipPath: undefined }
      }
    } else {
      result[idx] = { ...scene, clipPath: undefined }
    }

    completed++
    opts.onProgress(completed, opts.scenes.length)
  }

  return result
}

async function getCandidates(
  cache: Map<string, BrollMatch[]>,
  query: string,
  minDuration: number,
  pexelsKey: string,
  pixabayKey: string
): Promise<BrollMatch[]> {
  const cached = cache.get(query)
  if (cached) return cached

  let candidates: BrollMatch[] = []
  try {
    candidates = await searchPexelsVideos(pexelsKey, query, minDuration)
  } catch (err) {
    console.error('[pexels]', err)
  }
  if (candidates.length === 0 && pixabayKey) {
    try {
      candidates = await searchPixabayVideos(pixabayKey, query, minDuration)
    } catch (err) {
      console.error('[pixabay]', err)
    }
  }
  cache.set(query, candidates)
  return candidates
}

async function getFallbackCandidate(
  cache: Map<string, BrollMatch[]>,
  sceneIdx: number,
  minDuration: number,
  used: Set<string>,
  pexelsKey: string,
  pixabayKey: string
): Promise<BrollMatch | null> {
  const fallbackQuery = FALLBACK_QUERIES[sceneIdx % FALLBACK_QUERIES.length]
  const candidates = await getCandidates(
    cache,
    fallbackQuery,
    minDuration,
    pexelsKey,
    pixabayKey
  )
  return candidates.find((c) => !used.has(c.url)) ?? null
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`Download ${url} failed: ${res.status}`)
  const nodeStream = Readable.fromWeb(res.body as never)
  await pipeline(nodeStream, createWriteStream(dest))
}
