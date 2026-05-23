'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChatMessage, PantryItem } from '@/types'

interface PantryChatProps {
  onPantryUpdated: (items: PantryItem[]) => void
}

export function PantryChat({ onPantryUpdated }: PantryChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hey! Tell me what you have in your fridge and pantry. You can say something like \"I have chicken breasts, garlic, olive oil, and some wilting spinach\" — I'll keep track for you.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userMessage: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      if (data.pantry) onPantryUpdated(data.pantry)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Try again?' }])
    } finally {
      setLoading(false)
    }
  }

  function startVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      setListening(false)
    }
    recognition.onend = () => setListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                msg.role === 'user'
                  ? 'bg-stone-900 text-white rounded-br-sm dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-stone-100 text-stone-800 rounded-bl-sm dark:bg-stone-800 dark:text-stone-200'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-stone-100 px-4 py-3 dark:bg-stone-800">
              <Loader2 className="h-4 w-4 animate-spin text-stone-400 dark:text-stone-500" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-stone-100 p-3 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <button
            onClick={startVoice}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
              listening
                ? 'border-red-300 bg-red-50 text-red-500 animate-pulse dark:bg-red-950 dark:border-red-700'
                : 'border-stone-200 text-stone-400 hover:text-stone-600 hover:border-stone-300 dark:border-stone-700 dark:text-stone-500 dark:hover:text-stone-300 dark:hover:border-stone-600'
            )}
          >
            <Mic className="h-4 w-4" />
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder="I have eggs, butter, lemons..."
            className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:ring-stone-600"
          />
          <Button size="icon" onClick={() => send(input)} disabled={!input.trim() || loading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
