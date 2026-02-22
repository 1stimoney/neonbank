'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast, Toaster } from 'sonner'
import KycUpload from '@/components/kyc-upload'
import {
  ArrowDownToLine,
  LayoutDashboard,
  Plus,
  ShieldCheck,
} from 'lucide-react'

type Profile = {
  id: string
  first_name: string
  last_name: string
  email: string
  country: string | null
  phone: string | null
  dob: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state_region: string | null
  postal_code: string | null
  ssn_last4: string | null
  itin_last4: string | null
  id_document_path: string | null
  kyc_status: string
}

function digits4(value: string) {
  return value.replace(/\D/g, '').slice(0, 4)
}

function isDirty(a: any, b: any) {
  return JSON.stringify(a) !== JSON.stringify(b)
}

export default function ProfilePage() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [userId, setUserId] = useState<string>('')

  const [profile, setProfile] = useState<Profile | null>(null)
  const [initial, setInitial] = useState<Profile | null>(null)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) return
      setUserId(user.id)

      const { data: p, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) return toast.error(error.message)

      const loaded = p as any as Profile
      setProfile(loaded)
      setInitial(loaded)
    })()
  }, [supabase])

  const country = profile?.country ?? ''
  const isUSCA = country === 'United States' || country === 'Canada'

  const kyc = (profile?.kyc_status ?? 'unverified').toLowerCase()
  const kycVariant =
    kyc === 'verified' ? 'secondary' : kyc === 'pending' ? 'outline' : 'outline'

  const dirty = profile && initial ? isDirty(profile, initial) : false

  const last4Ok =
    (!profile?.ssn_last4 || profile.ssn_last4.length === 4) &&
    (!profile?.itin_last4 || profile.itin_last4.length === 4)

  const canSave = !!profile && dirty && last4Ok && !saving

  const save = async () => {
    if (!profile) return
    if (!isUSCA) return toast.error('Select United States or Canada.')

    if (profile.ssn_last4 && profile.ssn_last4.length !== 4) {
      return toast.error('SSN last 4 must be 4 digits.')
    }
    if (profile.itin_last4 && profile.itin_last4.length !== 4) {
      return toast.error('ITIN last 4 must be 4 digits.')
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          country: profile.country,
          phone: profile.phone,
          dob: profile.dob,
          address_line1: profile.address_line1,
          address_line2: profile.address_line2,
          city: profile.city,
          state_region: profile.state_region,
          postal_code: profile.postal_code,
          ssn_last4: profile.ssn_last4,
          itin_last4: profile.itin_last4,
          id_document_path: profile.id_document_path,
          kyc_status: profile.kyc_status || 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw error

      setInitial(profile)
      toast.success('Saved.')
    } catch (e: any) {
      toast.error(e?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return (
      <div className='space-y-4'>
        <Toaster richColors />
        <h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>
          Profile
        </h1>
        <Card className='rounded-3xl shadow-sm'>
          <CardContent className='py-10 text-center text-sm text-zinc-500'>
            Loading…
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <Toaster richColors />

      {/* Header */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>
            Profile
          </h1>
          <p className='text-sm text-zinc-500'>
            Update your details for withdrawals and plan purchases.
          </p>
        </div>

        <Badge className='w-fit rounded-2xl' variant={kycVariant}>
          <ShieldCheck className='mr-1 h-3.5 w-3.5' />
          KYC: {profile.kyc_status ?? 'unverified'}
        </Badge>
      </div>

      {/* Shortcuts (mobile-friendly full width buttons) */}
      <div className='grid gap-3 sm:grid-cols-3'>
        <Button
          asChild
          variant='outline'
          className='h-12 w-full justify-start rounded-2xl bg-white'
        >
          <Link href='/dashboard'>
            <LayoutDashboard className='mr-2 h-4 w-4' />
            Dashboard
          </Link>
        </Button>

        <Button asChild className='h-12 w-full justify-start rounded-2xl'>
          <Link href='/invest/create'>
            <Plus className='mr-2 h-4 w-4' />
            Create investment
          </Link>
        </Button>

        <Button
          asChild
          variant='outline'
          className='h-12 w-full justify-start rounded-2xl bg-white'
        >
          <Link href='/withdraw'>
            <ArrowDownToLine className='mr-2 h-4 w-4' />
            Withdraw
          </Link>
        </Button>
      </div>

      {/* Account */}
      <Card className='relative overflow-hidden rounded-3xl border shadow-sm'>
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/10 to-emerald-500/10' />
        <CardHeader className='relative'>
          <CardTitle className='text-base'>Account</CardTitle>
          <p className='text-sm text-zinc-500'>
            Some fields are read-only (name/email).
          </p>
        </CardHeader>

        <CardContent className='relative grid gap-4 p-5 sm:p-6'>
          {/* Always 1-col on mobile, 2-col from sm */}
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label>First name</Label>
              <Input
                className='rounded-2xl bg-white'
                value={profile.first_name}
                disabled
              />
            </div>

            <div className='grid gap-2'>
              <Label>Last name</Label>
              <Input
                className='rounded-2xl bg-white'
                value={profile.last_name}
                disabled
              />
            </div>
          </div>

          <div className='grid gap-2'>
            <Label>Email</Label>
            <Input
              className='rounded-2xl bg-white'
              value={profile.email}
              disabled
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label>Country (supported)</Label>
              <Select
                value={profile.country ?? ''}
                onValueChange={(v) => {
                  setProfile({ ...profile, country: v })
                  if (v === 'United States' || v === 'Canada') {
                    setProfile((prev) =>
                      prev
                        ? { ...prev, kyc_status: prev.kyc_status || 'pending' }
                        : prev
                    )
                  }
                }}
              >
                <SelectTrigger className='rounded-2xl bg-white'>
                  <SelectValue placeholder='Select country' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='United States'>United States</SelectItem>
                  <SelectItem value='Canada'>Canada</SelectItem>
                </SelectContent>
              </Select>

              {!isUSCA && (
                <p className='text-xs text-red-600'>
                  Only United States and Canada are supported.
                </p>
              )}
            </div>

            <div className='grid gap-2'>
              <Label>Phone number</Label>
              <Input
                className='rounded-2xl bg-white'
                value={profile.phone ?? ''}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                placeholder='+1 555...'
              />
            </div>
          </div>

          <div className='grid gap-2'>
            <Label>Date of birth</Label>
            <Input
              className='rounded-2xl bg-white'
              type='date'
              value={profile.dob ?? ''}
              onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* KYC & Address */}
      <Card className='rounded-3xl shadow-sm'>
        <CardHeader>
          <CardTitle className='text-base'>KYC & Address</CardTitle>
          <p className='text-sm text-zinc-500'>
            Required for withdrawals. Uploading an ID sets status to pending.
          </p>
        </CardHeader>

        <CardContent className='grid gap-4 p-5 sm:p-6'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label>Address line 1</Label>
              <Input
                className='rounded-2xl'
                value={profile.address_line1 ?? ''}
                onChange={(e) =>
                  setProfile({ ...profile, address_line1: e.target.value })
                }
                disabled={!isUSCA}
              />
            </div>
            <div className='grid gap-2'>
              <Label>Address line 2</Label>
              <Input
                className='rounded-2xl'
                value={profile.address_line2 ?? ''}
                onChange={(e) =>
                  setProfile({ ...profile, address_line2: e.target.value })
                }
                disabled={!isUSCA}
              />
            </div>
          </div>

          {/* 1-col mobile; 3-col from sm so it doesn’t feel cramped */}
          <div className='grid gap-4 sm:grid-cols-3'>
            <div className='grid gap-2'>
              <Label>City</Label>
              <Input
                className='rounded-2xl'
                value={profile.city ?? ''}
                onChange={(e) =>
                  setProfile({ ...profile, city: e.target.value })
                }
                disabled={!isUSCA}
              />
            </div>
            <div className='grid gap-2'>
              <Label>State/Province</Label>
              <Input
                className='rounded-2xl'
                value={profile.state_region ?? ''}
                onChange={(e) =>
                  setProfile({ ...profile, state_region: e.target.value })
                }
                disabled={!isUSCA}
              />
            </div>
            <div className='grid gap-2'>
              <Label>Postal code</Label>
              <Input
                className='rounded-2xl'
                value={profile.postal_code ?? ''}
                onChange={(e) =>
                  setProfile({ ...profile, postal_code: e.target.value })
                }
                disabled={!isUSCA}
              />
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label>SSN last 4</Label>
              <Input
                className='rounded-2xl'
                maxLength={4}
                value={profile.ssn_last4 ?? ''}
                onChange={(e) =>
                  setProfile({ ...profile, ssn_last4: digits4(e.target.value) })
                }
                disabled={!isUSCA}
              />
            </div>

            <div className='grid gap-2'>
              <Label>ITIN last 4</Label>
              <Input
                className='rounded-2xl'
                maxLength={4}
                value={profile.itin_last4 ?? ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    itin_last4: digits4(e.target.value),
                  })
                }
                disabled={!isUSCA}
              />
            </div>
          </div>

          {!last4Ok && (
            <p className='text-xs text-red-600'>
              SSN/ITIN last 4 must be exactly 4 digits (or left empty).
            </p>
          )}

          <div className={!isUSCA ? 'pointer-events-none opacity-60' : ''}>
            <KycUpload
              userId={userId}
              currentPath={profile.id_document_path}
              onUploaded={(path) =>
                setProfile({
                  ...profile,
                  id_document_path: path,
                  kyc_status: 'pending',
                })
              }
            />
          </div>

          <Button
            className='w-full rounded-2xl sm:w-auto'
            onClick={save}
            disabled={!canSave}
          >
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </Button>

          <p className='text-xs text-zinc-500'>
            Save is enabled only when you’ve changed something.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
