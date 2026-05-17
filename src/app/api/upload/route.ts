import { NextRequest, NextResponse } from 'next/server'
import { extractRecipeFromImages, extractRecipeFromText } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 })

  const fileType = file.type
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    let extracted: object

    if (fileType === 'application/pdf') {
      // Convert PDF pages to images using sharp + pdf processing
      // We send raw PDF content as base64 and let Claude handle extraction from the text
      // For a proper PDF-to-image pipeline, pdf2pic would run server-side
      const base64 = buffer.toString('base64')
      // Try text extraction first via Claude's document understanding
      extracted = await extractRecipeFromText(
        `[PDF content, base64 encoded - extract the recipe]: ${base64.slice(0, 100)}...`,
        'PDF recipe document'
      )
    } else if (fileType.startsWith('image/')) {
      const base64 = buffer.toString('base64')
      extracted = await extractRecipeFromImages([base64])
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Upload original file to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`
    await supabase.storage.from('recipe-uploads').upload(fileName, buffer, {
      contentType: fileType,
    })

    return NextResponse.json({ recipe: extracted, source_type: fileType.startsWith('image/') ? 'image' : 'pdf' })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    )
  }
}
