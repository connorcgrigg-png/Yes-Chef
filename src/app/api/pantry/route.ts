import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processPantryChat } from '@/lib/claude'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', user.id)
    .order('category', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages } = await request.json()

  // Load current pantry for context
  const { data: pantryItems } = await supabase
    .from('pantry_items')
    .select('name, quantity, unit')
    .eq('user_id', user.id)

  const { message, updates } = await processPantryChat(messages, pantryItems ?? [])

  // Apply updates to database
  for (const update of updates) {
    if (update.action === 'add') {
      const { data: existing } = await supabase
        .from('pantry_items')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', update.name)
        .maybeSingle()

      if (existing) {
        await supabase.from('pantry_items')
          .update({ quantity: update.quantity, unit: update.unit, category: update.category ?? 'other' })
          .eq('id', existing.id)
      } else {
        await supabase.from('pantry_items').insert({
          user_id: user.id,
          name: update.name.toLowerCase(),
          quantity: update.quantity,
          unit: update.unit,
          category: update.category ?? 'other',
        })
      }
    } else if (update.action === 'remove') {
      await supabase.from('pantry_items')
        .delete()
        .eq('user_id', user.id)
        .ilike('name', update.name)
    } else if (update.action === 'update') {
      await supabase.from('pantry_items')
        .update({ quantity: update.quantity, unit: update.unit })
        .eq('user_id', user.id)
        .ilike('name', update.name)
    }
  }

  // Return updated pantry
  const { data: updatedPantry } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', user.id)
    .order('category')

  return NextResponse.json({ message, updates, pantry: updatedPantry ?? [] })
}
