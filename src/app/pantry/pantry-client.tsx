'use client'

import { useState } from 'react'
import { ShoppingBag, Sparkles } from 'lucide-react'
import { PantryChat } from '@/components/pantry/pantry-chat'
import type { PantryItem } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  produce: '🥦 Produce',
  protein: '🥩 Protein',
  dairy: '🧀 Dairy',
  grains: '🌾 Grains',
  pantry: '🫙 Pantry',
  spices: '🌶️ Spices',
  frozen: '🧊 Frozen',
  other: '📦 Other',
}

interface Props {
  initialItems: PantryItem[]
}

export function PantryClient({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems)

  const grouped = items.reduce<Record<string, PantryItem[]>>((acc, item) => {
    const cat = item.category ?? 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Your Pantry</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Tell the assistant what you have and it'll keep your pantry up to date
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Pantry inventory */}
        <div>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 py-20 text-center dark:border-stone-700">
              <ShoppingBag className="mb-3 h-10 w-10 text-stone-200 dark:text-stone-700" />
              <p className="text-stone-500 font-medium dark:text-stone-400">Your pantry is empty</p>
              <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">Tell the assistant what you have →</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([category, categoryItems]) => (
                <div key={category}>
                  <h3 className="mb-3 text-sm font-semibold text-stone-500 dark:text-stone-400">
                    {CATEGORY_LABELS[category] ?? category}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {categoryItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800 capitalize dark:text-stone-200">{item.name}</p>
                          {item.quantity && (
                            <p className="text-xs text-stone-400 dark:text-stone-500">
                              {item.quantity}{item.unit ? ' ' + item.unit : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat interface */}
        <div className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden flex flex-col h-[600px] dark:border-stone-800 dark:bg-stone-900">
          <div className="border-b border-stone-100 px-4 py-3 flex items-center gap-2 dark:border-stone-800">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">Pantry Assistant</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PantryChat onPantryUpdated={setItems} />
          </div>
        </div>
      </div>
    </div>
  )
}
