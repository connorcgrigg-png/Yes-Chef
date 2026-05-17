import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreRecipeMatch } from '@/lib/utils'
import type { Recipe } from '@/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: recipes }, { data: pantryItems }] = await Promise.all([
    supabase.from('recipes').select('*').eq('user_id', user.id),
    supabase.from('pantry_items').select('*').eq('user_id', user.id),
  ])

  if (!recipes || !pantryItems) return NextResponse.json({ matches: [] })

  const matches = recipes
    .map(recipe => scoreRecipeMatch(recipe as Recipe, pantryItems))
    .filter(m => m.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 10)

  return NextResponse.json({ matches })
}
