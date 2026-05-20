'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, ChefHat, Pencil, Trash2 } from 'lucide-react'
import { RecipeCard } from '@/components/recipe/recipe-card'
import { ImportModal } from '@/components/recipe/import-modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Recipe } from '@/types'

interface Collection { id: string; name: string; color: string; icon: string }
interface Tag { id: string; name: string; color: string }

interface Props {
  initialRecipes: Recipe[]
  collections: Collection[]
  tags: Tag[]
}

const TAG_BUCKETS = [
  { key: 'protein',  label: 'Protein',       keywords: ['chicken', 'beef', 'salmon', 'shrimp', 'tofu', 'eggs', 'lamb', 'pork', 'turkey', 'tuna', 'cod', 'duck', 'bacon', 'sausage', 'crab', 'lobster', 'scallops', 'fish', 'steak', 'mince', 'ground beef'] },
  { key: 'cuisine',  label: 'Cuisine',        keywords: ['italian', 'thai', 'mexican', 'japanese', 'indian', 'french', 'chinese', 'greek', 'spanish', 'korean', 'vietnamese', 'moroccan', 'mediterranean', 'american', 'cajun', 'persian', 'caribbean', 'british', 'german', 'middle eastern'] },
  { key: 'carb',     label: 'Base Carb',      keywords: ['pasta', 'rice', 'potatoes', 'bread', 'noodles', 'quinoa', 'couscous', 'barley', 'oats', 'polenta', 'gnocchi', 'tortilla', 'lentils', 'beans'] },
  { key: 'diet',     label: 'Diet',           keywords: ['vegetarian', 'vegan', 'gluten-free', 'gluten free', 'dairy-free', 'dairy free', 'keto', 'paleo', 'whole30', 'low-carb', 'nut-free'] },
  { key: 'time',     label: 'Cook Time',      keywords: ['30 min or under'] },
]

function matchesBucket(tagName: string, keywords: string[]): boolean {
  return keywords.some(k => tagName === k || tagName.includes(k))
}

function TagChip({ tag, active, dim, onClick }: { tag: Tag; active: boolean; dim: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity',
        dim && !active ? 'opacity-40' : 'opacity-100'
      )}
      style={active && tag.color
        ? { backgroundColor: tag.color + '30', color: tag.color, outline: `1.5px solid ${tag.color}` }
        : { backgroundColor: '#f5f5f4', color: '#78716c' }
      }
    >
      {tag.name}
    </button>
  )
}

