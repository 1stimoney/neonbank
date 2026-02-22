// app/(app)/invest/page.tsx
import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wallet, Plus, TrendingUp, Clock } from 'lucide-react'

function statusVariant(status?: string) {
  const s = (status ?? '').toLowerCase()
  if (s === 'completed') return 'secondary'
  if (s === 'cancelled') return 'destructive'
  return 'outline'
}

export default async function InvestPage() {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user!

  const { data: investments } = await supabase
    .from('investments')
    .select('id,title,amount,status,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const totalInvested =
    investments?.reduce((sum, inv) => sum + Number(inv.amount || 0), 0) ?? 0

  const activeCount =
    investments?.filter((inv) => inv.status?.toLowerCase() === 'active')
      .length ?? 0

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>
            Investments
          </h1>
          <p className='text-sm text-zinc-500'>
            Track and manage your investment positions.
          </p>
        </div>

        <Button asChild className='rounded-2xl'>
          <Link href='/invest/create'>
            <Plus className='mr-2 h-4 w-4' />
            Create investment
          </Link>
        </Button>
      </div>

      {/* Quick stats */}
      <div className='grid gap-3 sm:grid-cols-2'>
        <Card className='rounded-3xl shadow-sm'>
          <CardContent className='flex items-center justify-between p-5'>
            <div>
              <p className='text-xs text-zinc-500'>Total invested</p>
              <p className='mt-1 text-xl font-semibold text-zinc-900'>
                {formatMoney(totalInvested)}
              </p>
            </div>
            <div className='grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-700'>
              <Wallet className='h-5 w-5' />
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-3xl shadow-sm'>
          <CardContent className='flex items-center justify-between p-5'>
            <div>
              <p className='text-xs text-zinc-500'>Active investments</p>
              <p className='mt-1 text-xl font-semibold text-zinc-900'>
                {activeCount}
              </p>
            </div>
            <div className='grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700'>
              <TrendingUp className='h-5 w-5' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action shortcuts */}
      <div className='grid gap-3 sm:grid-cols-3'>
        <Link
          href='/invest/create'
          className='group rounded-2xl border bg-white p-4 transition hover:bg-zinc-50'
        >
          <div className='flex items-center justify-between'>
            <div className='grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-700'>
              <Plus className='h-5 w-5' />
            </div>
          </div>
          <p className='mt-3 text-sm font-medium text-zinc-900'>
            New investment
          </p>
          <p className='mt-1 text-xs text-zinc-500'>
            Choose a plan to purchase
          </p>
        </Link>

        <Link
          href='/dashboard'
          className='group rounded-2xl border bg-white p-4 transition hover:bg-zinc-50'
        >
          <div className='flex items-center justify-between'>
            <div className='grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700'>
              <TrendingUp className='h-5 w-5' />
            </div>
          </div>
          <p className='mt-3 text-sm font-medium text-zinc-900'>
            View dashboard
          </p>
          <p className='mt-1 text-xs text-zinc-500'>Check balance & plan</p>
        </Link>

        <Link
          href='/withdraw'
          className='group rounded-2xl border bg-white p-4 transition hover:bg-zinc-50'
        >
          <div className='flex items-center justify-between'>
            <div className='grid h-10 w-10 place-items-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-700'>
              <Clock className='h-5 w-5' />
            </div>
          </div>
          <p className='mt-3 text-sm font-medium text-zinc-900'>
            Withdraw funds
          </p>
          <p className='mt-1 text-xs text-zinc-500'>Request payout</p>
        </Link>
      </div>

      {/* Investment list */}
      <div className='grid gap-4'>
        {(investments ?? []).map((inv) => (
          <Card key={inv.id} className='rounded-3xl shadow-sm'>
            <CardHeader className='flex-row items-center justify-between space-y-0'>
              <CardTitle className='text-base'>{inv.title}</CardTitle>
              <Badge
                className='rounded-2xl'
                variant={statusVariant(inv.status)}
              >
                {inv.status}
              </Badge>
            </CardHeader>
            <CardContent className='flex items-center justify-between'>
              <p className='text-sm text-zinc-500'>
                {new Date(inv.created_at).toLocaleString()}
              </p>
              <p className='text-sm font-semibold'>
                {formatMoney(Number(inv.amount))}
              </p>
            </CardContent>
          </Card>
        ))}

        {!investments?.length && (
          <Card className='rounded-3xl shadow-sm'>
            <CardContent className='py-10 text-center text-sm text-zinc-500'>
              No investments yet.
              <div className='mt-4'>
                <Button asChild className='rounded-2xl'>
                  <Link href='/invest/create'>
                    Create your first investment
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
