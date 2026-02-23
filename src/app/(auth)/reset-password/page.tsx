'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast, Toaster } from 'sonner'
import { Lock, ShieldCheck } from 'lucide-react'

export default function ResetPasswordPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const router = useRouter()

  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // When user clicks the email link, Supabase sets a recovery session.
    // We can confirm if there's a user/session.
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      setReady(!!data.session)
    })()
  }, [supabase])

  const canSubmit = password.trim().length >= 8 && password === confirm

  const updatePassword = async () => {
    if (!canSubmit) {
      if (password !== confirm) return toast.error('Passwords do not match.')
      return toast.error('Password must be at least 8 characters.')
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      toast.success('Password updated. Please sign in.')
      await supabase.auth.signOut()
      router.replace('/login')
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='relative min-h-screen bg-zinc-50'>
      <Toaster richColors />

      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl' />
        <div className='absolute -right-24 top-24 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl' />
      </div>

      <div className='relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6'>
        <div className='w-full max-w-md space-y-4'>
          <div className='space-y-1 text-center'>
            <div className='mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-zinc-900 text-white shadow-sm'>
              <ShieldCheck className='h-5 w-5' />
            </div>
            <h1 className='mt-3 text-2xl font-semibold tracking-tight text-zinc-900'>
              Set a new password
            </h1>
            <p className='text-sm text-zinc-500'>
              Create a strong password to secure your account.
            </p>
          </div>

          <Card className='rounded-3xl border shadow-sm'>
            <CardHeader>
              <CardTitle className='text-base text-zinc-900'>
                Reset password
              </CardTitle>
            </CardHeader>

            <CardContent className='space-y-4'>
              {!ready && (
                <div className='rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-600'>
                  This link may be expired or invalid. Please request a new
                  reset link from the login page.
                </div>
              )}

              <div className='grid gap-2'>
                <Label>New password</Label>
                <div className='relative'>
                  <Lock className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
                  <Input
                    className='rounded-2xl bg-white pl-9'
                    type='password'
                    placeholder='At least 8 characters'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!ready}
                  />
                </div>
              </div>

              <div className='grid gap-2'>
                <Label>Confirm password</Label>
                <Input
                  className='rounded-2xl bg-white'
                  type='password'
                  placeholder='Repeat password'
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={!ready}
                />
              </div>

              <Button
                className='w-full rounded-2xl'
                onClick={updatePassword}
                disabled={!ready || loading || !canSubmit}
              >
                {loading ? 'Updating…' : 'Update password'}
              </Button>

              <p className='text-center text-xs text-zinc-500'>
                You’ll be redirected to sign in after updating.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
