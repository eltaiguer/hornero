import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'
import { createCategory, deleteCategory, getCategories, updateCategory } from '@/services/category.service'
import { isHouseholdOwner } from '@/services/member.service'
import { CategoryManager } from '@/components/category/category-manager'
import type { CreateCategoryInput } from '@/lib/validations/category'

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ householdId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin')
  }

  const households = await getUserHouseholds(session.user.id)
  const params = (await searchParams) ?? {}
  const householdId = params.householdId ?? households[0]?.id

  if (!householdId) {
    redirect('/dashboard')
  }

  const owner = await isHouseholdOwner(householdId, session.user.id)
  if (!owner) {
    redirect('/dashboard')
  }

  const categories = await getCategories(householdId)

  async function handleCreate(input: CreateCategoryInput) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await createCategory(householdId as string, input)
    redirect(`/household/categories?householdId=${householdId}`)
  }

  async function handleUpdate(categoryId: string, input: Partial<CreateCategoryInput>) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await updateCategory(categoryId, input)
    redirect(`/household/categories?householdId=${householdId}`)
  }

  async function handleDelete(categoryId: string) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await deleteCategory(categoryId)
    redirect(`/household/categories?householdId=${householdId}`)
  }

  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-4">
      <h1 className="text-2xl font-bold">Categories</h1>
      <CategoryManager
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          color: category.color,
          emoji: category.emoji,
          isDefault: category.isDefault,
        }))}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </main>
  )
}
