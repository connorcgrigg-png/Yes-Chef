'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Users, ExternalLink, Edit2, Check, Trash2 } from 'lucide-react'
import { IngredientList } from '@/components/recipe/ingredient-list'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatTime } from '@/lib/utils'
import type { Recipe, Ingredient } from '@/types'

interface Collection { id: string; name: string; color: string; icon: string }
interface Tag { id: string; name: string; color: string }

interface Props {
  recipe: Recipe
  allCollections: Collection[]
  allTags: Tag[]
}

export function RecipeDetail({ recipe: initial, allCollections, allTags }: Props) {
  const [recipe, setRecipe] = useState(initial)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(recipe.title)
  const [editingFeeds, setEditingFeeds] = useState(false)
  const [feedsValue, setFeedsValue] = useState(String(recipe.feeds_people ?? ''))
  const [feedsPrompt, setFeedsPrompt] = useState(!recipe.feeds_people)
  const router = useRouter()

  async function patch(updates: Partial<Recipe>) {
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (data.recipe) setRecipe(data.recipe)
    } catch (e) {
      console.error('Failed to update recipe:', e)
    }
  }

  async function saveTitle() {
    setEditingTitle(false)
    if (titleValue !== recipe.title) await patch({ title: titleValue })
  }

  async function saveFeeds() {
    setEditingFeeds(false)
    setFeedsPrompt(false)
    const n = parseInt(feedsValue)
    if (!isNaN(n) && n !== recipe.feeds_people) await patch({ feeds_people: n })
  }

  async function updateIngredient(id: string, quantity: string, unit?: string) {
    const updated = recipe.ingredients.map(ing =>
      ing.id === id ? { ...ing, quantity, unit } : ing
    )
    await patch({ ingredients: updated })
  }

  async function deleteRecipe() {
    if (!confirm('Delete this recipe?')) return
    await fetch(`/api/recipes/${recipe.id}`, { method: 'DELETE' })
    router.push('/dashboard')
  }

  const recipeTags = recipe.recipe_tags ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back + actions */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex gap-2">
          {recipe.source_url && (
            <a href={recipe.source_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3.5 w-3.5" />
                Source
              </Button>
            </a>
          )}
          <Button variant="ghost" size="sm" onClick={deleteRecipe} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Hero image */}
      {recipe.image_url && (
        <div className="mb-8 overflow-hidden rounded-2xl">
          <img src={recipe.image_url} alt={recipe.title} className="h-72 w-full object-cover" />
        </div>
      )}

      {/* Title */}
      <div className="mb-2">
        {editingTitle ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
              onBlur={saveTitle}
              className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-2xl font-bold focus:outline-none"
            />
            <Button size="icon" onClick={saveTitle}><Check className="h-4 w-4" /></Button>
          </div>
        ) : (
          <h1
            className="text-3xl font-bold text-stone-900 cursor-pointer hover:text-amber-700 transition-colors group"
            onClick={() => setEditingTitle(true)}
          >
            {recipe.title}
            <Edit2 className="ml-2 inline h-4 w-4 opacity-0 group-hover:opacity-40 transition-opacity" />
          </h1>
        )}
      </div>

      {/* Meta row */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-stone-500">
        {/* Feeds how many */}
        {editingFeeds ? (
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>Feeds</span>
            <input
              autoFocus
              type="number"
              value={feedsValue}
              onChange={e => setFeedsValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
              onBlur={saveFeeds}
              className="w-14 rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-sm focus:outline-none"
            />
            <span>people</span>
          </div>
        ) : feedsPrompt ? (
          <button
            onClick={() => setEditingFeeds(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            How many does this feed? (tap to set)
          </button>
        ) : (
          <button
            className="flex items-center gap-1.5 hover:text-stone-700"
            onClick={() => setEditingFeeds(true)}
          >
            <Users className="h-4 w-4" />
            Feeds {recipe.feeds_people}
          </button>
        )}

        {recipe.prep_time_minutes && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            Prep {formatTime(recipe.prep_time_minutes)}
          </span>
        )}
        {recipe.cook_time_minutes && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            Cook {formatTime(recipe.cook_time_minutes)}
          </span>
        )}
      </div>

      {/* Tags */}
      {recipeTags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {recipeTags.map(rt => (
            <Badge key={rt.tag_id} color={rt.tags?.color}>{rt.tags?.name}</Badge>
          ))}
        </div>
      )}

      {/* Description */}
      {recipe.description && (
        <p className="mb-8 text-stone-600 leading-relaxed">{recipe.description}</p>
      )}

      {/* Two-column layout: ingredients + instructions */}
      <div className="grid gap-10 md:grid-cols-[2fr_3fr]">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-stone-900">Ingredients</h2>
          <IngredientList recipe={recipe} onUpdateIngredient={updateIngredient} editable />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-stone-900">Instructions</h2>
          <ol className="space-y-5">
            {recipe.instructions.map(step => (
              <li key={step.id} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-stone-600">
                  {step.step_number}
                </span>
                <p className="text-stone-700 leading-relaxed pt-0.5">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {recipe.notes && (
        <div className="mt-10 rounded-xl border border-stone-100 bg-stone-50 p-4">
          <h3 className="mb-1 text-sm font-semibold text-stone-600">Notes</h3>
          <p className="text-sm text-stone-600 leading-relaxed">{recipe.notes}</p>
        </div>
      )}
    </div>
  )
}
