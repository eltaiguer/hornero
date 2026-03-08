import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecurringExpenseForm } from '../recurring-expense-form'

describe('RecurringExpenseForm', () => {
  it('submits recurring input', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <RecurringExpenseForm
        categories={[{ id: 'cat-1', name: 'Rent' }]}
        members={[
          { id: 'u1', name: 'Alex', salary: 1000 },
          { id: 'u2', name: 'Sam', salary: 1000 },
        ]}
        onSubmit={onSubmit}
      />
    )

    await user.type(screen.getByLabelText(/amount/i), '100')
    await user.type(screen.getByLabelText(/description/i), 'Rent')
    await user.selectOptions(screen.getByLabelText(/category/i), 'cat-1')
    await user.selectOptions(screen.getByLabelText(/frequency/i), 'monthly')
    await user.clear(screen.getByLabelText(/starts on/i))
    await user.type(screen.getByLabelText(/starts on/i), '2026-03-01')
    await user.click(screen.getByRole('button', { name: /create recurring expense/i }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 100, frequency: 'monthly' }))
  })

  it('requires custom percentages to sum to 100', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <RecurringExpenseForm
        categories={[{ id: 'cat-1', name: 'Rent' }]}
        members={[
          { id: 'u1', name: 'Alex', salary: 1000 },
          { id: 'u2', name: 'Sam', salary: 1000 },
        ]}
        onSubmit={onSubmit}
      />
    )

    await user.type(screen.getByLabelText(/amount/i), '100')
    await user.type(screen.getByLabelText(/description/i), 'Rent')
    await user.click(screen.getByRole('button', { name: /custom/i }))

    const submit = screen.getByRole('button', { name: /create recurring expense/i })
    expect(submit).toBeDisabled()
  })
})
