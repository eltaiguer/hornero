import { prisma } from '@/lib/prisma'
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@/lib/validations/category'

export const DEFAULT_CATEGORIES = [
  { name: 'Groceries', color: '#22C55E', emoji: '🛒' },
  { name: 'Housing', color: '#8B5CF6', emoji: '🏠' },
  { name: 'Utilities', color: '#06B6D4', emoji: '⚡' },
  { name: 'Transport', color: '#3B82F6', emoji: '🚗' },
  { name: 'Dining Out', color: '#F59E0B', emoji: '🍽️' },
  { name: 'Entertainment', color: '#EC4899', emoji: '🎬' },
  { name: 'Health', color: '#EF4444', emoji: '🏥' },
  { name: 'Clothing', color: '#A855F7', emoji: '👕' },
  { name: 'Other', color: '#6B7280', emoji: '📁' },
] as const

export async function seedDefaultCategories(householdId: string) {
  await Promise.all(
    DEFAULT_CATEGORIES.map((category) =>
      prisma.category.upsert({
        where: {
          householdId_name: {
            householdId,
            name: category.name,
          },
        },
        update: {
          color: category.color,
          emoji: category.emoji,
          isDefault: true,
        },
        create: {
          householdId,
          name: category.name,
          color: category.color,
          emoji: category.emoji,
          isDefault: true,
        },
      })
    )
  )

  return DEFAULT_CATEGORIES.length
}

export async function createCategory(householdId: string, input: CreateCategoryInput) {
  const validated = createCategorySchema.parse(input)

  return prisma.category.create({
    data: {
      householdId,
      name: validated.name,
      color: validated.color,
      emoji: validated.emoji,
      isDefault: false,
    },
  })
}

export async function getCategories(householdId: string) {
  return prisma.category.findMany({
    where: { householdId },
    orderBy: { name: 'asc' },
  })
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  const validated = updateCategorySchema.parse(input)

  return prisma.category.update({
    where: { id: categoryId },
    data: validated,
  })
}

export async function deleteCategory(categoryId: string) {
  await prisma.category.delete({ where: { id: categoryId } })
}
