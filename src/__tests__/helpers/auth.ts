import { vi } from 'vitest'
import type { Session } from 'next-auth'

export function mockSession(overrides: Partial<Session['user']> = {}): Session {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      ...overrides,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

export function mockAuth(session: Session | null = null) {
  vi.mock('@/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue(session),
    handlers: { GET: vi.fn(), POST: vi.fn() },
    signIn: vi.fn(),
    signOut: vi.fn(),
  }))
}
