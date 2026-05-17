import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: recipes }, { data: collections }, { data: tags }] = await Promise.all([
    supabase.from('recipes').select('*, recipe_collections(collection_id), recipe_tags(tag_id)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('collections').select('*').eq('user_id', user.id).order('name'),
    supabase.from('tags').select('*').eq('user_id', user.id).order('name'),
  ])

  return (
    <>
      <Navbar />
      <DashboardClient
        initialRecipes={recipes ?? []}
        collections={collections ?? []}
        tags={tags ?? []}
      />
    </>
  )
}
