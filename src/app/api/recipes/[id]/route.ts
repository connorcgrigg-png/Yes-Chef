import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('recipes')
    .select(`*, recipe_collections(collection_id), recipe_tags(tag_id, tags(name, color))`)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ recipe: data })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { collection_ids, tag_ids, ...recipeData } = body

  const { data, error } = await supabase
    .from('recipes')
    .update(recipeData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, recipe_collections(collection_id), recipe_tags(tag_id, tags(name, color))')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (collection_ids !== undefined) {
    await supabase.from('recipe_collections').delete().eq('recipe_id', id)
    if (collection_ids.length > 0) {
      await supabase.from('recipe_collections').insert(
        collection_ids.map((cid: string) => ({ recipe_id: id, collection_id: cid }))
      )
    }
  }

  if (tag_ids !== undefined) {
    await supabase.from('recipe_tags').delete().eq('recipe_id', id)
    if (tag_ids.length > 0) {
      await supabase.from('recipe_tags').insert(
        tag_ids.map((tid: string) => ({ recipe_id: id, tag_id: tid }))
      )
    }
  }

  return NextResponse.json({ recipe: data })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('recipes').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
