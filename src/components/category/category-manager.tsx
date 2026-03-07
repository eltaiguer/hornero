'use client'

import { useState } from 'react'
import type { CreateCategoryInput } from '@/lib/validations/category'

interface CategoryManagerProps {
  categories: Array<{ id: string; name: string; color?: string; emoji?: string }>
  onCreate: (input: CreateCategoryInput) => void | Promise<void>
}

export function CategoryManager({ categories, onCreate }: CategoryManagerProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6B7280')
  const [emoji, setEmoji] = useState('📁')

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return

    await onCreate({ name: name.trim(), color, emoji })
    setName('')
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="space-y-3 rounded-md border p-4">
        <div>
          <label htmlFor="category-name" className="block text-sm font-medium">New category name</label>
          <input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="category-color" className="block text-sm font-medium">Color</label>
            <input
              id="category-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border"
            />
          </div>
          <div>
            <label htmlFor="category-emoji" className="block text-sm font-medium">Emoji</label>
            <input
              id="category-emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>

        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Add category
        </button>
      </form>

      <ul className="space-y-2">
        {categories.map((category) => (
          <li key={category.id} className="rounded-md border p-3 text-sm">
            {(category.emoji ?? '📁')} {category.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
