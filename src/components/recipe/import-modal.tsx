'use client'

import { useState, useRef } from 'react'
import { Link, Upload, Image, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Tab = 'url' | 'file' | 'image'

interface ImportModalProps {
  onImported: (recipe: object, sourceType: string, sourceUrl?: string) => void
  onClose: () => void
}

export function ImportModal({ onImported, onClose }: ImportModalProps) {
  const [tab, setTab] = useState<Tab>('url')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUrlImport() {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onImported(data.recipe, 'url', url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to import')
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(file: File) {
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onImported(data.recipe, data.source_type)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-stone-100 p-6 pb-4">
          <h2 className="text-lg font-semibold text-stone-900">Import a Recipe</h2>
          <p className="mt-1 text-sm text-stone-500">Paste a link, upload a PDF, or drop a photo</p>
        </div>

        <div className="flex gap-1 border-b border-stone-100 px-6 pt-4">
          {([['url', Link, 'From URL'], ['file', Upload, 'PDF'], ['image', Image, 'Photo']] as const).map(
            ([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2',
                  tab === key
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            )
          )}
        </div>

        <div className="p-6">
          {tab === 'url' && (
            <div className="space-y-3">
              <Input
                placeholder="https://www.seriouseats.com/..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUrlImport()}
                autoFocus
              />
              <p className="text-xs text-stone-400">
                Works with most recipe sites. NYT Cooking requires PDF upload.
              </p>
            </div>
          )}

          {(tab === 'file' || tab === 'image') && (
            <div
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer',
                dragOver ? 'border-stone-400 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
              )}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault()
                setDragOver(false)
                const file = e.dataTransfer.files[0]
                if (file) handleFileUpload(file)
              }}
            >
              {tab === 'file' ? (
                <>
                  <Upload className="h-8 w-8 text-stone-300 mb-3" />
                  <p className="text-sm font-medium text-stone-600">Drop a PDF here</p>
                  <p className="text-xs text-stone-400 mt-1">or click to browse</p>
                </>
              ) : (
                <>
                  <Image className="h-8 w-8 text-stone-300 mb-3" />
                  <p className="text-sm font-medium text-stone-600">Drop a cookbook photo</p>
                  <p className="text-xs text-stone-400 mt-1">JPG, PNG, WEBP supported</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept={tab === 'file' ? '.pdf' : 'image/*'}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
              />
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          {tab === 'url' && (
            <Button onClick={handleUrlImport} disabled={loading || !url.trim()}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</> : 'Import Recipe'}
            </Button>
          )}
          {(tab === 'file' || tab === 'image') && loading && (
            <Button disabled>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing...
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
