import { describe, it, expect, vi } from 'vitest'

// Mock next-auth and its dependencies since they require Next.js runtime
vi.mock('next-auth', () => {
  const mockAuth = vi.fn()
  const mockSignIn = vi.fn()
  const mockSignOut = vi.fn()
  const mockHandlers = { GET: vi.fn(), POST: vi.fn() }
  return {
    default: vi.fn(() => ({
      auth: mockAuth,
      signIn: mockSignIn,
      signOut: mockSignOut,
      handlers: mockHandlers,
    })),
  }
})

vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn(),
}))

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn((config) => config),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
}))

describe('Auth Configuration', () => {
  it('should export auth, handlers, signIn, signOut', async () => {
    const authModule = await import('../auth')
    expect(authModule.auth).toBeDefined()
    expect(authModule.handlers).toBeDefined()
    expect(authModule.signIn).toBeDefined()
    expect(authModule.signOut).toBeDefined()
  })

  it('should configure NextAuth with PrismaAdapter', async () => {
    const NextAuth = (await import('next-auth')).default
    expect(NextAuth).toHaveBeenCalled()

    const config = vi.mocked(NextAuth).mock.calls[0][0]
    expect(config).toHaveProperty('adapter')
    expect(config).toHaveProperty('session')
    expect(config).toHaveProperty('providers')
    expect(config).toHaveProperty('callbacks')
  })

  it('should use JWT session strategy', async () => {
    const NextAuth = (await import('next-auth')).default
    const config = vi.mocked(NextAuth).mock.calls[0][0]
    expect(config.session).toEqual({ strategy: 'jwt' })
  })
})
