export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
}

export interface Recipe {
  id: string
  user_id: string
  title: string
  description?: string
  source_url?: string
  source_type: 'url' | 'pdf' | 'image' | 'manual'
  image_url?: string
  feeds_people?: number
  prep_time_minutes?: number
  cook_time_minutes?: number
  total_time_minutes?: number
  ingredients: Ingredient[]
  instructions: Instruction[]
  tags: string[]
  collection_ids: string[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface Ingredient {
  id: string
  name: string
  quantity: string
  unit?: string
  notes?: string
  is_primary: boolean
  original_quantity?: string  // set on first import, never changes
  original_unit?: string
}

export interface Instruction {
  id: string
  step_number: number
  text: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description?: string
  color?: string
  icon?: string
  recipe_count: number
  created_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color?: string
}

export interface PantryItem {
  id: string
  user_id: string
  name: string
  quantity?: string
  unit?: string
  category?: string
  added_at: string
}

export interface RecipeMatch {
  recipe: Recipe
  have_count: number
  total_count: number
  missing_ingredients: Ingredient[]
  match_score: number  // weighted by primary/expensive ingredients
}

export type ChatContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mediaType: string }

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string | ChatContentBlock[]
}
