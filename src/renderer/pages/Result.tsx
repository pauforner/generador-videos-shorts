import type { GenerateResult } from '../../shared/types'

export default function Result({
  result,
  onNew
}: {
  result: GenerateResult
  onNew: () => void
}) {
  const fileUrl = `file://${result.videoPath}`

  return (
    <div className="h-full flex flex-col">
      <header className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold">Vídeo generado</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center gap-8">
        <video
          src={fileUrl}
          controls
          autoPlay
          loop
          className="rounded-lg bg-black"
          style={{ aspectRatio: '9 / 16', height: '70vh' }}
        />
        <div className="space-y-3 max-w-sm">
          <div className="card">
            <div className="text-xs text-muted">Duración</div>
            <div className="text-lg font-semibold">
              {Math.round(result.durationSeconds)}s
            </div>
          </div>
          <div className="card">
            <div className="text-xs text-muted mb-1">Ruta</div>
            <div className="text-xs font-mono break-all">{result.videoPath}</div>
          </div>
          <button
            className="btn-primary w-full"
            onClick={() => window.api.showInFolder(result.videoPath)}
          >
            Mostrar en Finder/Explorer
          </button>
          <button
            className="btn-ghost w-full"
            onClick={() => window.api.openPath(result.videoPath)}
          >
            Abrir vídeo
          </button>
          <button className="btn-ghost w-full" onClick={onNew}>
            Nuevo vídeo
          </button>
        </div>
      </div>
    </div>
  )
}
