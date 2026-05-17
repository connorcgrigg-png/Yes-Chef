'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChefHat, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <div className="max-w-sm text-center">
          <ChefHat className="mx-auto mb-4 h-10 w-10 text-amber-500" />
          <h2 className="text-xl font-semibold text-stone-900">Check your email</h2>
          <p className="mt-2 text-stone-500">We sent a confirmation link to {email}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
            <ChefHat className="h-6 w-6 text-amber-500" />
          </div>
          <h1 className="text-xl font-semibold text-stone-900">Create your account</h1>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-700">Name</label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" autoFocus />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-700">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-700">Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-stone-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
