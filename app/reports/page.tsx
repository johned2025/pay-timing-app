'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Session = {
  id: string
  started_at: string
  total_hours: number | null
  total_pay: number | null
  status: string
}

const statusColors: Record<string, string> = {
  submitted:    'bg-yellow-400',
  paid:         'bg-green-400',
  partially_paid: 'bg-blue-400',
  irregular:    'bg-red-400',
}

export default function ReportsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [filtered, setFiltered] = useState<Session[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selecting, setSelecting] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const longPressTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const longPressFired = useRef<Set<string>>(new Set())

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: authSession } }) => {
      if (!authSession) { router.replace('/login'); return }
      const { data } = await supabase
        .from('work_sessions')
        .select('id, started_at, total_hours, total_pay, status')
        .neq('status', 'open')
        .order('started_at', { ascending: false })
      setSessions(data ?? [])
      setFiltered(data ?? [])
      setLoading(false)
    })
  }, [router])

  useEffect(() => {
    let result = sessions
    if (fromDate) result = result.filter(s => s.started_at >= fromDate)
    if (toDate) result = result.filter(s => s.started_at <= toDate + 'T23:59:59')
    setFiltered(result)
  }, [fromDate, toDate, sessions])

  function startLongPress(id: string) {
    const timer = setTimeout(() => {
      longPressFired.current.add(id)
      setSelecting(true)
      setSelected(new Set([id]))
    }, 500)
    longPressTimers.current.set(id, timer)
  }

  function cancelLongPress(id: string) {
    const timer = longPressTimers.current.get(id)
    if (timer) { clearTimeout(timer); longPressTimers.current.delete(id) }
  }

  function handlePointerUp(id: string) {
    cancelLongPress(id)
    if (longPressFired.current.has(id)) { longPressFired.current.delete(id); return }
    if (selecting) {
      setSelected(prev => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        if (next.size === 0) setSelecting(false)
        return next
      })
    } else {
      router.push(`/sessions/${id}`)
    }
  }

  function cancelSelection() {
    setSelecting(false)
    setSelected(new Set())
  }

  async function createReport() {
    setCreating(true)
    const selectedSessions = filtered.filter(s => selected.has(s.id))
    const totalHours = selectedSessions.reduce((sum, s) => sum + (s.total_hours ?? 0), 0)
    const totalPay = selectedSessions.reduce((sum, s) => sum + (s.total_pay ?? 0), 0)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: report } = await supabase
      .from('reports')
      .insert({ employee_id: user!.id, total_hours: totalHours, total_pay: totalPay })
      .select('id')
      .single()

    if (!report) { setCreating(false); return }

    await supabase.from('report_sessions').insert(
      selectedSessions.map(s => ({ report_id: report.id, session_id: s.id }))
    )

    router.push(`/reports/${report.id}`)
  }

  const selectedSessions = filtered.filter(s => selected.has(s.id))
  const selectionHours = selectedSessions.reduce((sum, s) => sum + (s.total_hours ?? 0), 0)
  const selectionPay = selectedSessions.reduce((sum, s) => sum + (s.total_pay ?? 0), 0)

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* header */}
      <div className="bg-white px-4 pt-8 pb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">Sessions</h1>
          </div>
          {selecting && (
            <button onClick={cancelSelection} className="text-sm text-gray-500">Cancel</button>
          )}
        </div>

        {/* date filter */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
      </div>

      {/* list */}
      <div className="divide-y divide-gray-100 bg-white mt-2">
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">No sessions found</p>
        )}
        {filtered.map(session => (
          <div
            key={session.id}
            onPointerDown={() => startLongPress(session.id)}
            onPointerUp={() => handlePointerUp(session.id)}
            onPointerLeave={() => cancelLongPress(session.id)}
            onContextMenu={e => e.preventDefault()}
            className={`flex items-center px-4 py-4 gap-3 cursor-pointer select-none ${selected.has(session.id) ? 'bg-blue-50' : 'active:bg-gray-50'}`}
          >
            {selecting ? (
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected.has(session.id) ? 'bg-black border-black' : 'border-gray-300'}`}>
                {selected.has(session.id) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            ) : (
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColors[session.status] ?? 'bg-gray-300'}`} />
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{formatDate(session.started_at)}</p>
              <p className="text-xs text-gray-500">{(session.total_hours ?? 0).toFixed(1)}h</p>
            </div>

            <p className="text-sm font-semibold text-gray-900">${(session.total_pay ?? 0).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* legend */}
      {!selecting && (
        <div className="flex gap-4 px-4 mt-4 flex-wrap">
          {(['submitted', 'paid', 'partially_paid', 'irregular'] as const).map(status => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
              <span className="text-xs text-gray-500 capitalize">{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* bottom bar */}
      {selecting && selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{selected.size} session{selected.size > 1 ? 's' : ''}</span>
            <span className="font-semibold">{selectionHours.toFixed(1)}h · ${selectionPay.toFixed(2)}</span>
          </div>
          <button
            onClick={createReport}
            disabled={creating}
            className="w-full bg-black text-white rounded-lg py-3 font-medium disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create report'}
          </button>
        </div>
      )}
    </div>
  )
}
