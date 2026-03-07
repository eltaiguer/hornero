import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BudgetForm } from '../budget-form'

describe('BudgetForm', () => {
  it('submits budget input', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<BudgetForm categories={[{ id: 'cat-1', name: 'Groceries' }]} onSubmit={onSubmit} />)

    await user.selectOptions(screen.getByLabelText(/category/i), 'cat-1')
    await user.type(screen.getByLabelText(/amount/i), '500')
    await user.type(screen.getByLabelText(/month/i), '3')
    await user.type(screen.getByLabelText(/year/i), '2026')
    await user.click(screen.getByRole('button', { name: /save budget/i }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 500, month: 3, year: 2026 }))
  })
})
