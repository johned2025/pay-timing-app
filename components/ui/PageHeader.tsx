'use client'

import { useRouter } from 'next/navigation'

type Props = {
  title: string
  children?: React.ReactNode
}

export default function PageHeader({ title, children }: Props) {
  const router = useRouter()
  return (
    <div className="bg-white px-4 pt-8 pb-4 shadow-sm">
      <div className={`flex items-center gap-3 ${children ? 'mb-4' : ''}`}>
        <button onClick={() => router.back()} className="text-gray-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="page-title">{title}</h1>
      </div>
      {children}
    </div>
  )
}
