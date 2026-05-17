import type { Scene, SubtitleSettings, SubtitleStyleId, Word } from '../../../shared/types'
import { hormoziStyle } from './hormozi'
import { karaokeStyle } from './karaoke'
import { singleXxlStyle } from './single-xxl'
import { rollingStyle } from './rolling'
import { classicStyle } from './classic'
import { buildAssHeader } from '../ass-builder'

export type StyleFn = (scenes: Scene[], settings: SubtitleSettings) => string

const styles: Record<SubtitleStyleId, StyleFn> = {
  hormozi: hormoziStyle,
  karaoke: karaokeStyle,
  'single-xxl': singleXxlStyle,
  rolling: rollingStyle,
  classic: classicStyle
}

export function buildAss(scenes: Scene[], settings: SubtitleSettings): string {
  const header = buildAssHeader(settings)
  const events = styles[settings.styleId](scenes, settings)
  return header + events
}

export function flattenWords(scenes: Scene[]): Word[] {
  return scenes.flatMap((s) => s.words)
}
