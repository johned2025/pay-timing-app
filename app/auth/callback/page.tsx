'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function redirect(session: { user: unknown } | null) {
      if (!session) return
      const { data: profile } = await supabase.from('profiles').select('id').single()
      router.replace(profile ? '/dashboard' : '/onboarding')
    }

    // already logged in when landing here (e.g. clicking magic link again)
    supabase.auth.getSession().then(({ data: { session } }) => redirect(session))

    // normal magic link flow: session arrives via SIGNED_IN event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') redirect(session)
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="body-text">Signing you in...</p>
    </div>
  )
}
