import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseFilters } from '../expense-filters'

describe('ExpenseFilters', () => {
  it('emits filter changes', async () => {
    const onApply = vi.fn()
    const user = userEvent.setup()

    render(
      <ExpenseFilters
        categories={[{ id: 'cat-1', name: 'Groceries' }]}
        members={[{ id: 'u1', name: 'Alex' }]}
        onApply={onApply}
      />
    )

    await user.click(screen.getByRole('button', { name: /filter/i }))
    await user.selectOptions(screen.getByLabelText(/category/i), 'cat-1')
    await user.click(screen.getByRole('button', { name: /apply filters/i }))

    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'cat-1' }))
  })
})
