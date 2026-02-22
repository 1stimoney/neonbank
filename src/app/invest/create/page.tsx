// app/(app)/invest/create/page.tsx
import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import { formatMoney } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sparkles,
  ArrowRight,
  Check,
  ShieldCheck,
  Wallet,
  MessageCircle,
  HelpCircle,
} from 'lucide-react'

/**
 * WhatsApp destination
 * - Use international format WITHOUT + and WITHOUT spaces.
 * - Example Nigeria: 2348012345678
 * - Example US: 14085551234
 */
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER ?? '2348012345678'

type Plan = {
  id: string
  name: string
  roi_percent: number
  duration_days: number
  min_amount: number
  max_amount: number | null
  created_at: string
}

function rangeText(min: number, max: number | null) {
  if (!max) return `From ${formatMoney(min)}`
  if (min === max) return formatMoney(min)
  return `${formatMoney(min)} — ${formatMoney(max)}`
}

function planTier(plan: Plan) {
  const name = (plan.name ?? '').toLowerCase()
  if (name.includes('premium') || name.includes('pro')) return 'premium'
  if (name.includes('plus')) return 'plus'
  return 'standard'
}

function cardAccent(tier: string) {
  // Subtle “bank” color accents (still Apple-fintech clean)
  switch (tier) {
    case 'premium':
      return 'from-indigo-500/12 via-fuchsia-500/10 to-emerald-500/10'
    case 'plus':
      return 'from-emerald-500/12 via-sky-500/10 to-indigo-500/10'
    default:
      return 'from-zinc-500/10 via-indigo-500/10 to-emerald-500/10'
  }
}

function pickFeatured(plans: Plan[]) {
  // Feature the “best” plan as: highest ROI; if tie, longer duration; if tie, higher min amount.
  const sorted = [...plans].sort((a, b) => {
    if (Number(b.roi_percent) !== Number(a.roi_percent))
      return Number(b.roi_percent) - Number(a.roi_percent)
    if (Number(b.duration_days) !== Number(a.duration_days))
      return Number(b.duration_days) - Number(a.duration_days)
    return Number(b.min_amount) - Number(a.min_amount)
  })
  return sorted[0]?.id ?? null
}

