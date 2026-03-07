'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    const result = await signIn('credentials', {
      email,
      callbackUrl: '/dashboard',
      redirect: false,
    })

    if (result?.error) {
      setError('Sign in failed. Check your auth configuration and try again.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2"
          placeholder="you@example.com"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign in with email'}
      </button>
    </form>
  )
}
