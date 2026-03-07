import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryManager } from '../category-manager'

describe('CategoryManager', () => {
  it('adds a category through callback', async () => {
    const onCreate = vi.fn()
    const user = userEvent.setup()

    render(<CategoryManager categories={[]} onCreate={onCreate} />)

    await user.type(screen.getByLabelText(/new category name/i), 'Pets')
    await user.click(screen.getByRole('button', { name: /add category/i }))

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Pets' }))
  })
})
