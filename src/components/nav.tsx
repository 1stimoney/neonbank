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

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invest', label: 'Investments', icon: Wallet },
  { href: '/withdraw', label: 'Withdraw', icon: ArrowDownToLine },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function Nav({ showAdmin }: { showAdmin?: boolean }) {
  const pathname = usePathname()

  return (
    <div className='rounded-3xl border bg-white p-3 shadow-sm'>
      <div className='px-3 py-3'>
        <p className='text-sm font-medium text-zinc-900'>NeonBank</p>
        <p className='text-xs text-zinc-500'>Private demo</p>
      </div>

      <div className='space-y-1 px-1 pb-2'>
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition',
                active
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
              )}
            >
              <Icon className='h-4 w-4' />
              {label}
            </Link>
          )
        })}

        {showAdmin && (
          <Link
            href='/admin'
            className={cn(
              'mt-2 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition',
              pathname.startsWith('/admin')
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-700 hover:bg-zinc-100'
            )}
          >
            <Shield className='h-4 w-4' />
            Admin
          </Link>
        )}
      </div>
    </div>
  )
}
