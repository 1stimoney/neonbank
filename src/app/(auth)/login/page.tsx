'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast, Toaster } from 'sonner'
import { Mail, Lock, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const router = useRouter()

  const [tab, setTab] = useState<'password' | 'code'>('password')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)

  const [loading, setLoading] = useState(false)

  const canPasswordSignIn = email.trim() && password.trim()
  const canSendCode = email.trim()
  const canVerifyCode = email.trim() && code.trim().length >= 6

  const signInWithPassword = async () => {
    if (!canPasswordSignIn) return toast.error('Enter email and password.')

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error
      if (!data.session) {
        // Rare, but handle gracefully
        toast('Signed in. Completing verification…')
      }

      toast.success('Welcome back.')
      const params = new URLSearchParams(window.location.search)
      const next = params.get('next') || '/dashboard'
      router.replace(next)
    } catch (e: any) {
      // Keep it simple and user-friendly
      toast.error(e?.message ?? 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const sendCode = async () => {
    if (!canSendCode) return toast.error('Enter your email.')

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false, // IMPORTANT: returning users only
        },
      })

      if (error) throw error

      setCodeSent(true)
      toast.success('Verification code sent to your email.')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not send code')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    if (!canVerifyCode) return toast.error('Enter the 6-digit code.')

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
      })

      if (error) throw error
      if (!data.session) throw new Error('Could not create session.')

      toast.success('Verified. Signed in.')
      const params = new URLSearchParams(window.location.search)
      const next = params.get('next') || '/dashboard'
      router.replace(next)
    } catch (e: any) {
      toast.error(e?.message ?? 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='relative min-h-[calc(100vh-0px)] bg-zinc-50'>
      <Toaster richColors />

      {/* Background glow */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl' />
        <div className='absolute -right-24 top-24 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl' />
      </div>

      <div className='relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6'>
        <div className='w-full max-w-md space-y-4'>
          {/* Brand header */}
          <div className='space-y-1 text-center'>
            <div className='mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-zinc-900 text-white shadow-sm'>
              <ShieldCheck className='h-5 w-5' />
            </div>
            <h1 className='mt-3 text-2xl font-semibold tracking-tight text-zinc-900'>
              Sign in
            </h1>
            <p className='text-sm text-zinc-500'>
              Use password or verify with a code.
            </p>
          </div>

          <Card className='rounded-3xl border shadow-sm'>
            <CardHeader>
              <CardTitle className='text-base text-zinc-900'>
                Account access
              </CardTitle>
            </CardHeader>

            <CardContent className='space-y-5'>
              {/* Email always visible */}
              <div className='grid gap-2'>
                <Label>Email</Label>
                <div className='relative'>
                  <Mail className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
                  <Input
                    className='rounded-2xl bg-white pl-9'
                    placeholder='you@example.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete='email'
                    inputMode='email'
                  />
                </div>
              </div>

              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as any)}
                className='w-full'
              >
                <TabsList className='grid w-full grid-cols-2 rounded-2xl'>
                  <TabsTrigger value='password' className='rounded-2xl'>
                    Password
                  </TabsTrigger>
                  <TabsTrigger value='code' className='rounded-2xl'>
                    Code
                  </TabsTrigger>
                </TabsList>

                {/* Password tab */}
                <TabsContent value='password' className='mt-4 space-y-4'>
                  <div className='grid gap-2'>
                    <Label>Password</Label>
                    <div className='relative'>
                      <Lock className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
                      <Input
                        className='rounded-2xl bg-white pl-9'
                        type='password'
                        placeholder='••••••••'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete='current-password'
                      />
                    </div>
                  </div>

                  <Button
                    className='w-full rounded-2xl'
                    onClick={signInWithPassword}
                    disabled={loading || !canPasswordSignIn}
                  >
                    Sign in
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>

                  <p className='text-xs text-zinc-500'>
                    If you can’t sign in on a new device, switch to{' '}
                    <span className='font-medium'>Code</span>.
                  </p>
                </TabsContent>

                {/* Code tab */}
                <TabsContent value='code' className='mt-4 space-y-4'>
                  <div className='rounded-2xl border bg-zinc-50 p-4'>
                    <p className='text-sm font-medium text-zinc-900'>
                      Email verification
                    </p>
                    <p className='mt-1 text-xs text-zinc-500'>
                      We’ll send a 6-digit code to your email. Enter it below to
                      sign in.
                    </p>
                  </div>

                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      className='w-full rounded-2xl bg-white'
                      onClick={sendCode}
                      disabled={loading || !canSendCode}
                    >
                      Send code
                    </Button>

                    <Button
                      type='button'
                      className='w-full rounded-2xl'
                      onClick={() => {
                        if (!codeSent) return toast('Send the code first.')
                        verifyCode()
                      }}
                      disabled={loading || !canVerifyCode || !codeSent}
                    >
                      Verify
                      <KeyRound className='ml-2 h-4 w-4' />
                    </Button>
                  </div>

                  <div className='grid gap-2'>
                    <Label>Verification code</Label>
                    <Input
                      className='rounded-2xl bg-white'
                      placeholder='123456'
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      inputMode='numeric'
                    />
                    <p className='text-xs text-zinc-500'>
                      {codeSent
                        ? 'Code sent. Check your inbox (and spam).'
                        : 'Tap “Send code” to receive a code.'}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className='flex items-center justify-between text-sm'>
                <Link
                  href='/auth'
                  className='text-zinc-600 hover:text-zinc-900'
                >
                  Create account
                </Link>
                <button
                  type='button'
                  className='text-zinc-600 hover:text-zinc-900'
                  onClick={() => toast('Add a reset flow when you’re ready.')}
                >
                  Forgot password?
                </button>
              </div>
            </CardContent>
          </Card>

          <p className='text-center text-xs text-zinc-500'>
            Protected by secure sign-in.
          </p>
        </div>
      </div>
    </div>
  )
}
