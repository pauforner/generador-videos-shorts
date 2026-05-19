import type { SubtitleSettings, SubtitleSize, SubtitlePosition } from '../../shared/types'

export const VIDEO_W = 1080
export const VIDEO_H = 1920

export function fontSizeFor(size: SubtitleSize): number {
  switch (size) {
    case 'S': return 64
    case 'M': return 84
    case 'L': return 110
    case 'XL': return 150
  }
}

export function yPositionFor(position: SubtitlePosition): number {
  switch (position) {
    case 'upper-third': return Math.round(VIDEO_H * 0.33)
    case 'center': return Math.round(VIDEO_H * 0.5)
    case 'lower-third': return Math.round(VIDEO_H * 0.66)
  }
}

export function toAssColor(hex: string): string {
  const clean = hex.replace('#', '')
  const r = clean.slice(0, 2)
  const g = clean.slice(2, 4)
  const b = clean.slice(4, 6)
  return `&H00${b.toUpperCase()}${g.toUpperCase()}${r.toUpperCase()}`
}

export function assTime(seconds: number): string {
  if (seconds < 0) seconds = 0
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours}:${String(minutes).padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`
}

export function escapeAssText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}')
}

export function buildAssHeader(settings: SubtitleSettings): string {
  const fontSize = fontSizeFor(settings.size)
  const primary = toAssColor(settings.primaryColor)
  const outline = '&H00000000'
  const shadow = '&H80000000'

  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${VIDEO_W}
PlayResY: ${VIDEO_H}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${settings.font},${fontSize},${primary},${primary},${outline},${shadow},1,0,0,0,100,100,0,0,1,6,2,5,40,40,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`
}
