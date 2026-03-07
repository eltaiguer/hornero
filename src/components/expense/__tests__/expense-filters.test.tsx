import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseFilters } from '../expense-filters'

describe('ExpenseFilters', () => {
  it('emits filter changes', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ExpenseFilters
        categories={[{ id: 'cat-1', name: 'Groceries' }]}
        members={[{ id: 'u1', name: 'Alex' }]}
        onChange={onChange}
      />
    )

    await user.selectOptions(screen.getByLabelText(/category/i), 'cat-1')

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'cat-1' }))
  })
})
