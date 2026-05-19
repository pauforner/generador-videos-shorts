import { useEffect, useState } from 'react'
import Setup from './pages/Setup'
import NewVideo from './pages/NewVideo'
import Result from './pages/Result'
import Footer from './components/Footer'
import type { GenerateRequest, GenerateResult } from '../shared/types'

type View = 'loading' | 'setup' | 'editor' | 'result'

export default function App() {
  const [view, setView] = useState<View>('loading')
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [lastRequest, setLastRequest] = useState<GenerateRequest | null>(null)

  useEffect(() => {
    window.api.isConfigured().then((configured) => {
      setView(configured ? 'editor' : 'setup')
    })
  }, [])

  let main: React.ReactNode

  if (view === 'loading') {
    main = <div className="h-full flex items-center justify-center text-muted">Cargando…</div>
  } else if (view === 'setup') {
    main = <Setup onDone={() => setView('editor')} />
  } else if (view === 'result' && result) {
    main = (
      <Result
        result={result}
        onNew={() => {
          setResult(null)
          setLastRequest(null)
          setView('editor')
        }}
        onRegenerate={() => setView('editor')}
        canRegenerate={!!lastRequest}
      />
    )
  } else {
    main = (
      <NewVideo
        initialRequest={lastRequest}
        onGenerated={(req, res) => {
          setLastRequest(req)
          setResult(res)
          setView('result')
        }}
        onOpenSetup={() => setView('setup')}
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col">{main}</div>
      <Footer />
    </div>
  )
}
