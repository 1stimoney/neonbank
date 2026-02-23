// app/(auth)/layout.tsx
import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className='relative min-h-screen bg-zinc-50'>
      {/* Background glow */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl' />
        <div className='absolute -right-24 top-24 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl' />
      </div>

      {/* Centered auth shell */}
      <div className='relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6'>
        <div className='w-full max-w-md'>{children}</div>
      </div>
    </div>
  )
}
