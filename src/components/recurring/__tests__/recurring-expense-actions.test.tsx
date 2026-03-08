import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecurringExpenseActions } from '../recurring-expense-actions'

describe('RecurringExpenseActions', () => {
  it('calls pause/resume/delete callbacks', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onPause = vi.fn()
    const onResume = vi.fn()
    const onDelete = vi.fn()

    render(
      <RecurringExpenseActions
        active={true}
        onEdit={onEdit}
        onPause={onPause}
        onResume={onResume}
        onDelete={onDelete}
      />
    )

    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.click(screen.getByRole('button', { name: /pause/i }))
    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onPause).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