export function DashboardClient({ initialRecipes, collections: initialCollections, tags }: Props) {
  const [recipes, setRecipes] = useState(initialRecipes)
  const [collections, setCollections] = useState(initialCollections)
  const [search, setSearch] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [showImport, setShowImport] = useState(false)

  // Collection management
  const [addingCollection, setAddingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const newColInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()

  const usedTags = useMemo(() => {
    const ids = new Set<string>()
    recipes.forEach(r => r.recipe_tags?.forEach(rt => ids.add(rt.tag_id)))
    return tags.filter(t => ids.has(t.id))
  }, [recipes, tags])

  const filtered = useMemo(() => {
    let result = recipes
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(r => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q))
    }
    if (activeCollection) {
      result = result.filter(r => r.recipe_collections?.some(rc => rc.collection_id === activeCollection))
    }
    if (activeTags.size > 0) {
      result = result.filter(r => [...activeTags].every(tid => r.recipe_tags?.some(rt => rt.tag_id === tid)))
    }
    return result
  }, [recipes, search, activeCollection, activeTags])

  const tagSearchResults = useMemo(() => {
    if (!tagSearch.trim()) return []
    const q = tagSearch.toLowerCase()
    return usedTags.filter(t => t.name.includes(q))
  }, [tagSearch, usedTags])

  const otherTags = useMemo(() =>
    usedTags.filter(t => !TAG_BUCKETS.some(b => matchesBucket(t.name, b.keywords))),
    [usedTags]
  )

  async function handleImported(recipe: object, sourceType: string, sourceUrl?: string, imageUrl?: string) {
    setShowImport(false)
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...recipe, source_type: sourceType, source_url: sourceUrl, image_url: imageUrl }),
    })
    const data = await res.json()
    if (data.recipe) router.push(`/recipes/${data.recipe.id}`)
  }

  function toggleTag(id: string) {
    setActiveTags(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setTagSearch('')
  }

  async function createCollection() {
    const name = newCollectionName.trim()
    setAddingCollection(false)
    setNewCollectionName('')
    if (!name) return
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (data.collection) {
      setCollections(prev => [...prev, data.collection].sort((a, b) => a.name.localeCompare(b.name)))
    }
  }

  async function saveRename(id: string) {
    const name = renameValue.trim()
    setRenamingId(null)
    setRenameValue('')
    if (!name) return
    const res = await fetch(`/api/collections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (data.collection) {
      setCollections(prev =>
        prev.map(c => c.id === id ? { ...c, name: data.collection.name } : c)
          .sort((a, b) => a.name.localeCompare(b.name))
      )
    }
  }

  async function deleteCollection(id: string) {
    if (!confirm('Delete this collection? Recipes in it will not be deleted.')) return
    await fetch(`/api/collections/${id}`, { method: 'DELETE' })
    setCollections(prev => prev.filter(c => c.id !== id))
    if (activeCollection === id) setActiveCollection(null)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="space-y-6">
            {/* Collections */}
            <div>
              <div className="mb-2 flex items-center justify-between px-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Collections</h3>
                <button
                  onClick={() => { setAddingCollection(true); setTimeout(() => newColInputRef.current?.focus(), 0) }}
                  className="flex h-5 w-5 items-center justify-center rounded text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                  title="New collection"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <nav className="space-y-0.5">
                {/* All Recipes — never deletable */}
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
                  renamingId === col.id ? (
                    <div key={col.id} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5">
                      <span className="shrink-0 text-base">{col.icon}</span>
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveRename(col.id)
                          if (e.key === 'Escape') { setRenamingId(null); setRenameValue('') }
                        }}
                        onBlur={() => saveRename(col.id)}
                        className="flex-1 min-w-0 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-sm focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div key={col.id} className="group/col flex items-center gap-0.5">
                      <button
                        onClick={() => setActiveCollection(activeCollection === col.id ? null : col.id)}
                        className={cn('flex flex-1 min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                          activeCollection === col.id ? 'bg-stone-100 font-medium text-stone-900' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                        )}
                      >
                        <span className="shrink-0">{col.icon}</span>
                        <span className="truncate">{col.name}</span>
                      </button>
                      <button
                        onClick={() => { setRenamingId(col.id); setRenameValue(col.name) }}
                        className="shrink-0 flex h-6 w-6 items-center justify-center rounded text-stone-300 opacity-0 group-hover/col:opacity-100 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteCollection(col.id)}
                        className="shrink-0 flex h-6 w-6 items-center justify-center rounded text-stone-300 opacity-0 group-hover/col:opacity-100 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )
                ))}

                {/* Inline new collection input */}
                {addingCollection && (
                  <div className="flex items-center gap-1.5 rounded-lg px-2 py-1.5">
                    <span className="shrink-0 text-base">📁</span>
                    <input
                      ref={newColInputRef}
                      value={newCollectionName}
                      onChange={e => setNewCollectionName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') createCollection()
                        if (e.key === 'Escape') { setAddingCollection(false); setNewCollectionName('') }
                      }}
                      onBlur={() => { if (newCollectionName.trim()) createCollection(); else { setAddingCollection(false); setNewCollectionName('') } }}
                      placeholder="Collection name…"
                      className="flex-1 min-w-0 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-sm focus:outline-none"
                    />
                  </div>
                )}
              </nav>
            </div>

            {/* Tag filters */}
            {usedTags.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between px-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Filter by Tag</h3>
                  {activeTags.size > 0 && (
                    <button onClick={() => setActiveTags(new Set())} className="text-xs text-amber-600 hover:text-amber-700">
                      Clear ({activeTags.size})
                    </button>
                  )}
                </div>

                {/* Tag search */}
                <div className="relative mb-3 px-2">
                  <Search className="absolute left-3.5 top-1/2 h-3 w-3 -translate-y-1/2 text-stone-400" />
                  <input
                    value={tagSearch}
                    onChange={e => setTagSearch(e.target.value)}
                    placeholder="Search tags…"
                    className="w-full rounded-lg border border-stone-200 bg-white py-1.5 pl-7 pr-2.5 text-xs focus:border-stone-300 focus:outline-none"
                  />
                </div>

                {tagSearch ? (
                  <div className="flex flex-wrap gap-1.5 px-2">
                    {tagSearchResults.length > 0 ? tagSearchResults.map(tag => (
                      <TagChip key={tag.id} tag={tag} active={activeTags.has(tag.id)} dim={activeTags.size > 0} onClick={() => toggleTag(tag.id)} />
                    )) : (
                      <p className="text-xs text-stone-400">No tags match</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {TAG_BUCKETS.map(bucket => {
                      const bucketTags = usedTags.filter(t => matchesBucket(t.name, bucket.keywords))
                      if (bucketTags.length === 0) return null
                      return (
                        <div key={bucket.key} className="px-2">
                          <p className="mb-1.5 text-xs font-medium text-stone-400">{bucket.label}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {bucketTags.map(tag => (
                              <TagChip key={tag.id} tag={tag} active={activeTags.has(tag.id)} dim={activeTags.size > 0} onClick={() => toggleTag(tag.id)} />
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    {otherTags.length > 0 && (
                      <div className="px-2">
                        <p className="mb-1.5 text-xs font-medium text-stone-400">Other</p>
                        <div className="flex flex-wrap gap-1.5">
                          {otherTags.map(tag => (
                            <TagChip key={tag.id} tag={tag} active={activeTags.has(tag.id)} dim={activeTags.size > 0} onClick={() => toggleTag(tag.id)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="mb-6 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input placeholder="Search recipes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [grid-auto-rows:1fr]">
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
