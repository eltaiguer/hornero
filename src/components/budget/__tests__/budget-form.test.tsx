import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BudgetForm } from '../budget-form'

describe('BudgetForm', () => {
  it('submits budget input', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <BudgetForm
        categories={[{ id: 'cat-1', name: 'Groceries' }]}
        usedCategoryIds={[]}
        month={3}
        year={2026}
        onSubmit={onSubmit}
      />
    )

    await user.selectOptions(screen.getByLabelText(/category/i), 'cat-1')
    await user.type(screen.getByLabelText(/amount/i), '500')
    await user.click(screen.getByRole('button', { name: /set budget/i }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 500, month: 3, year: 2026 }))
  })

  it('renders update/remove actions in edit mode', () => {
    const onSubmit = vi.fn()
    const onDelete = vi.fn()

    render(
      <BudgetForm
        categories={[{ id: 'cat-1', name: 'Groceries' }]}
        usedCategoryIds={['cat-1']}
        month={3}
        year={2026}
        editingBudget={{ id: 'b-1', categoryId: 'cat-1', amount: 400 }}
        onDelete={onDelete}
        onSubmit={onSubmit}
      />
    )

    expect(screen.getByRole('button', { name: /update budget/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove budget/i })).toBeInTheDocument()
  })
})
