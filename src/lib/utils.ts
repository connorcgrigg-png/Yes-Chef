import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { v4 as uuidv4 } from 'uuid'
import type { Ingredient, Recipe, RecipeMatch, PantryItem } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  return uuidv4()
}

export function scaleIngredient(ingredient: Ingredient, originalFeeds: number, targetFeeds: number): Ingredient {
  const ratio = targetFeeds / originalFeeds
  const scaled = scaleQuantityString(ingredient.quantity, ratio)
  return { ...ingredient, quantity: scaled }
}

function scaleQuantityString(quantity: string, ratio: number): string {
  const qty = String(quantity ?? '')

  // Handle fractions like "1/2", "3/4"
  const fractionMatch = qty.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (fractionMatch) {
    const val = (parseInt(fractionMatch[1]) / parseInt(fractionMatch[2])) * ratio
    return formatNumber(val)
  }

  // Handle mixed numbers like "1 1/2"
  const mixedMatch = qty.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/)
  if (mixedMatch) {
    const val = (parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3])) * ratio
    return formatNumber(val)
  }

  // Handle plain numbers
  const numMatch = qty.match(/^(\d+(?:\.\d+)?)/)
  if (numMatch) {
    const val = parseFloat(numMatch[1]) * ratio
    const suffix = qty.slice(numMatch[1].length)
    return formatNumber(val) + suffix
  }

  return qty
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toString()

  const fractions: [number, string][] = [
    [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'], [0.375, '⅜'],
    [0.5, '½'], [0.625, '⅝'], [0.667, '⅔'], [0.75, '¾'], [0.875, '⅞'],
  ]

  const whole = Math.floor(n)
  const decimal = n - whole

  for (const [val, symbol] of fractions) {
    if (Math.abs(decimal - val) < 0.05) {
      return whole > 0 ? `${whole} ${symbol}` : symbol
    }
  }

  return n.toFixed(1).replace(/\.0$/, '')
}

export function scoreRecipeMatch(recipe: Recipe, pantryItems: PantryItem[]): RecipeMatch {
  const pantryNames = new Set(pantryItems.map(i => i.name.toLowerCase()))

  const missing: Ingredient[] = []
  let weightedHave = 0
  let weightedTotal = 0

  for (const ingredient of recipe.ingredients) {
    const weight = ingredient.is_primary ? 3 : 1
    weightedTotal += weight

    const found = pantryNames.has(ingredient.name.toLowerCase()) ||
      [...pantryNames].some(p => ingredient.name.toLowerCase().includes(p) || p.includes(ingredient.name.toLowerCase()))

    if (found) {
      weightedHave += weight
    } else {
      missing.push(ingredient)
    }
  }

  const match_score = weightedTotal > 0 ? weightedHave / weightedTotal : 0
  const have_count = recipe.ingredients.length - missing.length

  return {
    recipe,
    have_count,
    total_count: recipe.ingredients.length,
    missing_ingredients: missing,
    match_score,
  }
}

export function formatTime(minutes?: number): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
