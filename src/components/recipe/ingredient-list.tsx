'use client'

import { useState } from 'react'
import { Check, Pencil, Trash2, Plus, X } from 'lucide-react'
import { cn, scaleIngredient } from '@/lib/utils'
import type { Ingredient, Recipe } from '@/types'

interface IngredientListProps {
  recipe: Recipe
  onChangeIngredients?: (ingredients: Ingredient[]) => void
  editable?: boolean
}

interface EditState {
  quantity: string
  unit: string
  name: string
  notes: string
}

const emptyEdit: EditState = { quantity: '', unit: '', name: '', notes: '' }

function ingredientToEdit(ing: Ingredient): EditState {
  return { quantity: ing.quantity, unit: ing.unit ?? '', name: ing.name, notes: ing.notes ?? '' }
}

function EditRow({ value, onChange, onSave, onCancel, autoFocusField = 'name' }: {
  value: EditState
  onChange: (v: EditState) => void
  onSave: () => void
  onCancel: () => void
  autoFocusField?: 'quantity' | 'name'
}) {
  return (
    <div className="flex items-center gap-1.5 flex-1 flex-wrap">
      <input
        autoFocus={autoFocusField === 'quantity'}
        value={value.quantity}
        onChange={e => onChange({ ...value, quantity: e.target.value })}
        onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
        placeholder="qty"
        className="w-12 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-xs focus:outline-none"
      />
      <input
        value={value.unit}
        onChange={e => onChange({ ...value, unit: e.target.value })}
        onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
        placeholder="unit"
        className="w-16 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-xs focus:outline-none"
      />
      <input
        autoFocus={autoFocusField === 'name'}
        value={value.name}
        onChange={e => onChange({ ...value, name: e.target.value })}
        onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
        placeholder="ingredient name"
        className="w-32 flex-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-xs focus:outline-none"
      />
      <input
        value={value.notes}
        onChange={e => onChange({ ...value, notes: e.target.value })}
        onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
        placeholder="notes"
        className="w-24 rounded border border-stone-200 bg-white px-1.5 py-0.5 text-xs focus:outline-none"
      />
      <button onClick={onSave} className="flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors">
        <Check className="h-3 w-3" />
      </button>
      <button onClick={onCancel} className="flex h-5 w-5 items-center justify-center rounded border border-stone-200 text-stone-400 hover:text-stone-600 transition-colors">
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function IngredientList({ recipe, onChangeIngredients, editable }: IngredientListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [servings, setServings] = useState(recipe.feeds_people ?? 4)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>(emptyEdit)
  const [adding, setAdding] = useState(false)
  const [newState, setNewState] = useState<EditState>(emptyEdit)

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
    setAdding(false)
    setEditingId(ingredient.id)
    setEditState(ingredientToEdit(ingredient))
  }

  function saveEdit(ingredient: Ingredient) {
    if (!editState.name.trim()) { setEditingId(null); return }
    onChangeIngredients?.(recipe.ingredients.map(ing =>
      ing.id === ingredient.id
        ? { ...ing, quantity: editState.quantity, unit: editState.unit || undefined, name: editState.name.trim(), notes: editState.notes || undefined }
        : ing
    ))
    setEditingId(null)
  }

  function deleteIngredient(id: string) {
    onChangeIngredients?.(recipe.ingredients.filter(ing => ing.id !== id))
  }

  function saveNew() {
    if (!newState.name.trim()) { setAdding(false); setNewState(emptyEdit); return }
    const ing: Ingredient = {
      id: crypto.randomUUID(),
      name: newState.name.trim(),
      quantity: newState.quantity,
      unit: newState.unit || undefined,
      notes: newState.notes || undefined,
      is_primary: false,
      original_quantity: newState.quantity,
      original_unit: newState.unit || undefined,
    }
    onChangeIngredients?.([...recipe.ingredients, ing])
    setNewState(emptyEdit)
    setAdding(false)
  }

  return (
    <div>
      {/* Serving scaler */}
      <div className="mb-6 flex items-center gap-4">
        <span className="text-sm font-medium text-stone-600">I want to feed</span>
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
          <button onClick={() => setServings(originalServings)} className="text-xs text-amber-600 underline underline-offset-2">
            reset
          </button>
        )}
      </div>

      {/* Ingredient list */}
      <ul className="space-y-1">
        {recipe.ingredients.map(ingredient => {
          const scaled = ratio !== 1 ? scaleIngredient(ingredient, originalServings, servings) : ingredient
          const isChecked = checked.has(ingredient.id)
          const isEditing = editingId === ingredient.id

          return (
            <li
              key={ingredient.id}
              className={cn(
                'group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors',
                isChecked && !isEditing ? 'opacity-40' : 'hover:bg-stone-50'
              )}
            >
              {isEditing ? (
                <EditRow
                  value={editState}
                  onChange={setEditState}
                  onSave={() => saveEdit(ingredient)}
                  onCancel={() => setEditingId(null)}
                  autoFocusField="quantity"
                />
              ) : (
                <>
                  <button
                    onClick={() => toggleCheck(ingredient.id)}
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                      isChecked ? 'border-stone-400 bg-stone-400 text-white' : 'border-stone-200 hover:border-stone-400'
                    )}
                  >
                    {isChecked && <Check className="h-3 w-3" />}
                  </button>

                  <span className={cn('flex-1 text-sm', ingredient.is_primary ? 'font-medium text-stone-900' : 'text-stone-700')}>
                    {scaled.quantity}{scaled.unit ? ' ' + scaled.unit : ''} {ingredient.name}
                    {ingredient.notes && <span className="text-stone-400 font-normal">, {ingredient.notes}</span>}
                  </span>

                  {editable && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(ingredient)}
                        className="flex h-5 w-5 items-center justify-center rounded text-stone-400 hover:text-stone-700 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteIngredient(ingredient.id)}
                        className="flex h-5 w-5 items-center justify-center rounded text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          )
        })}
      </ul>

      {editable && (
        <div className="mt-2">
          {adding ? (
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <div className="h-5 w-5 shrink-0" />
              <EditRow
                value={newState}
                onChange={setNewState}
                onSave={saveNew}
                onCancel={() => { setAdding(false); setNewState(emptyEdit) }}
                autoFocusField="name"
              />
            </div>
          ) : (
            <button
              onClick={() => { setEditingId(null); setAdding(true) }}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add ingredient
            </button>
          )}
        </div>
      )}
    </div>
  )
}