export default async function CreateInvestmentPage() {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user!

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name,last_name,email,country,kyc_status')
    .eq('id', user.id)
    .maybeSingle()

  const { data: plans, error } = await supabase
    .from('plans')
    .select(
      'id,name,roi_percent,duration_days,min_amount,max_amount,created_at'
    )
    .order('min_amount', { ascending: true })

  if (error) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>
            Create Investment
          </h1>
          <p className='text-sm text-zinc-500'>Choose a plan to purchase.</p>
        </div>
        <Card className='rounded-3xl shadow-sm'>
          <CardContent className='py-10 text-center text-sm text-zinc-600'>
            Failed to load plans: {error.message}
          </CardContent>
        </Card>
      </div>
    )
  }

  const list = (plans ?? []) as Plan[]
  const featuredId = pickFeatured(list)

  const kyc = (profile?.kyc_status ?? 'unverified').toLowerCase()
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    'User'
  const email = profile?.email || user.email || ''

  const buildWhatsAppLink = (plan: Plan) => {
    const min = Number(plan.min_amount ?? 0)
    const max = plan.max_amount === null ? null : Number(plan.max_amount)

    const msg = [
      `Hi, I want to purchase the "${plan.name}" plan.`,
      ``,
      `Plan details:`,
      `• ROI: ${plan.roi_percent}%`,
      `• Duration: ${plan.duration_days} days`,
      `• Amount range: ${rangeText(min, max)}`,
      ``,
      `My details:`,
      `• Name: ${displayName}`,
      email ? `• Email: ${email}` : null,
      profile?.country ? `• Country: ${profile.country}` : null,
      ``,
      `Please send me the next steps.`,
    ]
      .filter(Boolean)
      .join('\n')

    // wa.me format
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>
            Create Investment
          </h1>
          <p className='text-sm text-zinc-500'>
            Select a plan, then tap Purchase to open WhatsApp with a pre-filled
            message.
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Badge
            className='rounded-2xl'
            variant={kyc === 'verified' ? 'secondary' : 'outline'}
          >
            <ShieldCheck className='mr-1 h-3.5 w-3.5' />
            KYC: {profile?.kyc_status ?? 'unverified'}
          </Badge>

          <Button asChild variant='outline' className='rounded-2xl bg-white'>
            <Link href='/invest'>
              <Wallet className='mr-2 h-4 w-4' />
              Back to investments
            </Link>
          </Button>
        </div>
      </div>

      {/* “How it works” mini card */}
      <Card className='rounded-3xl shadow-sm'>
        <CardContent className='grid gap-4 p-5 sm:grid-cols-3'>
          <div className='rounded-2xl border bg-white p-4'>
            <p className='text-xs text-zinc-500'>Step 1</p>
            <p className='mt-1 text-sm font-medium text-zinc-900'>
              Choose a plan
            </p>
            <p className='mt-1 text-xs text-zinc-500'>
              Pick based on ROI, duration, and range.
            </p>
          </div>

          <div className='rounded-2xl border bg-white p-4'>
            <p className='text-xs text-zinc-500'>Step 2</p>
            <p className='mt-1 text-sm font-medium text-zinc-900'>
              Tap Purchase
            </p>
            <p className='mt-1 text-xs text-zinc-500'>
              Opens WhatsApp with a custom message.
            </p>
          </div>

          <div className='rounded-2xl border bg-white p-4'>
            <p className='text-xs text-zinc-500'>Step 3</p>
            <p className='mt-1 text-sm font-medium text-zinc-900'>
              Get next steps
            </p>
            <p className='mt-1 text-xs text-zinc-500'>
              Admin can then record your investment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Shortcuts */}
      <div className='grid gap-3 sm:grid-cols-3'>
        <Link
          href='/dashboard'
          className='group rounded-2xl border bg-white p-4 transition hover:bg-zinc-50'
        >
          <p className='text-xs text-zinc-500'>Shortcut</p>
          <p className='mt-1 text-sm font-medium text-zinc-900'>
            Go to Dashboard
          </p>
          <p className='mt-1 text-xs text-zinc-500'>
            Balance, plan, quick actions
          </p>
        </Link>

        <Link
          href='/profile'
          className='group rounded-2xl border bg-white p-4 transition hover:bg-zinc-50'
        >
          <p className='text-xs text-zinc-500'>Shortcut</p>
          <p className='mt-1 text-sm font-medium text-zinc-900'>
            Update Profile
          </p>
          <p className='mt-1 text-xs text-zinc-500'>
            KYC details and ID upload
          </p>
        </Link>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          className='group rounded-2xl border bg-white p-4 transition hover:bg-zinc-50'
          target='_blank'
          rel='noreferrer'
        >
          <p className='text-xs text-zinc-500'>Shortcut</p>
          <p className='mt-1 text-sm font-medium text-zinc-900'>
            Open WhatsApp
          </p>
          <p className='mt-1 text-xs text-zinc-500'>Chat directly</p>
        </a>
      </div>

      {/* Plans grid */}
      <div className='flex items-center justify-between'>
        <p className='text-sm font-medium text-zinc-900'>
          Available plans ({list.length})
        </p>
        <div className='flex items-center gap-2 text-xs text-zinc-500'>
          <HelpCircle className='h-4 w-4' />
          Tip: Featured plan is auto-picked by ROI & duration.
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        {list.map((p) => {
          const featured = p.id === featuredId
          const tier = planTier(p)
          const min = Number(p.min_amount ?? 0)
          const max = p.max_amount === null ? null : Number(p.max_amount)

          return (
            <Card
              key={p.id}
              className='relative overflow-hidden rounded-3xl border shadow-sm'
            >
              {/* Accent background */}
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cardAccent(
                  tier
                )}`}
              />
              <div className='pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl' />
              <div className='pointer-events-none absolute -left-24 -bottom-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl' />

              <CardHeader className='relative'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <CardTitle className='truncate text-base'>
                      {p.name}
                    </CardTitle>
                    <p className='mt-1 text-xs text-zinc-600'>
                      Amount range:{' '}
                      <span className='font-medium'>{rangeText(min, max)}</span>
                    </p>
                  </div>

                  <div className='flex items-center gap-2'>
                    {featured && (
                      <Badge className='rounded-2xl' variant='secondary'>
                        <Sparkles className='mr-1 h-3.5 w-3.5' />
                        Featured
                      </Badge>
                    )}
                    <Badge className='rounded-2xl' variant='outline'>
                      {tier}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='relative space-y-4'>
                {/* Highlights */}
                <div className='grid gap-3 sm:grid-cols-3'>
                  <div className='rounded-2xl border bg-white/70 p-3'>
                    <p className='text-xs text-zinc-500'>ROI</p>
                    <p className='mt-1 text-sm font-semibold text-zinc-900'>
                      {p.roi_percent}%
                    </p>
                  </div>
                  <div className='rounded-2xl border bg-white/70 p-3'>
                    <p className='text-xs text-zinc-500'>Duration</p>
                    <p className='mt-1 text-sm font-semibold text-zinc-900'>
                      {p.duration_days} days
                    </p>
                  </div>
                  <div className='rounded-2xl border bg-white/70 p-3'>
                    <p className='text-xs text-zinc-500'>Minimum</p>
                    <p className='mt-1 text-sm font-semibold text-zinc-900'>
                      {formatMoney(min)}
                    </p>
                  </div>
                </div>

                {/* Perks list */}
                <div className='rounded-2xl border bg-white/70 p-4'>
                  <p className='text-sm font-medium text-zinc-900'>Includes</p>
                  <div className='mt-2 grid gap-2 text-sm text-zinc-700'>
                    <div className='flex items-center gap-2'>
                      <Check className='h-4 w-4 text-emerald-700' />
                      <span>Portfolio tracking on dashboard</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Check className='h-4 w-4 text-emerald-700' />
                      <span>Admin-recorded investment entry</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Check className='h-4 w-4 text-emerald-700' />
                      <span>Plan window & status history</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                  <a
                    href={buildWhatsAppLink(p)}
                    target='_blank'
                    rel='noreferrer'
                    className='w-full sm:w-auto'
                  >
                    <Button className='w-full rounded-2xl'>
                      <MessageCircle className='mr-2 h-4 w-4' />
                      Purchase on WhatsApp
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </a>

                  <Button
                    variant='outline'
                    className='w-full rounded-2xl bg-white sm:w-auto'
                    asChild
                  >
                    <Link href='/profile'>Update details</Link>
                  </Button>
                </div>

                <p className='text-xs text-zinc-500'>
                  WhatsApp message will include plan details + your name/email.
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!list.length && (
        <Card className='rounded-3xl shadow-sm'>
          <CardContent className='py-12 text-center'>
            <p className='text-sm text-zinc-600'>No plans found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
