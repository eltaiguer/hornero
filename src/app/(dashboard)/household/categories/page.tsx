import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'
import { createCategory, getCategories } from '@/services/category.service'
import { CategoryManager } from '@/components/category/category-manager'

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

  const categories = await getCategories(householdId)

  async function handleCreate(input: any) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await createCategory(householdId as string, input)
    redirect(`/household/categories?householdId=${householdId}`)
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Categories</h1>
      <CategoryManager categories={categories as any} onCreate={handleCreate} />
    </main>
  )
}
