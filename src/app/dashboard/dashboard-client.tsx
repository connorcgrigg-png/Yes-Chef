'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, FolderOpen, Tag, ChefHat } from 'lucide-react'
import { RecipeCard } from '@/components/recipe/recipe-card'
import { ImportModal } from '@/components/recipe/import-modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Recipe } from '@/types'

interface Collection { id: string; name: string; color: string; icon: string }
interface Tag { id: string; name: string; color: string }

interface Props {
  initialRecipes: Recipe[]
  collections: Collection[]
  tags: Tag[]
}

export function DashboardClient({ initialRecipes, collections, tags }: Props) {
  const [recipes, setRecipes] = useState(initialRecipes)
  const [search, setSearch] = useState('')
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const router = useRouter()

  const usedTagIds = useMemo(() => {
    const ids = new Set<string>()
    recipes.forEach(r => r.recipe_tags?.forEach(rt => ids.add(rt.tag_id)))
    return ids
  }, [recipes])

  const filtered = useMemo(() => {
    let result = recipes

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      )
    }

    if (activeCollection) {
      result = result.filter(r =>
        r.recipe_collections?.some(rc => rc.collection_id === activeCollection)
      )
    }

    if (activeTag) {
      result = result.filter(r =>
        r.recipe_tags?.some(rt => rt.tag_id === activeTag)
      )
    }

    return result
  }, [recipes, search, activeCollection, activeTag])

  async function handleImported(recipe: object, sourceType: string, sourceUrl?: string, imageUrl?: string) {
    setShowImport(false)
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...recipe, source_type: sourceType, source_url: sourceUrl, image_url: imageUrl }),
    })
    const data = await res.json()
    if (data.recipe) {
      router.push(`/recipes/${data.recipe.id}`)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Collections</h3>
              <nav className="space-y-0.5">
                <button
                  onClick={() => setActiveCollection(null)}
                  className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                    !activeCollection ? 'bg-stone-100 font-medium text-stone-900' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                  )}
                >
                  <ChefHat className="h-4 w-4" />
                  All Recipes
                  <span className="ml-auto text-xs text-stone-400">{recipes.length}</span>
                </button>
                {collections.map(col => (
                  <button
                    key={col.id}
                    onClick={() => setActiveCollection(activeCollection === col.id ? null : col.id)}
                    className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                      activeCollection === col.id ? 'bg-stone-100 font-medium text-stone-900' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                    )}
                  >
                    <span>{col.icon}</span>
                    {col.name}
                  </button>
                ))}
              </nav>
            </div>

            {usedTagIds.size > 0 && (
              <div>
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Tags</h3>
                <div className="flex flex-wrap gap-1.5 px-2">
                  {tags.filter(t => usedTagIds.has(t.id)).map(tag => (
                    <button key={tag.id} onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)}>
                      <Badge
                        color={activeTag === tag.id ? tag.color : undefined}
                        className={cn('cursor-pointer', !activeTag || activeTag === tag.id ? '' : 'opacity-50')}
                      >
                        {tag.name}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="mb-6 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                placeholder="Search recipes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setShowImport(true)}>
              <Plus className="h-4 w-4" />
              Add Recipe
            </Button>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <ChefHat className="mb-4 h-12 w-12 text-stone-200" />
              <h3 className="text-lg font-medium text-stone-600">
                {recipes.length === 0 ? 'Your cookbook is empty' : 'No recipes match'}
              </h3>
              <p className="mt-1 text-sm text-stone-400">
                {recipes.length === 0 ? 'Add your first recipe to get started' : 'Try a different search or filter'}
              </p>
              {recipes.length === 0 && (
                <Button className="mt-6" onClick={() => setShowImport(true)}>
                  <Plus className="h-4 w-4" />
                  Add your first recipe
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </main>
      </div>

      {showImport && (
        <ImportModal onImported={handleImported} onClose={() => setShowImport(false)} />
      )}
    </div>
  )
}
