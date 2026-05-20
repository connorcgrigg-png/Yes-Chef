import { NextRequest, NextResponse } from 'next/server'
import { extractRecipeFromImages, extractRecipeFromText } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs' as string) as typeof import('pdfjs-dist')
  GlobalWorkerOptions.workerSrc = `file://${process.cwd()}/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs`

  const pdf = await getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise

  const pages = await Promise.all(
    Array.from({ length: pdf.numPages }, async (_, i) => {
      const page = await pdf.getPage(i + 1)
      const content = await page.getTextContent()
      return content.items.map((item: { str: string }) => item.str).join(' ')
    })
  )

  return pages.join('\n').trim()
}

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
      const text = await extractTextFromPDF(buffer)
      if (text.length < 50) {
        throw new Error('Could not read text from this PDF — it may be a scanned image. Try uploading a photo of the recipe page instead.')
      }
      extracted = await extractRecipeFromText(text, 'PDF recipe document')
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
