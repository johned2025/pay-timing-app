'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageShell from '@/components/ui/PageShell'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function OnboardingPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [name, setName] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) { router.replace('/login'); return }
      setReady(true)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login')
      else setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [router])

  function validate() {
    if (name.trim().length < 2) return 'Name must be at least 2 characters'
    const rate = parseFloat(hourlyRate)
    if (isNaN(rate) || rate <= 0) return 'Enter a valid hourly rate'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      name: name.trim(),
      hourly_rate: parseFloat(hourlyRate),
    })

    setLoading(false)
    if (error) { setError(error.message); return }
    router.replace('/dashboard')
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <PageShell
      title="Set up your profile"
      subtitle="Your preferred rate will pre-fill when you start a new entry. You can always change it."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Your name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Maria Garcia"
          required
        />
        <Input
          label="Preferred hourly rate ($)"
          type="number"
          inputMode="decimal"
          value={hourlyRate}
          onChange={e => setHourlyRate(e.target.value)}
          placeholder="15.00"
          min="0.01"
          step="0.01"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Get started'}
        </Button>
      </form>
    </PageShell>
  )
}
