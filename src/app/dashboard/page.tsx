// app/(app)/dashboard/page.tsx
import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import { formatMoney } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  ArrowDownToLine,
  Wallet,
  User,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Plus,
  Receipt,
} from 'lucide-react'
import { redirect } from 'next/navigation'

function statusBadgeVariant(status?: string) {
  const s = (status ?? '').toLowerCase()
  if (s === 'completed') return 'secondary'
  if (s === 'cancelled') return 'destructive'
  return 'outline'
}

export default async function DashboardPage() {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user!
  if (!auth.user) redirect('/login')

  const { data: balanceRow } = await supabase
    .from('balances')
    .select('amount')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: activePlan } = await supabase
    .from('user_plans')
    .select(
      'id,is_active,started_at,ends_at,plans(name,roi_percent,duration_days)'
    )
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  const { data: investments } = await supabase
    .from('investments')
    .select('id,title,amount,status,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name,kyc_status')
    .eq('id', user.id)
    .maybeSingle()

  const balance = Number(balanceRow?.amount ?? 0)

  // Supabase relation can come back as object or array depending on config
  const plan = (activePlan as any)?.plans?.name
    ? (activePlan as any).plans
    : Array.isArray((activePlan as any)?.plans)
    ? (activePlan as any).plans?.[0]
    : null

  const kyc = (profile?.kyc_status ?? 'unverified').toLowerCase()

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>
            Welcome{profile?.first_name ? `, ${profile.first_name}` : ''}.
          </h1>
          <p className='text-sm text-zinc-500'>Overview + quick actions.</p>
        </div>

        <div className='flex items-center gap-2'>
          <Badge
            className='rounded-2xl'
            variant={kyc === 'verified' ? 'secondary' : 'outline'}
          >
            <ShieldCheck className='mr-1 h-3.5 w-3.5' />
            KYC: {profile?.kyc_status ?? 'unverified'}
          </Badge>
        </div>
      </div>

      {/* Balance hero */}
      <Card className='relative overflow-hidden rounded-3xl border shadow-sm'>
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/12 via-fuchsia-500/10 to-emerald-500/10' />
        <div className='pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl' />
        <div className='pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl' />

        <CardContent className='relative p-6 sm:p-7'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div>
              <p className='text-sm text-zinc-600'>Available balance</p>
              <p className='mt-2 text-4xl font-semibold tracking-tight text-zinc-900'>
                {formatMoney(balance)}
              </p>
              <p className='mt-2 text-xs text-zinc-500'>
                Balance is editable from Admin.
              </p>
            </div>

            <div className='flex gap-2'>
              <Button asChild className='rounded-2xl'>
                <Link href='/invest/create'>
                  <Receipt className='mr-2 h-4 w-4' />
                  Purchase plan
                </Link>
              </Button>
              <Button
                asChild
                variant='outline'
                className='rounded-2xl bg-white/60'
              >
                <Link href='/invest'>
                  <TrendingUp className='mr-2 h-4 w-4' />
                  History
                </Link>
              </Button>
            </div>
          </div>

          {/* Shortcut tiles */}
          <div className='mt-6 grid gap-3 sm:grid-cols-3'>
            <Link
              href='/invest/create'
              className='group rounded-2xl border bg-white/70 p-4 transition hover:bg-white'
            >
              <div className='flex items-center justify-between'>
                <div className='grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-700'>
                  <Plus className='h-5 w-5' />
                </div>
                <Sparkles className='h-4 w-4 text-zinc-400 transition group-hover:text-zinc-700' />
              </div>
              <p className='mt-3 text-sm font-medium text-zinc-900'>
                Create investment
              </p>
              <p className='mt-1 text-xs text-zinc-500'>
                Choose a plan to purchase
              </p>
            </Link>

            <Link
              href='/withdraw'
              className='group rounded-2xl border bg-white/70 p-4 transition hover:bg-white'
            >
              <div className='flex items-center justify-between'>
                <div className='grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700'>
                  <ArrowDownToLine className='h-5 w-5' />
                </div>
                <Sparkles className='h-4 w-4 text-zinc-400 transition group-hover:text-zinc-700' />
              </div>
              <p className='mt-3 text-sm font-medium text-zinc-900'>Withdraw</p>
              <p className='mt-1 text-xs text-zinc-500'>
                Request payout screen
              </p>
            </Link>

            <Link
              href='/profile'
              className='group rounded-2xl border bg-white/70 p-4 transition hover:bg-white'
            >
              <div className='flex items-center justify-between'>
                <div className='grid h-10 w-10 place-items-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-700'>
                  <User className='h-5 w-5' />
                </div>
                <Sparkles className='h-4 w-4 text-zinc-400 transition group-hover:text-zinc-700' />
              </div>
              <p className='mt-3 text-sm font-medium text-zinc-900'>Profile</p>
              <p className='mt-1 text-xs text-zinc-500'>Manage your details</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Active plan + Insight */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card className='rounded-3xl shadow-sm md:col-span-2'>
          <CardHeader className='flex-row items-center justify-between space-y-0'>
            <CardTitle className='text-sm text-zinc-600'>Active plan</CardTitle>
            <Badge
              className='rounded-2xl'
              variant={plan ? 'secondary' : 'outline'}
            >
              {plan ? 'Active' : 'None'}
            </Badge>
          </CardHeader>
          <CardContent>
            {plan ? (
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div>
                  <p className='text-lg font-semibold text-zinc-900'>
                    {plan.name}
                  </p>
                  <p className='mt-1 text-sm text-zinc-500'>
                    ROI {plan.roi_percent}% · {plan.duration_days} days
                  </p>
                </div>

                <div className='rounded-2xl border bg-zinc-50 px-4 py-3'>
                  <p className='text-xs text-zinc-500'>Plan window</p>
                  <p className='mt-1 text-sm font-medium text-zinc-900'>
                    {activePlan?.started_at
                      ? new Date(
                          activePlan.started_at as any
                        ).toLocaleDateString()
                      : '—'}{' '}
                    →{' '}
                    {activePlan?.ends_at
                      ? new Date(activePlan.ends_at as any).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>
            ) : (
              <p className='text-sm text-zinc-500'>
                No active plan assigned yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className='rounded-3xl shadow-sm'>
          <CardHeader>
            <CardTitle className='text-sm text-zinc-600'>
              Quick insight
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='rounded-2xl border bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 p-4'>
              <p className='text-xs text-zinc-500'>Investments</p>
              <p className='mt-1 text-xl font-semibold text-zinc-900'>
                {investments?.length ?? 0}
              </p>
              <p className='mt-1 text-xs text-zinc-500'>Last 5 shown below</p>
            </div>

            <Button
              asChild
              variant='outline'
              className='w-full rounded-2xl bg-white justify-start'
            >
              <Link href='/invest/create'>
                <Plus className='mr-2 h-4 w-4' />
                Create a new investment
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent investments */}
      <Card className='rounded-3xl shadow-sm'>
        <CardHeader className='flex-row items-center justify-between space-y-0'>
          <CardTitle className='text-sm text-zinc-600'>
            Recent investments
          </CardTitle>
          <Button asChild variant='outline' className='rounded-2xl'>
            <Link href='/invest'>See all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {investments?.length ? (
            <div className='space-y-3'>
              {investments.map((inv) => (
                <div
                  key={inv.id}
                  className='flex items-center justify-between gap-3 rounded-2xl border bg-white p-4'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium text-zinc-900'>
                      {inv.title}
                    </p>
                    <p className='mt-1 text-xs text-zinc-500'>
                      {new Date(inv.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className='shrink-0 text-right'>
                    <p className='text-sm font-semibold text-zinc-900'>
                      {formatMoney(Number(inv.amount))}
                    </p>
                    <Badge
                      className='mt-1 rounded-2xl'
                      variant={statusBadgeVariant(inv.status)}
                    >
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              ))}
              <Separator />
              <p className='text-xs text-zinc-500'>
                Showing last 5 investments.
              </p>
            </div>
          ) : (
            <p className='text-sm text-zinc-500'>No investments yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
