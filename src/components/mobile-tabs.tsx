'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Wallet,
  ArrowDownToLine,
  User,
  Shield,
} from 'lucide-react'

const tabs = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/invest', label: 'Invest', icon: Wallet },
  { href: '/withdraw', label: 'Withdraw', icon: ArrowDownToLine },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function MobileTabs({ showAdmin }: { showAdmin?: boolean }) {
  const pathname = usePathname()

  return (
    <div className='fixed bottom-0 left-0 right-0 z-50 md:hidden'>
      <div className='mx-auto max-w-6xl px-4 pb-[env(safe-area-inset-bottom)]'>
        <div className='mb-3 rounded-3xl border bg-white/85 backdrop-blur shadow-sm'>
          <div
            className={cn('grid', showAdmin ? 'grid-cols-5' : 'grid-cols-4')}
          >
            {tabs.map((t) => {
              const active = pathname.startsWith(t.href)
              const Icon = t.icon
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 py-3 text-xs transition',
                    active ? 'text-zinc-900' : 'text-zinc-500'
                  )}
                >
                  <div
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-2xl transition',
                      active
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-700'
                    )}
                  >
                    <Icon className='h-4 w-4' />
                  </div>
                  <span className={cn(active ? 'font-medium' : '')}>
                    {t.label}
                  </span>
                </Link>
              )
            })}

            {showAdmin && (
              <Link
                href='/admin'
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-3 text-xs transition',
                  pathname.startsWith('/admin')
                    ? 'text-zinc-900'
                    : 'text-zinc-500'
                )}
              >
                <div
                  className={cn(
                    'grid h-9 w-9 place-items-center rounded-2xl transition',
                    pathname.startsWith('/admin')
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-700'
                  )}
                >
                  <Shield className='h-4 w-4' />
                </div>
                <span
                  className={cn(
                    pathname.startsWith('/admin') ? 'font-medium' : ''
                  )}
                >
                  Admin
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
