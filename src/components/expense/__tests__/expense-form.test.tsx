import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseForm } from '../expense-form'

const onSubmit = vi.fn()
const onSubmitWithReceipt = vi.fn()

describe('ExpenseForm', () => {
  it('submits normalized payload', async () => {
    const user = userEvent.setup()
    onSubmit.mockReset()
    onSubmitWithReceipt.mockReset()

    render(
      <ExpenseForm
        categories={[{ id: 'cat-1', name: 'Groceries' }]}
        onSubmitWithReceipt={onSubmitWithReceipt}
        onSubmit={onSubmit}
      />
    )

    await user.type(screen.getByLabelText(/amount/i), '100')
    await user.type(screen.getByLabelText(/description/i), 'Groceries')
    await user.clear(screen.getByLabelText(/date/i))
    await user.type(screen.getByLabelText(/date/i), '2026-03-01')
    await user.selectOptions(screen.getByLabelText(/category/i), 'cat-1')
    await user.click(screen.getByRole('button', { name: /save expense/i }))

    expect(onSubmitWithReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 100, description: 'Groceries', categoryId: 'cat-1' }),
      null
    )
  })

  it('submits selected receipt file through onSubmitWithReceipt', async () => {
    const user = userEvent.setup()
    onSubmitWithReceipt.mockReset()

    render(
      <ExpenseForm
        categories={[{ id: 'cat-1', name: 'Groceries' }]}
        onSubmitWithReceipt={onSubmitWithReceipt}
        onSubmit={onSubmit}
      />
    )

    const file = new File(['image'], 'receipt.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)

    await user.type(screen.getByLabelText(/amount/i), '100')
    await user.type(screen.getByLabelText(/description/i), 'Groceries')
    await user.clear(screen.getByLabelText(/date/i))
    await user.type(screen.getByLabelText(/date/i), '2026-03-01')
    await user.selectOptions(screen.getByLabelText(/category/i), 'cat-1')
    await user.click(screen.getByRole('button', { name: /save expense/i }))

    expect(onSubmitWithReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 100, description: 'Groceries' }),
      expect.objectContaining({ name: 'receipt.jpg' })
    )
  })
})
