import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { extractRecipeFromText } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await request.json()
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })

    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)

    const html = await response.text()
    const $ = cheerio.load(html)

    // Try JSON-LD structured data first (most recipe sites use this)
    let recipeText = ''
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() ?? '')
        const schema = Array.isArray(json) ? json.find(j => j['@type'] === 'Recipe') : json
        if (schema?.['@type'] === 'Recipe') {
          recipeText = JSON.stringify(schema)
        }
      } catch {}
    })

    // Fallback: extract readable text from the page
    if (!recipeText) {
      $('script, style, nav, footer, header, aside, .ad, .advertisement').remove()
      recipeText = $('main, article, .recipe, #recipe, [class*="recipe"]').text() || $('body').text()
      recipeText = recipeText.replace(/\s+/g, ' ').trim().slice(0, 8000)
    }

    const extracted = await extractRecipeFromText(recipeText, 'recipe webpage content')

    return NextResponse.json({ recipe: extracted, source_url: url })
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to scrape recipe' },
      { status: 500 }
    )
  }
}
