type Props = {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export default function PageShell({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 text-center mb-8">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
