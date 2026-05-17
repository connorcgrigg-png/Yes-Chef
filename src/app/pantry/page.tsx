import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { PantryClient } from './pantry-client'

export default async function PantryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: pantryItems } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', user.id)
    .order('category')

  return (
    <>
      <Navbar />
      <PantryClient initialItems={pantryItems ?? []} />
    </>
  )
}
