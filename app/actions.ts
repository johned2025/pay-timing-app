'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function sendOtp(email: string, inviteCode: string) {
  if (inviteCode !== process.env.INVITE_CODE) {
    return { error: 'Invalid invite code' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${appUrl}/auth/callback` },
  })
  if (error) return { error: error.message }

  return { success: true }
}
