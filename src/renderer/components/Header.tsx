import logo from '../assets/logo-inicia.png'

export default function Header({
  title,
  right
}: {
  title: string
  right?: React.ReactNode
}) {
  return (
    <header className="px-6 py-3 border-b border-border flex items-center justify-between bg-bg">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Inicia" className="h-7 w-auto" />
        <div className="h-5 w-px bg-border" />
        <h1 className="text-base font-semibold">{title}</h1>
      </div>
      {right}
    </header>
  )
}
