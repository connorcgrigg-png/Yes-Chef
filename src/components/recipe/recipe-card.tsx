import Link from 'next/link'
import { Clock, Users, ChefHat } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import type { Recipe } from '@/types'

interface RecipeCardProps {
  recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="group flex h-full">
      <article className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-stone-100 bg-white shadow-sm transition-all duration-150 hover:border-stone-200 hover:shadow-md dark:bg-stone-900 dark:border-stone-800 dark:hover:border-stone-700">
        {/* Image — fixed height, always present */}
        <div className="h-40 w-full shrink-0 overflow-hidden">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 via-stone-100 to-stone-200 dark:from-amber-950 dark:via-stone-800 dark:to-stone-700">
              <ChefHat className="h-10 w-10 text-stone-300 dark:text-stone-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 font-semibold leading-snug text-stone-900 transition-colors group-hover:text-amber-700 dark:text-stone-100">
            {recipe.title}
          </h3>

          {recipe.description && (
            <p className="mt-1 line-clamp-2 text-sm text-stone-500 dark:text-stone-400">{recipe.description}</p>
          )}

          <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-stone-400 dark:text-stone-500">
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
        </div>
      </article>
    </Link>
  )
}
