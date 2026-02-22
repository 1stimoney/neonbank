'use client'

import { useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),

  country: z.enum(['United States', 'Canada']),
  email: z.string().email('Enter a valid email'),

  // Appears only after sending
  code: z.string().optional(),

  phone: z.string().min(6, 'Phone is required'),
  dob: z.string().min(1, 'Date of birth is required'),

  address_line1: z.string().min(2, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state_region: z.string().min(1, 'State/Province is required'),
  postal_code: z.string().min(2, 'Postal code is required'),

  // last 4 only
  tax_id_last4: z.string().regex(/^\d{4}$/, 'Enter last 4 digits'),

  // file is handled separately
})

type Values = z.infer<typeof schema>

export default function AuthPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const router = useRouter()

  const [codeSent, setCodeSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const [idFile, setIdFile] = useState<File | null>(null)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      country: 'United States',
      email: '',
      code: '',
      phone: '',
      dob: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state_region: '',
      postal_code: '',
      tax_id_last4: '',
    },
    mode: 'onTouched',
  })

  const sendCode = async () => {
    // Only validate what we need to send the email code
    const ok = await form.trigger(['email'])
    if (!ok) return

    const email = form.getValues('email')
    setSending(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      })
      if (error) throw error

      setCodeSent(true)
      toast.success('Verification code sent.')
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to send code')
    } finally {
      setSending(false)
    }
  }

  const onSubmit = async (values: Values) => {
    // full validation includes everything
    const ok = await form.trigger()
    if (!ok) return

    if (!codeSent) return toast.error('Send verification code first.')
    if (!values.code || values.code.length !== 6) {
      return toast.error('Enter the 6-digit code.')
    }
    if (!idFile) {
      return toast.error('Upload a valid ID image.')
    }

    setVerifying(true)
    try {
      // 1) verify OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email: values.email,
        token: values.code,
        type: 'email',
      })
      if (error) throw error

      const user = data.user
      if (!user) throw new Error('No user returned after verification.')

      // 2) upload ID to private storage
      const ext = idFile.name.split('.').pop() || 'png'
      const path = `${user.id}/id-${Date.now()}.${ext}`

      const upload = await supabase.storage.from('kyc').upload(path, idFile, {
        upsert: true,
        contentType: idFile.type,
      })
      if (upload.error) throw upload.error

      // 3) create/update profile + balance
      const { error: pErr } = await supabase.from('profiles').upsert({
        id: user.id,
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,

        country: values.country,
        phone: values.phone,
        dob: values.dob,

        address_line1: values.address_line1,
        address_line2: values.address_line2 ?? null,
        city: values.city,
        state_region: values.state_region,
        postal_code: values.postal_code,

        tax_id_last4: values.tax_id_last4,

        id_document_path: path,
        kyc_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      if (pErr) throw pErr

      const { error: bErr } = await supabase.from('balances').upsert({
        user_id: user.id,
        amount: 0,
        updated_at: new Date().toISOString(),
      })
      if (bErr) throw bErr

      toast.success('Account created.')
      router.replace('/dashboard')
    } catch (e: any) {
      toast.error(e?.message ?? 'Signup failed')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <main className='min-h-screen bg-white'>
      <Toaster richColors />
      <div className='mx-auto max-w-xl px-6 py-16'>
        <Card className='rounded-3xl border shadow-sm'>
          <CardHeader>
            <CardTitle className='text-2xl tracking-tight'>
              Create your account
            </CardTitle>
            <p className='text-sm text-zinc-500'>
              United States & Canada only.
            </p>
          </CardHeader>

          <CardContent>
            <form className='grid gap-6' onSubmit={form.handleSubmit(onSubmit)}>
              {/* Name */}
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='grid gap-2'>
                  <Label>First name</Label>
                  <Input
                    className='rounded-2xl'
                    {...form.register('first_name')}
                  />
                  <FieldError msg={form.formState.errors.first_name?.message} />
                </div>

                <div className='grid gap-2'>
                  <Label>Last name</Label>
                  <Input
                    className='rounded-2xl'
                    {...form.register('last_name')}
                  />
                  <FieldError msg={form.formState.errors.last_name?.message} />
                </div>
              </div>

              {/* Country */}
              <div className='grid gap-2'>
                <Label>Country</Label>
                <Select
                  value={form.watch('country')}
                  onValueChange={(v) =>
                    form.setValue('country', v as any, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className='rounded-2xl'>
                    <SelectValue placeholder='Select country' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='United States'>United States</SelectItem>
                    <SelectItem value='Canada'>Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email + Send code inline */}
              <div className='grid gap-2'>
                <Label>Email</Label>
                <div className='flex gap-2'>
                  <Input
                    className='rounded-2xl'
                    {...form.register('email')}
                    placeholder='you@domain.com'
                  />
                  <Button
                    type='button'
                    className='rounded-2xl'
                    variant='outline'
                    onClick={sendCode}
                    disabled={sending}
                  >
                    {sending ? 'Sending…' : 'Send code'}
                  </Button>
                </div>
                <FieldError msg={form.formState.errors.email?.message} />
              </div>

              {/* Code appears after send */}
              {codeSent && (
                <div className='grid gap-2'>
                  <Label>Verification code</Label>
                  <Input
                    className='rounded-2xl'
                    maxLength={6}
                    inputMode='numeric'
                    placeholder='6-digit code'
                    {...form.register('code')}
                    onChange={(e) => {
                      // digits only
                      const cleaned = e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6)
                      form.setValue('code', cleaned, { shouldValidate: false })
                    }}
                  />
                  <p className='text-xs text-zinc-500'>
                    Enter the code sent to your email.
                  </p>
                </div>
              )}

              {/* Contact + DOB */}
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='grid gap-2'>
                  <Label>Phone number</Label>
                  <Input
                    className='rounded-2xl'
                    {...form.register('phone')}
                    placeholder='+1 ...'
                  />
                  <FieldError msg={form.formState.errors.phone?.message} />
                </div>

                <div className='grid gap-2'>
                  <Label>Date of birth</Label>
                  <Input
                    className='rounded-2xl'
                    type='date'
                    {...form.register('dob')}
                  />
                  <FieldError msg={form.formState.errors.dob?.message} />
                </div>
              </div>

              {/* Address */}
              <div className='grid gap-2'>
                <Label>Address line 1</Label>
                <Input
                  className='rounded-2xl'
                  {...form.register('address_line1')}
                />
                <FieldError
                  msg={form.formState.errors.address_line1?.message}
                />
              </div>

              <div className='grid gap-2'>
                <Label>Address line 2 (optional)</Label>
                <Input
                  className='rounded-2xl'
                  {...form.register('address_line2')}
                />
              </div>

              <div className='grid gap-4 md:grid-cols-3'>
                <div className='grid gap-2'>
                  <Label>City</Label>
                  <Input className='rounded-2xl' {...form.register('city')} />
                  <FieldError msg={form.formState.errors.city?.message} />
                </div>

                <div className='grid gap-2'>
                  <Label>State/Province</Label>
                  <Input
                    className='rounded-2xl'
                    {...form.register('state_region')}
                  />
                  <FieldError
                    msg={form.formState.errors.state_region?.message}
                  />
                </div>

                <div className='grid gap-2'>
                  <Label>Postal code</Label>
                  <Input
                    className='rounded-2xl'
                    {...form.register('postal_code')}
                  />
                  <FieldError
                    msg={form.formState.errors.postal_code?.message}
                  />
                </div>
              </div>

              {/* Tax ID last4 */}
              <div className='grid gap-2'>
                <Label>
                  {form.watch('country') === 'Canada'
                    ? 'SIN last 4'
                    : 'SSN last 4'}
                </Label>
                <Input
                  className='rounded-2xl'
                  maxLength={4}
                  inputMode='numeric'
                  placeholder='1234'
                  {...form.register('tax_id_last4')}
                  onChange={(e) => {
                    const cleaned = e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 4)
                    form.setValue('tax_id_last4', cleaned, {
                      shouldValidate: true,
                    })
                  }}
                />
                <FieldError msg={form.formState.errors.tax_id_last4?.message} />
              </div>

              {/* ID upload */}
              <div className='grid gap-2'>
                <Label>Upload valid ID</Label>
                <Input
                  className='rounded-2xl'
                  type='file'
                  accept='image/*'
                  onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
                />
                <p className='text-xs text-zinc-500'>
                  Image only. Stored privately in Supabase Storage.
                </p>
              </div>

              <Button
                type='submit'
                className='rounded-2xl'
                disabled={verifying}
              >
                {verifying ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className='text-xs text-red-600'>{msg}</p>
}
