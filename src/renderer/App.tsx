import { useEffect, useState } from 'react'
import Setup from './pages/Setup'
import NewVideo from './pages/NewVideo'
import Result from './pages/Result'
import type { GenerateResult } from '../shared/types'

type View = 'loading' | 'setup' | 'editor' | 'result'

export default function App() {
  const [view, setView] = useState<View>('loading')
  const [result, setResult] = useState<GenerateResult | null>(null)

  useEffect(() => {
    window.api.isConfigured().then((configured) => {
      setView(configured ? 'editor' : 'setup')
    })
  }, [])

  if (view === 'loading') {
    return <div className="h-full flex items-center justify-center text-muted">Cargando…</div>
  }

  if (view === 'setup') {
    return <Setup onDone={() => setView('editor')} />
  }

  if (view === 'result' && result) {
    return (
      <Result
        result={result}
        onNew={() => {
          setResult(null)
          setView('editor')
        }}
      />
    )
  }

  return (
    <NewVideo
      onGenerated={(r) => {
        setResult(r)
        setView('result')
      }}
      onOpenSetup={() => setView('setup')}
    />
  )
}
