import { supabaseServer } from '@/lib/supabase/server'
import { initials } from '@/lib/format'
import Link from 'next/link'
import { Button } from './ui/button'

export default async function Topbar() {
  const supabase = await supabaseServer()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  let profile: any = null
  if (user) {
    const { data: p } = await supabase
      .from('profiles')
      .select('first_name,last_name')
      .eq('id', user.id)
      .maybeSingle()
    profile = p
  }

  async function signOut() {
    'use server'
    const supabase = await supabaseServer()
    await supabase.auth.signOut()
  }

  return (
    <header className='sticky top-0 z-20 border-b bg-white/80 backdrop-blur'>
      <div className='mx-auto flex max-w-6xl items-center justify-between px-6 py-4'>
        <Link
          href={user ? '/dashboard' : '/'}
          className='text-sm font-medium text-zinc-900'
        >
          NeonBank
        </Link>

        <div className='flex items-center gap-3'>
          {user ? (
            <>
              <div className='flex items-center gap-2 rounded-2xl border bg-white px-3 py-2'>
                <div className='grid h-7 w-7 place-items-center rounded-xl bg-zinc-900 text-xs font-semibold text-white'>
                  {initials(profile?.first_name, profile?.last_name)}
                </div>
                <span className='text-sm text-zinc-700'>
                  {profile?.first_name ?? 'User'}
                </span>
              </div>

              <form action={signOut}>
                <Button type='submit' variant='outline' className='rounded-2xl'>
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Button asChild className='rounded-2xl'>
              <Link href='/login'>Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
