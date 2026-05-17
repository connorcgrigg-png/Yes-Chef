'use client'

import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { ImportModal } from '@/components/recipe/import-modal'

export default function NewRecipePage() {
  const router = useRouter()

  async function handleImported(recipe: object, sourceType: string, sourceUrl?: string) {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...recipe, source_type: sourceType, source_url: sourceUrl }),
    })
    const data = await res.json()
    if (data.recipe) {
      router.push(`/recipes/${data.recipe.id}`)
    }
  }

  return (
    <>
      <Navbar />
      <ImportModal
        onImported={handleImported}
        onClose={() => router.back()}
      />
    </>
  )
}
