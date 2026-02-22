import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const adminCheck = await supabaseAdmin
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (adminCheck.error || !adminCheck.data) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { action, payload } = body

  try {
    if (action === 'create_plan') {
      const { error } = await supabaseAdmin.from('plans').insert(payload)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    if (action === 'set_balance') {
      const { error } = await supabaseAdmin.from('balances').upsert({
        user_id: payload.user_id,
        amount: payload.amount,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    if (action === 'assign_plan') {
      // deactivate existing
      await supabaseAdmin
        .from('user_plans')
        .update({ is_active: false })
        .eq('user_id', payload.user_id)
        .eq('is_active', true)

      const started_at = new Date()
      const ends_at = new Date(started_at)
      ends_at.setDate(ends_at.getDate() + (payload.duration_days ?? 60))

      const { error } = await supabaseAdmin.from('user_plans').insert({
        user_id: payload.user_id,
        plan_id: payload.plan_id,
        started_at: started_at.toISOString(),
        ends_at: ends_at.toISOString(),
        is_active: true,
      })
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    if (action === 'create_investment') {
      const { error } = await supabaseAdmin.from('investments').insert(payload)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 })
  }
}
