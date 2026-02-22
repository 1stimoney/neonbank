import { supabaseServer } from './supabase/server'

export async function getUser() {
  const supabase = await supabaseServer()
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

export async function isAdmin(userId: string) {
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return false
  return !!data
}
