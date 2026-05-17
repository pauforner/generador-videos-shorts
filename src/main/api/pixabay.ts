import type { BrollMatch } from './pexels'

interface PixabayVideoVariant {
  url: string
  width: number
  height: number
}

interface PixabayVideo {
  id: number
  duration: number
  videos: {
    large?: PixabayVideoVariant
    medium?: PixabayVideoVariant
    small?: PixabayVideoVariant
    tiny?: PixabayVideoVariant
  }
}

interface PixabayResponse {
  hits: PixabayVideo[]
}

export async function searchPixabayVideo(
  apiKey: string,
  query: string,
  minDuration: number
): Promise<BrollMatch | null> {
  if (!apiKey) return null

  const url = new URL('https://pixabay.com/api/videos/')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('q', query)
  url.searchParams.set('video_type', 'film')
  url.searchParams.set('per_page', '20')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Pixabay ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as PixabayResponse

  if (!data.hits || data.hits.length === 0) return null

  const portrait = data.hits.filter((v) => {
    const variant = v.videos.large ?? v.videos.medium
    return variant && variant.height > variant.width
  })

  const pool = portrait.length > 0 ? portrait : data.hits

  const chosen = pool
    .sort((a, b) => {
      const aCovers = a.duration >= minDuration ? 0 : 1
      const bCovers = b.duration >= minDuration ? 0 : 1
      if (aCovers !== bCovers) return aCovers - bCovers
      return b.duration - a.duration
    })[0]

  if (!chosen) return null

  const variant = chosen.videos.large ?? chosen.videos.medium ?? chosen.videos.small
  if (!variant) return null

  return { url: variant.url, duration: chosen.duration, source: 'pixabay' }
}
