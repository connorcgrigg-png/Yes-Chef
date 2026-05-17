import Link from 'next/link'
import { Clock, Users } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import type { Recipe } from '@/types'

interface RecipeCardProps {
  recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="group block">
      <article className="rounded-xl border border-stone-100 bg-white p-5 shadow-sm transition-all duration-150 hover:shadow-md hover:border-stone-200">
        {recipe.image_url && (
          <div className="mb-4 -mx-5 -mt-5 overflow-hidden rounded-t-xl">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <h3 className="font-semibold text-stone-900 leading-snug group-hover:text-amber-700 transition-colors">
          {recipe.title}
        </h3>

        {recipe.description && (
          <p className="mt-1 text-sm text-stone-500 line-clamp-2">{recipe.description}</p>
        )}

        <div className="mt-3 flex items-center gap-3 text-xs text-stone-400">
          {recipe.feeds_people && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Feeds {recipe.feeds_people}
            </span>
          )}
          {recipe.total_time_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(recipe.total_time_minutes)}
            </span>
          )}
        </div>
      </article>
    </Link>
  )
}
