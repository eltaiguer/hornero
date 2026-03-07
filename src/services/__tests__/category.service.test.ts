import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createCategory,
  deleteCategory,
  getCategories,
  seedDefaultCategories,
  updateCategory,
  DEFAULT_CATEGORIES,
} from '../category.service'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

describe('CategoryService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a category', async () => {
    vi.mocked(prisma.category.create).mockResolvedValue({ id: 'cat-1', name: 'Food' } as any)

    const result = await createCategory('hh-1', { name: 'Food', color: '#22C55E', emoji: '🍔' })

    expect(result.id).toBe('cat-1')
    expect(prisma.category.create).toHaveBeenCalled()
  })

  it('lists categories by household', async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([{ id: 'cat-1' }] as any)

    const result = await getCategories('hh-1')

    expect(result).toHaveLength(1)
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { householdId: 'hh-1' },
      orderBy: { name: 'asc' },
    })
  })

  it('updates category', async () => {
    vi.mocked(prisma.category.update).mockResolvedValue({ id: 'cat-1', name: 'Updated' } as any)

    const result = await updateCategory('cat-1', { name: 'Updated' })

    expect(result.name).toBe('Updated')
  })

  it('deletes category', async () => {
    vi.mocked(prisma.category.delete).mockResolvedValue({ id: 'cat-1' } as any)

    await deleteCategory('cat-1')

    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } })
  })

  it('seeds default categories idempotently', async () => {
    vi.mocked(prisma.category.upsert).mockResolvedValue({ id: 'cat-1' } as any)

    const result = await seedDefaultCategories('hh-1')

    expect(result).toBe(DEFAULT_CATEGORIES.length)
    expect(prisma.category.upsert).toHaveBeenCalledTimes(DEFAULT_CATEGORIES.length)
  })
})
