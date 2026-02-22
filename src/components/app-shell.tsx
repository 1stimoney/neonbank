import { ReactNode } from 'react'
import Nav from './nav'
import Topbar from './topbar'
import MobileTabs from './mobile-tabs'

export default function AppShell({
  children,
  showAdmin,
}: {
  children: ReactNode
  showAdmin?: boolean
}) {
  return (
    <div className='min-h-screen bg-zinc-50'>
      <Topbar />

      <div className='mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-24 pt-6 sm:px-6 md:grid-cols-[240px_1fr] md:pb-8'>
        {/* Desktop sidebar */}
        <aside className='hidden md:block'>
          <Nav showAdmin={showAdmin} />
        </aside>

        {/* Main */}
        <main className='min-w-0'>{children}</main>
      </div>

      {/* Mobile bottom tabs */}
      <MobileTabs showAdmin={showAdmin} />
    </div>
  )
}
