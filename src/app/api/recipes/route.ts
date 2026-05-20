import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateId } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const collectionId = searchParams.get('collection')
  const tagId = searchParams.get('tag')

  let query = supabase
    .from('recipes')
    .select(`
      *,
      recipe_collections(collection_id),
      recipe_tags(tag_id, created_at, tags(name, color))
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.textSearch('search_vector', search)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let recipes = data ?? []

  if (collectionId) {
    recipes = recipes.filter(r =>
      r.recipe_collections?.some((rc: { collection_id: string }) => rc.collection_id === collectionId)
    )
  }

  if (tagId) {
    recipes = recipes.filter(r =>
      r.recipe_tags?.some((rt: { tag_id: string }) => rt.tag_id === tagId)
    )
  }

  return NextResponse.json({ recipes })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { collection_ids = [], tag_ids = [], suggested_tags = [], ...recipeData } = body

  // Add IDs to ingredients and instructions
  const ingredients = (recipeData.ingredients ?? []).map((ing: object & { quantity: unknown; unit?: unknown }) => {
    const quantity = String(ing.quantity ?? '')
    const unit = ing.unit ? String(ing.unit) : undefined
    return {
      ...ing,
      id: generateId(),
      quantity,
      unit,
      original_quantity: quantity,
      original_unit: unit,
    }
  })

  const instructions = (recipeData.instructions ?? []).map((inst: object) => ({
    ...inst,
    id: generateId(),
  }))

  const { data: recipe, error } = await supabase
    .from('recipes')
    .insert({
      ...recipeData,
      user_id: user.id,
      ingredients,
      instructions,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Handle collections
  if (collection_ids.length > 0) {
    await supabase.from('recipe_collections').insert(
      collection_ids.map((cid: string) => ({ recipe_id: recipe.id, collection_id: cid }))
    )
  }

  // Handle tags (create new ones from suggested_tags if needed)
  const allTagIds = [...tag_ids]
  if (suggested_tags.length > 0) {
    for (const tagName of suggested_tags) {
      const { data: existing } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', tagName)
        .single()

      if (existing) {
        allTagIds.push(existing.id)
      } else {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({ user_id: user.id, name: tagName })
          .select('id')
          .single()
        if (newTag) allTagIds.push(newTag.id)
      }
    }
  }

  if (allTagIds.length > 0) {
    await supabase.from('recipe_tags').insert(
      allTagIds.map((tid: string) => ({ recipe_id: recipe.id, tag_id: tid }))
    )
  }

  return NextResponse.json({ recipe })
}
