import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { join } from 'path'
import { searchPexelsVideo } from '../api/pexels'
import { searchPixabayVideo } from '../api/pixabay'
import type { Scene } from '../../shared/types'

const FALLBACK_QUERIES = ['city', 'nature', 'people walking', 'abstract', 'lifestyle']

export async function fetchBrolls(opts: {
  scenes: Scene[]
  pexelsKey: string
  pixabayKey: string
  tempDir: string
  onProgress: (current: number, total: number) => void
}): Promise<Scene[]> {
  const result: Scene[] = []
  const concurrency = 3
  let completed = 0

  const tasks = opts.scenes.map((scene, idx) => async () => {
    const query = scene.keywordsEn.join(' ') || FALLBACK_QUERIES[idx % FALLBACK_QUERIES.length]
    const clipPath = join(opts.tempDir, `clip_${String(idx).padStart(3, '0')}.mp4`)

    const match =
      (await safeSearch(() => searchPexelsVideo(opts.pexelsKey, query, scene.duration))) ??
      (opts.pixabayKey
        ? await safeSearch(() => searchPixabayVideo(opts.pixabayKey, query, scene.duration))
        : null) ??
      (await safeSearch(() =>
        searchPexelsVideo(opts.pexelsKey, FALLBACK_QUERIES[idx % FALLBACK_QUERIES.length], scene.duration)
      ))

    if (match) {
      await downloadFile(match.url, clipPath)
      result[idx] = { ...scene, clipPath }
    } else {
      result[idx] = { ...scene, clipPath: undefined }
    }
    completed++
    opts.onProgress(completed, opts.scenes.length)
  })

  for (let i = 0; i < tasks.length; i += concurrency) {
    await Promise.all(tasks.slice(i, i + concurrency).map((t) => t()))
  }

  return result
}

async function safeSearch<T>(fn: () => Promise<T | null>): Promise<T | null> {
  try {
    return await fn()
  } catch (err) {
    console.error('[broll search]', err)
    return null
  }
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`Download ${url} failed: ${res.status}`)
  const nodeStream = Readable.fromWeb(res.body as never)
  await pipeline(nodeStream, createWriteStream(dest))
}
