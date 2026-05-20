import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { RecipeDetail } from './recipe-detail'

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*, recipe_collections(collection_id), recipe_tags(tag_id, created_at, tags(name, color))')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!recipe) notFound()

  const { data: collections } = await supabase.from('collections').select('*').eq('user_id', user.id)
  const { data: tags } = await supabase.from('tags').select('*').eq('user_id', user.id)

  return (
    <>
      <Navbar />
      <RecipeDetail recipe={recipe} allCollections={collections ?? []} allTags={tags ?? []} />
    </>
  )
}
