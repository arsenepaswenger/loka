import { supabase } from './supabaseClient'

export const getProfileForSession = async (session) => {
  const user = session?.user

  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nom, prenom, phone, location')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error

  return {
    id: user.id,
    email: user.email,
    emailConfirmedAt: user.email_confirmed_at,
    ...data
  }
}
