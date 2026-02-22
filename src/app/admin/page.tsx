'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast, Toaster } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Plan = {
  id: string
  name: string
  roi_percent: number
  duration_days: number
}

export default function AdminPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [plans, setPlans] = useState<Plan[]>([])

  const [plan, setPlan] = useState({
    name: 'Starter',
    roi_percent: 10,
    duration_days: 60,
    min_amount: 0,
  })

  const [userId, setUserId] = useState('')
  const [balance, setBalance] = useState('0')

  const [assignPlanId, setAssignPlanId] = useState('')
  const [investment, setInvestment] = useState({
    user_id: '',
    title: 'BTC Mining',
    amount: '1000',
    status: 'active',
  })

  const refreshPlans = async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('id,name,roi_percent,duration_days')
      .order('created_at', { ascending: false })
    if (error) return toast.error(error.message)
    setPlans((data ?? []) as any)
  }

  useEffect(() => {
    refreshPlans()
  }, [])

  const callAdmin = async (action: string, payload: any) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error ?? 'Failed')
  }

  return (
    <div className='space-y-6'>
      <Toaster richColors />
      <div>
        <h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>
          Admin
        </h1>
        <p className='text-sm text-zinc-500'>
          Manage plans, balances, and investments.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <Card className='rounded-3xl shadow-sm'>
          <CardHeader>
            <CardTitle className='text-base'>Create plan</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-3'>
            <div className='grid gap-2'>
              <Label>Name</Label>
              <Input
                className='rounded-2xl'
                value={plan.name}
                onChange={(e) => setPlan({ ...plan, name: e.target.value })}
              />
            </div>
            <div className='grid gap-2'>
              <Label>ROI %</Label>
              <Input
                className='rounded-2xl'
                value={plan.roi_percent}
                onChange={(e) =>
                  setPlan({ ...plan, roi_percent: Number(e.target.value || 0) })
                }
              />
            </div>
            <div className='grid gap-2'>
              <Label>Duration days</Label>
              <Input
                className='rounded-2xl'
                value={plan.duration_days}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    duration_days: Number(e.target.value || 60),
                  })
                }
              />
            </div>

            <Button
              className='rounded-2xl'
              onClick={async () => {
                try {
                  await callAdmin('create_plan', plan)
                  toast.success('Plan created')
                  refreshPlans()
                } catch (e: any) {
                  toast.error(e.message)
                }
              }}
            >
              Create
            </Button>
          </CardContent>
        </Card>

        <Card className='rounded-3xl shadow-sm'>
          <CardHeader>
            <CardTitle className='text-base'>Set balance</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-3'>
            <div className='grid gap-2'>
              <Label>User ID</Label>
              <Input
                className='rounded-2xl'
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder='uuid...'
              />
            </div>
            <div className='grid gap-2'>
              <Label>Amount</Label>
              <Input
                className='rounded-2xl'
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
            <Button
              className='rounded-2xl'
              onClick={async () => {
                try {
                  await callAdmin('set_balance', {
                    user_id: userId,
                    amount: Number(balance || 0),
                  })
                  toast.success('Balance updated')
                } catch (e: any) {
                  toast.error(e.message)
                }
              }}
            >
              Update
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <Card className='rounded-3xl shadow-sm'>
          <CardHeader>
            <CardTitle className='text-base'>Assign plan</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-3'>
            <div className='grid gap-2'>
              <Label>User ID</Label>
              <Input
                className='rounded-2xl'
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder='uuid...'
              />
            </div>
            <div className='grid gap-2'>
              <Label>Plan</Label>
              <Select value={assignPlanId} onValueChange={setAssignPlanId}>
                <SelectTrigger className='rounded-2xl'>
                  <SelectValue placeholder='Select plan' />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className='rounded-2xl'
              onClick={async () => {
                try {
                  const chosen = plans.find((p) => p.id === assignPlanId)
                  if (!chosen) throw new Error('Select a plan')
                  await callAdmin('assign_plan', {
                    user_id: userId,
                    plan_id: chosen.id,
                    duration_days: chosen.duration_days,
                  })
                  toast.success('Plan assigned')
                } catch (e: any) {
                  toast.error(e.message)
                }
              }}
            >
              Assign
            </Button>
          </CardContent>
        </Card>

        <Card className='rounded-3xl shadow-sm'>
          <CardHeader>
            <CardTitle className='text-base'>Create investment</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-3'>
            <div className='grid gap-2'>
              <Label>User ID</Label>
              <Input
                className='rounded-2xl'
                value={investment.user_id}
                onChange={(e) =>
                  setInvestment({ ...investment, user_id: e.target.value })
                }
                placeholder='uuid...'
              />
            </div>
            <div className='grid gap-2'>
              <Label>Title</Label>
              <Input
                className='rounded-2xl'
                value={investment.title}
                onChange={(e) =>
                  setInvestment({ ...investment, title: e.target.value })
                }
              />
            </div>
            <div className='grid gap-2'>
              <Label>Amount</Label>
              <Input
                className='rounded-2xl'
                value={investment.amount}
                onChange={(e) =>
                  setInvestment({ ...investment, amount: e.target.value })
                }
              />
            </div>
            <Button
              className='rounded-2xl'
              onClick={async () => {
                try {
                  await callAdmin('create_investment', {
                    user_id: investment.user_id,
                    title: investment.title,
                    amount: Number(investment.amount || 0),
                    status: investment.status,
                  })
                  toast.success('Investment created')
                } catch (e: any) {
                  toast.error(e.message)
                }
              }}
            >
              Create
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className='rounded-3xl shadow-sm'>
        <CardHeader>
          <CardTitle className='text-base'>Your plans</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          {plans.map((p) => (
            <div
              key={p.id}
              className='flex items-center justify-between rounded-2xl border px-4 py-3'
            >
              <div>
                <p className='text-sm font-medium'>{p.name}</p>
                <p className='text-xs text-zinc-500'>
                  ROI {p.roi_percent}% · {p.duration_days} days
                </p>
              </div>
              <p className='text-xs text-zinc-500'>{p.id}</p>
            </div>
          ))}
          {!plans.length && (
            <p className='text-sm text-zinc-500'>No plans yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
