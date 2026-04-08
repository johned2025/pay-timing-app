'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import HoldButton from '@/components/ui/HoldButton'
import Link from 'next/link'

type Profile = { name: string; hourly_rate: number }
type Session = { id: string; started_at: string }
type Entry = { id: string; started_at: string; stopped_at: string | null; duration_minutes: number | null; hourly_rate: number }

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [activeEntry, setActiveEntry] = useState<Entry | null>(null)
  const [entryRate, setEntryRate] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: authSession } }) => {
      if (!authSession) { router.replace('/login'); return }
      await loadData()
    })
  }, [router])

  // live timer tick
  useEffect(() => {
    if (!activeEntry) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(activeEntry.started_at).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeEntry])

  async function loadData() {
    setLoading(true)

    const { data: prof } = await supabase
      .from('profiles').select('name, hourly_rate').single()
    if (!prof) { router.replace('/onboarding'); return }
    setProfile(prof)
    setEntryRate(String(prof.hourly_rate))

    const { data: openSession } = await supabase
      .from('work_sessions')
      .select('id, started_at')
      .eq('status', 'open')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (openSession) {
      setSession(openSession)

      const { data: sessionEntries } = await supabase
        .from('work_entries')
        .select('id, started_at, stopped_at, duration_minutes, hourly_rate')
        .eq('session_id', openSession.id)
        .order('started_at', { ascending: true })

      const all = sessionEntries ?? []
      setEntries(all)
      const active = all.find(e => !e.stopped_at) ?? null
      setActiveEntry(active)
      if (active) {
        setElapsed(Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000))
      }
    }

    setLoading(false)
  }

  async function startSession() {
    const { data } = await supabase
      .from('work_sessions')
      .insert({ employee_id: (await supabase.auth.getUser()).data.user!.id })
      .select('id, started_at')
      .single()
    if (data) { setSession(data); setEntries([]) }
  }

  async function clockIn() {
    if (!session) return
    const rate = parseFloat(entryRate)
    if (isNaN(rate) || rate <= 0) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('work_entries')
      .insert({ session_id: session.id, employee_id: user!.id, started_at: new Date().toISOString(), hourly_rate: rate })
      .select('id, started_at, stopped_at, duration_minutes, hourly_rate')
      .single()
    if (data) { setActiveEntry(data); setEntries(prev => [...prev, data]) }
  }

  async function clockOut() {
    if (!activeEntry) return
    const stoppedAt = new Date()
    const duration = Math.round((stoppedAt.getTime() - new Date(activeEntry.started_at).getTime()) / 60000)
    const { data } = await supabase
      .from('work_entries')
      .update({ stopped_at: stoppedAt.toISOString(), duration_minutes: duration })
      .eq('id', activeEntry.id)
      .select('id, started_at, stopped_at, duration_minutes, hourly_rate')
      .single()
    if (data) {
      setActiveEntry(null)
      setEntries(prev => prev.map(e => e.id === data.id ? data : e))
    }
  }

  async function submitSession() {
    if (!session) return
    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0)
    const totalHours = totalMinutes / 60
    const totalPay = entries.reduce((sum, e) => sum + ((e.duration_minutes ?? 0) / 60) * e.hourly_rate, 0)
    await supabase
      .from('work_sessions')
      .update({ status: 'submitted', ended_at: new Date().toISOString(), total_hours: totalHours, total_pay: totalPay })
      .eq('id', session.id)
    setSession(null)
    setEntries([])
    setActiveEntry(null)
  }

  function formatElapsed(seconds: number) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    )
  }

  const completedEntries = entries.filter(e => e.stopped_at)
  const totalPay = completedEntries.reduce((sum, e) => sum + ((e.duration_minutes ?? 0) / 60) * e.hourly_rate, 0)

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm mx-auto space-y-6">

        {/* header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">Hello, {profile?.name}</h1>
            <p className="text-sm text-gray-500">
              {session ? 'Session in progress' : 'No active session'}
            </p>
          </div>
          <Link href="/reports" className="text-sm text-gray-500 underline underline-offset-2">
            Reports
          </Link>
        </div>

        {/* no session */}
        {!session && (
          <Button onClick={startSession}>Start new session</Button>
        )}

        {/* active session */}
        {session && (
          <>
            {/* timer */}
            {activeEntry && (
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Clocked in</p>
                <p className="text-4xl font-mono font-bold tracking-tight">{formatElapsed(elapsed)}</p>
                <p className="text-sm text-gray-500 mt-1">@ ${activeEntry.hourly_rate}/hr</p>
              </div>
            )}

            {/* clock in rate input + button */}
            {!activeEntry && (
              <div className="space-y-3">
                <Input
                  label="Hourly rate for this entry ($)"
                  type="number"
                  inputMode="decimal"
                  value={entryRate}
                  onChange={e => setEntryRate(e.target.value)}
                  placeholder="15.00"
                  min="0.01"
                  step="0.01"
                />
                <Button onClick={clockIn}>Clock in</Button>
              </div>
            )}

            {activeEntry && (
              <Button onClick={clockOut} variant="secondary">Clock out</Button>
            )}

            {/* entries list */}
            {completedEntries.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
                {completedEntries.map(entry => (
                  <div key={entry.id} className="px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{formatDuration(entry.duration_minutes!)}</p>
                      <p className="text-xs text-gray-400">@ ${entry.hourly_rate}/hr</p>
                    </div>
                    <p className="text-sm font-medium">
                      ${((entry.duration_minutes! / 60) * entry.hourly_rate).toFixed(2)}
                    </p>
                  </div>
                ))}
                <div className="px-4 py-3 flex justify-between items-center bg-gray-50 rounded-b-xl">
                  <p className="text-sm font-semibold">Total</p>
                  <p className="text-sm font-semibold">${totalPay.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* submit — only if there are completed entries and not clocked in */}
            {completedEntries.length > 0 && !activeEntry && (
              <HoldButton onHoldComplete={submitSession}>Hold to submit session</HoldButton>
            )}
          </>
        )}
      </div>
    </div>
  )
}
