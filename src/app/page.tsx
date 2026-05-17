import Link from 'next/link'
import { ChefHat, Link as LinkIcon, Upload, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
      <div className="mx-auto max-w-xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100">
            <ChefHat className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-stone-900">Yes, Chef</h1>
        <p className="mt-4 text-lg text-stone-500">
          Save recipes from anywhere. Read them without the noise.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
          {[
            { icon: LinkIcon, label: 'Paste any URL' },
            { icon: Upload, label: 'Upload PDFs & photos' },
            { icon: Sparkles, label: 'Smart pantry matching' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-xl border border-stone-100 bg-white p-4 shadow-sm">
              <Icon className="mx-auto mb-2 h-5 w-5 text-amber-500" />
              <p className="text-stone-600">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/auth/signup"
            className="rounded-xl bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-700 transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/auth/login"
            className="rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
