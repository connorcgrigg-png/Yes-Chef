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

  const { error } = await supabase
    .from('recipes')
    .update(recipeData)
    .eq('id', id)
    .eq('user_id', user.id)

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
    const { data: existing } = await supabase.from('recipe_tags').select('tag_id').eq('recipe_id', id)
    const existingIds = new Set((existing ?? []).map((r: { tag_id: string }) => r.tag_id))
    const newIds = new Set(tag_ids as string[])

    const toDelete = [...existingIds].filter(tid => !newIds.has(tid))
    if (toDelete.length > 0) {
      await supabase.from('recipe_tags').delete().eq('recipe_id', id).in('tag_id', toDelete)
    }

    const toAdd = (tag_ids as string[]).filter(tid => !existingIds.has(tid))
    if (toAdd.length > 0) {
      await supabase.from('recipe_tags').insert(toAdd.map(tid => ({ recipe_id: id, tag_id: tid })))
    }
  }

  const { data: updated, error: fetchError } = await supabase
    .from('recipes')
    .select('*, recipe_collections(collection_id), recipe_tags(tag_id, tags(name, color))')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  return NextResponse.json({ recipe: updated })
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
