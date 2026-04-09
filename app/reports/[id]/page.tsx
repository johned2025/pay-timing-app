'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'

type Report = {
  id: string
  total_hours: number
  total_pay: number
  status: string
  created_at: string
}

type Entry = {
  id: string
  started_at: string
  stopped_at: string | null
  duration_minutes: number | null
  hourly_rate: number
}

type Session = {
  id: string
  started_at: string
  total_hours: number | null
  total_pay: number | null
  status: string
  entries: Entry[]
}

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: authSession } }) => {
      if (!authSession) { router.replace('/login'); return }
      await loadData()
    })
  }, [router, id])

  async function loadData() {
    setLoading(true)

    const { data: reportData } = await supabase
      .from('reports')
      .select('id, total_hours, total_pay, status, created_at')
      .eq('id', id)
      .single()

    if (!reportData) { router.replace('/reports'); return }
    setReport(reportData)

    const { data: reportSessions } = await supabase
      .from('report_sessions')
      .select('work_sessions(id, started_at, total_hours, total_pay, status)')
      .eq('report_id', id)

    const sessionList: Session[] = []
    for (const rs of reportSessions ?? []) {
      const ws = rs.work_sessions as unknown as Omit<Session, 'entries'>
      const { data: entries } = await supabase
        .from('work_entries')
        .select('id, started_at, stopped_at, duration_minutes, hourly_rate')
        .eq('session_id', ws.id)
        .order('started_at', { ascending: true })
      sessionList.push({ ...ws, entries: entries ?? [] })
    }

    sessionList.sort((a, b) => a.started_at.localeCompare(b.started_at))
    setSessions(sessionList)
    setLoading(false)
  }

  async function markAllPaid() {
    setMarkingPaid(true)
    await supabase
      .from('work_sessions')
      .update({ status: 'paid' })
      .in('id', sessions.map(s => s.id))
    await loadData()
    setMarkingPaid(false)
  }

  function buildPlainText(): string {
    if (!report) return ''
    const lines: string[] = []
    lines.push(`Report — ${formatDate(report.created_at)}`)
    lines.push(`Total: ${grandHours.toFixed(1)}h  $${grandTotal.toFixed(2)}`)
    lines.push('')
    for (const session of sessions) {
      lines.push(`Session: ${formatDate(session.started_at)}`)
      for (const entry of session.entries) {
        const start = formatTime(entry.started_at)
        const end = entry.stopped_at ? formatTime(entry.stopped_at) : '—'
        const dur = entry.duration_minutes ? formatDuration(entry.duration_minutes) : '—'
        const earn = entry.duration_minutes
          ? ((entry.duration_minutes / 60) * entry.hourly_rate).toFixed(2)
          : '0.00'
        lines.push(`  ${start} – ${end}  (${dur})  @$${entry.hourly_rate}/hr  $${earn}`)
      }
      lines.push(`  Subtotal: ${(session.total_hours ?? 0).toFixed(1)}h  $${(session.total_pay ?? 0).toFixed(2)}`)
      lines.push('')
    }
    return lines.join('\n').trim()
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(buildPlainText()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  }

  function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const grandTotal = sessions.reduce((sum, s) => sum + (s.total_pay ?? 0), 0)
  const grandHours = sessions.reduce((sum, s) => sum + (s.total_hours ?? 0), 0)
  const allPaid = sessions.length > 0 && sessions.every(s => s.status === 'paid')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      {/* header */}
      <div className="bg-white px-4 pt-8 pb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Report</h1>
        </div>
        <p className="text-sm text-gray-500 ml-8">{formatDate(report!.created_at)}</p>
      </div>

      {/* sessions */}
      <div className="space-y-4 px-4 mt-4">
        {sessions.map(session => (
          <div key={session.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* session date */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">{formatDate(session.started_at)}</p>
            </div>

            {/* entries */}
            {session.entries.map(entry => {
              const earnings = entry.duration_minutes
                ? ((entry.duration_minutes / 60) * entry.hourly_rate).toFixed(2)
                : '0.00'
              return (
                <div key={entry.id} className="px-4 py-3 border-b border-gray-100 flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-900">
                      {formatTime(entry.started_at)} – {entry.stopped_at ? formatTime(entry.stopped_at) : '—'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {entry.duration_minutes ? formatDuration(entry.duration_minutes) : '—'} @ ${entry.hourly_rate}/hr
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">${earnings}</p>
                </div>
              )
            })}

            {/* session subtotal */}
            <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Subtotal</p>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">${(session.total_pay ?? 0).toFixed(2)}</p>
                <p className="text-xs text-gray-400">{(session.total_hours ?? 0).toFixed(1)}h</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* grand total */}
      <div className="mx-4 mt-4 bg-black text-white rounded-xl px-4 py-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Grand total</p>
          <p className="text-sm text-gray-300 mt-0.5">{grandHours.toFixed(1)} hours</p>
        </div>
        <p className="text-2xl font-bold">${grandTotal.toFixed(2)}</p>
      </div>

      {/* actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 space-y-2">
        <button
          onClick={copyToClipboard}
          className="w-full border border-gray-300 text-gray-700 rounded-lg py-3 font-medium text-sm"
        >
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </button>
        {allPaid ? (
          <p className="text-center text-sm text-green-600 font-medium py-1">All sessions marked as paid</p>
        ) : (
          <Button onClick={markAllPaid} disabled={markingPaid}>
            {markingPaid ? 'Marking as paid...' : 'Mark all as paid'}
          </Button>
        )}
      </div>
    </div>
  )
}
