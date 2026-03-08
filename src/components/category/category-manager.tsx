'use client'

import { useMemo, useState } from 'react'
import type { CreateCategoryInput } from '@/lib/validations/category'

interface CategoryManagerProps {
  categories: Array<{ id: string; name: string; color?: string; emoji?: string; isDefault?: boolean }>
  onCreate: (input: CreateCategoryInput) => void | Promise<void>
  onUpdate: (categoryId: string, input: Partial<CreateCategoryInput>) => void | Promise<void>
  onDelete: (categoryId: string) => void | Promise<void>
}

export function CategoryManager({ categories, onCreate, onUpdate, onDelete }: CategoryManagerProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6B7280')
  const [emoji, setEmoji] = useState('📁')
  const [editingId, setEditingId] = useState<string | null>(null)

  const grouped = useMemo(() => ({
    defaults: categories.filter((category) => category.isDefault),
    custom: categories.filter((category) => !category.isDefault),
  }), [categories])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return

    await onCreate({ name: name.trim(), color, emoji })
    setName('')
    setColor('#6B7280')
    setEmoji('📁')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Default Categories</h2>
          <span className="text-xs text-gray-400">System</span>
        </div>
        <ul>
          {grouped.defaults.map((category) => (
            <li key={category.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <p className="text-sm">
                <span className="w-3 h-3 rounded-full inline-block mr-2" style={{ backgroundColor: category.color ?? '#6B7280' }} />
                {category.emoji ?? '📁'} {category.name}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border p-4 space-y-4">
        <h2 className="text-base font-semibold">Custom Categories</h2>
        {grouped.custom.length === 0 ? (
          <p className="text-sm text-gray-500">No custom categories yet</p>
        ) : (
          <ul>
            {grouped.custom.map((category) => (
              <li key={category.id} className="py-2 border-b last:border-b-0">
                {editingId === category.id ? (
                  <form
                    className="space-y-2"
                    onSubmit={async (event) => {
                      event.preventDefault()
                      const formData = new FormData(event.currentTarget)
                      await onUpdate(category.id, {
                        name: String(formData.get('name') ?? '').trim(),
                        color: String(formData.get('color') ?? '#6B7280'),
                        emoji: String(formData.get('emoji') ?? '📁'),
                      })
                      setEditingId(null)
                    }}
                  >
                    <div className="grid grid-cols-[1fr_4rem_3rem] gap-2 items-end">
                      <input name="name" defaultValue={category.name} className="rounded-md border px-3 py-2" />
                      <input name="emoji" defaultValue={category.emoji ?? '📁'} className="rounded-md border px-3 py-2 w-16 text-center text-lg" />
                      <input name="color" type="color" defaultValue={category.color ?? '#6B7280'} className="w-10 h-10 rounded cursor-pointer border-0" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-white">Save</button>
                      <button type="button" className="rounded-md border px-3 py-2" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm">
                      <span className="w-3 h-3 rounded-full inline-block mr-2" style={{ backgroundColor: category.color ?? '#6B7280' }} />
                      {category.emoji ?? '📁'} {category.name}
                    </p>
                    <div className="flex items-center gap-3">
                      <button type="button" className="text-xs font-medium text-blue-600" onClick={() => setEditingId(category.id)}>Edit</button>
                      <button type="button" className="text-xs font-medium text-red-600" onClick={() => void onDelete(category.id)}>Delete</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleCreate} className="rounded-md border p-4 space-y-3">
        <h2 className="text-base font-semibold">Add Category</h2>
        <div className="grid grid-cols-[1fr_4rem_3rem] gap-2 items-end">
          <div>
            <label htmlFor="category-name" className="block text-sm font-medium">Name</label>
            <input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2"
              required
            />
          </div>
          <div>
            <label htmlFor="category-emoji" className="block text-sm font-medium">Emoji</label>
            <input
              id="category-emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="mt-1 rounded-md border px-2 py-2 w-16 text-center text-lg"
              required
            />
          </div>
          <div>
            <label htmlFor="category-color" className="block text-sm font-medium">Color</label>
            <input
              id="category-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-1 w-10 h-10 rounded cursor-pointer border-0"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Save</button>
        </div>
      </form>
    </div>
  )
}
