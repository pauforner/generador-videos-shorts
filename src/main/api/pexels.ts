interface PexelsVideoFile {
  link: string
  width: number
  height: number
  quality: string
  file_type: string
}

interface PexelsVideo {
  id: number
  duration: number
  width: number
  height: number
  video_files: PexelsVideoFile[]
}

interface PexelsResponse {
  videos: PexelsVideo[]
}

export interface BrollMatch {
  url: string
  duration: number
  source: 'pexels' | 'pixabay'
}

export async function searchPexelsVideos(
  apiKey: string,
  query: string,
  minDuration: number
): Promise<BrollMatch[]> {
  const url = new URL('https://api.pexels.com/videos/search')
  url.searchParams.set('query', query)
  url.searchParams.set('orientation', 'portrait')
  url.searchParams.set('size', 'medium')
  url.searchParams.set('per_page', '15')

  const res = await fetch(url.toString(), {
    headers: { Authorization: apiKey }
  })
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as PexelsResponse

  if (!data.videos || data.videos.length === 0) return []

  const sorted = [...data.videos]
    .filter((v) => v.height > v.width)
    .sort((a, b) => {
      const aCovers = a.duration >= minDuration ? 0 : 1
      const bCovers = b.duration >= minDuration ? 0 : 1
      if (aCovers !== bCovers) return aCovers - bCovers
      return b.duration - a.duration
    })

  const matches: BrollMatch[] = []
  for (const v of sorted) {
    const file =
      v.video_files.find((f) => f.quality === 'hd' && f.height >= 1280) ??
      v.video_files.find((f) => f.quality === 'hd') ??
      v.video_files[0]
    if (file) matches.push({ url: file.link, duration: v.duration, source: 'pexels' })
  }
  return matches
}
