import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className='min-h-screen bg-white'>
      <div className='mx-auto max-w-5xl px-6 py-16'>
        <div className='rounded-3xl border bg-gradient-to-b from-white to-zinc-50 p-10 shadow-sm'>
          <p className='text-sm text-zinc-500'>NeonBank</p>
          <h1 className='mt-3 text-4xl font-semibold tracking-tight text-zinc-900'>
            Clean fintech UI, built for speed.
          </h1>
          <p className='mt-3 max-w-xl text-zinc-600'>
            Sign in to view your dashboard, investments, withdrawals, and
            profile.
          </p>
          <div className='mt-8 flex gap-3'>
            <Button asChild className='rounded-2xl'>
              <Link href='/auth'>Get started</Link>
            </Button>
            <Button asChild variant='outline' className='rounded-2xl'>
              <Link href='/auth'>Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
