'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn, scaleIngredient, formatTime } from '@/lib/utils'
import type { Ingredient, Recipe } from '@/types'

interface IngredientListProps {
  recipe: Recipe
  onUpdateIngredient?: (id: string, quantity: string, unit?: string) => void
  editable?: boolean
}

export function IngredientList({ recipe, onUpdateIngredient, editable }: IngredientListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [servings, setServings] = useState(recipe.feeds_people ?? 4)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const originalServings = recipe.feeds_people ?? 4
  const ratio = servings / originalServings

  function toggleCheck(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function startEdit(ingredient: Ingredient) {
    setEditingId(ingredient.id)
    setEditValue(ingredient.quantity)
  }

  function saveEdit(ingredient: Ingredient) {
    onUpdateIngredient?.(ingredient.id, editValue, ingredient.unit)
    setEditingId(null)
  }

  return (
    <div>
      {/* Serving scaler */}
      <div className="mb-6 flex items-center gap-4">
        <span className="text-sm font-medium text-stone-600">Feeds</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setServings(Math.max(1, servings - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors text-lg leading-none"
          >
            −
          </button>
          <span className="w-8 text-center text-lg font-semibold text-stone-900">{servings}</span>
          <button
            onClick={() => setServings(servings + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors text-lg leading-none"
          >
            +
          </button>
        </div>
        <span className="text-sm text-stone-400">people</span>
        {servings !== originalServings && (
          <button
            onClick={() => setServings(originalServings)}
            className="text-xs text-amber-600 underline underline-offset-2"
          >
            reset
          </button>
        )}
      </div>

      {/* Ingredient list */}
      <ul className="space-y-2">
        {recipe.ingredients.map(ingredient => {
          const scaled = ratio !== 1 ? scaleIngredient(ingredient, originalServings, servings) : ingredient
          const isChecked = checked.has(ingredient.id)
          const hasEdit = ingredient.original_quantity && ingredient.original_quantity !== ingredient.quantity

          return (
            <li
              key={ingredient.id}
              className={cn(
                'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
                isChecked ? 'opacity-50' : 'hover:bg-stone-50'
              )}
            >
              <button
                onClick={() => toggleCheck(ingredient.id)}
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                  isChecked
                    ? 'border-stone-400 bg-stone-400 text-white'
                    : 'border-stone-200 hover:border-stone-400'
                )}
              >
                {isChecked && <Check className="h-3 w-3" />}
              </button>

              <div className="flex-1 min-w-0">
                <span className={cn('text-sm', ingredient.is_primary ? 'font-medium text-stone-900' : 'text-stone-700')}>
                  {editingId === ingredient.id ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(ingredient)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit(ingredient)}
                      className="w-16 rounded border border-amber-300 bg-amber-50 px-1 text-sm focus:outline-none"
                    />
                  ) : (
                    <span
                      className={cn(editable && 'cursor-pointer hover:text-amber-700')}
                      onClick={() => editable && startEdit(ingredient)}
                    >
                      {scaled.quantity}
                    </span>
                  )}{' '}
                  {scaled.unit && <span>{scaled.unit} </span>}
                  <span>{ingredient.name}</span>
                  {ingredient.notes && (
                    <span className="text-stone-400">, {ingredient.notes}</span>
                  )}
                </span>

                {hasEdit && (
                  <span className="ml-2 text-xs text-stone-400">
                    (was{' '}
                    <span className="line-through">
                      {ingredient.original_quantity}{ingredient.original_unit ? ' ' + ingredient.original_unit : ''}
                    </span>
                    )
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
