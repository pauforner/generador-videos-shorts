import type { SubtitleSettings } from '../../shared/types'

const SAMPLE_WORDS = ['Esto', 'es', 'una', 'demo', 'del', 'estilo', 'de', 'subtítulos']

export default function SubtitlePreview({ settings }: { settings: SubtitleSettings }) {
  return (
    <div
      className="relative rounded-lg bg-black overflow-hidden mx-auto"
      style={{ aspectRatio: '9 / 16', height: '60vh' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[80%] text-center"
        style={{
          top:
            settings.position === 'center'
              ? '50%'
              : settings.position === 'lower-third'
                ? '66%'
                : '85%',
          transform: 'translate(-50%, -50%)',
          fontFamily:
            settings.font === 'Anton'
              ? 'Anton, Impact, sans-serif'
              : settings.font === 'Inter Black'
                ? '"Inter", sans-serif'
                : '"Montserrat", sans-serif',
          fontWeight: 900,
          textShadow: '0 4px 14px rgba(0,0,0,0.85)'
        }}
      >
        {renderPreview(settings)}
      </div>
    </div>
  )
}

function renderPreview(settings: SubtitleSettings): JSX.Element {
  const size = sizeFor(settings.size)
  switch (settings.styleId) {
    case 'hormozi':
      return (
        <div style={{ fontSize: size, lineHeight: 1.05, letterSpacing: '0.02em' }}>
          <span style={{ color: settings.primaryColor }}>DEMO </span>
          <span style={{ color: settings.highlightColor }}>ESTILO</span>
        </div>
      )
    case 'karaoke':
      return (
        <div
          style={{
            fontSize: size * 0.7,
            lineHeight: 1.1,
            color: settings.primaryColor
          }}
        >
          {SAMPLE_WORDS.slice(0, 4).map((w, i) => (
            <span key={i} style={i === 2 ? { color: settings.highlightColor } : undefined}>
              {w + ' '}
            </span>
          ))}
        </div>
      )
    case 'single-xxl':
      return (
        <div
          style={{
            fontSize: size * 1.4,
            color: settings.primaryColor,
            lineHeight: 1
          }}
        >
          DEMO
        </div>
      )
    case 'rolling':
      return (
        <div style={{ fontSize: size * 0.75, color: settings.primaryColor, opacity: 0.7 }}>
          <span style={{ opacity: 0.4 }}>una </span>
          <span style={{ color: settings.highlightColor, opacity: 1 }}>demo </span>
          <span style={{ opacity: 0.4 }}>del</span>
        </div>
      )
    case 'classic':
      return (
        <div
          style={{
            fontSize: size * 0.5,
            color: settings.primaryColor,
            fontWeight: 600,
            lineHeight: 1.3
          }}
        >
          Esto es una demo del estilo de subtítulos.
        </div>
      )
  }
}

function sizeFor(size: SubtitleSettings['size']): number {
  switch (size) {
    case 'S': return 28
    case 'M': return 38
    case 'L': return 52
    case 'XL': return 72
  }
}
