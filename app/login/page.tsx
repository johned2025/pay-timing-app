'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { sendOtp } from '@/app/actions'
import PageShell from '@/components/ui/PageShell'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await sendOtp(email, inviteCode)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setSent(true)
  }

  return (
    <PageShell title="TimePay" subtitle="Track your work hours">
      {sent ? (
        <div className="text-center space-y-2">
          <p className="font-medium text-gray-900">Check your email</p>
          <p className="text-sm text-gray-500">
            We sent a sign-in link to <strong>{email}</strong>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Invite code"
            type="text"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            placeholder="Enter invite code"
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send link'}
          </Button>
        </form>
      )}
    </PageShell>
  )
}
